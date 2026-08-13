import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { LearningSession } from "../../models/LearningSession.model";
import { LearningVersion } from "../../models/LearningVersion.model";
import { LearningSource } from "../../models/LearningSource.model";
import mongoose from "mongoose";

export const getLearningHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const sessions = await LearningSession.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ lastStudiedAt: -1 })
    .populate("sourceId", "name type url pageCount");

  return sendSuccessResponse(res, sessions, "Learning history retrieved successfully");
});

export const getSessionWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const session = await LearningSession.findById(sessionId)
    .populate("sourceId")
    .populate("history");

  if (!session) {
    throw new AppError("Learning workspace session not found", 404);
  }

  return sendSuccessResponse(res, session, "Workspace loaded successfully");
});

export const createSessionVersion = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { versionName, learningStyle, depth, language, blocks, sources } = req.body;

  const session = await LearningSession.findById(sessionId);
  if (!session) {
    throw new AppError("Learning session not found", 404);
  }

  const version = await LearningVersion.create({
    sessionId: new mongoose.Types.ObjectId(String(sessionId)),
    versionName: versionName || `V${session.history.length + 1} - ${learningStyle}`,
    learningStyle,
    depth,
    language,
    blocks: blocks || [],
    sources: sources || []
  });

  session.history.push(version._id as mongoose.Types.ObjectId);
  session.preferredStyle = learningStyle;
  session.preferredLanguage = language;
  session.lastStudiedAt = new Date();
  await session.save();

  return sendSuccessResponse(res, version, "Learning version added successfully");
});

export const getSessionVersions = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const versions = await LearningVersion.find({ sessionId: new mongoose.Types.ObjectId(String(sessionId)) })
    .sort({ createdAt: -1 });

  return sendSuccessResponse(res, versions, "Session versions retrieved successfully");
});

export const initializeExplainSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { topic, sourceId, preferredStyle, preferredLanguage } = req.body;

  if (!topic) {
    throw new AppError("Concept/Topic query is required", 400);
  }

  // Check if session already exists for this user and topic
  let session = await LearningSession.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    topic: topic
  });

  if (!session) {
    // Generate initial knowledge map concepts with proper typed statuses
    const initialMap: { concept: string; status: "mastered" | "understood" | "partial" | "weak" | "unknown" }[] = [
      { concept: "Definition", status: "unknown" },
      { concept: "Why it exists", status: "unknown" },
      { concept: "Mechanism", status: "unknown" },
      { concept: "Common Mistakes", status: "unknown" },
      { concept: "Scaling", status: "unknown" }
    ];

    session = await LearningSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      topic,
      sourceId: sourceId ? new mongoose.Types.ObjectId(sourceId) : undefined,
      knowledgeMap: initialMap,
      preferredStyle: preferredStyle || "academic",
      preferredLanguage: preferredLanguage || "English",
      history: []
    });
  } else {
    // If sourceId is updated, append
    if (sourceId) {
      session.sourceId = new mongoose.Types.ObjectId(sourceId);
      await session.save();
    }
  }

  return sendSuccessResponse(res, session, "Learning session initialized successfully");
});
