import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";
import { sendSuccessResponse } from "../../utils/response";
import Resume from "../../models/Resume.model";
import { analyzeResumeQuality } from "../../services/resumeQuality.service";

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/resume/:resumeId/quality
// Trigger quality + ATS analysis on an extracted resume
// ─────────────────────────────────────────────────────────────────
export const runQualityAnalysis = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId).select(
    "status rawText structuredData qualityScore atsScore impactScore projectScore analysisBreakdown topIssues"
  );

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  if (resume.status === "PROCESSING") {
    throw new AppError("Resume extraction is still in progress. Please wait.", 400);
  }

  if (resume.status === "NOT_A_RESUME") {
    throw new AppError(
      `This document is not a resume (detected as: ${(resume as any).documentType || "unknown"}). Please upload a valid resume or CV.`,
      422
    );
  }

  // If already analyzed, return cached result
  if (resume.qualityScore > 0) {
    return sendSuccessResponse(res, {
      resumeId: resume._id,
      overallScore: resume.qualityScore,
      atsScore: resume.atsScore,
      impactScore: resume.impactScore,
      projectScore: resume.projectScore,
      analysisBreakdown: resume.analysisBreakdown,
      topIssues: resume.topIssues,
      cached: true,
    }, "Quality analysis retrieved (cached)");
  }

  // Run Groq quality analysis
  const analysis = await analyzeResumeQuality(
    resume.rawText || "",
    (resume.structuredData as any) || {}
  );

  // Map checks to analysisBreakdown format
  const breakdown = analysis.checks.map(c => ({
    check: c.label,
    status: (c.status === "Excellent" || c.status === "Good")
      ? "Good"
      : c.status === "Missing"
        ? "Missing"
        : "Needs Improvement",
    detail: c.detail,
  }));

  // Persist scores and breakdown to DB
  await Resume.findByIdAndUpdate(resumeId, {
    qualityScore: analysis.overallScore,
    atsScore: analysis.atsScore,
    impactScore: analysis.impactScore,
    projectScore: analysis.projectScore,
    analysisBreakdown: breakdown,
    topIssues: analysis.issues.map(i => i.title),
  });

  return sendSuccessResponse(res, {
    resumeId,
    overallScore: analysis.overallScore,
    atsScore: analysis.atsScore,
    impactScore: analysis.impactScore,
    projectScore: analysis.projectScore,
    experienceScore: analysis.experienceScore,
    careerAlignmentScore: analysis.careerAlignmentScore,
    checks: analysis.checks,
    issues: analysis.issues,
    tip: analysis.tip,
    cached: false,
  }, "Quality analysis complete");
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/resume/:resumeId/quality
// Retrieve stored quality analysis
// ─────────────────────────────────────────────────────────────────
export const getQualityAnalysis = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId).select(
    "qualityScore atsScore impactScore projectScore analysisBreakdown topIssues status"
  );

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  return sendSuccessResponse(res, {
    resumeId: resume._id,
    status: resume.status,
    overallScore: resume.qualityScore,
    atsScore: resume.atsScore,
    impactScore: resume.impactScore,
    projectScore: resume.projectScore,
    analysisBreakdown: resume.analysisBreakdown,
    topIssues: resume.topIssues,
  });
});
