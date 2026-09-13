import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccessResponse } from "../utils/response";
import {
  discoverRepository,
  getSikhoChallengeForFile,
  recordSikhoPaymentForFile,
  getPrismChallengeForFile,
  submitPrismReviewWithSignature,
  executeFileReviewWithPayment,
  aggregateRepositoryReview,
  retrySingleFileReview,
} from "../services/repositoryReview.service";
import RepositoryReview from "../models/RepositoryReview.model";
import RepositoryFileReview from "../models/RepositoryFileReview.model";

export const discover = asyncHandler(async (req: Request, res: Response) => {
  const { repoUrl, maxFiles } = req.body;
  const userId = (req as any).user?._id?.toString() || req.body.userId || "user_guest";

  if (!repoUrl) {
    return res.status(400).json({
      success: false,
      message: "repoUrl is required (e.g., https://github.com/owner/repository).",
    });
  }

  const result = await discoverRepository(
    repoUrl,
    userId,
    maxFiles ? Number(maxFiles) : undefined
  );

  sendSuccessResponse(
    res,
    {
      reviewId: result.review.reviewId,
      owner: result.review.owner,
      repository: result.review.repository,
      repoUrl: result.review.repoUrl,
      defaultBranch: result.review.branch,
      commitSha: result.review.commitSha,
      reviewableFileCount: result.review.fileCount,
      prismPricePerFile: result.review.prismPricePerFile,
      platformFeePerFile: result.review.platformFeePerFile,
      userPricePerFile: result.review.userPricePerFile,
      providerTotal: result.review.providerTotal,
      platformFeeTotal: result.review.platformFeeTotal,
      userTotal: result.review.userTotal,
      status: result.review.status,
      files: result.files.map((f) => ({
        fileReviewId: f.fileReviewId,
        filePath: f.filePath,
        language: f.language,
        size: f.size,
        status: f.status,
        sikhoPaymentStatus: f.sikhoPaymentStatus,
        sikhoPaymentTxId: f.sikhoPaymentTxId,
        prismPaymentStatus: f.prismPaymentStatus,
        prismPaymentTxId: f.prismPaymentTxId,
      })),
    },
    "Repository discovered and reviewable files parsed successfully",
    200
  );
});

/**
 * Step 1: Sikho AI x402 Protocol Endpoint ($0.05 USDC / 50,000 micro-USDC)
 * - If called without Payment-Signature: Returns HTTP 402 + Payment-Required header
 * - If called with Payment-Signature: Verifies payment on-chain, records fee, returns HTTP 200 + Payment-Response header
 */
export const handleSikhoX402Payment = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  if (!reviewId || !fileId) {
    return res.status(400).json({
      success: false,
      message: "reviewId and fileId are required.",
    });
  }

  const paymentSignature = (
    req.headers["payment-signature"] ||
    req.headers["x-payment"] ||
    req.body?.paymentSignature ||
    req.body?.sikhoPaymentTxId
  ) as string | undefined;

  const senderAddress = (
    req.headers["x-payer"] ||
    req.body?.sender ||
    req.body?.senderAddress
  ) as string | undefined;

  // Case 1: No Payment-Signature Header -> Yield HTTP 402 Challenge
  if (!paymentSignature || paymentSignature.trim().length === 0) {
    const challenge = await getSikhoChallengeForFile(reviewId, fileId);
    const encodedRequired = Buffer.from(JSON.stringify(challenge)).toString("base64");

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE"
    );
    res.setHeader("PAYMENT-REQUIRED", encodedRequired);
    return res.status(402).json(challenge);
  }

  // Case 2: Payment-Signature Header Present -> Verify, Settle & Yield HTTP 200
  const result = await recordSikhoPaymentForFile(
    reviewId,
    fileId,
    paymentSignature,
    senderAddress
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "X-PAYMENT-RESPONSE, PAYMENT-RESPONSE, PAYMENT-REQUIRED"
  );
  res.setHeader("PAYMENT-RESPONSE", result.paymentResponseHeader);
  res.setHeader("X-PAYMENT-RESPONSE", result.paymentResponseHeader);

  sendSuccessResponse(
    res,
    {
      file: result.file,
      txId: result.txId,
      paymentResponse: result.paymentResponseHeader,
    },
    "Sikho AI platform fee ($0.05) verified and settled via x402 protocol",
    200
  );
});

export const recordSikhoPayment = handleSikhoX402Payment;

