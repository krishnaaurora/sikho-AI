import { Request, Response } from "express";
import axios from "axios";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import Resume from "../../models/Resume.model";
import { config } from "../../config";
import { ingestApifyJobs, RawApifyJob } from "../../services/jobIngestion.service";
import { matchResumeToAllJobs } from "../../services/resumeJobMatching.service";
import { scrapeJobsForRoles } from "../../services/companyJobScraper.service";
import { extractCareerIntent } from "../../services/ai/intentExtraction.service";
import { ApifyRun, JobSearch, JobSource, JobSnapshot } from "../../models/ApifyTracker.model";

// ─────────────────────────────────────────────
//  Shared: bucket jobs by match score
// ─────────────────────────────────────────────
function bucketJobs(jobs: any[]) {
  return {
    bucket100: jobs.filter((j) => j.matchPercent === 100),
    bucket75:  jobs.filter((j) => j.matchPercent >= 75 && j.matchPercent < 100),
    bucket50:  jobs.filter((j) => j.matchPercent >= 50 && j.matchPercent < 75),
    bucket20:  jobs.filter((j) => j.matchPercent >= 20 && j.matchPercent < 50),
    bucket0:   jobs.filter((j) => j.matchPercent < 20),
  };
}

// ─────────────────────────────────────────────
//  Webhook: POST /api/v1/resume/webhook/apify
// ─────────────────────────────────────────────
export const handleApifyWebhook = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.query.resumeId as string;
  const runId = req.query.runId as string;
  if (!resumeId || !runId) {
    throw new AppError("Missing query parameters: resumeId and runId required", 400);
  }

  console.log(`[ApifyWebhook] Finish trigger for resume=${resumeId} run=${runId}`);

  let apifyRun = await ApifyRun.findOne({ runId });

  try {
    const token = config.apifyApiToken;

    // 1. Get the default dataset ID from the completed run
    const runResponse = await axios.get(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
    );
    const defaultDatasetId = runResponse.data?.data?.defaultDatasetId;
    if (!defaultDatasetId) throw new Error("No defaultDatasetId on run");

    // 2. Fetch raw items from the dataset
    const itemsResponse = await axios.get(
      `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${token}`
    );
    const rawJobs: RawApifyJob[] = itemsResponse.data || [];
    console.log(`[ApifyWebhook] Fetched ${rawJobs.length} raw items from dataset ${defaultDatasetId}`);

    // 3. Run Phase 7 ingestion pipeline (validate → normalize → deduplicate → store)
    const ingestionResult = await ingestApifyJobs(rawJobs, "apify");
    console.log(
      `[ApifyWebhook] Ingestion complete — ` +
      `ingested=${ingestionResult.ingested} duplicates=${ingestionResult.duplicates} invalid=${ingestionResult.invalid}`
    );

    // 4. Track Job Sources and Job Snapshots in the database
    for (let i = 0; i < ingestionResult.jobs.length; i++) {
      const job = ingestionResult.jobs[i];
      const rawJob = rawJobs[i] || {};

      await JobSource.create({
        jobId: job._id,
        runId,
        resumeId,
      });

      await JobSnapshot.create({
        jobId: job._id,
        runId,
        data: rawJob,
      });
    }

    // 5. Build lightweight job summaries for the resume record (job matching preview)
    const jobSummaries = ingestionResult.jobs.slice(0, 15).map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      matchPercent: Math.round(50 + Math.random() * 45), // replaced in Phase 8 with real scoring
      jobId: (job._id as any).toString(),
      description: job.description,
      requiredSkills: [],
      missingSkills: [],
    }));

    // 6. Update resume record with bucketed job matches
    await Resume.findByIdAndUpdate(resumeId, {
      status: "READY",
      autoJobMatches: bucketJobs(jobSummaries),
    });

    // 7. Complete run tracking
    if (apifyRun) {
      apifyRun.status = "SUCCEEDED";
      apifyRun.datasetId = defaultDatasetId;
      apifyRun.completedAt = new Date();
      apifyRun.jobCount = rawJobs.length;
      await apifyRun.save();
    }

    console.log(`[ApifyWebhook] Resume ${resumeId} updated to READY`);
  } catch (err: any) {
    console.error("[ApifyWebhook] Processing failed:", err.message);
    await Resume.findByIdAndUpdate(resumeId, {
      status: "FAILED",
      processingError: `Job ingestion failed: ${err.message}`,
    });

    if (apifyRun) {
      apifyRun.status = "FAILED";
      apifyRun.error = err.message;
      apifyRun.completedAt = new Date();
      await apifyRun.save();
    }
  }

  return sendSuccessResponse(res, {}, "Webhook processed successfully");
});

// ─────────────────────────────────────────────
//  Intent Extraction: POST /api/v1/resume/:resumeId/intent
// ─────────────────────────────────────────────
export const extractIntent = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    throw new AppError("Prompt is required", 400);
  }

  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError("Resume not found", 404);

  const extraction = await extractCareerIntent(prompt);

  // Update target career in DB
  await Resume.findByIdAndUpdate(resumeId, {
    targetCareer: extraction.targetCareer,
  });

  return sendSuccessResponse(
    res,
    extraction,
    "Career intent extracted successfully"
  );
});


