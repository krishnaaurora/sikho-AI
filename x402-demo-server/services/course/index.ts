import { CourseRepository, CategoryRepository, ChapterRepository, ReviewRepository, LessonRepository, PurchaseRepository } from "../../repositories";
import { GetCoursesQuery, SearchCoursesQuery } from "../../types/course.types";
import { getPaginationParams, buildPaginationResponse } from "../../utils/pagination";
import { AppError } from "../../utils/errors";
import { Types } from "mongoose";

const getSortOption = (sortBy: string | undefined) => {
  switch (sortBy) {
    case "newest":
      return { createdAt: -1 };
    case "popular":
      return { totalStudents: -1, rating: -1 };
    case "rating":
      return { rating: -1, totalRatings: -1 };
    case "price-low":
      return { price: 1 };
    case "price-high":
      return { price: -1 };
    case "alphabetical":
      return { title: 1 };
    default:
      return { createdAt: -1 };
  }
};

const buildFilter = (query: GetCoursesQuery) => {
  const filter: any = {};
  
  if (query.level) {
    filter.level = query.level;
  }
  
  if (query.language) {
    filter.language = { $regex: query.language, $options: "i" };
  }
  
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }
  
  if (query.minRating !== undefined) {
    filter.rating = { $gte: query.minRating };
  }

  return filter;
};

export const getAllCoursesService = async (query: GetCoursesQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = buildFilter(query);
  
  if (query.category) {
    const category = await CategoryRepository.findBySlug(query.category);
    if (category) {
      filter.categoryId = category._id;
    }
  }
  
  const sort = getSortOption(query.sortBy);
  const { courses, total } = await CourseRepository.findAll(filter, { skip, limit, sort });
  
  return buildPaginationResponse(courses, total, page, limit);
};

export const getCourseByIdService = async (id: string | string[], userId?: string) => {
  const courseId = Array.isArray(id) ? id[0] : id;
  const course = await CourseRepository.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const chapters = await ChapterRepository.findByCourseId(course._id);
  const chaptersWithLessons = await Promise.all(chapters.map(async chapter => {
    const lessons = await LessonRepository.findByChapterId(chapter._id);
    return {
      ...chapter.toObject(),
      lessons
    };
  }));

  let isPurchased = false;
  if (userId) {
    const purchase = await PurchaseRepository.findByUserAndCourse(userId, course._id);
    isPurchased = !!purchase;
  }

  const reviews = await ReviewRepository.findByCourseId(course._id);
  const { averageRating, totalReviews } = await ReviewRepository.getAverageRating(course._id);

  const relatedCourses = await CourseRepository.findAll(
    { categoryId: course.categoryId, _id: { $ne: course._id } },
    { limit: 5, sort: { rating: -1 } }
  );

  return {
    ...course.toObject(),
    chapters: chaptersWithLessons,
    category: course.categoryId,
    instructor: course.createdBy,
    isPurchased,
    reviews,
    averageRating,
    totalReviews,
    relatedCourses: relatedCourses.courses
  };
};

export const getCourseBySlugService = async (slug: string | string[], userId?: string) => {
  const courseSlug = Array.isArray(slug) ? slug[0] : slug;
  const course = await CourseRepository.findBySlug(courseSlug);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const chapters = await ChapterRepository.findByCourseId(course._id);
  const chaptersWithLessons = await Promise.all(chapters.map(async chapter => {
    const lessons = await LessonRepository.findByChapterId(chapter._id);
    return {
      ...chapter.toObject(),
      lessons
    };
  }));

  let isPurchased = false;
  if (userId) {
    const purchase = await PurchaseRepository.findByUserAndCourse(userId, course._id);
    isPurchased = !!purchase;
  }

  const reviews = await ReviewRepository.findByCourseId(course._id);
  const { averageRating, totalReviews } = await ReviewRepository.getAverageRating(course._id);

  const relatedCourses = await CourseRepository.findAll(
    { categoryId: course.categoryId, _id: { $ne: course._id } },
    { limit: 5, sort: { rating: -1 } }
  );

  return {
    ...course.toObject(),
    chapters: chaptersWithLessons,
    category: course.categoryId,
    instructor: course.createdBy,
    isPurchased,
    reviews,
    averageRating,
    totalReviews,
    relatedCourses: relatedCourses.courses
  };
};

