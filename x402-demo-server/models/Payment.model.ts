import mongoose, { Schema, model, Document, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  X402 = "x402",
  ALGORAND = "algorand",
}

export interface IPayment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  amount: number;
  currency: string;
  blockchain: string;
  transactionHash?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  x402Reference?: string;
  paidAt?: Date;
}

const PaymentSchema: Schema = new Schema(
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
    blockchain: {
      type: String,
      required: [true, "Blockchain is required"],
      default: "Algorand",
    },
    transactionHash: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.X402,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    x402Reference: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ transactionHash: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ userId: 1, courseId: 1 });

const Payment = model<IPayment>("Payment", PaymentSchema);
export default Payment;
