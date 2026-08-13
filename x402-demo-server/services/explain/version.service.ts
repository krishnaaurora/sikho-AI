import { ILearningVersion } from "../../models/LearningVersion.model";
import { ILearningSession } from "../../models/LearningSession.model";
import mongoose from "mongoose";

export interface VersionDetail {
  versionId: string;
  versionName: string;
  learningStyle: string;
  depth: string;
  language: string;
  createdAt: Date;
}

/**
 * Creates a new learning snapshot version linked to a learning session.
 */
export async function createNewLearningVersion(params: {
  sessionId: string;
  versionName: string;
  learningStyle: string;
  depth: string;
  language: string;
  blocks: any[];
  sources: { sourceName: string; pageOrUrl?: string }[];
}): Promise<ILearningVersion> {
  const { LearningVersion } = require("../../models/LearningVersion.model");
  const { LearningSession } = require("../../models/LearningSession.model");

  const newVersion = await LearningVersion.create({
    sessionId: new mongoose.Types.ObjectId(params.sessionId),
    versionName: params.versionName,
    learningStyle: params.learningStyle,
    depth: params.depth,
    language: params.language,
    blocks: params.blocks,
    sources: params.sources
  });

  // Link version to session history listing
  await LearningSession.findByIdAndUpdate(params.sessionId, {
    $push: { history: newVersion._id }
  });

  return newVersion;
}
