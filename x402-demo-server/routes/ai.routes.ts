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
import { visualExplain } from "../controllers/ai/visualExplain.controller";

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

import { Response, NextFunction } from "express";
import { verifyAccessToken, getUserById } from "../services/auth";
import User, { UserRole } from "../models/User.model";
import { enforceWorkspacePayment } from "../middlewares/x402.middleware";

// Optional authentication middleware (allows unauthenticated probes to receive x402 challenges)
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

  const defaultUser = (await User.findOne({ role: UserRole.LEARNER })) || (await User.findOne());
  if (defaultUser) req.user = defaultUser;
  next();
};

const router = express.Router();

// AI Routes
router.post("/chat", chat);
router.post("/analyze", analyze);
router.post("/generate-course", generateCourse);
router.post("/route-intent", authenticate, requireLearner, routeIntent);

// 2. Doubt Solve ($0.002)
router.all(
  "/doubt-solve",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.002, description: "Answer a student's specific doubt or question about technical concepts." }),
  doubtSolveMvp
);

// 3. Code Review ($0.005)
router.all(
  "/code-review",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Review submitted source code and return issues, suggestions and improved code." }),
  codeReviewMvp
);

// 4. Debug ($0.003)
router.all(
  "/debug",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Identify the root cause of a programming compile or runtime error and return the fixed code." }),
  debugMvp
);

// 5. Generate Quiz ($0.005)
router.all(
  "/generate-quiz",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Create multiple-choice questions with answers and explanations for quiz practice." }),
  generateQuizMvp
);

// 6. Mock Interview ($0.008)
router.all(
  "/mock-interview",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.008, description: "Simulate a live technical coding interview or evaluate candidate answers." }),
  mockInterviewMvp
);

// 7. Research Analysis ($0.010)
router.all(
  "/research-analysis",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.010, description: "Analyze research-paper text and return methodology, findings, limitations and research gaps." }),
  researchAnalysisMvp
);

// 8. Interactive Lab ($0.003)
router.all(
  "/interactive-lab",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate a structured interactive learning experiment guide with steps." }),
  interactiveLabMvp
);

// 9. Resume Analysis ($0.004)
router.all(
  "/resume-analysis",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.004, description: "Grade resume text against job description, listing strengths and missing skills." }),
  resumeAnalysisMvp
);

// 10. Career Roadmap ($0.005)
router.all(
  "/career-roadmap",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Compile a monthly personalized study roadmap to learn a new role." }),
  careerRoadmapMvp
);

// Source PDF (keep advanced routing untouched)
router.post(
  "/explain/source/pdf",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.005, description: "Create personalized learning context from this PDF document" }),
  uploadSingle("file"),
  uploadPDFSource
);

// Keep other advanced helper endpoints
router.post(
  "/visual-explain",
  optionalAuthenticate,
  visualExplain
);

router.post(
  "/explain/visual",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate structured visual flow chart details" }),
  explain
);

router.post(
  "/explain/mind-map",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Generate interactive visual concept tree map from workspace context" }),
  getMindMap
);

router.post(
  "/explain/compare",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.003, description: "Compare two explanation snapshot versions to detect differences" }),
  getComparison
);

router.post(
  "/explain/synthesize",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.004, description: "Evaluate learner's written explanation against grounded sources" }),
  evaluateSynthesis
);

router.post(
  "/explain/continue",
  optionalAuthenticate,
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