export const getSikhoChallenge = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  if (!reviewId || !fileId) {
    return res.status(400).json({
      success: false,
      message: "reviewId and fileId are required.",
    });
  }

  const challenge = await getSikhoChallengeForFile(reviewId, fileId);
  const encodedRequired = Buffer.from(JSON.stringify(challenge)).toString("base64");

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE"
  );
  res.setHeader("PAYMENT-REQUIRED", encodedRequired);

  sendSuccessResponse(
    res,
    challenge,
    "Sikho x402 payment challenge retrieved successfully",
    200
  );
});

/**
 * Step 2A: Fetch Prism 402 Challenge for user wallet signing
 */
export const getPrismChallenge = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  if (!reviewId || !fileId) {
    return res.status(400).json({
      success: false,
      message: "reviewId and fileId are required.",
    });
  }

  const result = await getPrismChallengeForFile(reviewId, fileId);

  res.setHeader(
    "Access-Control-Expose-Headers",
    "PAYMENT-REQUIRED, Payment-Required, PAYMENT-RESPONSE, Payment-Response, X-PAYMENT-RESPONSE, *"
  );
  if (result.paymentRequiredHeader) {
    res.setHeader("PAYMENT-REQUIRED", result.paymentRequiredHeader);
    res.setHeader("Payment-Required", result.paymentRequiredHeader);
  }

  sendSuccessResponse(
    res,
    result,
    "Prism x402 payment challenge retrieved successfully",
    200
  );
});

/**
 * Step 2B: Submit User's Signed x402 Payment-Signature & Execute Real Prism Code Review
 */
export const submitPrismReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  const { paymentSignature, prismPaymentTxId } = req.body;

  if (!reviewId || !fileId || !paymentSignature) {
    return res.status(400).json({
      success: false,
      message: "reviewId, fileId, and paymentSignature are required.",
    });
  }

  const result = await submitPrismReviewWithSignature(
    reviewId,
    fileId,
    paymentSignature,
    prismPaymentTxId
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "PAYMENT-RESPONSE, Payment-Response, X-PAYMENT-RESPONSE, *"
  );
  if (result.prismPaymentResponse) {
    res.setHeader("PAYMENT-RESPONSE", result.prismPaymentResponse);
    res.setHeader("Payment-Response", result.prismPaymentResponse);
    res.setHeader("X-PAYMENT-RESPONSE", result.prismPaymentResponse);
  }

  sendSuccessResponse(
    res,
    { file: result },
    "Prism x402 code review executed and settled successfully",
    200
  );
});

/**
 * Unified single file review handler
 */
export const reviewSingleFile = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  const { sikhoPaymentTxId, userPaymentTxId, paymentSignature, prismPaymentTxId } = req.body;

  const result = await executeFileReviewWithPayment(
    reviewId,
    fileId,
    sikhoPaymentTxId || userPaymentTxId,
    paymentSignature,
    prismPaymentTxId
  );

  sendSuccessResponse(
    res,
    { file: result },
    "File review executed and verified successfully",
    200
  );
});

export const start = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.body;
  const review = await RepositoryReview.findOne({ reviewId });
  sendSuccessResponse(
    res,
    review,
    "Repository review session initialized",
    200
  );
});

export const getReviewStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewId: string =
      typeof req.params.reviewId === "string"
        ? req.params.reviewId
        : Array.isArray(req.params.reviewId)
        ? req.params.reviewId[0]
        : "";

    const review = await RepositoryReview.findOne({ reviewId });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Repository review not found." });
    }

    const files = await RepositoryFileReview.find({
      repositoryReviewId: reviewId,
    }).sort({ filePath: 1 });

    sendSuccessResponse(
      res,
      {
        review,
        files,
      },
      "Repository review status retrieved successfully"
    );
  }
);

export const getReviewFiles = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewId: string =
      typeof req.params.reviewId === "string"
        ? req.params.reviewId
        : Array.isArray(req.params.reviewId)
        ? req.params.reviewId[0]
        : "";

    const files = await RepositoryFileReview.find({
      repositoryReviewId: reviewId,
    }).sort({ filePath: 1 });

    sendSuccessResponse(res, files, "Repository review files retrieved successfully");
  }
);

export const retryFile = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : Array.isArray(req.params.reviewId)
      ? req.params.reviewId[0]
      : "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : Array.isArray(req.params.fileId)
      ? req.params.fileId[0]
      : "";

  const { sikhoPaymentTxId, paymentSignature, prismPaymentTxId } = req.body;

  if (!reviewId || !fileId) {
    return res
      .status(400)
      .json({ success: false, message: "reviewId and fileId are required." });
  }

  const updatedFile = await retrySingleFileReview(
    reviewId,
    fileId,
    sikhoPaymentTxId,
    paymentSignature,
    prismPaymentTxId
  );

  sendSuccessResponse(
    res,
    { file: updatedFile },
    "File review retry executed successfully",
    200
  );
});
