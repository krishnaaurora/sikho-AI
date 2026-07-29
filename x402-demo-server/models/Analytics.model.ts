import mongoose, { Schema, model, Document } from "mongoose";

export interface IAnalytics extends Document {
  date: Date;
  dailyUsers: number;
  revenue: number;
  coursesPurchased: number;
  aiRequests: number;
  quizAttempts: number;
  learningHours: number;
}

const AnalyticsSchema: Schema = new Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      unique: true,
      default: Date.now,
    },
    dailyUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    coursesPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiRequests: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    learningHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

AnalyticsSchema.index({ date: 1 });

const Analytics = model<IAnalytics>("Analytics", AnalyticsSchema);
export default Analytics;
