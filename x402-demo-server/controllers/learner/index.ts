import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import {
  createCustomCourseService,
  getLearnerCoursesService,
  unlockChapterService,
} from "../../services/learner";
import { buildPaymentRequired, verifyX402Payment } from "../../services/payment";
import { authenticate, requireLearner } from "../../middlewares/auth.middleware";
// @ts-ignore
import { encodePaymentRequiredHeader } from "@x402/core/http";
import Chapter from "../../models/Chapter.model";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { env } from "../../config/env";

export const createCustomCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { topic } = req.body;
  const result = await createCustomCourseService(userId, topic);
  return sendSuccessResponse(res, result, "Course created successfully");
});

export const getLearnerCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const courses = await getLearnerCoursesService(userId);
  return sendSuccessResponse(res, courses, "Courses retrieved successfully");
});

export const unlockChapter = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { chapterId, transactionHash } = req.body;
  const purchase = await unlockChapterService(userId, chapterId, transactionHash);
  return sendSuccessResponse(res, purchase, "Chapter unlocked successfully");
});

export const getProfile = async (req: Request, res: Response) => {};
export const updateProfile = async (req: Request, res: Response) => {};
export const getCourseById = async (req: Request, res: Response) => {};

/**
 * X402 payment-gated chapter unlock endpoint.
 *
 * - Without X-PAYMENT header: returns 402 with payment-required details.
 * - With X-PAYMENT header: verifies via facilitator, unlocks chapter, returns purchase.
 */
export const unlockChapterX402 = asyncHandler(async (req: Request, res: Response) => {
  const chapterId = String(req.query.chapterId || req.params.chapterId || "65cb765f0123456789abcdef");

  // Look up the chapter to get the price (fallback to default 0.06 for GoPlausible indexer probe)
  let chapterPrice = 0.06;
  try {
    // @ts-ignore
    const chapter = await Chapter.findById(chapterId);
    if (chapter && typeof chapter.price === "number") {
      chapterPrice = chapter.price;
    }
  } catch {
    chapterPrice = 0.06;
  }

  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "");
  const isLocal = !forwardedHost || forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1");
  const publicOrigin = env.PUBLIC_BACKEND_URL || "https://sikho-ai.onrender.com";
  const baseOrigin = isLocal ? publicOrigin : `${forwardedProto}://${forwardedHost}`;
  
  // Use static base URL for GoPlausible cataloging to prevent endpoint multiplication
  const resourceUrl = `${baseOrigin}/api/v1/learners/chapters/unlock`;
  const paymentRequired = buildPaymentRequired(chapterId, chapterPrice, resourceUrl);

  const paymentHeader = (req.headers["x-payment"] || req.headers["payment-signature"]) as string | undefined;

  // No payment header → return 402 with payment requirements (accessible publicly for crawlers/Bazaar)
  if (!paymentHeader) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE");
    res.setHeader("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequired as any));
    return res.status(402).json(paymentRequired);
  }

  // Payment header present → verify it with the facilitator
  logger.info(`Verifying X402 payment for chapter ${chapterId}`);
  const { transactionHash } = await verifyX402Payment(paymentHeader, paymentRequired);

  // After settlement succeeds, require an authenticated learner to record the purchase.
  await new Promise<void>((resolve, reject) => {
    authenticate(req as any, res, (err) => {
      if (err) return reject(err);
      requireLearner(req as any, res, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });

  const userId = (req as any).user._id;

  // Create purchase record and mark chapter as unlocked
  const purchase = await unlockChapterService(userId, chapterId, transactionHash);

  logger.info(`Chapter ${chapterId} unlocked via X402. TxHash: ${transactionHash}`);
  return sendSuccessResponse(res, { purchase, transactionHash }, "Chapter unlocked successfully");
});
