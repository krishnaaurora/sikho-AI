import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { LearningSession } from "../../models/LearningSession.model";
import { explainConcept } from "../../services/ai";

export const getContinuation = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, learningStyle, depth, language } = req.body;
  if (!sessionId) {
    throw new AppError("Session ID is required to determine next steps", 400);
  }

  const session = await LearningSession.findById(sessionId);
  if (!session) {
    throw new AppError("Learning session not found", 404);
  }

  // Find the first concept that is not mastered yet
  const nextTarget = session.knowledgeMap.find(c => c.status !== "mastered")?.concept || "Advanced Implementation";
  
  // Call explainConcept to generate the lesson for this next concept
  const nextStepExplanation = await explainConcept({
    query: `${session.topic}: ${nextTarget}`,
    learningStyle: learningStyle || session.preferredStyle || "academic",
    depth: depth || "deep",
    examples: "example-heavy",
    language: language || session.preferredLanguage || "English",
    sourceId: session.sourceId?.toString()
  });

  return sendSuccessResponse(
    res,
    {
      sessionId: session._id,
      topic: session.topic,
      nextConcept: nextTarget,
      explanation: nextStepExplanation,
      suggestedAction: `Ground your focus in ${nextTarget} to bridge gaps`
    },
    "Personalized next learning step compiled"
  );
});
