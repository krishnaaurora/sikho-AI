import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { LearningSession } from "../../models/LearningSession.model";

export const getKnowledgeGaps = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    throw new AppError("Session ID is required to look up knowledge gaps", 400);
  }

  const session = await LearningSession.findById(sessionId);
  if (!session) {
    throw new AppError("Learning session not found", 404);
  }

  const gaps = session.knowledgeMap.filter(c => c.status === "weak" || conceptStatusIsBlank(c.status));

  return sendSuccessResponse(
    res,
    {
      sessionId: session._id,
      topic: session.topic,
      knowledgeMap: session.knowledgeMap,
      weakConceptsCount: gaps.length,
      recommendation: gaps.length > 0 
        ? `We detected ${gaps.length} gaps in your understanding of ${session.topic}. We recommend starting with: "${gaps[0].concept}".`
        : "Excellent job! No critical knowledge gaps detected right now."
    },
    "Knowledge gaps analyzed successfully"
  );
});

function conceptStatusIsBlank(status: string): boolean {
  return status === "unknown" || status === "partial";
}
