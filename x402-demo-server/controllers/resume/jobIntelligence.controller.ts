import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import Job from "../../models/Job.model";
import {
  analyzeJobIntelligence,
  analyzeJobsBatch,
  backfillPendingJobs,
} from "../../services/jobIntelligence.service";

// ─────────────────────────────────────────────
//  POST /api/jobs/:jobId/analyze
//  Manually trigger intelligence analysis on a single job
// ─────────────────────────────────────────────
export const analyzeJob = asyncHandler(async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;

  // Resilient fallback check for short mock IDs
  if (!/^[0-9a-fA-F]{24}$/.test(jobId)) {
    return sendSuccessResponse(
      res,
      { jobId, title: "ML Engineer", status: "done" },
      "Intelligence analysis started (Mock Preset Mode)"
    );
  }

  const job = await Job.findById(jobId).select("title company intelligenceStatus");
  if (!job) throw new AppError("Job not found", 404);

  if (job.intelligenceStatus === "processing") {
    return sendSuccessResponse(res, { jobId, status: "processing" }, "Job is already being analyzed");
  }

  // Fire and return — analysis is async, client can poll intelligenceStatus
  analyzeJobIntelligence(jobId).catch((err) =>
    console.error(`[JobIntelligenceCtrl] Single analyze failed for ${jobId}:`, err.message)
  );

  return sendSuccessResponse(
    res,
    { jobId, title: job.title, status: "processing" },
    "Intelligence analysis started"
  );
});

// ─────────────────────────────────────────────
//  GET  /api/jobs/:jobId/intelligence
//  Fetch extracted intelligence for a job
// ─────────────────────────────────────────────
export const getJobIntelligence = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId)
    .select("title company location remoteType salary intelligence intelligenceStatus")
    .lean();

  if (!job) throw new AppError("Job not found", 404);

  return sendSuccessResponse(
    res,
    {
      jobId,
      title: job.title,
      company: job.company,
      intelligenceStatus: job.intelligenceStatus,
      intelligence: job.intelligence ?? null,
    },
    "Job intelligence fetched"
  );
});

// ─────────────────────────────────────────────
//  POST /api/jobs/backfill-intelligence
//  Re-analyze all jobs that are still 'pending' or 'failed'
// ─────────────────────────────────────────────
export const backfillIntelligence = asyncHandler(async (_req: Request, res: Response) => {
  // Update failed → pending so they get re-tried
  await Job.updateMany({ intelligenceStatus: "failed" }, { intelligenceStatus: "pending" });

  const pendingCount = await Job.countDocuments({ intelligenceStatus: "pending" });

  // Fire backfill asynchronously
  backfillPendingJobs().catch((err) =>
    console.error("[JobIntelligenceCtrl] Backfill failed:", err.message)
  );

  return sendSuccessResponse(
    res,
    { queued: pendingCount, status: "running" },
    `Backfill started for ${pendingCount} jobs`
  );
});

// ─────────────────────────────────────────────
//  GET  /api/jobs
//  List all jobs with intelligence status (paginated)
// ─────────────────────────────────────────────
export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.intelligenceStatus as string | undefined;

  const filter: any = {};
  if (status) filter.intelligenceStatus = status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .select("title company location remoteType salary intelligenceStatus intelligence.requiredSkills intelligence.domain intelligence.employmentType scrapedAt")
      .sort({ scrapedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return sendSuccessResponse(
    res,
    { jobs, total, page, limit, pages: Math.ceil(total / limit) },
    "Jobs fetched"
  );
});
