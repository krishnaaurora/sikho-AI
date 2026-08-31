import mongoose, { Schema, model, Document, Types } from "mongoose";

export type ResumeStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "NOT_A_RESUME";

export interface ISkillEvidence {
  skill: string;
  evidenceSections: string[]; // e.g. ["experience", "projects", "skills"]
  status: "Strong" | "Partial" | "Listed Only" | "Missing";
}

export interface IDetectedCareer {
  career: string;
  confidence: number; // 0-100
}

export interface IJobMatch {
  title: string;
  company: string;
  location: string;
  matchPercent: number;
  jobId: string;
  description?: string;
  requiredSkills?: string[];
  missingSkills?: string[];
}

export interface IAutoRecommendation {
  type: "resume" | "project";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  techStack?: string[];
  difficulty?: string;
  duration?: string;
  impact?: string;
}

export interface IResume extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  rawText: string;
  // Structured Extraction
  structuredData: {
    personal: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      github?: string;
      linkedin?: string;
      website?: string;
      summary?: string;
    };
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startYear?: string;
      endYear?: string;
      gpa?: string;
    }>;
    experience: Array<{
      company: string;
      role: string;
      startDate?: string;
      endDate?: string;
      description: string;
      technologies?: string[];
    }>;
    internships: Array<{
      company: string;
      role: string;
      startDate?: string;
      endDate?: string;
      description: string;
    }>;
    skills: string[];
    projects: Array<{
      name: string;
      description: string;
      technologies?: string[];
      url?: string;
    }>;
    certifications: Array<{
      name: string;
      issuer?: string;
      date?: string;
    }>;
    achievements: string[];
    publications: string[];
    links: string[];
  };
  // Quality Scores
  qualityScore: number;   // 0-100 overall resume quality
  atsScore: number;       // 0-100 ATS compatibility
  impactScore: number;    // 0-100 impact language strength
  projectScore: number;   // 0-100 project quality
  // Analysis
  analysisBreakdown: Array<{
    check: string;
    status: "Good" | "Missing" | "Poor" | "Needs Improvement";
    detail?: string;
  }>;
  topIssues: string[];
  // Career Intelligence
  detectedCareers: IDetectedCareer[];
  primaryCareer?: string;
  skillEvidence: ISkillEvidence[];
  // Auto Job Matching (bucketed)
  autoJobMatches: {
    bucket100: IJobMatch[];
    bucket75: IJobMatch[];
    bucket50: IJobMatch[];
    bucket20: IJobMatch[];
    bucket0: IJobMatch[];
  };
  // Auto Recommendations
  autoRecommendations: IAutoRecommendation[];
  // Target Career (user-set)
  targetCareer?: string;
  targetJobMatches: IJobMatch[];
  // Document validation
  isResume: boolean;
  documentType?: string; // e.g. "resume", "legal_document", "registration_form", "other"
  // Status
  status: ResumeStatus;
  processingError?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const JobMatchSchema = new Schema({
  title: String,
  company: String,
  location: String,
  matchPercent: Number,
  jobId: String,
  description: String,
  requiredSkills: [String],
  missingSkills: [String],
}, { _id: false });

const ResumeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/pdf" },
    rawText: { type: String, default: "" },
    structuredData: {
      personal: { type: Schema.Types.Mixed, default: {} },
      education: { type: [Schema.Types.Mixed], default: [] },
      experience: { type: [Schema.Types.Mixed], default: [] },
      internships: { type: [Schema.Types.Mixed], default: [] },
      skills: { type: [String], default: [] },
      projects: { type: [Schema.Types.Mixed], default: [] },
      certifications: { type: [Schema.Types.Mixed], default: [] },
      achievements: { type: [String], default: [] },
      publications: { type: [String], default: [] },
      links: { type: [String], default: [] },
    },
    qualityScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    analysisBreakdown: { type: [Schema.Types.Mixed], default: [] },
    topIssues: { type: [String], default: [] },
    detectedCareers: { type: [Schema.Types.Mixed], default: [] },
    primaryCareer: { type: String },
    skillEvidence: { type: [Schema.Types.Mixed], default: [] },
    autoJobMatches: {
      bucket100: { type: [JobMatchSchema], default: [] },
      bucket75: { type: [JobMatchSchema], default: [] },
      bucket50: { type: [JobMatchSchema], default: [] },
      bucket20: { type: [JobMatchSchema], default: [] },
      bucket0: { type: [JobMatchSchema], default: [] },
    },
    autoRecommendations: { type: [Schema.Types.Mixed], default: [] },
    targetCareer: { type: String },
    targetJobMatches: { type: [JobMatchSchema], default: [] },
    isResume: { type: Boolean, default: true },
    documentType: { type: String, default: "resume" },
    status: {
      type: String,
      enum: ["UPLOADING", "PROCESSING", "READY", "FAILED", "NOT_A_RESUME"],
      default: "UPLOADING",
    },
    processingError: { type: String },
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ status: 1 });

const Resume = model<IResume>("Resume", ResumeSchema);
export default Resume;
