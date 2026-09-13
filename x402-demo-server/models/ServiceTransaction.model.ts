import mongoose, { Schema, Document } from "mongoose";

export type ServiceTransactionStatus =
  | "pending"
  | "payment_pending"
  | "payment_confirmed"
  | "provider_payment_pending"
  | "provider_payment_confirmed"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export interface IServiceTransaction extends Document {
  requestId: string;
  userId: string;
  serviceId: string;
  providerId: string;
  providerAmount: number;
  platformFee: number;
  userAmount: number;
  currency: string;
  network: string;
  status: ServiceTransactionStatus;
  userPaymentTxId?: string;
  providerPaymentTxId?: string;
  requestPayload: {
    file_path?: string;
    raw_url?: string;
    code?: string;
    language?: string;
  };
  result?: any;
  paymentResponse?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const ServiceTransactionSchema: Schema = new Schema(
  {
    requestId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    serviceId: { type: String, required: true, default: "prism-code-review" },
    providerId: { type: String, required: true, default: "Prism" },
    providerAmount: { type: Number, required: true, default: 0.20 },
    platformFee: { type: Number, required: true, default: 0.05 },
    userAmount: { type: Number, required: true, default: 0.25 },
    currency: { type: String, default: "USDC" },
    network: {
      type: String,
      default: "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "payment_pending",
        "payment_confirmed",
        "provider_payment_pending",
        "provider_payment_confirmed",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    userPaymentTxId: { type: String },
    providerPaymentTxId: { type: String },
    requestPayload: {
      file_path: { type: String },
      raw_url: { type: String },
      code: { type: String },
      language: { type: String },
    },
    result: { type: Schema.Types.Mixed },
    paymentResponse: { type: String },
    error: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IServiceTransaction>(
  "ServiceTransaction",
  ServiceTransactionSchema
);
