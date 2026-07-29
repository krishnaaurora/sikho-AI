export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum CourseBadge {
  BEST_SELLER = "Best Seller",
  TRENDING = "Trending",
  NEW = "New",
  AI_PICK = "AI Pick",
}

export interface Instructor {
  _id: string;
  fullName: string;
  email: string;
  profileImage?: string;
  bio?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Lesson {
  _id: string;
  chapterId: string;
  courseId: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  resources: string[];
  duration?: number;
  order: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  totalLessons: number;
  duration?: number;
  price: number;
  currency: string;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  courseId: string;
  userId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  };
  rating: number;
  title?: string;
  comment?: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  categoryId: Category;
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
  createdBy: Instructor;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetail extends Course {
  chapters: Chapter[];
  category: Category;
  instructor: Instructor;
  isPurchased: boolean;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  relatedCourses: Course[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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
