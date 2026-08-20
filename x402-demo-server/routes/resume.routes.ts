import express from "express";
import {
  uploadResume,
  getResumeStatus,
  getResumeExtraction,
  unlockResumePass,
} from "../controllers/resume/resume.controller";
import { uploadSingle } from "../middlewares/upload.middleware";
import { Response, NextFunction } from "express";
import { verifyAccessToken, getUserById } from "../services/auth";
import User from "../models/User.model";

import {
  runQualityAnalysis,
  getQualityAnalysis,
} from "../controllers/resume/quality.controller";
import {
  discoverJobs,
  handleApifyWebhook,
  extractIntent,
} from "../controllers/resume/apify.controller";
import {
  analyzeJob,
  getJobIntelligence,
  backfillIntelligence,
  listJobs,
} from "../controllers/resume/jobIntelligence.controller";
import {
  matchSingleJob,
  getMatch,
  matchAllJobs,
  getResumeMatches,
  getDistribution,
} from "../controllers/resume/matching.controller";
import {
  analyzeResumeImprovements,
  getResumeImprovements,
  applyResumeImprovements,
  generateProjectPlan,
} from "../controllers/resume/resumeImprovement.controller";
import { enforceWorkspacePayment } from "../middlewares/x402.middleware";

const router = express.Router();

// ─── Optional authentication middleware (falls back to seeded user) ───
const optionalAuthenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded: any = verifyAccessToken(token);
      const currentUser = await getUserById(decoded.userId);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
        return next();
      }
    }
  } catch {
    // Ignore — proceed as guest
  }

  const defaultUser = (await User.findOne({ email: "sneha@gmail.com" })) || (await User.findOne());
  if (defaultUser) req.user = defaultUser;
  next();
};

// ─── Routes ───────────────────────────────────────────────────────
// POST  /api/resume/upload          — Upload and start extraction
router.post("/upload", optionalAuthenticate, uploadSingle("file"), uploadResume);

// GET   /api/resume/:resumeId/status     — Poll extraction status
router.get("/:resumeId/status", optionalAuthenticate, getResumeStatus);

// GET   /api/resume/:resumeId/extraction — Full extracted data for Extraction Engine UI
router.get("/:resumeId/extraction", optionalAuthenticate, getResumeExtraction);

// POST  /api/resume/:resumeId/unlock      — Unlock Resume Intelligence pass (Paid $0.10)
router.post(
  "/:resumeId/unlock",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.10, description: "Resume Intelligence Pass" }),
  unlockResumePass
);

// POST  /api/resume/:resumeId/quality    — Trigger quality & ATS analysis
router.post("/:resumeId/quality", optionalAuthenticate, runQualityAnalysis);

// GET   /api/resume/:resumeId/quality     — Fetch analyzed quality metrics
router.get("/:resumeId/quality", optionalAuthenticate, getQualityAnalysis);

// POST  /api/resume/:resumeId/intent        — Extract target career parameters from prompt
router.post("/:resumeId/intent", optionalAuthenticate, extractIntent);

// POST  /api/resume/:resumeId/discover-jobs — Start Apify scraping
router.post("/:resumeId/discover-jobs", optionalAuthenticate, enforceWorkspacePayment({ priceUsd: 0.02, description: "Target Career Exploration Search" }), discoverJobs);

// POST  /api/resume/webhook/apify          — Apify webhook callback receiver
router.post("/webhook/apify", handleApifyWebhook);

// ─── Job Intelligence Routes (Phase 8) ───────────────────────────
// GET   /api/resume/jobs                        — List all jobs (paginated)
router.get("/jobs", listJobs);

// POST  /api/resume/jobs/backfill-intelligence  — Re-analyze pending/failed jobs
router.post("/jobs/backfill-intelligence", backfillIntelligence);

// POST  /api/resume/jobs/:jobId/analyze         — Analyze single job
router.post("/jobs/:jobId/analyze", optionalAuthenticate, enforceWorkspacePayment({ priceUsd: 0.02, description: "Job-Specific Resume Analysis" }), analyzeJob);

// GET   /api/resume/jobs/:jobId/intelligence    — Fetch job intelligence
router.get("/jobs/:jobId/intelligence", getJobIntelligence);

// ─── Resume ↔ Job Matching Routes (Phase 9) ──────────────────────
// GET   /api/resume/:resumeId/matches              — All matches for a resume (paginated)
router.get("/:resumeId/matches", optionalAuthenticate, getResumeMatches);

// GET   /api/resume/:resumeId/match-distribution   — Tier distribution for donut chart
router.get("/:resumeId/match-distribution", optionalAuthenticate, getDistribution);

// POST  /api/resume/:resumeId/match-all            — Batch match against all DB jobs
router.post("/:resumeId/match-all", optionalAuthenticate, matchAllJobs);

// POST  /api/resume/:resumeId/match/:jobId         — Match against a specific job
router.post("/:resumeId/match/:jobId", optionalAuthenticate, matchSingleJob);

// GET   /api/resume/:resumeId/match/:jobId         — Fetch existing match result
router.get("/:resumeId/match/:jobId", optionalAuthenticate, getMatch);

// ─── Resume Improvement Routes (Phase 11) ─────────────────────────
// POST  /api/resume/:resumeId/improvements/analyze  — Trigger improvement gap calculations
router.post("/:resumeId/improvements/analyze", optionalAuthenticate, analyzeResumeImprovements);

// GET   /api/resume/:resumeId/improvements          — Get market & job-specific tips
router.get("/:resumeId/improvements", optionalAuthenticate, getResumeImprovements);

// POST  /api/resume/:resumeId/improvements/apply       — Live dynamic resume improvements (Paid $0.05)
router.post(
  "/:resumeId/improvements/apply",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.05, description: "Resume Improvement AI" }),
  applyResumeImprovements
);

// POST  /api/resume/:resumeId/projects/generate        — Live dynamic project recommendations (Paid $0.03)
router.post(
  "/:resumeId/projects/generate",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.03, description: "Project Generation AI" }),
  generateProjectPlan
);

export default router;
