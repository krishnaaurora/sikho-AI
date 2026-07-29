import mongoose, { Schema, model, Document, Types } from "mongoose";

export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum CourseBadge {
  NEW = "new",
  TOP = "top",
  TRENDING = "trending",
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  categoryId: Types.ObjectId;
  level: CourseLevel;
  duration?: number;
  language: string;
  tags: string[];
  rating: number;
  totalRatings: number;
  totalStudents: number;
  totalLessons: number;
  price: number;
  currency: string;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  badge?: CourseBadge;
}

const CourseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    banner: {
      type: String,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    level: {
      type: String,
      required: [true, "Course level is required"],
      enum: Object.values(CourseLevel),
      default: CourseLevel.BEGINNER,
    },
    duration: {
      type: Number,
      min: 0,
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      default: "English",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USDC",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    badge: {
      type: String,
      enum: Object.values(CourseBadge),
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ slug: 1 });
CourseSchema.index({ categoryId: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ price: 1 });
CourseSchema.index({ rating: -1 });
CourseSchema.index({ isPublished: 1, isDeleted: 1 });

const Course = model<ICourse>("Course", CourseSchema);
export default Course;
