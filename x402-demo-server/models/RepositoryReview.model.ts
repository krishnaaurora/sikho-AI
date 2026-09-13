import mongoose, { Schema, Document } from "mongoose";

export interface IAggregateReview {
  overallScore: number;
  securityScore: number;
  testCoverageEstimate: string;
  summary: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findingsCount: number;
  architecturalNotes?: string;
  recommendations: string[];
}

export interface IRepositoryReview extends Document {
  reviewId: string;
  userId: string;
  repoUrl: string;
  owner: string;
  repository: string;
  branch: string;
  commitSha: string;

  fileCount: number;
  completedFiles: number;
  failedFiles: number;

  prismPricePerFile: number;
  platformFeePerFile: number;
  userPricePerFile: number;

  providerTotal: number;
  platformFeeTotal: number;
  userTotal: number;

  userPaymentTxId?: string;
  providerPaymentTxId?: string;
  senderAddress?: string;

  status:
    | "discovering"
    | "awaiting_payment"
    | "payment_confirmed"
    | "processing"
    | "partial"
    | "completed"
    | "failed";

  aggregateReview?: IAggregateReview;
  error?: string;

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const RepositoryReviewSchema = new Schema<IRepositoryReview>(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      default: "user_guest",
      index: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    repository: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: "main",
    },
    commitSha: {
      type: String,
      default: "",
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    completedFiles: {
      type: Number,
      default: 0,
    },
    failedFiles: {
      type: Number,
      default: 0,
    },
    prismPricePerFile: {
      type: Number,
      default: 0.2,
    },
    platformFeePerFile: {
      type: Number,
      default: 0.05,
    },
    userPricePerFile: {
      type: Number,
      default: 0.25,
    },
    providerTotal: {
      type: Number,
      default: 0,
    },
    platformFeeTotal: {
      type: Number,
      default: 0,
    },
    userTotal: {
      type: Number,
      default: 0,
    },
    userPaymentTxId: {
      type: String,
      sparse: true,
      index: true,
    },
    providerPaymentTxId: {
      type: String,
      sparse: true,
      index: true,
    },
    senderAddress: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "discovering",
        "awaiting_payment",
        "payment_confirmed",
        "processing",
        "partial",
        "completed",
        "failed",
      ],
      default: "discovering",
      index: true,
    },
    aggregateReview: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRepositoryReview>(
  "RepositoryReview",
  RepositoryReviewSchema
);
