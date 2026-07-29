import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface ICertificate extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  certificateId: string;
  certificateUrl: string;
  issuedAt: Date;
}

const CertificateSchema: Schema = new Schema(
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
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true,
      trim: true,
    },
    certificateUrl: {
      type: String,
      required: [true, "Certificate URL is required"],
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CertificateSchema.index({ certificateId: 1 });

const Certificate = model<ICertificate>("Certificate", CertificateSchema);
export default Certificate;
