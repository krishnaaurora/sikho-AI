import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface ILesson extends Document {
  chapterId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  resources: string[];
  duration?: number;
  order: number;
  isFree: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
}

const LessonSchema: Schema = new Schema(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter ID is required"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    description: {
      type: String,
    },
    content: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    pdfUrl: {
      type: String,
    },
    resources: [
      {
        type: String,
        trim: true,
      },
    ],
    duration: {
      type: Number,
      min: 0,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      default: 0,
      min: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
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

LessonSchema.index({ chapterId: 1, order: 1 });
LessonSchema.index({ courseId: 1, order: 1 });
LessonSchema.index({ isDeleted: 1 });

const Lesson = model<ILesson>("Lesson", LessonSchema);
export default Lesson;
