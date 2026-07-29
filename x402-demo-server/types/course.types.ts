import { CourseLevel, CourseBadge } from "../models/Course.model";
import { ICategory } from "../models/Category.model";
import { IChapter } from "../models/Chapter.model";

export interface CourseResponse {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  categoryId: any;
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
  badge?: CourseBadge;
  skills: string[];
  requirements: string[];
  whoIsThisFor: string[];
  courseIncludes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetailResponse extends CourseResponse {
  chapters?: IChapter[];
  category?: ICategory;
  instructor?: any;
}

export interface GetCoursesQuery {
  page?: number;
  limit?: number;
  category?: string;
  level?: CourseLevel;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "newest" | "popular" | "rating" | "price-low" | "price-high" | "alphabetical";
}

export interface SearchCoursesQuery extends GetCoursesQuery {
  q: string;
}

