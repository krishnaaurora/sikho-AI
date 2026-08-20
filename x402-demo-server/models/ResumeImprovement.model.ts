import mongoose, { Schema, model, Document, Types } from "mongoose";

// ─────────────────────────────────────────────
//  Market Skill Gaps / Insights model
// ─────────────────────────────────────────────
export interface IResumeImprovementInsight extends Document {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  career: string; // e.g. "Data Scientist"
  
  skill: string;
  marketDemand: number; // percentage, e.g. 72
  candidateStatus: "Strong" | "Partial" | "Weak" | "Missing";
  priority: "High" | "Medium" | "Low";
  recommendation: string;
  sourceJobCount: number; // number of jobs requiring this skill
}

const ResumeImprovementInsightSchema = new Schema<IResumeImprovementInsight>(
  {
    resumeId:        { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    userId:          { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    career:          { type: String, required: true },
    skill:           { type: String, required: true },
    marketDemand:    { type: Number, required: true },
    candidateStatus: { type: String, enum: ["Strong", "Partial", "Weak", "Missing"], required: true },
    priority:        { type: String, enum: ["High", "Medium", "Low"], required: true },
    recommendation:  { type: String, required: true },
    sourceJobCount:  { type: Number, required: true },
  },
  { timestamps: true }
);

ResumeImprovementInsightSchema.index({ resumeId: 1, priority: 1, marketDemand: -1 });

export const ResumeImprovementInsight = model<IResumeImprovementInsight>(
  "ResumeImprovementInsight",
  ResumeImprovementInsightSchema
);

// ─────────────────────────────────────────────
//  Job-Specific Resume Recommendations model
// ─────────────────────────────────────────────
export interface IJobResumeRecommendation extends Document {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  
  recommendation: string[]; // specific action points
  reason: string;
  relatedSkill: string[];
  priority: "High" | "Medium" | "Low";
}

const JobResumeRecommendationSchema = new Schema<IJobResumeRecommendation>(
  {
    resumeId:       { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    jobId:          { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    recommendation: { type: [String], default: [] },
    reason:         { type: String, required: true },
    relatedSkill:   { type: [String], default: [] },
    priority:       { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  },
  { timestamps: true }
);

JobResumeRecommendationSchema.index({ resumeId: 1, jobId: 1 }, { unique: true });

export const JobResumeRecommendation = model<IJobResumeRecommendation>(
  "JobResumeRecommendation",
  JobResumeRecommendationSchema
);
