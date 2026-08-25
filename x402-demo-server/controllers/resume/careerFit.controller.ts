import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";
import { sendSuccessResponse } from "../../utils/response";
import Resume from "../../models/Resume.model";
import { analyzeCareerFit } from "../../services/careerFit.service";

// ─────────────────────────────────────────────────────────────────
// POST /api/resume/:resumeId/career-fit
// Runs Groq career fit analysis — returns top matching roles
// ─────────────────────────────────────────────────────────────────
export const runCareerFit = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId).select(
    "status rawText structuredData detectedCareers primaryCareer"
  );
  if (!resume) throw new AppError("Resume not found", 404);
  if (resume.status === "PROCESSING")
    throw new AppError("Resume extraction is still in progress. Please wait.", 400);
  if (resume.status === "NOT_A_RESUME")
    throw new AppError(
      `This document is not a resume (detected as: ${(resume as any).documentType || "unknown"}). Please upload a valid resume or CV.`,
      422
    );
  if (resume.status !== "READY")
    throw new AppError("Resume extraction failed or is not ready.", 400);

  // Return cached result if already computed
  if ((resume.detectedCareers || []).length > 0) {
    return sendSuccessResponse(
      res,
      {
        resumeId,
        topRoles: resume.detectedCareers,
        primaryCareer: resume.primaryCareer,
        cached: true,
      },
      "Career fit analysis retrieved (cached)"
    );
  }

  const result = await analyzeCareerFit(
    resume.rawText || "",
    (resume.structuredData as any) || {}
  );

  // Persist to DB
  await Resume.findByIdAndUpdate(resumeId, {
    detectedCareers: result.topRoles.map((r) => ({
      career: r.role,
      confidence: r.confidence,
    })),
    primaryCareer: result.primaryCareer,
  });

  return sendSuccessResponse(
    res,
    {
      resumeId,
      topRoles: result.topRoles,
      summary: result.summary,
      primaryCareer: result.primaryCareer,
      cached: false,
    },
    "Career fit analysis complete"
  );
});

// ─────────────────────────────────────────────────────────────────
// GET /api/resume/:resumeId/career-fit
// Return cached career fit data
// ─────────────────────────────────────────────────────────────────
export const getCareerFit = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId).select(
    "detectedCareers primaryCareer status"
  );
  if (!resume) throw new AppError("Resume not found", 404);

  return sendSuccessResponse(res, {
    resumeId,
    topRoles: resume.detectedCareers || [],
    primaryCareer: resume.primaryCareer || null,
    status: resume.status,
  });
});
