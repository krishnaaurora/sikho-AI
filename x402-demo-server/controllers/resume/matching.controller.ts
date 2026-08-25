import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import Job from "../../models/Job.model";
import ResumeJobMatch from "../../models/ResumeJobMatch.model";
import {
  matchResumeToJob,
  matchResumeToAllJobs,
  getMatchDistribution,
} from "../../services/resumeJobMatching.service";

// ─────────────────────────────────────────────
//  POST /api/v1/resume/:resumeId/match/:jobId
//  Match a single resume against a specific job
// ─────────────────────────────────────────────
export const matchSingleJob = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const jobId    = req.params.jobId    as string;

  const result = await matchResumeToJob(resumeId, jobId);
  return sendSuccessResponse(res, result, "Match computed");
});

// ─────────────────────────────────────────────
//  GET /api/v1/resume/:resumeId/match/:jobId
//  Fetch existing match result for a resume+job pair
// ─────────────────────────────────────────────
export const getMatch = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const jobId    = req.params.jobId    as string;

  const match = await ResumeJobMatch.findOne({ resumeId, jobId })
    .populate("jobId", "title company location remoteType salary jobUrl intelligence.employmentType")
    .lean();

  if (!match) throw new AppError("Match not found — run POST first", 404);
  return sendSuccessResponse(res, match, "Match fetched");
});

// ─────────────────────────────────────────────
//  POST /api/v1/resume/:resumeId/match-all
//  Match a resume against all jobs in the DB (or a subset)
// ─────────────────────────────────────────────
export const matchAllJobs = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const limit    = parseInt(req.query.limit as string) || 50;

  // Match all jobs — include newly ingested ones regardless of intelligence status
  const jobs = await Job.find({})
    .select("_id")
    .sort({ scrapedAt: -1 })
    .limit(limit)
    .lean();

  const jobIds = jobs.map((j) => (j._id as any).toString());

  if (jobIds.length === 0) {
    return sendSuccessResponse(res, { matched: 0, failed: 0 }, "No analyzed jobs available yet");
  }

  // Fire async — respond immediately
  matchResumeToAllJobs(resumeId, jobIds).catch((err) =>
    console.error("[MatchingCtrl] batch failed:", err.message)
  );

  return sendSuccessResponse(
    res,
    { queued: jobIds.length, status: "matching" },
    `Matching started for ${jobIds.length} jobs`
  );
});

// ─────────────────────────────────────────────
//  GET /api/v1/resume/:resumeId/matches
//  Get all match results for a resume (sorted by score)
// ─────────────────────────────────────────────
export const getResumeMatches = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const page     = parseInt(req.query.page  as string) || 1;
  const limit    = parseInt(req.query.limit as string) || 20;
  const tier     = req.query.tier as string | undefined;

  const filter: any = { resumeId };
  if (tier) filter.matchTier = tier;

  const [matches, total, distribution] = await Promise.all([
    ResumeJobMatch.find(filter)
      .populate("jobId", "title company location remoteType salary jobUrl applyUrl source postedAt experienceLevel description intelligence.employmentType intelligence.domain intelligence.requiredSkills intelligence.summary")
      .sort({ "scores.overall": -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ResumeJobMatch.countDocuments(filter),
    getMatchDistribution(resumeId),
  ]);

  // Add convenience aliases so the frontend can read consistent field names
  const normalised = matches.map((m: any) => ({
    ...m,
    // Frontend reads m.matchScore (0-1); schema stores scores.overall (0-100)
    matchScore: (m.scores?.overall ?? 0) / 100,
    // Frontend reads m.matchedSkills as string[]; schema stores objects
    matchedSkills: (m.matchedSkills || []).map((s: any) =>
      typeof s === "string" ? s : s.skill
    ),
    // Frontend reads m.missingSkills; schema field is missingItems
    missingSkills: (m.missingItems || []).map((i: any) =>
      typeof i === "string" ? i : i.skill
    ),
    // Frontend reads m.whyMatch; schema field is whyYouMatch
    whyMatch: m.whyYouMatch || [],
  }));

  return sendSuccessResponse(
    res,
    {
      matches: normalised,
      distribution,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    "Matches fetched"
  );
});

// ─────────────────────────────────────────────
//  GET /api/v1/resume/:resumeId/match-distribution
//  Get tier distribution summary for donut chart
// ─────────────────────────────────────────────
export const getDistribution = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const dist = await getMatchDistribution(resumeId);
  return sendSuccessResponse(res, dist, "Distribution fetched");
});
