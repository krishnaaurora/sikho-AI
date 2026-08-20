import { Request, Response } from "express";
import axios from "axios";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import Resume from "../../models/Resume.model";
import { config } from "../../config";
import { ingestApifyJobs, RawApifyJob } from "../../services/jobIngestion.service";
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
//  Webhook: POST /api/resume/webhook/apify
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
//  Intent Extraction: POST /api/resume/:resumeId/intent
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

// ─────────────────────────────────────────────
//  Trigger: POST /api/resume/:resumeId/discover-jobs
// ─────────────────────────────────────────────
export const discoverJobs = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const { 
    career = "Data Scientist", 
    location = "India", 
    experienceLevel = "Entry Level", 
    remote = false 
  } = req.body;

  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError("Resume not found", 404);

  // Sync / ensure targetCareer is set on resume record
  if (career && resume.targetCareer !== career) {
    resume.targetCareer = career;
    await resume.save();
  }

  const token = config.apifyApiToken;

  // Build target career search queries dynamically (Phase 13 workflow)
  let searchQueries: string[] = [];
  if (experienceLevel === "Internship" || experienceLevel.toLowerCase().includes("intern")) {
    searchQueries = [`${career} Intern`, `Junior ${career} Intern`, `Graduate ${career}`];
  } else if (experienceLevel === "Senior Level" || experienceLevel.toLowerCase().includes("senior") || experienceLevel.toLowerCase().includes("lead")) {
    searchQueries = [`Senior ${career}`, `Lead ${career}`, `Staff ${career}`];
  } else {
    searchQueries = [career, `Junior ${career}`, `${career} Engineer`];
  }

  // Prepend or append location filters
  let formattedLocation = location;
  if (remote) {
    searchQueries = searchQueries.map(q => `${q} Remote`);
    formattedLocation = "Remote";
  } else if (location && location !== "India") {
    searchQueries = searchQueries.map(q => `${q} in ${location}`);
  }

  // Actor input for Google Jobs Scraper
  const actorInput = {
    searchQueries,
    locations: [location || "India"],
    maxItems: 20,
  };

  const webhookUrl =
    `${req.protocol}://${req.get("host")}/api/resume/webhook/apify?resumeId=${resumeId}`;

  if (!token) {
    throw new AppError("Apify API Token (APIFY_API_TOKEN) is not configured in .env file.", 400);
  }

  try {
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/apify~google-jobs-scraper/runs?token=${token}`,
      actorInput,
      { headers: { "Content-Type": "application/json" } }
    );

    const runId: string = runResponse.data?.data?.id;
    if (!runId) {
      throw new Error("No run ID returned from Apify");
    }
    const actorId = "apify~google-jobs-scraper";
    console.log(`[ApifyDiscover] Started Actor run ${runId} for resume ${resumeId}`);

    // Track the run
    await ApifyRun.create({
      runId,
      actorId,
      searchQuery: searchQueries.join(", "),
      status: "RUNNING",
      startedAt: new Date(),
      resumeId,
    });

    // Track the search
    await JobSearch.create({
      resumeId,
      searchQuery: searchQueries.join(", "),
      runId,
    });

    // Fire-and-forget background poll → simulate webhook when run finishes
    setTimeout(async () => {
      try {
        console.log(`[ApifyDiscover] Background webhook trigger for run ${runId}`);
        await axios.post(`${webhookUrl}&runId=${runId}`);
      } catch (err: any) {
        console.error("[ApifyDiscover] Background webhook trigger failed:", err.message);
      }
    }, 10_000);

    return sendSuccessResponse(
      res,
      { resumeId, status: "DISCOVERING", runId, searchQueries, location, remote },
      "Job discovery initiated"
    );
  } catch (err: any) {
    console.error("[ApifyDiscover] Actor start failed:", err.message);
    throw new AppError(`Failed to trigger job discovery via Apify: ${err.response?.data?.error?.message || err.message}`, 500);
  }
});


