import Groq from "groq-sdk";
import Resume, { ISkillEvidence } from "../models/Resume.model";
import Job, { IJobIntelligence } from "../models/Job.model";
import ResumeJobMatch, {
  IResumeJobMatch,
  IMatchedSkill,
  IMissingItem,
  IMatchScores,
} from "../models/ResumeJobMatch.model";
import { config } from "../config";

const MODEL = "openai/gpt-oss-120b";

// ─────────────────────────────────────────────
//  Groq client
// ─────────────────────────────────────────────
function getGroqClient(): Groq {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

// ─────────────────────────────────────────────
//  Helpers — normalise for comparison
// ─────────────────────────────────────────────
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function skillInList(skill: string, list: string[]): boolean {
  const n = norm(skill);
  return list.some((s) => norm(s).includes(n) || n.includes(norm(s)));
}

/** Calculate years of experience from experience + internship arrays */
function calcExperienceYears(
  experience: Array<{ startDate?: string; endDate?: string }>,
  internships: Array<{ startDate?: string; endDate?: string }>
): number {
  let totalMonths = 0;

  const entries = [...experience, ...internships];
  for (const e of entries) {
    const start = e.startDate ? new Date(e.startDate) : null;
    const end   = e.endDate   ? (e.endDate.toLowerCase().includes("present") ? new Date() : new Date(e.endDate)) : new Date();

    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diff > 0 && diff < 600) totalMonths += diff; // sanity cap at 50 years
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

/** Parse "0-2 years", "3+ years", "Fresher" into min/max numbers */
function parseExperienceRange(req: string): { min: number; max: number } {
  if (!req) return { min: 0, max: 2 };
  const lower = req.toLowerCase();
  if (lower.includes("fresher") || lower.includes("no exp")) return { min: 0, max: 0 };
  const match = lower.match(/(\d+)\s*[–\-to]+\s*(\d+)/);
  if (match) return { min: Number(match[1]), max: Number(match[2]) };
  const plus = lower.match(/(\d+)\s*\+/);
  if (plus) return { min: Number(plus[1]), max: Number(plus[1]) + 5 };
  const single = lower.match(/(\d+)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) + 1 };
  return { min: 0, max: 3 };
}

// ─────────────────────────────────────────────
//  Score calculators
// ─────────────────────────────────────────────

function calcSkillMatch(
  candidateSkills: string[],
  skillEvidence: ISkillEvidence[],
  requiredSkills: string[],
  preferredSkills: string[]
): { score: number; matched: IMatchedSkill[]; missing: IMissingItem[] } {
  const matched: IMatchedSkill[] = [];
  const missing: IMissingItem[] = [];

  if (!requiredSkills.length) return { score: 50, matched, missing };

  let requiredHits = 0;
  let preferredHits = 0;

  for (const req of requiredSkills) {
    const evidenceEntry = skillEvidence.find((e) => norm(e.skill) === norm(req) || skillInList(req, [e.skill]));
    const inSkills = skillInList(req, candidateSkills);

    if (evidenceEntry && evidenceEntry.status !== "Missing") {
      requiredHits++;
      matched.push({
        skill: req,
        strength: evidenceEntry.status === "Strong" ? "Strong Match" : evidenceEntry.status === "Partial" ? "Partial Match" : "Listed Only",
        evidenceSections: evidenceEntry.evidenceSections,
      });
    } else if (inSkills) {
      requiredHits += 0.7;
      matched.push({ skill: req, strength: "Listed Only", evidenceSections: ["skills"] });
    } else {
      missing.push({ skill: req, importance: "Critical", reason: "Not found in resume" });
    }
  }

  for (const pref of preferredSkills) {
    if (skillInList(pref, candidateSkills)) {
      preferredHits++;
      matched.push({ skill: pref, strength: "Partial Match", evidenceSections: ["skills"] });
    } else {
      missing.push({ skill: pref, importance: "Preferred", reason: "Not found in resume" });
    }
  }

  const requiredScore  = requiredSkills.length  > 0 ? (requiredHits  / requiredSkills.length)  * 100 : 0;
  const preferredScore = preferredSkills.length > 0 ? (preferredHits / preferredSkills.length) * 100 : 100;

  const score = Math.min(100, Math.round(requiredScore * 0.75 + preferredScore * 0.25));
  return { score, matched, missing };
}

function calcExperienceMatch(candidateYears: number, requiredRange: string): number {
  const { min, max } = parseExperienceRange(requiredRange);
  if (candidateYears >= min && candidateYears <= max + 1) return 100;
  if (candidateYears > max + 1) return Math.max(60, 100 - (candidateYears - max - 1) * 5);
  const deficit = min - candidateYears;
  return Math.max(0, Math.round(100 - deficit * 20));
}

function calcProjectMatch(
  projects: Array<{ technologies?: string[] }>,
  requiredSkills: string[]
): number {
  if (!projects.length) return 0;
  let hits = 0;
  for (const req of requiredSkills) {
    const found = projects.some((p) =>
      p.technologies ? skillInList(req, p.technologies) : false
    );
    if (found) hits++;
  }
  const base = requiredSkills.length > 0 ? (hits / requiredSkills.length) * 100 : 50;
  // Bonus for having substantive projects
  const bonus = projects.length >= 2 ? 10 : 0;
  return Math.min(100, Math.round(base + bonus));
}

function calcEducationMatch(
  education: Array<{ degree: string; field: string }>,
  requiredEducation: string
): number {
  if (!requiredEducation || requiredEducation.toLowerCase().includes("any")) return 100;
  if (!education.length) return 30;

  const reqNorm = norm(requiredEducation);
  const hasDegree = education.some((e) => {
    const combined = norm(`${e.degree} ${e.field}`);
    return combined.includes(reqNorm.slice(0, 5)) || reqNorm.includes(norm(e.degree).slice(0, 4));
  });

  return hasDegree ? 100 : 60;
}

function calcDomainMatch(
  primaryCareer: string,
  jobDomain: string,
  jobTitle: string
): number {
  if (!primaryCareer || !jobDomain) return 50;
  const careerNorm = norm(primaryCareer);
  const domainNorm = norm(jobDomain);
  const titleNorm  = norm(jobTitle);

  if (careerNorm.includes(domainNorm) || domainNorm.includes(careerNorm)) return 95;
  if (titleNorm.includes(careerNorm.slice(0, 5))) return 85;

  const careerWords = careerNorm.split(/\s+/);
  const domainWords = domainNorm.split(/\s+/);
  const overlap = careerWords.filter((w) => domainWords.includes(w) && w.length > 3).length;
  return Math.min(90, 40 + overlap * 20);
}

function computeOverall(scores: Omit<IMatchScores, "overall">): number {
  const weights = {
    skillMatch:      0.40,
    experienceMatch: 0.20,
    projectMatch:    0.20,
    educationMatch:  0.10,
    domainMatch:     0.10,
  };
  return Math.round(
    scores.skillMatch      * weights.skillMatch      +
    scores.experienceMatch * weights.experienceMatch +
    scores.projectMatch    * weights.projectMatch    +
    scores.educationMatch  * weights.educationMatch  +
    scores.domainMatch     * weights.domainMatch
  );
}

function getMatchTierAndLabel(overall: number): {
  tier: IResumeJobMatch["matchTier"];
  label: IResumeJobMatch["matchLabel"];
} {
  if (overall >= 90) return { tier: "100%", label: "Perfect Match" };
  if (overall >= 75) return { tier: "75%",  label: "Great Match" };
  if (overall >= 50) return { tier: "50%",  label: "Good Match" };
  if (overall >= 20) return { tier: "20%",  label: "Partial Match" };
  return { tier: "0%", label: "Low Match" };
}

// ─────────────────────────────────────────────
//  AI narrative generation
// ─────────────────────────────────────────────
async function generateNarrative(
  candidateName: string,
  jobTitle: string,
  company: string,
  scores: IMatchScores,
  matchedSkills: IMatchedSkill[],
  missingItems: IMissingItem[]
): Promise<{ keyHighlights: string[]; whyYouMatch: string[]; whatsMissing: string[] }> {
  const groq = getGroqClient();

  const prompt = `
You are a career matching assistant. Given the match data below, generate 3 sections as JSON.

Candidate: ${candidateName}
Job: ${jobTitle} at ${company}
Scores: Skill=${scores.skillMatch}% Experience=${scores.experienceMatch}% Project=${scores.projectMatch}% Education=${scores.educationMatch}% Domain=${scores.domainMatch}%
Matched Skills: ${matchedSkills.slice(0, 8).map(s => s.skill).join(", ")}
Missing Skills: ${missingItems.slice(0, 6).map(m => m.skill).join(", ")}

Return ONLY this JSON:
{
  "keyHighlights": ["3-4 short bullet highlights like 'Strong technical skills alignment'"],
  "whyYouMatch": ["4-6 reasons why candidate matches, referencing matched skills"],
  "whatsMissing": ["3-5 specific gaps with brief reason like 'Docker - Not found in projects'"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: "system", content: "You are a career matching assistant. Return only valid JSON." },
        { role: "user",   content: prompt },
      ],
    });

    const raw = (completion.choices[0]?.message?.content || "")
      .replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);
    return {
      keyHighlights: Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights : [],
      whyYouMatch:   Array.isArray(parsed.whyYouMatch)   ? parsed.whyYouMatch   : [],
      whatsMissing:  Array.isArray(parsed.whatsMissing)   ? parsed.whatsMissing  : [],
    };
  } catch {
    // Fallback if LLM fails
    return {
      keyHighlights: [
        `${scores.skillMatch}% skill alignment with job requirements`,
        matchedSkills.length > 0 ? `${matchedSkills.length} matching skills found` : "Limited skill overlap",
        missingItems.length > 0  ? "Some preferred skills are missing"              : "Strong overall match",
      ],
      whyYouMatch:  matchedSkills.slice(0, 5).map((s) => `${s.skill} — ${s.strength}`),
      whatsMissing: missingItems.slice(0, 5).map((m) => `${m.skill} — ${m.reason}`),
    };
  }
}

// ─────────────────────────────────────────────
//  Core: Match a single resume against a single job
// ─────────────────────────────────────────────
export async function matchResumeToJob(
  resumeId: string,
  jobId: string
): Promise<IResumeJobMatch> {
  const [resume, job] = await Promise.all([
    Resume.findById(resumeId).lean(),
    Job.findById(jobId).lean(),
  ]);

  if (!resume) throw new Error(`Resume ${resumeId} not found`);
  if (!job)    throw new Error(`Job ${jobId} not found`);

  const intel: IJobIntelligence | undefined = job.intelligence as any;

  // ── Extract candidate data ──
  const candidateSkills = resume.structuredData?.skills || [];
  const skillEvidence   = (resume.skillEvidence || []) as ISkillEvidence[];
  const experience      = resume.structuredData?.experience || [];
  const internships     = resume.structuredData?.internships || [];
  const projects        = resume.structuredData?.projects || [];
  const education       = resume.structuredData?.education || [];
  const primaryCareer   = resume.primaryCareer || "";
  const candidateName   = resume.structuredData?.personal?.name || "Candidate";

  // ── Extract job requirements ──
  const requiredSkills    = intel?.requiredSkills    || job.requirements || [];
  const preferredSkills   = intel?.preferredSkills   || [];
  const reqExperience     = intel?.requiredExperience || "";
  const reqEducation      = intel?.requiredEducation  || "";
  const jobDomain         = intel?.domain             || "";

  // ── Calculate scores ──
  const candidateYears = calcExperienceYears(experience, internships);
  const { score: skillScore, matched: matchedSkills, missing: missingFromSkills } = calcSkillMatch(
    candidateSkills, skillEvidence, requiredSkills, preferredSkills
  );
  const experienceScore = calcExperienceMatch(candidateYears, reqExperience);
  const projectScore    = calcProjectMatch(projects, requiredSkills);
  const educationScore  = calcEducationMatch(education, reqEducation);
  const domainScore     = calcDomainMatch(primaryCareer, jobDomain, job.title);

  const scores: IMatchScores = {
    skillMatch:      skillScore,
    experienceMatch: experienceScore,
    projectMatch:    projectScore,
    educationMatch:  educationScore,
    domainMatch:     domainScore,
    overall:         0,
  };
  scores.overall = computeOverall(scores);

  const { tier, label } = getMatchTierAndLabel(scores.overall);

  // ── Generate AI narrative ──
  const narrative = await generateNarrative(
    candidateName,
    job.title,
    job.company,
    scores,
    matchedSkills,
    missingFromSkills
  );

  // ── Upsert into DB ──
  const matchDoc = await ResumeJobMatch.findOneAndUpdate(
    { resumeId, jobId },
    {
      $set: {
        scores,
        matchedSkills,
        missingItems: missingFromSkills,
        keyHighlights:         narrative.keyHighlights,
        whyYouMatch:           narrative.whyYouMatch,
        whatsMissing:          narrative.whatsMissing,
        candidateExperience:   `${candidateYears} years`,
        jobRequiredExperience: reqExperience,
        matchTier:  tier,
        matchLabel: label,
        computedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return matchDoc;
}

// ─────────────────────────────────────────────
//  Batch: Match a resume against multiple jobs
// ─────────────────────────────────────────────
export async function matchResumeToAllJobs(
  resumeId: string,
  jobIds: string[],
  concurrency = 3
): Promise<{ matched: number; failed: number }> {
  let matched = 0;
  let failed  = 0;

  for (let i = 0; i < jobIds.length; i += concurrency) {
    const batch = jobIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((jobId) => matchResumeToJob(resumeId, jobId))
    );
    for (const r of results) {
      if (r.status === "fulfilled") matched++;
      else { failed++; console.error("[Matching] Failed:", (r as PromiseRejectedResult).reason?.message); }
    }
    // Small delay between batches to respect Groq rate limits
    if (i + concurrency < jobIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  console.log(`[Matching] Batch complete — matched=${matched} failed=${failed}`);
  return { matched, failed };
}

// ─────────────────────────────────────────────
//  Distribution: count jobs per tier for a resume
// ─────────────────────────────────────────────
export async function getMatchDistribution(resumeId: string) {
  const results = await ResumeJobMatch.aggregate([
    { $match: { resumeId: new (require("mongoose").Types.ObjectId)(resumeId) } },
    { $group: { _id: "$matchTier", count: { $sum: 1 } } },
  ]);

  const dist: Record<string, number> = { "100%": 0, "75%": 0, "50%": 0, "20%": 0, "0%": 0 };
  for (const r of results) dist[r._id] = r.count;
  return dist;
}
