import express from "express";
import {
  createCustomCourse,
  getLearnerCourses,
  unlockChapter,
  unlockChapterX402,
} from "../controllers/learner";
import { authenticate, requireLearner } from "../middlewares/auth.middleware";

const router = express.Router();

// Apply auth middleware selectively to standard learner routes
router.post("/courses", authenticate, requireLearner, createCustomCourse);
router.get("/courses", authenticate, requireLearner, getLearnerCourses);
router.post("/chapters/unlock", authenticate, requireLearner, unlockChapter);

/** X402 payment-gated unlock: GET returns 402 publicly, GET with X-PAYMENT/X-PAYMENT-SIGNATURE performs auth & unlock */
router.get("/chapters/:chapterId/unlock", unlockChapterX402);

export default router;
