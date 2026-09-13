import express from "express";
import {
  discover,
  start,
  getReviewStatus,
  getReviewFiles,
  retryFile,
} from "../controllers/repositoryReview.controller";

const router = express.Router();

// Repository Review Endpoints
router.post("/discover", discover);
router.post("/start", start);
router.get("/:reviewId", getReviewStatus);
router.get("/:reviewId/files", getReviewFiles);
router.post("/:reviewId/files/:fileId/retry", retryFile);

export default router;
