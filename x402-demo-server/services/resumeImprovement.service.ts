import Groq from "groq-sdk";
import Resume, { ISkillEvidence } from "../models/Resume.model";
import Job from "../models/Job.model";
import ResumeJobMatch from "../models/ResumeJobMatch.model";
import {
  ResumeImprovementInsight,
  JobResumeRecommendation,
} from "../models/ResumeImprovement.model";
import { config } from "../config";

const MODEL = "openai/gpt-oss-120b";

function getGroqClient(): Groq {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: randomKey });
}

// ─────────────────────────────────────────────
//  Phase 11: Core Analysis Service
// ─────────────────────────────────────────────
export async function runResumeImprovementAnalysis(resumeId: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const userId = resume.userId;
  const targetCareer = resume.primaryCareer || "Data Scientist";

  // 1. Fetch relevant job match pairs (100%, 75%, 50% Match tiers)
  const matches = await ResumeJobMatch.find({
    resumeId,
    matchTier: { $in: ["100%", "75%", "50%"] }
  }).populate("jobId").lean();

  if (matches.length === 0) {
    console.log("[ImprovementEngine] No relevant matches found to aggregate.");
    return { insightsCount: 0, jobRecommendationsCount: 0 };
  }

  // 2. Aggregate market requirements
  const skillsCount: Record<string, number> = {};
  let totalJobs = matches.length;

  for (const m of matches) {
    const job: any = m.jobId;
    if (!job) continue;
    
    // Extract requirements from job intelligence or fallback to raw requirements
    const reqs = job.intelligence?.requiredSkills || job.requirements || [];
    for (const r of reqs) {
      const cleanSkill = r.trim();
      if (!cleanSkill) continue;
      skillsCount[cleanSkill] = (skillsCount[cleanSkill] || 0) + 1;
    }
  }

  // Calculate Market Frequency profile
  const candidateSkills = resume.structuredData?.skills || [];
  const skillEvidence = (resume.skillEvidence || []) as ISkillEvidence[];

  // Clear previous insights & recommendations for this resume
  await Promise.all([
    ResumeImprovementInsight.deleteMany({ resumeId }),
    JobResumeRecommendation.deleteMany({ resumeId })
  ]);

  const insightOps = [];

  // Compare against candidate evidence
  for (const [skill, count] of Object.entries(skillsCount)) {
    const frequency = Math.round((count / totalJobs) * 100);
    if (frequency < 15) continue; // Filter out low-frequency skills

    // Map candidate status
    const evidenceEntry = skillEvidence.find(
      (e) => e.skill.toLowerCase() === skill.toLowerCase()
    );
    let status: "Strong" | "Partial" | "Weak" | "Missing" = "Missing";
    if (evidenceEntry) {
      if (evidenceEntry.status === "Strong") status = "Strong";
      else if (evidenceEntry.status === "Partial") status = "Partial";
      else if (evidenceEntry.status === "Listed Only") status = "Weak";
    } else if (candidateSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      status = "Weak";
    }

    // Determine priority = Frequency * Candidate Gap
    let priority: "High" | "Medium" | "Low" = "Low";
    if (status === "Missing" && frequency >= 50) priority = "High";
    else if (status === "Weak" && frequency >= 40) priority = "Medium";
    else if (status === "Missing" && frequency >= 25) priority = "Medium";
    else if (status === "Strong") priority = "Low";

    // Generate recommendation statement
    let recommendation = "";
    if (status === "Missing") {
      recommendation = `Add ${skill} keywords and build a small project or document your coursework on it.`;
    } else if (status === "Weak") {
      recommendation = `Strengthen evidence for ${skill} by linking it to a project or experience detail.`;
    } else if (status === "Partial") {
      recommendation = `Highlight ${skill} metrics and measurable output in your latest project.`;
    } else {
      recommendation = `Maintain Python/SQL evidence alignment.`;
    }

    insightOps.push({
      resumeId,
      userId,
      career: targetCareer,
      skill,
      marketDemand: frequency,
      candidateStatus: status,
      priority,
      recommendation,
      sourceJobCount: count,
    });
  }

  // Save market-level insights
  if (insightOps.length > 0) {
    await ResumeImprovementInsight.insertMany(insightOps);
  }

  // 3. Generate job-level recommendations (for top matches)
  const jobRecOps = [];
  const topMatches = matches.slice(0, 4); // Limit to top 4 for performance/UI carousel

  for (const m of topMatches) {
    const job: any = m.jobId;
    if (!job) continue;

    // Filter missing/weak skills for this specific job match
    const missing = m.missingItems?.filter((x: any) => x.importance === "Critical").map((x: any) => x.skill) || [];
    const weak = m.matchedSkills?.filter((x: any) => x.strength === "Listed Only").map((x: any) => x.skill) || [];

    const recText = [];
    if (missing.length > 0) {
      recText.push(`Strengthen ${job.title} relevance by adding ${missing.slice(0, 2).join("/")} details.`);
    }
    if (weak.length > 0) {
      recText.push(`Add concrete deployment or metrics evidence for ${weak.slice(0, 2).join("/")}.`);
    }
    if (recText.length === 0) {
      recText.push("Your resume matches all requirements. Quantify current bullet points for impact.");
    }

    jobRecOps.push({
      resumeId,
      userId,
      jobId: job._id,
      recommendation: recText,
      reason: `This job requires ${missing.concat(weak).slice(0, 3).join(", ")} which are missing or weakly evidenced in your resume.`,
      relatedSkill: missing.concat(weak),
      priority: m.scores.overall >= 80 ? "High" : "Medium"
    });
  }

  if (jobRecOps.length > 0) {
    await JobResumeRecommendation.insertMany(jobRecOps);
  }

  return {
    insightsCount: insightOps.length,
    jobRecommendationsCount: jobRecOps.length
  };
}

