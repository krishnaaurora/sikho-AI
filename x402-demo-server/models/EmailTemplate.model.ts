import mongoose, { Schema, Document } from "mongoose";

export interface IEmailTemplate extends Document {
  templateKey: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables?: string[];
  updatedBy?: string;
  updatedAt?: Date;
}

const EmailTemplateSchema: Schema = new Schema(
  {
    templateKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    bodyHtml: {
      type: String,
      required: true,
    },
    bodyText: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: ["{{name}}", "{{email}}"],
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
