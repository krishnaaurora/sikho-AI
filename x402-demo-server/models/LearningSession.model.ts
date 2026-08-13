import mongoose, { Schema, Document } from "mongoose";

export interface IConceptStatus {
  concept: string;
  status: "mastered" | "understood" | "partial" | "weak" | "unknown";
}

export interface ILearningSession extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  sourceId?: mongoose.Types.ObjectId;
  knowledgeMap: IConceptStatus[];
  history: mongoose.Types.ObjectId[]; // list of LearningVersion IDs
  preferredStyle: string;
  preferredLanguage: string;
  lastStudiedAt: Date;
  createdAt: Date;
}

const LearningSessionSchema = new Schema<ILearningSession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true },
  sourceId: { type: Schema.Types.ObjectId, ref: "LearningSource" },
  knowledgeMap: [{
    concept: { type: String, required: true },
    status: { type: String, enum: ["mastered", "understood", "partial", "weak", "unknown"], default: "unknown" }
  }],
  history: [{ type: Schema.Types.ObjectId, ref: "LearningVersion" }],
  preferredStyle: { type: String, default: "academic" },
  preferredLanguage: { type: String, default: "English" },
  lastStudiedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const LearningSession = mongoose.model<ILearningSession>("LearningSession", LearningSessionSchema);