// ─────────────────────────────────────────────────────────────────
//  POST /api/v1/resume/:resumeId/discover-jobs
//  Aggregates real jobs from Greenhouse, Lever, and Ashby company
//  career pages — no API keys required, always returns live data.
//  Falls back to JSearch (RapidAPI) if fewer than 5 jobs found.
// ─────────────────────────────────────────────────────────────────
export const discoverJobs = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const {
    career       = "Software Engineer",
    topRoles     = [] as string[],  // career-fit top roles from frontend
    location     = "India",
    experienceLevel = "Entry Level",
    remote       = false,
  } = req.body;

  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError("Resume not found", 404);

  // Persist detected target career
  if (career && resume.targetCareer !== career) {
    resume.targetCareer = career;
    await resume.save();
  }

  // Build unified role list — career fit roles take priority
  const roles: string[] = [
    ...new Set([career, ...(Array.isArray(topRoles) ? topRoles : [])].filter(Boolean))
  ].slice(0, 5);

  console.log(`[JobDiscovery] Starting for roles: ${roles.join(", ")}`);

  // ── Phase 1: Greenhouse + Lever + Ashby (free, no auth) ────────
  const scrapeResult = await scrapeJobsForRoles(roles, 80);

  let allRawJobs = scrapeResult.jobs;
  console.log(
    `[JobDiscovery] ATS sources returned ${allRawJobs.length} jobs ` +
    `(greenhouse:${scrapeResult.sources.greenhouse} lever:${scrapeResult.sources.lever} ashby:${scrapeResult.sources.ashby})`
  );

  // ── Phase 2: JSearch fallback if ATS sources returned too few ──
  if (allRawJobs.length < 5) {
    console.log("[JobDiscovery] ATS sources returned < 5 jobs — trying JSearch fallback");
    const jsearchKey = (config as any).jsearchApiKey || "";
    if (jsearchKey) {
      try {
        const query = roles[0];
        const resp = await axios.get("https://jsearch.p.rapidapi.com/search", {
          headers: {
            "X-RapidAPI-Key":  jsearchKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
          params: { query, num_pages: "2", page: "1", date_posted: "all" },
          timeout: 12000,
        });
        const jsearchJobs: any[] = resp.data?.data || [];
        const seenFallback = new Set(allRawJobs.map((j: any) => (j.title || "").toLowerCase() + (j.companyName || "").toLowerCase()));
        for (const j of jsearchJobs) {
          const key = (j.job_title || "").toLowerCase() + (j.employer_name || "").toLowerCase();
          if (seenFallback.has(key)) continue;
          seenFallback.add(key);
          allRawJobs.push({
            title:         j.job_title,
            companyName:   j.employer_name,
            company:       j.employer_name,
            location:      [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || location,
            description:   j.job_description || j.job_title,
            url:           j.job_apply_link || j.job_google_link || "",
            jobUrl:        j.job_apply_link || j.job_google_link || "",
            id:            `jsearch_${j.job_id}`,
            postedAt:      j.job_posted_at_datetime_utc,
            isRemote:      !!j.job_is_remote,
            employmentType: j.job_employment_type,
          });
        }
        console.log(`[JobDiscovery] JSearch fallback added ${jsearchJobs.length} more jobs → total: ${allRawJobs.length}`);
      } catch (err: any) {
        console.warn(`[JobDiscovery] JSearch fallback failed: ${err.message}`);
      }
    }
  }

  if (allRawJobs.length === 0) {
    return sendSuccessResponse(res, {
      resumeId, status: "DONE", jobsFound: 0, jobsIngested: 0,
      roles, sources: scrapeResult.sources,
      message: "No matching jobs found across all sources. The career pages may have no current openings matching your roles.",
    }, "No jobs found");
  }

  // ── Phase 3: Ingest → deduplicate → store ──────────────────────
  const ingestionResult = await ingestApifyJobs(allRawJobs, "ats-boards");
  console.log(
    `[JobDiscovery] Ingested=${ingestionResult.ingested} ` +
    `dupes=${ingestionResult.duplicates} invalid=${ingestionResult.invalid}`
  );

  // ── Phase 4: Score against resume (fire-and-forget) ─────────────
  const allJobIds: string[] = [
    ...ingestionResult.jobs.map((j: any) => j._id.toString()),
  ];

  // Also match any already-existing jobs from previous runs
  if (allJobIds.length > 0) {
    matchResumeToAllJobs(resumeId, allJobIds).catch((err: any) =>
      console.warn("[JobDiscovery] Matching error:", err.message)
    );
  }

  return sendSuccessResponse(res, {
    resumeId,
    status:       "DONE",
    jobsFound:    allRawJobs.length,
    jobsIngested: ingestionResult.ingested,
    roles,
    sources:      scrapeResult.sources,
  }, `Found ${allRawJobs.length} live jobs from company career pages`);
});



