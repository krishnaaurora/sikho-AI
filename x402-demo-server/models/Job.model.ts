import mongoose, { Schema, model, Document } from "mongoose";

// ─────────────────────────────────────────────
//  Intelligence sub-document
// ─────────────────────────────────────────────
export interface IJobIntelligence {
  // Required qualifications
  requiredSkills: string[];
  requiredExperience: string;        // e.g. "0–2 years", "3+ years"
  requiredEducation: string;         // e.g. "B.Tech/B.E. in CS", "Any Graduate"
  requiredCertifications: string[];

  // Preferred qualifications
  preferredSkills: string[];
  preferredTools: string[];
  preferredCertifications: string[];

  // Role context
  responsibilities: string[];
  domain: string;                    // e.g. "Machine Learning", "Data Engineering"
  employmentType: string;            // e.g. "Full-time", "Internship", "Contract"
  remoteStatus: string;              // e.g. "Remote", "Hybrid", "On-site"
  salaryRange: string;               // normalised salary string

  // Meta
  analyzedAt: Date;
  modelUsed: string;
}

const JobIntelligenceSchema = new Schema<IJobIntelligence>(
  {
    requiredSkills:           { type: [String], default: [] },
    requiredExperience:       { type: String, default: "" },
    requiredEducation:        { type: String, default: "" },
    requiredCertifications:   { type: [String], default: [] },
    preferredSkills:          { type: [String], default: [] },
    preferredTools:           { type: [String], default: [] },
    preferredCertifications:  { type: [String], default: [] },
    responsibilities:         { type: [String], default: [] },
    domain:                   { type: String, default: "" },
    employmentType:           { type: String, default: "" },
    remoteStatus:             { type: String, default: "" },
    salaryRange:              { type: String, default: "" },
    analyzedAt:               { type: Date, default: Date.now },
    modelUsed:                { type: String, default: "" },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
//  Job document
// ─────────────────────────────────────────────
export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  remoteType: "Remote" | "Hybrid" | "On-site" | "Unspecified";
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  source: string;
  sourceJobId: string;
  jobHash: string;
  jobUrl?: string;
  postedAt?: Date;
  scrapedAt: Date;

  // Phase 8 — structured intelligence
  intelligence?: IJobIntelligence;
  intelligenceStatus: "pending" | "processing" | "done" | "failed";
}

const JobSchema = new Schema<IJob>(
  {
    title:            { type: String, required: true, index: true },
    company:          { type: String, required: true, index: true },
    location:         { type: String, required: true },
    remoteType: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site", "Unspecified"],
      default: "Unspecified",
    },
    description:      { type: String, required: true },
    requirements:     { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    salary:           { type: String },
    source:           { type: String, required: true, index: true },
    sourceJobId:      { type: String, required: true },
    jobHash:          { type: String, required: true, unique: true, index: true },
    jobUrl:           { type: String },
    postedAt:         { type: Date },
    scrapedAt:        { type: Date, default: Date.now },

    // Phase 8
    intelligence:        { type: JobIntelligenceSchema },
    intelligenceStatus:  {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound index for primary deduplication
JobSchema.index({ source: 1, sourceJobId: 1 }, { unique: true });
// Index for querying un-analyzed jobs
JobSchema.index({ intelligenceStatus: 1 });

const Job = model<IJob>("Job", JobSchema);
export default Job;
