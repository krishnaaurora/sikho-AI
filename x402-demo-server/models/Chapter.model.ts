import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IChapter extends Document {
  courseId: Types.ObjectId;
  title: string;
  order: number;
  description?: string;
  totalLessons: number;
  duration?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  price?: number;
  currency?: string;
}

const ChapterSchema: Schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      default: 0,
      min: 0,
    },
    description: {
      type: String,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    price: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "USDC",
    },
  },
  {
    timestamps: true,
  }
);

ChapterSchema.index({ courseId: 1, order: 1 });
ChapterSchema.index({ isDeleted: 1 });

const Chapter = model<IChapter>("Chapter", ChapterSchema);
export default Chapter;
