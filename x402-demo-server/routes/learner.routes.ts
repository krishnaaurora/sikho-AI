import express from "express";
import {
  createCustomCourse,
  getLearnerCourses,
  unlockChapter,
  unlockChapterX402,
} from "../controllers/learner";
import { authenticate, requireLearner } from "../middlewares/auth.middleware";

const router = express.Router();

// Apply auth middleware to all learner routes
router.use(authenticate, requireLearner);

router.post("/courses", createCustomCourse);
router.get("/courses", getLearnerCourses);
router.post("/chapters/unlock", unlockChapter);
/** X402 payment-gated unlock: GET returns 402, GET with X-PAYMENT unlocks */
router.get("/chapters/:chapterId/unlock", unlockChapterX402);

export default router;
