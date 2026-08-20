import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import {
  runResumeImprovementAnalysis,
  generateLiveImprovements,
  generateProjectRecommendation,
} from "../../services/resumeImprovement.service";
import {
  ResumeImprovementInsight,
  JobResumeRecommendation,
} from "../../models/ResumeImprovement.model";

// ─────────────────────────────────────────────
//  POST /api/resume/:resumeId/improvements/analyze
//  Runs calculations and populates insights and job-specific recommendations
// ─────────────────────────────────────────────
export const analyzeResumeImprovements = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;

  const result = await runResumeImprovementAnalysis(resumeId);

  return sendSuccessResponse(res, result, "Resume improvement analysis complete.");
});

// ─────────────────────────────────────────────
//  GET /api/resume/:resumeId/improvements
//  Fetches market-level insights and job-specific recommendations
// ─────────────────────────────────────────────
export const getResumeImprovements = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;

  const [marketInsights, jobRecommendations] = await Promise.all([
    ResumeImprovementInsight.find({ resumeId }).sort({ priority: 1, marketDemand: -1 }).lean(),
    JobResumeRecommendation.find({ resumeId })
      .populate("jobId", "title company location remoteType salary jobUrl")
      .lean(),
  ]);

  return sendSuccessResponse(
    res,
    { marketInsights, jobRecommendations },
    "Resume improvements fetched successfully."
  );
});

// ─────────────────────────────────────────────
//  POST /api/resume/:resumeId/improvements/apply
//  Dynamic user-prompted resume optimizer
// ─────────────────────────────────────────────
export const applyResumeImprovements = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const jobId = req.body.jobId as string;
  const prompt = req.body.prompt as string;

  const suggestions = await generateLiveImprovements(resumeId, jobId, prompt);
  return sendSuccessResponse(res, suggestions, "AI suggestions generated successfully.");
});

// ─────────────────────────────────────────────
//  POST /api/resume/:resumeId/projects/generate
//  Dynamic project generator addressing missing skill gaps
// ─────────────────────────────────────────────
export const generateProjectPlan = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = req.params.resumeId as string;
  const jobId = req.body.jobId as string;

  const projectPlan = await generateProjectRecommendation(resumeId, jobId);
  return sendSuccessResponse(res, projectPlan, "AI project recommendation generated successfully.");
});
