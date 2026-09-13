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
    | "processing"
    | "fee_pending"
    | "fee_completed"
    | "provider_payment_pending"
    | "provider_payment_confirmed"
    | "completed"
    | "failed"
    | "retry_required";

  platformFeeAmount: number; // 50000 micro-USDC ($0.05)
  platformFeeStatus: "pending" | "completed" | "failed";
  platformFeeTransactionId?: string;

  providerAmount: number; // 200000 micro-USDC ($0.20)
  providerPaymentTxId?: string;
  prismRequestId?: string;

  reviewResult?: any;
  error?: string;

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
        "processing",
        "fee_pending",
        "fee_completed",
        "provider_payment_pending",
        "provider_payment_confirmed",
        "completed",
        "failed",
        "retry_required",
      ],
      default: "pending",
      index: true,
    },
    platformFeeAmount: {
      type: Number,
      default: 50000,
    },
    platformFeeStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    platformFeeTransactionId: {
      type: String,
      sparse: true,
    },
    providerAmount: {
      type: Number,
      default: 200000,
    },
    providerPaymentTxId: {
      type: String,
      sparse: true,
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
