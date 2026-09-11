import express from "express";
import multer from "multer";
import { enforceWorkspacePayment } from "../middlewares/x402.middleware";
import {
  getOrPostInterviewQuestions,
  getOrPostLearningPathBatch,
  getOrPostStudyResources,
  postUploadAndAnalyze
} from "../controllers/interview/interviewPro.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── 1. INTERVIEW QUESTIONS ($0.03 USDC) ────────────────────────────────────
// Supports both GET and POST
router.get(
  "/interview-questions",
  enforceWorkspacePayment({
    priceUsd: 0.03,
    description: "Sikho AI - High-Yield Technical Interview Questions Pass",
    discoveryInput: { role: "Software Engineer", experience: "Senior", gaps: "System Design, Caching" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        role: { type: "string", description: "Candidate target role" },
        experience: { type: "string", description: "Candidate experience level" },
        gaps: { type: "string", description: "Comma-separated target skill gaps" }
      }
    }
  }),
  getOrPostInterviewQuestions
);

router.post(
  "/interview-questions",
  enforceWorkspacePayment({
    priceUsd: 0.03,
    description: "Sikho AI - High-Yield Technical Interview Questions Pass",
    discoveryInput: { role: "Software Engineer", experience: "Senior", gaps: ["System Design", "Caching"] },
    discoveryInputSchema: {
      type: "object",
      properties: {
        role: { type: "string", description: "Candidate target role" },
        experience: { type: "string", description: "Candidate experience level" },
        gaps: { type: "array", items: { type: "string" }, description: "Target skill gaps" }
      }
    }
  }),
  getOrPostInterviewQuestions
);

// ─── 2. LEARNING PATH 3-MODULE BATCH ($0.09 USDC) ───────────────────────────
// Supports both GET and POST
router.get(
  "/learning-path",
  enforceWorkspacePayment({
    priceUsd: 0.09,
    description: "Sikho AI - Learning Path 3-Module Batch Unlock",
    discoveryInput: { batch: 2, role: "Full Stack Software Engineer", modulesToUnlock: 3 },
    discoveryInputSchema: {
      type: "object",
      properties: {
        batch: { type: "integer", description: "Batch index (e.g. 2 for modules 4-6, 3 for modules 7-9)" },
        role: { type: "string", description: "Target engineering role" },
        modulesToUnlock: { type: "integer", description: "Number of modules to unlock (default 3)" }
      }
    }
  }),
  getOrPostLearningPathBatch
);

router.post(
  "/learning-path",
  enforceWorkspacePayment({
    priceUsd: 0.09,
    description: "Sikho AI - Learning Path 3-Module Batch Unlock",
    discoveryInput: { batch: 2, role: "Full Stack Software Engineer", modulesToUnlock: 3 },
    discoveryInputSchema: {
      type: "object",
      properties: {
        batch: { type: "integer", description: "Batch index (e.g. 2 for modules 4-6, 3 for modules 7-9)" },
        role: { type: "string", description: "Target engineering role" },
        modulesToUnlock: { type: "integer", description: "Number of modules to unlock (default 3)" }
      }
    }
  }),
  getOrPostLearningPathBatch
);

// ─── 3. STUDY RESOURCES ($0.03 USDC) ────────────────────────────────────────
// Supports both GET and POST
router.get(
  "/study-resources",
  enforceWorkspacePayment({
    priceUsd: 0.03,
    description: "Sikho AI - Verified Architectural Study Resources Pass",
    discoveryInput: { topic: "System Design & Modern Backend Architecture" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Engineering topic or gap focus" }
      }
    }
  }),
  getOrPostStudyResources
);

router.post(
  "/study-resources",
  enforceWorkspacePayment({
    priceUsd: 0.03,
    description: "Sikho AI - Verified Architectural Study Resources Pass",
    discoveryInput: { topic: "System Design & Modern Backend Architecture", gaps: ["Distributed Systems", "SQL Indexing"] },
    discoveryInputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Engineering topic or gap focus" },
        gaps: { type: "array", items: { type: "string" }, description: "Identified gap areas" }
      }
    }
  }),
  getOrPostStudyResources
);

// ─── 4. Resume Upload & Gap Analysis (FREE - no x402 payment required) ───────
router.post(
  "/upload",
  upload.fields([{ name: "file", maxCount: 1 }, { name: "jd_file", maxCount: 1 }]),
  postUploadAndAnalyze
);

export default router;
