import mongoose, { Schema, Document } from "mongoose";

export interface ILearningVersion extends Document {
  sessionId: mongoose.Types.ObjectId;
  versionName: string;
  learningStyle: string;
  depth: string;
  language: string;
  blocks: any[]; // explain blocks containing grounded content & citations
  sources: {
    sourceName: string;
    pageOrUrl?: string;
  }[];
  createdAt: Date;
}

const LearningVersionSchema = new Schema<ILearningVersion>({
  sessionId: { type: Schema.Types.ObjectId, ref: "LearningSession", required: true },
  versionName: { type: String, required: true },
  learningStyle: { type: String, required: true },
  depth: { type: String, required: true },
  language: { type: String, required: true },
  blocks: [{ type: Schema.Types.Mixed }],
  sources: [{
    sourceName: { type: String, required: true },
    pageOrUrl: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const LearningVersion = mongoose.model<ILearningVersion>("LearningVersion", LearningVersionSchema);
