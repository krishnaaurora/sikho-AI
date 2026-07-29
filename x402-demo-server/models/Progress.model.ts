import mongoose, { Schema, model, Document, Types } from "mongoose";

interface IQuizScore {
  quizId: Types.ObjectId;
  score: number;
  completedAt: Date;
}

export interface IProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessons: Types.ObjectId[];
  completedChapters: Types.ObjectId[];
  percentage: number;
  lastLesson?: Types.ObjectId;
  totalTimeSpent: number;
  quizScores: IQuizScore[];
}

const ProgressSchema: Schema = new Schema(
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
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    completedChapters: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chapter",
      },
    ],
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastLesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizScores: [
      {
        quizId: {
          type: Schema.Types.ObjectId,
          ref: "Quiz",
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1 });
ProgressSchema.index({ courseId: 1 });

const Progress = model<IProgress>("Progress", ProgressSchema);
export default Progress;
