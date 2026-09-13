import express from "express";
import {
  discover,
  start,
  recordSikhoPayment,
  getPrismChallenge,
  submitPrismReview,
  reviewSingleFile,
  getReviewStatus,
  getReviewFiles,
  retryFile,
} from "../controllers/repositoryReview.controller";

const router = express.Router();

// Repository Review Endpoints
router.post("/discover", discover);
router.post("/start", start);

// Step 1: User pays $0.05 Sikho platform fee
router.post("/:reviewId/files/:fileId/sikho-payment", recordSikhoPayment);

// Step 2A: Fetch Prism 402 Challenge
router.post("/:reviewId/files/:fileId/prism-challenge", getPrismChallenge);

// Step 2B: Submit User's Signed x402 Payment & Execute Prism Review
router.post("/:reviewId/files/:fileId/prism-submit", submitPrismReview);

// Unified / Single file review
router.post("/:reviewId/files/:fileId/review", reviewSingleFile);

router.get("/:reviewId", getReviewStatus);
router.get("/:reviewId/files", getReviewFiles);
router.post("/:reviewId/files/:fileId/retry", retryFile);

export default router;
