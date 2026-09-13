import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformFeeTransaction extends Document {
  feeTransactionId: string;
  reviewId: string;
  fileId: string;
  filePath?: string;
  amount: number; // 50000 micro-USDC ($0.05)
  currency: string;
  assetId: string;
  network: string;
  purpose: string;
  status: "completed" | "failed" | "refunded";
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformFeeTransactionSchema = new Schema<IPlatformFeeTransaction>(
  {
    feeTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reviewId: {
      type: String,
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
      index: true,
    },
    filePath: {
      type: String,
    },
    amount: {
      type: Number,
      default: 50000,
    },
    currency: {
      type: String,
      default: "USDC",
    },
    assetId: {
      type: String,
      default: "31566704",
    },
    network: {
      type: String,
      default: "Algorand MainNet",
    },
    purpose: {
      type: String,
      default: "github_code_review_platform_fee",
    },
    status: {
      type: String,
      enum: ["completed", "failed", "refunded"],
      default: "completed",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee idempotency: one platform fee per review per file
PlatformFeeTransactionSchema.index(
  { reviewId: 1, fileId: 1 },
  { unique: true }
);

export default mongoose.model<IPlatformFeeTransaction>(
  "PlatformFeeTransaction",
  PlatformFeeTransactionSchema
);
