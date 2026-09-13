import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccessResponse } from "../utils/response";
import {
  discoverRepository,
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
      })),
    },
    "Repository discovered and reviewable files parsed successfully",
    200
  );
});

export const reviewSingleFile = asyncHandler(async (req: Request, res: Response) => {
  const reviewId: string =
    typeof req.params.reviewId === "string"
      ? req.params.reviewId
      : req.body.reviewId || "";

  const fileId: string =
    typeof req.params.fileId === "string"
      ? req.params.fileId
      : req.body.fileId || "";

  const { userPaymentTxId } = req.body;

  if (!reviewId || !fileId || !userPaymentTxId) {
    return res.status(400).json({
      success: false,
      message: "reviewId, fileId, and userPaymentTxId are required for per-file review.",
    });
  }

  const result = await executeFileReviewWithPayment(reviewId, fileId, userPaymentTxId);

  sendSuccessResponse(
    res,
    { file: result },
    "File review executed and verified successfully",
    200
  );
});

export const start = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId, fileId, userPaymentTxId } = req.body;

  if (fileId && userPaymentTxId) {
    const result = await executeFileReviewWithPayment(reviewId, fileId, userPaymentTxId);
    return sendSuccessResponse(
      res,
      { file: result },
      "File review executed and verified successfully",
      200
    );
  }

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

  if (!reviewId || !fileId) {
    return res
      .status(400)
      .json({ success: false, message: "reviewId and fileId are required." });
  }

  const updatedFile = await retrySingleFileReview(reviewId, fileId);

  sendSuccessResponse(
    res,
    updatedFile,
    "File review retry executed successfully",
    200
  );
});
