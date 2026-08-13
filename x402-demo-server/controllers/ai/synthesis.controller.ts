import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { evaluateStudentExplanation } from "../../services/explain/synthesis.service";
import { LearningSource } from "../../models/LearningSource.model";
import { LearningSession } from "../../models/LearningSession.model";
import { retrieveRelevantChunks } from "../../services/explain/retrieval.service";

export const evaluateSynthesis = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, studentExplanation, topic } = req.body;
  if (!sessionId || !studentExplanation) {
    throw new AppError("Session ID and student explanation text are required", 400);
  }

  const session = await LearningSession.findById(sessionId);
  if (!session) {
    throw new AppError("Learning session not found", 404);
  }

  // Get reference source text context
  let referenceContext = "";
  if (session.sourceId) {
    const source = await LearningSource.findById(session.sourceId);
    if (source) {
      const chunks = retrieveRelevantChunks(topic || session.topic, source, 6);
      referenceContext = chunks.map(c => c.text).join("\n\n");
    }
  } else {
    referenceContext = `Topic: ${session.topic}`;
  }

  const report = await evaluateStudentExplanation(
    topic || session.topic,
    studentExplanation,
    referenceContext
  );

  // Update knowledge map based on analysis findings
  // Gaps are marked weak/partial, understood are marked understood/mastered
  const newMap = [...session.knowledgeMap];
  
  report.understood.forEach(u => {
    const key = u.substring(0, 30);
    const existing = newMap.find(item => item.concept.toLowerCase() === key.toLowerCase());
    if (existing) {
      existing.status = "mastered";
    } else {
      newMap.push({ concept: key, status: "mastered" });
    }
  });

  report.partiallyUnderstood.forEach(p => {
    const key = p.substring(0, 30);
    const existing = newMap.find(item => item.concept.toLowerCase() === key.toLowerCase());
    if (existing) {
      existing.status = "partial";
    } else {
      newMap.push({ concept: key, status: "partial" });
    }
  });

  report.missing.forEach(m => {
    const key = m.substring(0, 30);
    const existing = newMap.find(item => item.concept.toLowerCase() === key.toLowerCase());
    if (existing) {
      existing.status = "weak";
    } else {
      newMap.push({ concept: key, status: "weak" });
    }
  });

  session.knowledgeMap = newMap;
  await session.save();

  return sendSuccessResponse(res, { report, knowledgeMap: session.knowledgeMap }, "Student synthesis evaluated successfully");
});
