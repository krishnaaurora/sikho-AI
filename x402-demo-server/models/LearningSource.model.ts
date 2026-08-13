import mongoose, { Schema, Document } from "mongoose";

export interface ILearningSource extends Document {
  name: string;
  type: "pdf" | "url";
  url?: string;
  fileSize?: number;
  pageCount?: number;
  chunks: {
    id: string;
    text: string;
    pageNumber?: number;
    heading?: string;
  }[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LearningSourceSchema = new Schema<ILearningSource>({
  name: { type: String, required: true },
  type: { type: String, enum: ["pdf", "url"], required: true },
  url: { type: String },
  fileSize: { type: Number },
  pageCount: { type: Number },
  chunks: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    pageNumber: { type: Number },
    heading: { type: String }
  }],
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

export const LearningSource = mongoose.model<ILearningSource>("LearningSource", LearningSourceSchema);
