import express from "express";
import { chat, analyze, generateCourse, explain } from "../controllers/ai";
import { uploadPDFSource } from "../controllers/ai/source.controller";
import { getMindMap } from "../controllers/ai/mindmap.controller";
import { getComparison } from "../controllers/ai/comparison.controller";
import { evaluateSynthesis } from "../controllers/ai/synthesis.controller";
import { getContinuation } from "../controllers/ai/continuation.controller";
import { 
  getLearningHistory, 
  initializeExplainSession, 
  getSessionWorkspace, 
  getSessionVersions, 
  createSessionVersion 
} from "../controllers/ai/session.controller";
import { authenticate, requireLearner } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { explainRequestSchema } from "../types/explain.types";
import { uploadSingle } from "../middlewares/upload.middleware";

// New MVP imports
import {
  explainConceptMvp,
  doubtSolveMvp,
  codeReviewMvp,
  debugMvp,
  generateQuizMvp,
  mockInterviewMvp,
  researchAnalysisMvp,
  interactiveLabMvp,
  resumeAnalysisMvp,
  careerRoadmapMvp
} from "../controllers/ai/mvp.controller";

import { routeIntent } from "../controllers/ai/router.controller";

const router = express.Router();

import { enforceWorkspacePayment } from "../middlewares/x402.middleware";

// AI Routes
router.post("/chat", chat);
router.post("/analyze", analyze);
router.post("/generate-course", generateCourse);
router.post("/route-intent", authenticate, requireLearner, routeIntent);

// 1. Explain ($0.002)
router.post(
  "/explain",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.002, description: "Generate a structured explanation of a technical concept adapted to the requested learning style." }),
  explain
);

// 2. Doubt Solve ($0.002)
router.post(
  "/doubt-solve",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.002, description: "Answer a student's specific doubt or question about technical concepts." }),
  doubtSolveMvp
);

// 3. Code Review ($0.005)
router.post(
  "/code-review",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Review submitted source code and return issues, suggestions and improved code." }),
  codeReviewMvp
);

// 4. Debug ($0.003)
router.post(
  "/debug",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Identify the root cause of a programming compile or runtime error and return the fixed code." }),
  debugMvp
);

// 5. Generate Quiz ($0.005)
router.post(
  "/generate-quiz",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Create multiple-choice questions with answers and explanations for quiz practice." }),
  generateQuizMvp
);

// 6. Mock Interview ($0.008)
router.post(
  "/mock-interview",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.008, description: "Simulate a live technical coding interview or evaluate candidate answers." }),
  mockInterviewMvp
);

// 7. Research Analysis ($0.010)
router.post(
  "/research-analysis",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.010, description: "Analyze research-paper text and return methodology, findings, limitations and research gaps." }),
  researchAnalysisMvp
);

// 8. Interactive Lab ($0.003)
router.post(
  "/interactive-lab",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate a structured interactive learning experiment guide with steps." }),
  interactiveLabMvp
);

// 9. Resume Analysis ($0.004)
router.post(
  "/resume-analysis",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.004, description: "Grade resume text against job description, listing strengths and missing skills." }),
  resumeAnalysisMvp
);

// 10. Career Roadmap ($0.005)
router.post(
  "/career-roadmap",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Compile a monthly personalized study roadmap to learn a new role." }),
  careerRoadmapMvp
);

// Source PDF (keep advanced routing untouched)
router.post(
  "/explain/source/pdf",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Create personalized learning context from this PDF document" }),
  uploadSingle("file"),
  uploadPDFSource
);

// Keep other advanced helper endpoints
router.post(
  "/explain/visual",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate structured visual flow chart details" }),
  explain
);

router.post(
  "/explain/mind-map",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate interactive visual concept tree map from workspace context" }),
  getMindMap
);

router.post(
  "/explain/compare",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Compare two explanation snapshot versions to detect differences" }),
  getComparison
);

router.post(
  "/explain/synthesize",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.004, description: "Evaluate learner's written explanation against grounded sources" }),
  evaluateSynthesis
);

router.post(
  "/explain/continue",
  authenticate,
  requireLearner,
  enforceWorkspacePayment({ priceUsd: 0.002, description: "Compile next target concept lesson to remediate gaps" }),
  getContinuation
);

// Free helper session workspace APIs
router.get("/explain/history", authenticate, requireLearner, getLearningHistory);
router.post("/explain/session", authenticate, requireLearner, initializeExplainSession);
router.get("/explain/:sessionId", authenticate, requireLearner, getSessionWorkspace);
router.get("/explain/:sessionId/versions", authenticate, requireLearner, getSessionVersions);
router.post("/explain/:sessionId/versions", authenticate, requireLearner, createSessionVersion);

export default router;
