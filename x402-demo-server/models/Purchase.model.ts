import mongoose, { Schema, model, Document, Types } from "mongoose";

export enum PurchaseStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface IPurchase extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  chapterId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  transactionHash?: string;
  amount: number;
  currency: string;
  purchaseStatus: PurchaseStatus;
  purchasedAt: Date;
}

const PurchaseSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    transactionHash: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USDC",
    },
    purchaseStatus: {
      type: String,
      enum: Object.values(PurchaseStatus),
      default: PurchaseStatus.PENDING,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ userId: 1, courseId: 1 });
PurchaseSchema.index({ userId: 1, chapterId: 1 });
PurchaseSchema.index({ paymentId: 1 });
PurchaseSchema.index({ transactionHash: 1 });

const Purchase = model<IPurchase>("Purchase", PurchaseSchema);
export default Purchase;
