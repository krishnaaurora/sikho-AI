import mongoose, { Schema, Document } from "mongoose";

export interface IX402Service extends Document {
  serviceId: string;
  name: string;
  description: string;
  priceUsd: number;
  endpoint: string;
  status: string;
}

const X402ServiceSchema: Schema = new Schema(
  {
    serviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    endpoint: { type: String, required: true },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model<IX402Service>("X402Service", X402ServiceSchema);