export const getCourseReviewsService = async (id: string | string[]) => {
  const courseId = Array.isArray(id) ? id[0] : id;
  const course = await CourseRepository.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const reviews = await ReviewRepository.findByCourseId(course._id);
  const ratingDistribution = await ReviewRepository.getRatingDistribution(course._id);
  const { averageRating, totalReviews } = await ReviewRepository.getAverageRating(course._id);
  
  return {
    reviews,
    ratingDistribution,
    averageRating,
    totalReviews
  };
};

export const getCourseChaptersService = async (id: string | string[]) => {
  const courseId = Array.isArray(id) ? id[0] : id;
  const course = await CourseRepository.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const chapters = await ChapterRepository.findByCourseId(course._id);
  const chaptersWithLessons = await Promise.all(chapters.map(async chapter => {
    const lessons = await LessonRepository.findByChapterId(chapter._id);
    return {
      ...chapter.toObject(),
      lessons
    };
  }));
  
  return chaptersWithLessons;
};

export const getCourseRelatedService = async (id: string | string[]) => {
  const courseId = Array.isArray(id) ? id[0] : id;
  const course = await CourseRepository.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const relatedCourses = await CourseRepository.findAll(
    { categoryId: course.categoryId, _id: { $ne: course._id } },
    { limit: 5, sort: { rating: -1 } }
  );
  
  return relatedCourses;
};

export const getCourseProgressService = async (id: string | string[], userId: string) => {
  const courseId = Array.isArray(id) ? id[0] : id;
  const course = await CourseRepository.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  
  const purchase = await PurchaseRepository.findByUserAndCourse(userId, course._id);
  if (!purchase) {
    throw new AppError("Course not purchased", 403);
  }
  
  return {
    courseId: course._id,
    progress: 0,
    completedLessons: [],
    totalLessons: course.totalLessons
  };
};

export const searchCoursesService = async (query: SearchCoursesQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = buildFilter(query);
  
  if (query.category) {
    const category = await CategoryRepository.findBySlug(query.category);
    if (category) {
      filter.categoryId = category._id;
    }
  }
  
  const sort = getSortOption(query.sortBy);
  const { courses, total } = await CourseRepository.search(query.q, filter, { skip, limit, sort });
  
  return buildPaginationResponse(courses, total, page, limit);
};

export const getCategoriesService = async () => {
  return CategoryRepository.findAll();
};

export const getCoursesByCategoryService = async (slug: string | string[], query: GetCoursesQuery) => {
  const categorySlug = Array.isArray(slug) ? slug[0] : slug;
  const category = await CategoryRepository.findBySlug(categorySlug);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  
  const { page, limit, skip } = getPaginationParams(query);
  const filter = buildFilter(query);
  filter.categoryId = category._id;
  
  const sort = getSortOption(query.sortBy);
  const { courses, total } = await CourseRepository.findAll(filter, { skip, limit, sort });
  
  return {
    category,
    ...buildPaginationResponse(courses, total, page, limit),
  };
};

export const getPopularCoursesService = async (query: GetCoursesQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { courses, total } = await CourseRepository.findPopular({ skip, limit });
  return buildPaginationResponse(courses, total, page, limit);
};

export const getTrendingCoursesService = async (query: GetCoursesQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { courses, total } = await CourseRepository.findTrending({ skip, limit });
  return buildPaginationResponse(courses, total, page, limit);
};

export const getRecommendedCoursesService = async (query: GetCoursesQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { courses, total } = await CourseRepository.findRecommended({ skip, limit });
  return buildPaginationResponse(courses, total, page, limit);
};
