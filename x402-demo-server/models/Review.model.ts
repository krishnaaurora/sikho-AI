import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  helpfulCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ courseId: 1, rating: 1 });
ReviewSchema.index({ isDeleted: 1 });

const Review = model<IReview>("Review", ReviewSchema);
export default Review;
