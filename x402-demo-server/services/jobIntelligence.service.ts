import Groq from "groq-sdk";
import Job, { IJobIntelligence } from "../models/Job.model";
import { config } from "../config";

const MODEL = "openai/gpt-oss-120b";
const BATCH_SIZE = 5;          // jobs analyzed per batch
const DELAY_MS  = 1200;        // delay between batches to respect rate limits

// ─────────────────────────────────────────────
//  Groq client (round-robin key rotation)
// ─────────────────────────────────────────────
function getGroqClient(): Groq {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

// ─────────────────────────────────────────────
//  LLM Extraction prompt
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Job Description Intelligence Engine.
Given a raw job posting, extract structured information and return ONLY valid JSON.
Do not include markdown, code fences, or explanations — just the JSON object.`;

function buildUserPrompt(title: string, company: string, description: string): string {
  return `
Job Title: ${title}
Company: ${company}
Job Description:
"""
${description.slice(0, 3000)}
"""

Extract and return this exact JSON structure:
{
  "requiredSkills": ["list of required technical skills and programming languages"],
  "requiredExperience": "experience range as string e.g. '0-2 years' or '3+ years' or 'Fresher'",
  "requiredEducation": "education requirement e.g. 'B.Tech/B.E. in CS or related field'",
  "requiredCertifications": ["list of required certifications if any"],
  "preferredSkills": ["optional/preferred technical skills"],
  "preferredTools": ["tools, platforms, frameworks that are preferred but not mandatory"],
  "preferredCertifications": ["preferred certifications if any"],
  "responsibilities": ["3-6 key job responsibilities as short bullet points"],
  "domain": "primary domain e.g. 'Machine Learning', 'Data Engineering', 'Web Development', 'DevOps'",
  "employmentType": "e.g. 'Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'",
  "remoteStatus": "e.g. 'Remote', 'Hybrid', 'On-site', 'Unspecified'",
  "salaryRange": "extracted salary as string, empty string if not mentioned"
}`;
}

// ─────────────────────────────────────────────
//  Parse LLM response → IJobIntelligence
// ─────────────────────────────────────────────
function parseIntelligenceResponse(raw: string, modelUsed: string): IJobIntelligence {
  // Strip markdown code fences if model ignores instruction
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try extracting first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in LLM response");
    parsed = JSON.parse(match[0]);
  }

  return {
    requiredSkills:           Array.isArray(parsed.requiredSkills)          ? parsed.requiredSkills          : [],
    requiredExperience:       typeof parsed.requiredExperience === "string"  ? parsed.requiredExperience      : "",
    requiredEducation:        typeof parsed.requiredEducation === "string"   ? parsed.requiredEducation       : "",
    requiredCertifications:   Array.isArray(parsed.requiredCertifications)   ? parsed.requiredCertifications  : [],
    preferredSkills:          Array.isArray(parsed.preferredSkills)          ? parsed.preferredSkills         : [],
    preferredTools:           Array.isArray(parsed.preferredTools)           ? parsed.preferredTools          : [],
    preferredCertifications:  Array.isArray(parsed.preferredCertifications)  ? parsed.preferredCertifications : [],
    responsibilities:         Array.isArray(parsed.responsibilities)         ? parsed.responsibilities        : [],
    domain:                   typeof parsed.domain === "string"              ? parsed.domain                  : "",
    employmentType:           typeof parsed.employmentType === "string"      ? parsed.employmentType          : "",
    remoteStatus:             typeof parsed.remoteStatus === "string"        ? parsed.remoteStatus            : "",
    salaryRange:              typeof parsed.salaryRange === "string"         ? parsed.salaryRange             : "",
    analyzedAt:               new Date(),
    modelUsed,
  };
}

// ─────────────────────────────────────────────
//  Analyze a single job
// ─────────────────────────────────────────────
export async function analyzeJobIntelligence(jobId: string): Promise<IJobIntelligence | null> {
  const job = await Job.findById(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Mark as processing
  await Job.findByIdAndUpdate(jobId, { intelligenceStatus: "processing" });

  const groq = getGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: buildUserPrompt(job.title, job.company, job.description) },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const intelligence = parseIntelligenceResponse(rawContent, MODEL);

    await Job.findByIdAndUpdate(jobId, {
      intelligence,
      intelligenceStatus: "done",
    });

    console.log(`[JobIntelligence] ✓ Analyzed: "${job.title}" @ ${job.company}`);
    return intelligence;
  } catch (err: any) {
    console.error(`[JobIntelligence] ✗ Failed for ${jobId}:`, err.message);
    await Job.findByIdAndUpdate(jobId, { intelligenceStatus: "failed" });
    return null;
  }
}

// ─────────────────────────────────────────────
//  Batch analyze a list of job IDs
//  (used right after ingestion from Phase 7)
// ─────────────────────────────────────────────
export async function analyzeJobsBatch(jobIds: string[]): Promise<{
  analyzed: number;
  failed: number;
}> {
  let analyzed = 0;
  let failed   = 0;

  for (let i = 0; i < jobIds.length; i += BATCH_SIZE) {
    const batch = jobIds.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map((id) => analyzeJobIntelligence(id))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value !== null) {
        analyzed++;
      } else {
        failed++;
      }
    }

    // Rate-limit guard between batches
    if (i + BATCH_SIZE < jobIds.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`[JobIntelligence] Batch complete — analyzed=${analyzed} failed=${failed}`);
  return { analyzed, failed };
}

// ─────────────────────────────────────────────
//  Backfill: analyze all pending jobs in DB
//  (for re-running or catching missed jobs)
// ─────────────────────────────────────────────
export async function backfillPendingJobs(): Promise<{ analyzed: number; failed: number }> {
  const pendingJobs = await Job.find({ intelligenceStatus: "pending" })
    .select("_id")
    .lean();

  const ids = pendingJobs.map((j) => (j._id as any).toString());
  console.log(`[JobIntelligence] Backfill: found ${ids.length} pending jobs`);

  if (ids.length === 0) return { analyzed: 0, failed: 0 };
  return analyzeJobsBatch(ids);
}
