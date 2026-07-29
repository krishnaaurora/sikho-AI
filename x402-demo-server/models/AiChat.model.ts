import mongoose, { Schema, model, Document, Types } from "mongoose";

export enum AiChatRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export interface IAiChat extends Omit<Document, "model"> {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: AiChatRole;
  message: string;
  tokens?: number;
  modelName?: string;
}

const AiChatSchema: Schema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: [true, "Session ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: Object.values(AiChatRole),
      required: [true, "Role is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    tokens: {
      type: Number,
      min: 0,
    },
    modelName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

AiChatSchema.index({ sessionId: 1 });
AiChatSchema.index({ userId: 1 });
AiChatSchema.index({ createdAt: -1 });
AiChatSchema.index({ sessionId: 1, createdAt: -1 });

const AiChat = model<IAiChat>("AiChat", AiChatSchema);
export default AiChat;
