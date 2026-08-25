/**
 * findJobs.controller.ts
 * ─────────────────────────────────────────────────────────────────
 * POST /api/resume/:resumeId/find-jobs   — x402 $0.02 USDC
 *
 * The single paid endpoint in Resume Intelligence. Takes the user's
 * top-5 career-fit roles and runs a two-phase real-time job discovery:
 *
 * PAGE 1 — Gemini + Google Search grounding (~10 jobs per role)
 *   Uses Gemini's Google Search grounding to find live job postings,
 *   extracts jobUrl + applyUrl from search citations.
 *
 * PAGE 2+ — Company ATS APIs (Greenhouse, Lever, Ashby)
 *   Scrapes 35+ company career pages in parallel using free public APIs.
 *
 * After discovery: normalise → deduplicate → store → resume↔job match.
 *
 * Responses:
 *   { status: "done", jobsFound, jobsIngested, roles, page1Count, page2Count }
 *
 * IMPORTANT: Never fabricate job URLs. If Gemini doesn't return a
 * verifiable URL, the job is stored with jobUrl = null.
 */

import { Response } from "express";
import axios from "axios";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";
import { sendSuccessResponse } from "../../utils/response";
import Resume from "../../models/Resume.model";
import { analyzeCareerFit } from "../../services/careerFit.service";
import { config } from "../../config";
import { ingestApifyJobs, RawApifyJob } from "../../services/jobIngestion.service";
import { scrapeJobsForRoles } from "../../services/companyJobScraper.service";
import { matchResumeToAllJobs } from "../../services/resumeJobMatching.service";

// ─── Gemini REST helper ───────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.0-flash";

