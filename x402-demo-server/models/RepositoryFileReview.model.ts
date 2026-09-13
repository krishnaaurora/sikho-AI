import mongoose, { Schema, Document } from "mongoose";

export interface IRepositoryFileReview extends Document {
  fileReviewId: string;
  repositoryReviewId: string; // matches RepositoryReview.reviewId
  filePath: string;
  language: string;
  size: number;
  sha: string;

  status:
    | "pending"
    | "sikho_paid"
    | "prism_pending"
    | "prism_paid"
    | "completed"
    | "failed";

  // Sikho AI Platform Fee ($0.05 USDC / 50,000 micro-USDC)
  sikhoPaymentAmount: number;
  sikhoPaymentStatus: "pending" | "confirmed" | "failed";
  sikhoPaymentTxId?: string;
  platformFeeAmount?: number;
  platformFeeStatus?: string;
  platformFeeTransactionId?: string;

  // Prism AI Code Review ($0.20 USDC / 200,000 micro-USDC via Real x402)
  prismPaymentAmount: number;
  prismPaymentStatus: "pending" | "confirmed" | "failed";
  prismPaymentTxId?: string;
  prismPaymentResponse?: string;
  prismRequestId?: string;

  reviewResult?: any;
  error?: string;
  retryCount: number;

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RepositoryFileReviewSchema = new Schema<IRepositoryFileReview>(
  {
    fileReviewId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    repositoryReviewId: {
      type: String,
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "typescript",
    },
    size: {
      type: Number,
      default: 0,
    },
    sha: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "sikho_paid",
        "prism_pending",
        "prism_paid",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },
    sikhoPaymentAmount: {
      type: Number,
      default: 50000,
    },
    sikhoPaymentStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    sikhoPaymentTxId: {
      type: String,
      sparse: true,
      index: true,
    },
    prismPaymentAmount: {
      type: Number,
      default: 200000,
    },
    prismPaymentStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    prismPaymentTxId: {
      type: String,
      sparse: true,
      index: true,
    },
    prismPaymentResponse: {
      type: String,
    },
    prismRequestId: {
      type: String,
    },
    reviewResult: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for idempotency
RepositoryFileReviewSchema.index(
  { repositoryReviewId: 1, filePath: 1 },
  { unique: true }
);

export default mongoose.model<IRepositoryFileReview>(
  "RepositoryFileReview",
  RepositoryFileReviewSchema
);
