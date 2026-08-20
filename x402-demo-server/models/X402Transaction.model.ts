import mongoose, { Schema, Document } from "mongoose";

export interface IX402Transaction extends Document {
  userId: string;
  serviceId: string;
  resourceId?: string;
  amount: number;
  currency: string;
  walletAddress: string;
  txHash: string;
  status: string;
  timestamp: Date;
}

const X402TransactionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    serviceId: { type: String, required: true },
    resourceId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USDC" },
    walletAddress: { type: String, required: true },
    txHash: { type: String, required: true },
    status: { type: String, default: "Success" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IX402Transaction>("X402Transaction", X402TransactionSchema);
