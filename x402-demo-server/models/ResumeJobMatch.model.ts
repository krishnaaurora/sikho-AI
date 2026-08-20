import mongoose, { Schema, model, Document, Types } from "mongoose";

// ─────────────────────────────────────────────
//  Match Detail sub-documents
// ─────────────────────────────────────────────
export interface IMatchedSkill {
  skill: string;
  strength: "Strong Match" | "Partial Match" | "Listed Only";
  evidenceSections: string[]; // e.g. ["experience", "projects"]
}

export interface IMissingItem {
  skill: string;
  importance: "Critical" | "Preferred" | "Optional";
  reason: string;
}

export interface IMatchScores {
  skillMatch: number;         // 0-100
  experienceMatch: number;    // 0-100
  projectMatch: number;       // 0-100
  educationMatch: number;     // 0-100
  domainMatch: number;        // 0-100
  overall: number;            // 0-100 (weighted composite)
}

export interface IMatchDistribution {
  count100: number;
  count75: number;
  count50: number;
  count20: number;
  count0: number;
}

// ─────────────────────────────────────────────
//  ResumeJobMatch document
// ─────────────────────────────────────────────
export interface IResumeJobMatch extends Document {
  resumeId: Types.ObjectId;
  jobId: Types.ObjectId;

  scores: IMatchScores;
  matchedSkills: IMatchedSkill[];
  missingItems: IMissingItem[];

  keyHighlights: string[];
  whyYouMatch: string[];
  whatsMissing: string[];

  candidateExperience: string;       // e.g. "1.2 years"
  jobRequiredExperience: string;     // e.g. "0–2 years"

  matchTier: "100%" | "75%" | "50%" | "20%" | "0%";
  matchLabel: "Perfect Match" | "Great Match" | "Good Match" | "Partial Match" | "Low Match";

  computedAt: Date;
}

const MatchScoresSchema = new Schema<IMatchScores>(
  {
    skillMatch:      { type: Number, default: 0 },
    experienceMatch: { type: Number, default: 0 },
    projectMatch:    { type: Number, default: 0 },
    educationMatch:  { type: Number, default: 0 },
    domainMatch:     { type: Number, default: 0 },
    overall:         { type: Number, default: 0 },
  },
  { _id: false }
);

const ResumeJobMatchSchema = new Schema<IResumeJobMatch>(
  {
    resumeId:              { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    jobId:                 { type: Schema.Types.ObjectId, ref: "Job",    required: true, index: true },
    scores:                { type: MatchScoresSchema, default: {} },
    matchedSkills:         { type: Schema.Types.Mixed, default: [] },
    missingItems:          { type: Schema.Types.Mixed, default: [] },
    keyHighlights:         { type: [String], default: [] },
    whyYouMatch:           { type: [String], default: [] },
    whatsMissing:          { type: [String], default: [] },
    candidateExperience:   { type: String, default: "" },
    jobRequiredExperience: { type: String, default: "" },
    matchTier:             { type: String, enum: ["100%", "75%", "50%", "20%", "0%"], default: "0%" },
    matchLabel:            { type: String, enum: ["Perfect Match", "Great Match", "Good Match", "Partial Match", "Low Match"], default: "Low Match" },
    computedAt:            { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One match result per resume+job pair
ResumeJobMatchSchema.index({ resumeId: 1, jobId: 1 }, { unique: true });
ResumeJobMatchSchema.index({ resumeId: 1, "scores.overall": -1 });

const ResumeJobMatch = model<IResumeJobMatch>("ResumeJobMatch", ResumeJobMatchSchema);
export default ResumeJobMatch;
