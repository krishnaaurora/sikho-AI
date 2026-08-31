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
import { runQualityAnalysis } from "../controllers/resume/quality.controller";
import { runCareerFit } from "../controllers/resume/careerFit.controller";

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
  
  // Ensure existing seeded services also update to latest prices
  await X402Service.updateOne({ serviceId: "resume_pass" }, { $set: { priceUsd: 0.50 } });
  await X402Service.updateOne({ serviceId: "custom_search" }, { $set: { priceUsd: 0.50 } });
  await X402Service.updateOne({ serviceId: "job_analysis" }, { $set: { priceUsd: 0.50 } });
  await X402Service.updateOne({ serviceId: "resume_improve" }, { $set: { priceUsd: 0.05 } });
  await X402Service.updateOne({ serviceId: "project_generate" }, { $set: { priceUsd: 0.03 } });
  await X402Service.updateOne({ serviceId: "action_plan" }, { $set: { priceUsd: 0.10 } });
  await X402Service.updateOne({ serviceId: "ats_analysis" }, { $set: { priceUsd: 0.05, endpoint: "/api/v1/x402/ats-analysis" } });
  await X402Service.updateOne({ serviceId: "career_fit" }, { $set: { priceUsd: 0.50, endpoint: "/api/v1/x402/career-fit" } });

  const count = await X402Service.countDocuments();
  if (count === 0) {
    await X402Service.create([
      {
        serviceId: "resume_pass",
        name: "Resume Intelligence Pass",
        description: "Unlock full Resume Intelligence, ATS analysis, and career fit matching for 7 days",
        priceUsd: 0.50,
        endpoint: "/api/x402/resume-intelligence",
        status: "Active"
      },
      {
        serviceId: "custom_search",
        name: "Target Career Exploration Search",
        description: "Live Apify scraper search for custom target career transition goals",
        priceUsd: 0.50,
        endpoint: "/api/x402/target-career-search",
        status: "Active"
      },
      {
        serviceId: "job_analysis",
        name: "Deep Job-Specific Analysis",
        description: "Deep AI-driven gap analysis of your resume against a selected job description",
        priceUsd: 0.50,
        endpoint: "/api/x402/job-analysis",
        status: "Active"
      },
      {
        serviceId: "resume_improve",
        name: "Resume Improvement AI",
        description: "Modify and write high-impact resume section adjustments tailored to job requirements",
        priceUsd: 0.05,
        endpoint: "/api/x402/resume-improvement",
        status: "Active"
      },
      {
        serviceId: "project_generate",
        name: "Project Generation AI",
        description: "Generate comprehensive implementation blueprints matching missing technical skills",
        priceUsd: 0.03,
        endpoint: "/api/x402/project-generation",
        status: "Active"
      },
      {
        serviceId: "action_plan",
        name: "Career Action Plan",
        description: "Complete 30-day career transition roadmap with skills, projects, and interview prep",
        priceUsd: 0.10,
        endpoint: "/api/x402/career-action-plan",
        status: "Active"
      },
      {
        serviceId: "ats_analysis",
        name: "ATS Quality & Gaps Analysis",
        description: "Detailed evaluation of resume sections, clarity, and ATS compatibility",
        priceUsd: 0.05,
        endpoint: "/api/v1/x402/ats-analysis",
        status: "Active"
      },
      {
        serviceId: "career_fit",
        name: "Resume Career Fit & Top Roles",
        description: "AI-based matching of resume details against target career paths",
        priceUsd: 0.50,
        endpoint: "/api/v1/x402/career-fit",
        status: "Active"
      }
    ]);
  }
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
    const transactions = await X402Transaction.find({}).sort({ timestamp: -1 });
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

// ─── ENDPOINT 1: RESUME INTELLIGENCE ($0.50) ───
router.post(
  "/resume-intelligence",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.50, description: "Resume Intelligence Pass" }),
  asyncHandler(async (req: any, res: Response) => {
    const { resumeId } = req.body;
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }
    resume.status = "READY";
    await resume.save();
    return sendSuccessResponse(res, { resumeId, status: "READY" }, "Resume Intelligence unlocked successfully.");
  })
);

// ─── ENDPOINT 2: TARGET CAREER MARKET SEARCH ($0.50) ───
router.post(
  "/target-career-search",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.50, description: "Target Career Exploration Search" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body.resumeId;
    return discoverJobs(req, res, next);
  })
);

// ─── ENDPOINT 3: JOB-SPECIFIC ANALYSIS ($0.50) ───
router.post(
  "/job-analysis",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.50, description: "Deep Job-Specific Analysis" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.jobId = req.body.jobId;
    req.params.resumeId = req.body.resumeId;
    return analyzeJob(req, res, next);
  })
);

// ─── ENDPOINT 4: RESUME IMPROVEMENT ($0.05) ───
router.post(
  "/resume-improvement",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.05, description: "Resume Improvement AI" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body.resumeId;
    return applyResumeImprovements(req, res, next);
  })
);

// ─── ENDPOINT 5: PROJECT GENERATION ($0.03) ───
router.post(
  "/project-generation",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.03, description: "Project Generation AI" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body.resumeId;
    return generateProjectPlan(req, res, next);
  })
);

// ─── ENDPOINT 6: CAREER ACTION PLAN ($0.10) ───
router.post(
  "/career-action-plan",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.10, description: "Complete Career Action Plan" }),
  asyncHandler(async (req: any, res: Response) => {
    const { resumeId, targetCareer } = req.body;
    const actionPlan = await generateCareerActionPlan(resumeId, targetCareer);
    return sendSuccessResponse(res, actionPlan, "Career action plan generated successfully.");
  })
);

// ─── ENDPOINT 7: ATS QUALITY & GAPS ANALYSIS ($0.05) ───
router.post(
  "/ats-analysis",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.05, description: "ATS Quality & Gaps Analysis" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body.resumeId;
    return runQualityAnalysis(req, res, next);
  })
);

// ─── ENDPOINT 8: RESUME CAREER FIT & TOP ROLES ($0.50) ───
router.post(
  "/career-fit",
  optionalAuthenticate,
  enforceWorkspacePayment({ priceUsd: 0.50, description: "Resume Career Fit & Top Roles" }),
  asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    req.params.resumeId = req.body.resumeId;
    return runCareerFit(req, res, next);
  })
);

export default router;
