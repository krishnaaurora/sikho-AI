import mongoose, { Schema, Document } from "mongoose";

export interface IAdminLog extends Document {
  adminId?: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  target?: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    target: {
      type: String,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
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

AdminLogSchema.index({ timestamp: -1 });
AdminLogSchema.index({ adminEmail: 1 });

export default mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);
