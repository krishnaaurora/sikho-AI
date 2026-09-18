import mongoose, { Schema, Document } from "mongoose";

export enum SikhoAppType {
  LEARN_ANYTHING = "Learn Anything",
  RESUME_INTELLIGENCE = "Resume Intelligence",
  CAREER_ROADMAP = "Career Roadmap",
  INTERVIEW_MISSION = "Interview Mission",
  GITHUB_REVIEW = "GitHub Review",
  JOB_INTELLIGENCE = "Job Intelligence",
  CAREER_CONSULTANT = "Career Consultant",
}

export interface IAppUsageEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  appName: SikhoAppType;
  featureName?: string;
  isPaid: boolean;
  paymentAmount?: number;
  currency?: string;
  metadata?: any;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AppUsageEventSchema = new Schema<IAppUsageEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userName: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    appName: {
      type: String,
      enum: Object.values(SikhoAppType),
      required: true,
      index: true,
    },
    featureName: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USDC",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AppUsageEventSchema.index({ appName: 1, timestamp: -1 });
AppUsageEventSchema.index({ userId: 1, appName: 1 });

export default mongoose.model<IAppUsageEvent>(
  "AppUsageEvent",
  AppUsageEventSchema
);