export async function generateLiveImprovements(resumeId: string, jobId: string, userPrompt: string): Promise<any[]> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const job = /^[0-9a-fA-F]{24}$/.test(jobId) ? await Job.findById(jobId).lean() : null;

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");
  const jobTitle = job ? job.title : "Target Role";
  const jobDesc = job ? job.description : "No job selected";

  const systemPrompt = `You are a professional ATS resume optimizer. You rewrite resume sections based on a selected job description and user prompt requests.
You must return a valid JSON array of objects representing exact before/after suggestions.
Format:
[
  {
    "id": 0,
    "title": "1. [Short label of the project or section item changed]",
    "impact": "High Impact" | "Medium Impact" | "Low Impact",
    "color": "bg-red-55 text-red-655 border-red-100",
    "before": "[Exact old text from the resume]",
    "after": "[Exact improved new text adding metrics, tool names, and outcomes]",
    "badges": ["Added Impact", "Quantified", "Tools Added", "Outcome Added"]
  }
]
Constraints:
- Respect the user's focus instructions: "${userPrompt}". If they request to modify ONLY the project section, rewrite only project bullet points.
- Output ONLY a raw JSON array. No markdown wraps, no explanations.`;

  const userContent = `Selected Job: ${jobTitle}
Selected Job Description: ${jobDesc}
Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(resultText.trim());
    return Array.isArray(parsed) ? parsed : parsed.suggestions || Object.values(parsed)[0] || [];
  } catch (err: any) {
    console.error("[GroqImprovement] Live improvement generation failed:", err.message);
    throw new Error(`Failed to generate optimized suggestions: ${err.message}`);
  }
}

export async function generateProjectRecommendation(resumeId: string, jobId: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const job = /^[0-9a-fA-F]{24}$/.test(jobId) ? await Job.findById(jobId).lean() : null;

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");
  const jobTitle = job ? job.title : "Target Role";
  const jobDesc = job ? job.description : "No job selected";

  const systemPrompt = `You are a professional technical career coach. Suggest a specific, high-impact hands-on project the user should build to cover the skills gap between their current resume and their selected target job requirements.
