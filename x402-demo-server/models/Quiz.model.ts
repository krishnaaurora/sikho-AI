import mongoose, { Schema, model, Document, Types } from "mongoose";

interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface IQuiz extends Document {
  lessonId: Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuestion[];
  passingScore: number;
  totalMarks: number;
  duration?: number;
  isDeleted: boolean;
  deletedAt?: Date;
}

const QuizSchema: Schema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Lesson ID is required"],
    },
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },
    description: {
      type: String,
    },
    questions: [
      {
        question: {
          type: String,
          required: [true, "Question is required"],
        },
        options: [
          {
            type: String,
            required: [true, "Options are required"],
          },
        ],
        correctAnswer: {
          type: String,
          required: [true, "Correct answer is required"],
        },
        explanation: {
          type: String,
        },
      },
    ],
    passingScore: {
      type: Number,
      required: [true, "Passing score is required"],
      default: 60,
      min: 0,
      max: 100,
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      default: 100,
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
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({ lessonId: 1 });
QuizSchema.index({ isDeleted: 1 });

const Quiz = model<IQuiz>("Quiz", QuizSchema);
export default Quiz;
