import crypto from "crypto";
import PlatformFeeTransaction, {
  IPlatformFeeTransaction,
} from "../models/PlatformFeeTransaction.model";
import RepositoryReview from "../models/RepositoryReview.model";
import RepositoryFileReview from "../models/RepositoryFileReview.model";
import { logger } from "../utils/logger";

export interface ProcessPlatformFeeInput {
  reviewId: string;
  fileId: string;
  filePath?: string;
  amount?: number; // micro-USDC
  currency?: string;
  assetId?: string;
  network?: string;
  purpose?: string;
}

export interface ProcessPlatformFeeResult {
  success: boolean;
  platformFeeTransactionId: string;
  amount: number;
  currency: string;
  assetId: string;
  network: string;
  status: "completed" | "failed";
  timestamp: Date;
  isIdempotentReplay?: boolean;
}

const EXPECTED_PLATFORM_FEE_MICRO_USDC = 50000; // $0.05 USDC

/**
 * Executes and records an authoritative Sikho platform-fee ledger operation.
 * Enforces per-file charging, exact amount validation ($0.05), and strict idempotency.
 */
export async function processPlatformFee(
  input: ProcessPlatformFeeInput
): Promise<ProcessPlatformFeeResult> {
  const {
    reviewId,
    fileId,
    filePath,
    amount = EXPECTED_PLATFORM_FEE_MICRO_USDC,
    currency = "USDC",
    assetId = "31566704",
    network = "Algorand MainNet",
    purpose = "github_code_review_platform_fee",
  } = input;

  if (!reviewId || !fileId) {
    throw new Error("reviewId and fileId are required for platform fee processing.");
  }

  // 1. Validate fee amount is strictly 50,000 micro-USDC ($0.05)
  if (amount !== EXPECTED_PLATFORM_FEE_MICRO_USDC) {
    throw new Error(
      `Invalid platform fee amount: expected ${EXPECTED_PLATFORM_FEE_MICRO_USDC} micro-USDC ($0.05), received ${amount}.`
    );
  }

  // 2. Check Idempotency: Has this file already been charged?
  const existingFee = await PlatformFeeTransaction.findOne({
    reviewId,
    fileId,
  });

  if (existingFee && existingFee.status === "completed") {
    logger.info(
      `[Platform Fee] Idempotent hit: Platform fee already settled for ${reviewId}:${fileId} (Ref: ${existingFee.feeTransactionId})`
    );
    return {
      success: true,
      platformFeeTransactionId: existingFee.feeTransactionId,
      amount: existingFee.amount,
      currency: existingFee.currency,
      assetId: existingFee.assetId,
      network: existingFee.network,
      status: "completed",
      timestamp: existingFee.timestamp,
      isIdempotentReplay: true,
    };
  }

  // 3. Verify parent review and file existence
  const parentReview = await RepositoryReview.findOne({ reviewId });
  if (!parentReview) {
    throw new Error(`Repository review "${reviewId}" does not exist.`);
  }

  const fileDoc = await RepositoryFileReview.findOne({
    $or: [{ fileReviewId: fileId }, { repositoryReviewId: reviewId, filePath }],
  });

  // 4. Generate unique ledger reference ID
  const feeTransactionId = `fee_ref_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // 5. Record Platform Fee Ledger Transaction
  const feeDoc = await PlatformFeeTransaction.create({
    feeTransactionId,
    reviewId,
    fileId,
    filePath: filePath || fileDoc?.filePath || "unknown_file",
    amount,
    currency,
    assetId,
    network,
    purpose,
    status: "completed",
    timestamp: new Date(),
  });

  // 6. Update File Review State
  if (fileDoc) {
    fileDoc.platformFeeStatus = "completed";
    fileDoc.platformFeeTransactionId = feeTransactionId;
    fileDoc.platformFeeAmount = amount;
    await fileDoc.save();
  }

  logger.info(
    `[Platform Fee] Logged $0.05 platform fee for file ${fileId} in review ${reviewId} -> Ref: ${feeTransactionId}`
  );

  return {
    success: true,
    platformFeeTransactionId: feeDoc.feeTransactionId,
    amount: feeDoc.amount,
    currency: feeDoc.currency,
    assetId: feeDoc.assetId,
    network: feeDoc.network,
    status: "completed",
    timestamp: feeDoc.timestamp,
  };
}
