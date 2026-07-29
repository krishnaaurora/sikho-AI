import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import {
  getAllCoursesService,
  getCourseByIdService,
  getCourseBySlugService,
  searchCoursesService,
  getCategoriesService,
  getCoursesByCategoryService,
  getPopularCoursesService,
  getTrendingCoursesService,
  getRecommendedCoursesService,
  getCourseReviewsService,
  getCourseChaptersService,
  getCourseRelatedService,
  getCourseProgressService,
} from "../../services/course";

export const getAllCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await getAllCoursesService(req.query);
  return sendSuccessResponse(res, result, "Courses retrieved successfully");
});

export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const course = await getCourseByIdService(req.params.id as string, userId);
  return sendSuccessResponse(res, course, "Course retrieved successfully");
});

export const getCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const course = await getCourseBySlugService(req.params.slug as string, userId);
  return sendSuccessResponse(res, course, "Course retrieved successfully");
});

export const getCourseReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await getCourseReviewsService(req.params.id as string);
  return sendSuccessResponse(res, reviews, "Course reviews retrieved successfully");
});

export const getCourseChapters = asyncHandler(async (req: Request, res: Response) => {
  const chapters = await getCourseChaptersService(req.params.id as string);
  return sendSuccessResponse(res, chapters, "Course chapters retrieved successfully");
});

export const getCourseRelated = asyncHandler(async (req: Request, res: Response) => {
  const related = await getCourseRelatedService(req.params.id as string);
  return sendSuccessResponse(res, related, "Related courses retrieved successfully");
});

export const getCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const progress = await getCourseProgressService(req.params.id as string, userId);
  return sendSuccessResponse(res, progress, "Course progress retrieved successfully");
});

export const searchCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchCoursesService(req.query as any);
  return sendSuccessResponse(res, result, "Search results retrieved successfully");
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await getCategoriesService();
  return sendSuccessResponse(res, categories, "Categories retrieved successfully");
});

export const getCoursesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await getCoursesByCategoryService(req.params.slug as string, req.query);
  return sendSuccessResponse(res, result, "Category courses retrieved successfully");
});

export const getPopularCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await getPopularCoursesService(req.query);
  return sendSuccessResponse(res, result, "Popular courses retrieved successfully");
});

export const getTrendingCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await getTrendingCoursesService(req.query);
  return sendSuccessResponse(res, result, "Trending courses retrieved successfully");
});

export const getRecommendedCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await getRecommendedCoursesService(req.query);
  return sendSuccessResponse(res, result, "Recommended courses retrieved successfully");
});
