import mongoose, { Schema, Document, model } from "mongoose";

// ─────────────────────────────────────────────
// 1. ApifyRun model
// ─────────────────────────────────────────────
export interface IApifyRun extends Document {
  runId: string;
  actorId: string;
  datasetId?: string;
  searchQuery: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "DISCOVERING";
  startedAt: Date;
  completedAt?: Date;
  jobCount?: number;
  error?: string;
  resumeId: mongoose.Types.ObjectId;
}

const ApifyRunSchema = new Schema<IApifyRun>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    actorId: { type: String, required: true },
    datasetId: { type: String },
    searchQuery: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["RUNNING", "SUCCEEDED", "FAILED", "DISCOVERING"], 
      default: "RUNNING" 
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    jobCount: { type: Number, default: 0 },
    error: { type: String },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
  },
  { timestamps: true }
);

export const ApifyRun = model<IApifyRun>("ApifyRun", ApifyRunSchema);

// ─────────────────────────────────────────────
// 2. JobSearch model
// ─────────────────────────────────────────────
export interface IJobSearch extends Document {
  resumeId: mongoose.Types.ObjectId;
  searchQuery: string;
  runId: string;
  createdAt: Date;
}

const JobSearchSchema = new Schema<IJobSearch>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    searchQuery: { type: String, required: true },
    runId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const JobSearch = model<IJobSearch>("JobSearch", JobSearchSchema);

// ─────────────────────────────────────────────
// 3. JobSource model
// ─────────────────────────────────────────────
export interface IJobSource extends Document {
  jobId: mongoose.Types.ObjectId;
  runId: string;
  resumeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const JobSourceSchema = new Schema<IJobSource>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    runId: { type: String, required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
  },
  { timestamps: true }
);

export const JobSource = model<IJobSource>("JobSource", JobSourceSchema);

// ─────────────────────────────────────────────
// 4. JobSnapshot model
// ─────────────────────────────────────────────
export interface IJobSnapshot extends Document {
  jobId: mongoose.Types.ObjectId;
  runId: string;
  data: any;
  createdAt: Date;
}

const JobSnapshotSchema = new Schema<IJobSnapshot>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    runId: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const JobSnapshot = model<IJobSnapshot>("JobSnapshot", JobSnapshotSchema);
