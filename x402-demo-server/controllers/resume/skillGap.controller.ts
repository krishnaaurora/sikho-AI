import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";
import { sendSuccessResponse } from "../../utils/response";
import Resume from "../../models/Resume.model";
import { analyzeSkillGap } from "../../services/skillGap.service";

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/resume/:resumeId/skill-gap
// Body: { targetRole?: string }
// ─────────────────────────────────────────────────────────────────
export const runSkillGap = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId).select(
    "status rawText structuredData primaryCareer targetCareer"
  );
  if (!resume) throw new AppError("Resume not found", 404);
  if (resume.status === "PROCESSING")
    throw new AppError("Resume extraction is still in progress.", 400);
  if (resume.status !== "READY")
    throw new AppError("Resume not ready.", 400);

  const targetRole =
    req.body.targetRole ||
    resume.targetCareer ||
    resume.primaryCareer ||
    "Software Engineer";

  const result = await analyzeSkillGap(
    resume.rawText || "",
    (resume.structuredData as any) || {},
    targetRole
  );

  return sendSuccessResponse(res, { resumeId, ...result }, "Skill gap analysis complete");
});
