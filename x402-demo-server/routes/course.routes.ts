import express from "express";
import {
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  searchCourses,
  getCategories,
  getCoursesByCategory,
  getPopularCourses,
  getTrendingCourses,
  getRecommendedCourses,
  getCourseReviews,
  getCourseChapters,
  getCourseRelated,
  getCourseProgress,
} from "../controllers/course";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", getAllCourses);
router.get("/search", searchCourses);
router.get("/categories", getCategories);
router.get("/popular", getPopularCourses);
router.get("/trending", getTrendingCourses);
router.get("/recommended", getRecommendedCourses);
router.get("/category/:slug", getCoursesByCategory);
router.get("/id/:id", getCourseById);
router.get("/slug/:slug", getCourseBySlug);
router.get("/:id", getCourseById);
router.get("/:id/reviews", getCourseReviews);
router.get("/:id/chapters", getCourseChapters);
router.get("/:id/related", getCourseRelated);
router.get("/:id/progress", authenticate, getCourseProgress);

export default router;