async function searchJobsWithGemini(
  role: string,
  location: string
): Promise<RawApifyJob[]> {
  const geminiKey = (config as any).geminiApiKey || "";
  if (!geminiKey) return [];

  const prompt = `Find 10 current real job openings for "${role}" ${location ? `in ${location}` : ""}.

For each job return a JSON array with this exact schema:
[
  {
    "title": "exact job title",
    "company": "company name",
    "location": "city, country",
    "jobUrl": "REAL verified URL to the job posting page — must start with https://",
    "applyUrl": "REAL application URL if different from jobUrl, otherwise null",
    "source": "Greenhouse | Lever | Ashby | LinkedIn | Indeed | company careers page",
    "postedAt": "ISO date string or null",
    "salary": "salary range or null",
    "description": "2-3 sentence description of the role",
    "isRemote": true or false
  }
]

CRITICAL RULES:
- Only include jobs you can verify exist right now via Google Search
- jobUrl MUST be a real HTTP/HTTPS URL to the actual job page
- Do NOT invent URLs. If you cannot find a verified URL, omit that job.
- Do NOT use Google search result pages as jobUrl
- Do NOT use a company homepage as jobUrl
- applyUrl should only be set if it is a DIFFERENT verified application URL
- Return only the JSON array, no markdown, no explanation`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
    const resp = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],  // Google Search grounding
        generationConfig: { temperature: 0.1 },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 25000 }
    );

    const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "").trim();

    const parsed: any[] = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(j =>
        j.title && j.company &&
        j.jobUrl && j.jobUrl.startsWith("https://") &&
        !j.jobUrl.includes("google.com/search") &&
        !j.jobUrl.match(/^https?:\/\/[^/]+\/?$/) // not bare homepage
      )
      .map((j, idx) => ({
        title:          j.title,
        company:        j.company,
        companyName:    j.company,
        location:       j.location || location || "Remote",
        description:    j.description || j.title,
        url:            j.jobUrl,
        jobUrl:         j.jobUrl,
        applyUrl:       j.applyUrl?.startsWith("https://") ? j.applyUrl : undefined,
        salary:         j.salary || undefined,
        postedAt:       j.postedAt || undefined,
        isRemote:       !!j.isRemote,
        id:             `gemini_${role.replace(/\s+/g, "_")}_${idx}`,
        // Tag the discovery source for the source badge
        employmentType: j.source || "Web Search",
      }));
  } catch (err: any) {
    console.warn(`[FindJobs] Gemini search failed for "${role}": ${err.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/resume/:resumeId/find-jobs   (x402 $0.02)
// ─────────────────────────────────────────────────────────────────
export const findJobs = asyncHandler(async (req: any, res: Response) => {
  const resumeId = req.body.resumeId || req.params.resumeId || req.query.resumeId;
  const {
    location     = "India",
    experienceLevel = "Entry Level",
  } = req.body;

  // 1. Load resume + career-fit roles
  const resume = await Resume.findById(resumeId).select(
    "status primaryCareer detectedCareers targetCareer"
  );
  if (!resume) throw new AppError("Resume not found", 404);
  if (resume.status === "PROCESSING")
    throw new AppError("Resume extraction is still in progress", 400);

  // Build top-5 roles from career fit data.
  // If detectedCareers is empty, run career-fit analysis now so we have accurate roles.
  let detectedCareers = resume.detectedCareers || [];
  if (detectedCareers.length === 0) {
    try {
      const fullResume = await Resume.findById(resumeId).select("rawText structuredData");
      if (fullResume?.rawText) {
        const cfResult = await analyzeCareerFit(fullResume.rawText, (fullResume.structuredData as any) || {});
        detectedCareers = cfResult.topRoles.map((r: any) => ({ career: r.role, confidence: r.confidence }));
        // Persist so future calls are instant
        await Resume.findByIdAndUpdate(resumeId, {
          detectedCareers,
          primaryCareer: cfResult.primaryCareer,
        });
        console.log(`[FindJobs] Computed career fit on-the-fly: ${cfResult.primaryCareer}`);
      }
    } catch (cfErr: any) {
      console.warn(`[FindJobs] Career fit computation failed: ${cfErr.message}`);
      if (cfErr?.status === 429 || cfErr?.message?.includes("Rate limit") || cfErr?.message?.includes("429")) {
        return res.status(200).json({
          success: true,
          data: {
            status: "temporarily_unavailable",
            message: "Live job analysis is temporarily busy. Please try again shortly."
          },
          message: "Service temporarily rate limited"
        });
      }
    }
  }

  const topRoles: string[] = [];
  if (detectedCareers.length) {
    const sorted = [...detectedCareers].sort(
      (a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );
    topRoles.push(...sorted.slice(0, 5).map((r: any) => r.career || r.role || ""));
  }
  if (!topRoles.length && resume.primaryCareer)   topRoles.push(resume.primaryCareer);
  if (!topRoles.length && resume.targetCareer)    topRoles.push(resume.targetCareer);
  if (!topRoles.length)                           topRoles.push("Software Engineer");

  const roles = [...new Set(topRoles.filter(Boolean))];
  console.log(`[FindJobs] Discovering jobs for roles: ${roles.join(", ")}`);

  // ── PAGE 1: Gemini + Google Search (~10 jobs per role) ───────────
  const geminiJobsRaw: RawApifyJob[] = [];
  const geminiSeen = new Set<string>();

  for (const role of roles) {
    const jobs = await searchJobsWithGemini(role, location);
    for (const j of jobs) {
      const key = `${(j.jobUrl || "").toLowerCase()}`;
      if (geminiSeen.has(key)) continue;
      geminiSeen.add(key);
      // Tag source as gemini for the source badge
      geminiJobsRaw.push({ ...j, id: j.id || `gemini_${geminiSeen.size}` });
    }
  }
  console.log(`[FindJobs] PAGE 1 — Gemini returned ${geminiJobsRaw.length} verified jobs`);

  // ── PAGE 2+: Greenhouse + Lever + Ashby ─────────────────────────
  const atsResult = await scrapeJobsForRoles(roles, 80);
  console.log(`[FindJobs] PAGE 2+ — ATS sources: greenhouse=${atsResult.sources.greenhouse} lever=${atsResult.sources.lever} ashby=${atsResult.sources.ashby}`);

  // ── JSearch fallback if both sources returned very few jobs ──────
  const fallbackJobs: RawApifyJob[] = [];
  if (geminiJobsRaw.length + atsResult.jobs.length < 5) {
    const jsearchKey = (config as any).jsearchApiKey || "";
    if (jsearchKey) {
      try {
        const query = roles[0] || "Software Engineer";
        const resp = await axios.get("https://jsearch.p.rapidapi.com/search", {
          headers: { "X-RapidAPI-Key": jsearchKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
          params: { query, num_pages: "2", page: "1", date_posted: "all" },
          timeout: 12000,
        });
        const jJobs: any[] = resp.data?.data || [];
        for (const j of jJobs) {
          fallbackJobs.push({
            title:         j.job_title,
            companyName:   j.employer_name,
            company:       j.employer_name,
            location:      [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || location,
            description:   j.job_description || j.job_title,
            url:           j.job_apply_link || j.job_google_link || "",
            jobUrl:        j.job_apply_link || j.job_google_link || "",
            applyUrl:      j.job_apply_link?.startsWith("https://") ? j.job_apply_link : undefined,
            id:            `jsearch_${j.job_id}`,
            postedAt:      j.job_posted_at_datetime_utc,
            isRemote:      !!j.job_is_remote,
            employmentType: j.job_employment_type,
          });
        }
        console.log(`[FindJobs] JSearch fallback added ${fallbackJobs.length} jobs`);
      } catch (err: any) {
        console.warn(`[FindJobs] JSearch fallback failed: ${err.message}`);
      }
    }
  }

  // ── Merge all sources, filter invalid URLs ───────────────────────
  const allRaw: RawApifyJob[] = [
    ...geminiJobsRaw,
    ...atsResult.jobs,
    ...fallbackJobs,
  ].filter(j =>
    j.title && j.company &&
    (j.jobUrl || j.url || j.applyUrl)  // must have at least one real URL
  );

  if (allRaw.length === 0) {
    return sendSuccessResponse(res, {
      resumeId, status: "done",
      jobsFound: 0, jobsIngested: 0, roles,
      page1Count: geminiJobsRaw.length,
      page2Count: atsResult.jobs.length,
      message: "No verified job postings found. Career pages may have no current openings.",
    }, "Job discovery complete");
  }

  // ── Ingest → deduplicate → store ────────────────────────────────
  const ingestionResult = await ingestApifyJobs(allRaw, "find-jobs");
  console.log(`[FindJobs] Ingested=${ingestionResult.ingested} dupes=${ingestionResult.duplicates} invalid=${ingestionResult.invalid}`);

  // ── Score against resume (fire-and-forget) ───────────────────────
  const newJobIds = ingestionResult.jobs.map((j: any) => j._id.toString());
  if (newJobIds.length > 0) {
    matchResumeToAllJobs(resumeId, newJobIds).catch((err: any) =>
      console.warn("[FindJobs] Matching error:", err.message)
    );
  }

  return sendSuccessResponse(res, {
    resumeId,
    status:       "done",
    jobsFound:    allRaw.length,
    jobsIngested: ingestionResult.ingested,
    roles,
    page1Count:   geminiJobsRaw.length,
    page2Count:   atsResult.jobs.length + fallbackJobs.length,
    sources:      {
      gemini:      geminiJobsRaw.length,
      greenhouse:  atsResult.sources.greenhouse,
      lever:       atsResult.sources.lever,
      ashby:       atsResult.sources.ashby,
      jsearch:     fallbackJobs.length,
    },
  }, `Found ${allRaw.length} verified live jobs across ${roles.length} career roles`);
});
