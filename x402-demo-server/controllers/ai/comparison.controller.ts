import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { LearningVersion } from "../../models/LearningVersion.model";
import { compareExplanationVersions } from "../../services/explain/comparison.service";

export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const { v1Id, v2Id, topic } = req.body;
  if (!v1Id || !v2Id) {
    throw new AppError("Two version IDs are required for comparison", 400);
  }

  const v1 = await LearningVersion.findById(v1Id);
  const v2 = await LearningVersion.findById(v2Id);

  if (!v1 || !v2) {
    throw new AppError("One or both versions could not be found", 404);
  }

  const report = await compareExplanationVersions(
    topic || "Topic",
    v1.versionName,
    v1.blocks,
    v2.versionName,
    v2.blocks
  );

  return sendSuccessResponse(res, report, "Comparison report generated successfully");
});
