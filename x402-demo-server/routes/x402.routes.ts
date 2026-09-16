import express, { Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccessResponse } from "../utils/response";
import X402Service from "../models/X402Service.model";
import X402Transaction from "../models/X402Transaction.model";
import Resume from "../models/Resume.model";
import { verifyAccessToken, getUserById } from "../services/auth";
import { enforceWorkspacePayment } from "../middlewares/x402.middleware";

// Controller imports
import { discoverJobs } from "../controllers/resume/apify.controller";
import { analyzeJob } from "../controllers/resume/jobIntelligence.controller";
import { applyResumeImprovements, generateProjectPlan } from "../controllers/resume/resumeImprovement.controller";
import { generateCareerActionPlan } from "../services/resumeImprovement.service";
import { visualExplain } from "../controllers/ai/visualExplain.controller";
import { handleAdaptiveInterview } from "../controllers/interview/adaptiveInterview.controller";

const router = express.Router();

// Optional authentication middleware (falls back to seeded user)
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

    // Default fallback to user_01 if unauthenticated
    const fallbackUser = await getUserById("user_01");
    req.user = fallbackUser || { _id: "user_01", targetRole: "Data Scientist" };
    next();
  } catch (err) {
    next();
  }
};

// Seed initial services if collection is empty
const seedServices = async () => {
  try {
    await X402Service.collection.dropIndex("service_id_1");
  } catch (e) {
    // Ignore if index doesn't exist
  }
  const count = await X402Service.countDocuments();
  if (count === 0) {
    await X402Service.create([
      {
        serviceId: "resume_pass",
        name: "Resume Intelligence Pass",
        description: "Unlock full Resume Intelligence, ATS analysis, and career fit matching for 7 days",
        priceUsd: 0.30,
        endpoint: "/api/x402/resume-intelligence",
        status: "Active"
      },
      {
        serviceId: "custom_search",
        name: "Target Career Exploration Search",
        description: "Live Apify scraper search for custom target career transition goals",
        priceUsd: 0.30,
        endpoint: "/api/x402/target-career-search",
        status: "Active"
      },
      {
        serviceId: "job_analysis",
        name: "Deep Job-Specific Analysis",
        description: "Deep AI-driven gap analysis of your resume against a selected job description",
        priceUsd: 0.30,
        endpoint: "/api/x402/job-analysis",
        status: "Active"
      },
      {
        serviceId: "resume_improve",
        name: "Resume Improvement AI",
        description: "Modify and write high-impact resume section adjustments tailored to job requirements",
        priceUsd: 0.30,
        endpoint: "/api/x402/resume-improvement",
        status: "Active"
      },
      {
        serviceId: "project_generate",
        name: "Project Generation AI",
        description: "Generate comprehensive implementation blueprints matching missing technical skills",
        priceUsd: 0.30,
        endpoint: "/api/x402/project-generation",
        status: "Active"
      },
      {
        serviceId: "action_plan",
        name: "Career Action Plan",
        description: "Complete 30-day career transition roadmap with skills, projects, and interview prep",
        priceUsd: 0.30,
        endpoint: "/api/x402/career-action-plan",
        status: "Active"
      },
      {
        serviceId: "interview_questions",
        name: "Technical Interview Questions AI Pass",
        description: "Unlock tailored architectural & technical interview questions with STAR answers",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/interview-questions",
        status: "Active"
      },
      {
        serviceId: "learning_path",
        name: "Learning Path 3-Module Batch Unlock",
        description: "Unlock next batch of 3 in-depth concept & scenario modules",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/learning-path",
        status: "Active"
      },
      {
        serviceId: "study_resources",
        name: "Curated Study Resources Pass",
        description: "Unlock curated technical primers, system design docs, and indexing guides",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/study-resources",
        status: "Active"
      },
      {
        serviceId: "visual_explainer",
        name: "AI Visual Concept Explainer",
        description: "Interactive 3D isometric technical concept animation & mastery challenge",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/visual-explainer",
        status: "Active"
      },
      {
        serviceId: "interview_prep",
        name: "Adaptive Technical Interview Prep",
        description: "Interactive adaptive mock interview with AI evaluation, follow-up questioning and performance report",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/interview-prep",
        status: "Active"
      },
      {
        serviceId: "download_resume",
        name: "AI Auto-Fixed ATS Resume PDF Download Pass",
        description: "Official AI Auto-Fixed ATS optimized resume high-resolution PDF download pass",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/download-resume",
        status: "Active"
      }
    ]);
  }
  // Ensure existing seeded services also update or insert
  await X402Service.updateOne({ serviceId: "resume_pass" }, { $set: { priceUsd: 0.30 } });
  await X402Service.updateOne(
    { serviceId: "custom_search" },
    {
      $set: {
        name: "Target Career Exploration Search",
        description: "Live Apify scraper search for custom target career transition goals",
        priceUsd: 0.30,
        endpoint: "/api/x402/target-career-search",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "job_analysis" },
    {
      $set: {
        name: "Deep Job-Specific Analysis",
        description: "Deep AI-driven gap analysis of your resume against a selected job description",
        priceUsd: 0.30,
        endpoint: "/api/x402/job-analysis",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "resume_improve" },
    {
      $set: {
        name: "Resume Improvement AI",
        description: "Modify and write high-impact resume section adjustments tailored to job requirements",
        priceUsd: 0.30,
        endpoint: "/api/x402/resume-improvement",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "project_generate" },
    {
      $set: {
        name: "Project Generation AI",
        description: "Generate comprehensive implementation blueprints matching missing technical skills",
        priceUsd: 0.30,
        endpoint: "/api/x402/project-generation",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "action_plan" },
    {
      $set: {
        name: "Career Action Plan",
        description: "Complete 30-day career transition roadmap with skills, projects, and interview prep",
        priceUsd: 0.30,
        endpoint: "/api/x402/career-action-plan",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "interview_questions" },
    {
      $set: {
        name: "Technical Interview Questions AI Pass",
        description: "Unlock tailored architectural & technical interview questions with STAR answers",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/interview-questions",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "learning_path" },
    {
      $set: {
        name: "Learning Path 3-Module Batch Unlock",
        description: "Unlock next batch of 3 in-depth concept & scenario modules",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/learning-path",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "study_resources" },
    {
      $set: {
        name: "Curated Study Resources Pass",
        description: "Unlock curated technical primers, system design docs, and indexing guides",
        priceUsd: 0.30,
        endpoint: "/api/v1/interview-pro/study-resources",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "visual_explainer" },
    {
      $set: {
        name: "AI Visual Concept Explainer",
        description: "Interactive 3D isometric technical concept animation & mastery challenge",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/visual-explainer",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "interview_prep" },
    {
      $set: {
        name: "Adaptive Technical Interview Prep",
        description: "Interactive adaptive mock interview with AI evaluation, follow-up questioning and performance report",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/interview-prep",
        status: "Active"
      }
    },
    { upsert: true }
  );
  await X402Service.updateOne(
    { serviceId: "download_resume" },
    {
      $set: {
        name: "AI Auto-Fixed ATS Resume PDF Download Pass",
        description: "Official AI Auto-Fixed ATS optimized resume high-resolution PDF download pass",
        priceUsd: 0.30,
        endpoint: "/api/v1/x402/download-resume",
        status: "Active"
      }
    },
    { upsert: true }
  );
};

// GET /api/x402/services -> list pricing
router.get(
  "/services",
  asyncHandler(async (req, res) => {
    await seedServices();
    const services = await X402Service.find({});
    return sendSuccessResponse(res, services, "x402 Services retrieved successfully");
  })
);

// GET /api/x402/transactions -> list user transactions ledger
router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const serviceId = req.query.serviceId;
    const filter: Record<string, any> = typeof serviceId === "string" ? { serviceId } : {};
    const transactions = await X402Transaction.find(filter).sort({ timestamp: -1 });
    return sendSuccessResponse(res, transactions, "x402 Transactions retrieved successfully");
  })
);

// POST /api/x402/transactions -> add a new transaction log on successful settlement
router.post(
  "/transactions",
  asyncHandler(async (req, res) => {
    const { userId, serviceId, amount, currency, walletAddress, txHash, status, resourceId } = req.body;
    const tx = await X402Transaction.create({
      userId,
      serviceId,
      amount,
      currency,
      walletAddress,
      txHash,
      status,
      resourceId
    });
    return sendSuccessResponse(res, tx, "Transaction registered successfully");
  })
);

// ─── ENDPOINT 1: RESUME INTELLIGENCE ($0.30) ───
router.all(
  "/resume-intelligence",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.30, description: "Resume Intelligence Pass" }),
  asyncHandler(async (req: any, res: Response) => {
    const resumeId = req.body?.resumeId || req.query?.resumeId;
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }
    resume.status = "READY";
    await resume.save();
    return sendSuccessResponse(res, { resumeId, status: "READY" }, "Resume Intelligence unlocked successfully.");
  })
);

// ─── ENDPOINT 2: TARGET CAREER MARKET SEARCH ($0.30) ───
router.all(
  "/target-career-search",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Target Career Exploration Search",
    discoveryInput: { resumeId: "65cb765f0123456789abcdef", targetRole: "Machine Learning Engineer" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Candidate resume ID" },
        targetRole: { type: "string", description: "Target role title" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body?.resumeId || req.query?.resumeId;
    return discoverJobs(req, res, next);
  })
);

// ─── ENDPOINT 3: JOB-SPECIFIC ANALYSIS ($0.30) ───
router.all(
  "/job-analysis",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Deep Job-Specific Analysis",
    discoveryInput: { jobId: "65cb765f0123456789abcdef", resumeId: "65cb765f0123456789abcdef" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        jobId: { type: "string", description: "Target Job ID" },
        resumeId: { type: "string", description: "Candidate resume ID" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.jobId = req.body?.jobId || req.query?.jobId;
    req.params.resumeId = req.body?.resumeId || req.query?.resumeId;
    return analyzeJob(req, res, next);
  })
);

// ─── ENDPOINT 4: RESUME IMPROVEMENT ($0.30) ───
router.all(
  "/resume-improvement",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Resume Improvement AI",
    discoveryInput: { resumeId: "65cb765f0123456789abcdef" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Candidate resume ID" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body?.resumeId || req.query?.resumeId;
    return applyResumeImprovements(req, res, next);
  })
);

// ─── ENDPOINT 5: PROJECT GENERATION ($0.30) ───
router.all(
  "/project-generation",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Project Generation AI",
    discoveryInput: { resumeId: "65cb765f0123456789abcdef", skillGaps: ["Redis", "Distributed Systems"] },
    discoveryInputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Candidate resume ID" },
        skillGaps: { type: "array", items: { type: "string" }, description: "Missing skill gaps to address" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body?.resumeId || req.query?.resumeId;
    return generateProjectPlan(req, res, next);
  })
);

// ─── ENDPOINT 6: CAREER ACTION PLAN ($0.30) ───
router.all(
  "/career-action-plan",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Complete Career Action Plan",
    discoveryInput: { resumeId: "65cb765f0123456789abcdef", targetCareer: "Senior Backend Architect" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Candidate resume ID" },
        targetCareer: { type: "string", description: "Target career goal" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response) => {
    const resumeId = req.body?.resumeId || req.query?.resumeId;
    const targetCareer = req.body?.targetCareer || req.query?.targetCareer;
    const actionPlan = await generateCareerActionPlan(resumeId, targetCareer);
    return sendSuccessResponse(res, actionPlan, "Career action plan generated successfully.");
  })
);

// ─── ENDPOINT 7: AI VISUAL CONCEPT EXPLAINER ($0.30) ───
// Permanent stable endpoint handling all Visual Explainer transactions (1 endpoint -> N transactions)
router.all(
  "/visual-explainer",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Sikho AI - Interactive 3D Visual Concept Explainer Pass",
    discoveryInput: { concept: "Load Balancing", difficulty: "beginner" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        concept: { type: "string", description: "Technical concept to visualize (e.g. Load Balancing, Token Streaming, Caching)" },
        difficulty: { type: "string", description: "Target depth (beginner, intermediate, advanced)" }
      }
    }
  }),
  visualExplain
);

// ─── ENDPOINT 8: ADAPTIVE TECHNICAL INTERVIEW PREPARATION ($0.30) ───
// Permanent stable endpoint handling all Adaptive Interview Prep transactions (1 endpoint -> N transactions)
router.all(
  "/interview-prep",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Sikho AI - Adaptive Technical Interview Preparation Pass",
    discoveryInput: { topic: "Data Structures & Algorithms", action: "start" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Detected technical interview topic" },
        action: { type: "string", enum: ["overview", "start", "evaluate", "report"] }
      }
    }
  }),
  handleAdaptiveInterview
);

// ─── ENDPOINT 9: AI AUTO-FIXED ATS RESUME PDF DOWNLOAD ($0.30) ───
// Permanent stable endpoint handling all AI Auto-Fixed ATS Resume PDF Download transactions (1 endpoint -> N transactions)
router.all(
  "/download-resume",
  optionalAuthenticate,
  enforceWorkspacePayment({
    priceUsd: 0.30,
    description: "Sikho AI - AI Auto-Fixed ATS Resume PDF Download Pass",
    discoveryInput: { resumeId: "65cb765f0123456789abcdef", format: "pdf" },
    discoveryInputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Candidate resume ID" },
        format: { type: "string", enum: ["pdf"], description: "Export format" }
      }
    }
  }),
  asyncHandler(async (req: any, res: Response) => {
    return sendSuccessResponse(res, { success: true, downloadAllowed: true }, "AI Auto-Fixed ATS Resume PDF download authorized successfully.");
  })
);

export default router;
