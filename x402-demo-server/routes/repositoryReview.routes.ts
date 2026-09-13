import express from "express";
import {
  discover,
  start,
  handleSikhoX402Payment,
  recordSikhoPayment,
  getSikhoChallenge,
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

// Step 1: Real Sikho x402 Protocol Endpoint ($0.05 USDC)
// - GET/POST without Payment-Signature yields HTTP 402 Payment Required
// - POST with Payment-Signature settles payment and yields HTTP 200 OK
router.all("/sikho-x402", handleSikhoX402Payment);
router.all("/:reviewId/files/:fileId/sikho-x402", handleSikhoX402Payment);
router.all("/:reviewId/files/:fileId/sikho-challenge", getSikhoChallenge);
router.post("/:reviewId/files/:fileId/sikho-payment", handleSikhoX402Payment);

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