You must return a valid JSON object matching this structure:
{
  "projectName": "Name of recommended project",
  "rationale": "Why this project is highly relevant to the gaps",
  "missingSkills": ["List of missing skills it targets"],
  "requirementsMetCount": 17,
  "architecture": "Describe architectural setup",
  "techStack": ["Stack items"],
  "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"],
  "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
  "apis": ["Endpoint 1 details", "Endpoint 2 details"],
  "deployment": "Deployment guidelines",
  "resumeBullet": "High-impact resume bullet points they can add after building it",
  "readme": "Markdown README template outline structure"
}
Output ONLY raw JSON. No markdown code block wraps.`;

  const userContent = `Selected Job: ${jobTitle}
Selected Job Description: ${jobDesc}
Current Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    return JSON.parse(resultText.trim());
  } catch (err: any) {
    console.error("[GroqProject] Project recommendations generation failed:", err.message);
    throw new Error(`Failed to generate custom project recommendation: ${err.message}`);
  }
}

export async function generateCareerActionPlan(resumeId: string, targetCareer: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");

  const systemPrompt = `You are an elite career development strategist and coach. Generate a complete 30-day action plan for transition into the target career of ${targetCareer}.
You must return a valid JSON object matching this structure:
{
  "targetCareer": "${targetCareer}",
  "overview": "Overview of the 30-day career roadmap",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Focus of Week 1",
      "days": [
        { "day": 1, "task": "Task for Day 1" },
        { "day": 2, "task": "Task for Day 2" },
        { "day": 3, "task": "Task for Day 3" },
        { "day": 4, "task": "Task for Day 4" },
        { "day": 5, "task": "Task for Day 5" },
        { "day": 6, "task": "Task for Day 6" },
        { "day": 7, "task": "Task for Day 7" }
      ]
    },
    {
      "weekNumber": 2,
      "focus": "Focus of Week 2",
      "days": [
        { "day": 8, "task": "Task for Day 8" },
        { "day": 9, "task": "Task for Day 9" },
        { "day": 10, "task": "Task for Day 10" },
        { "day": 11, "task": "Task for Day 11" },
        { "day": 12, "task": "Task for Day 12" },
        { "day": 13, "task": "Task for Day 13" },
        { "day": 14, "task": "Task for Day 14" }
      ]
    },
    {
      "weekNumber": 3,
      "focus": "Focus of Week 3",
      "days": [
        { "day": 15, "task": "Task for Day 15" },
        { "day": 16, "task": "Task for Day 16" },
        { "day": 17, "task": "Task for Day 17" },
        { "day": 18, "task": "Task for Day 18" },
        { "day": 19, "task": "Task for Day 19" },
        { "day": 20, "task": "Task for Day 20" },
        { "day": 21, "task": "Task for Day 21" }
      ]
    },
    {
      "weekNumber": 4,
      "focus": "Focus of Week 4",
      "days": [
        { "day": 22, "task": "Task for Day 22" },
        { "day": 23, "task": "Task for Day 23" },
        { "day": 24, "task": "Task for Day 24" },
        { "day": 25, "task": "Task for Day 25" },
        { "day": 26, "task": "Task for Day 26" },
        { "day": 27, "task": "Task for Day 27" },
        { "day": 28, "task": "Task for Day 28" },
        { "day": 29, "task": "Task for Day 29" },
        { "day": 30, "task": "Task for Day 30" }
      ]
    }
  ],
  "learningResources": ["Resource 1", "Resource 2", "Resource 3"],
  "interviewPrep": ["Tip 1", "Tip 2", "Tip 3"]
}
Output ONLY raw JSON. No markdown code wraps.`;

  const userContent = `Target Career: ${targetCareer}
Current Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    return JSON.parse(resultText.trim());
  } catch (err: any) {
    console.error("[GroqActionPlan] Career action plan generation failed:", err.message);
    throw new Error(`Failed to generate transition action plan: ${err.message}`);
  }
}
