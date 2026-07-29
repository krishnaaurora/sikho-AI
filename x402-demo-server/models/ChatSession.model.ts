import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IChatSession extends Document {
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
}

const ChatSessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ChatSessionSchema.index({ userId: 1, courseId: 1 });
ChatSessionSchema.index({ userId: 1 });
ChatSessionSchema.index({ courseId: 1 });

const ChatSession = model<IChatSession>("ChatSession", ChatSessionSchema);
export default ChatSession;
