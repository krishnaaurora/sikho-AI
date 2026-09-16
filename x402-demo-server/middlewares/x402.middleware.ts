import { Request, Response, NextFunction } from "express";
import { buildWorkspacePaymentRequired, verifyX402Payment, PaidEndpointConfig, ALGORAND_MAINNET_CAIP2 } from "../services/payment";
// @ts-ignore
import { encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import X402Transaction from "../models/X402Transaction.model";

export { PaidEndpointConfig };

/**
 * Express middleware that intercepts requests and enforces pay-per-use constraints.
 * 
 * - Checks for payment signatures via X-PAYMENT or PAYMENT-SIGNATURE headers.
 * - If missing, yields HTTP 402 with x402 resource metadata structure.
 * - If present, verifies transaction settlement with GoPlausible facilitator.
 */
export const enforceWorkspacePayment = (config: PaidEndpointConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = (
      req.headers["payment-signature"] ||
      req.headers["x-payment"] ||
      (typeof req.headers["authorization"] === "string" && req.headers["authorization"].startsWith("x402 ")
        ? req.headers["authorization"].slice(5)
        : undefined)
    ) as string | undefined;

    logger.info(`[x402] ${req.method} ${req.originalUrl || req.path} - PaymentHeader: ${paymentHeader ? 'PRESENT (' + paymentHeader.substring(0, 15) + '...)' : 'MISSING'}`);

    // Stable catalog URL: strictly canonicalize paths to prevent duplicate entries in GoPlausible facilitator
    let rawPath = String(req.originalUrl || req.path).split("?")[0].replace(/\/+$/, "");
    if (!rawPath.startsWith("/api/v1")) {
      if (rawPath.startsWith("/api/")) {
        rawPath = rawPath.replace(/^\/api/, "/api/v1");
      } else {
        rawPath = `/api/v1${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
      }
    }
    // Normalize parameter segments: e.g. /api/v1/resume/:id/quality -> /api/v1/resume/quality
    const cleanPath = rawPath
      .replace(/\/resume\/[^/]+\/quality/i, "/resume/quality")
      .replace(/\/resume\/[^/]+\/career-fit/i, "/resume/career-fit")
      .replace(/\/resume\/[^/]+\/intent/i, "/resume/intent")
      .replace(/\/learners\/chapters\/[^/]+\/unlock/i, "/learners/chapters/unlock")
      .replace(/\/[a-f\d]{24}/gi, "");

    // Canonical public origin: always associate with merchant domain sikho-ai.onrender.com
    const publicOrigin = env.PUBLIC_BACKEND_URL || "https://sikho-ai.onrender.com";
    const requestUrl = `${publicOrigin}${cleanPath}`;

    // Derive service identity and unique operation resource targets
    let serviceId = "job_analysis";
    if (config.description.toLowerCase().includes("visual") || cleanPath.includes("visual-explainer")) {
      serviceId = "visual_explainer";
    } else if (cleanPath.includes("interview-prep") || config.description.toLowerCase().includes("interview prep") || config.description.toLowerCase().includes("adaptive technical interview")) {
      serviceId = "interview_prep";
    } else if (config.description.toLowerCase().includes("interview")) {
      serviceId = "interview_questions";
    } else if (config.description.toLowerCase().includes("learning")) {
      serviceId = "learning_path";
    } else if (config.description.toLowerCase().includes("study")) {
      serviceId = "study_resources";
    } else if (config.description.toLowerCase().includes("improvement")) {
      serviceId = "resume_improvement";
    } else if (config.description.toLowerCase().includes("project")) {
      serviceId = "project_generation";
    } else if (config.description.toLowerCase().includes("job discovery") || config.description.toLowerCase().includes("find-jobs") || config.description.toLowerCase().includes("exploration")) {
      serviceId = "job_discovery";
    }

    const resourceId = req.params?.jobId || req.params?.resumeId || req.body?.jobId || req.body?.resumeId || req.path;
    const userId = (req as any).user?._id?.toString() || "user_01";

    // Build requirement metadata mapping
    const paymentRequired = buildWorkspacePaymentRequired(
      cleanPath,
      config.priceUsd,
      config.description,
      requestUrl,
      req.method,
      config
    );

    // Allow complete payment bypass in development/demo mode if explicitly configured
    if (process.env.BYPASS_PAYMENT === "true") {
      logger.info(`[x402 Bypass] BYPASS_PAYMENT is enabled. Bypassing payment verification for ${req.path}.`);
      await X402Transaction.create({
        userId,
        serviceId,
        resourceId,
        amount: config.priceUsd,
        currency: "USDC",
        walletAddress: "BYPASS_WALLET_ADDRESS",
        txHash: `bypass_tx_${Date.now()}`,
        status: "Success"
      }).catch(() => {});
      return next();
    }

    // No payment header → yield 402
    if (!paymentHeader) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      res.setHeader("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequired as any));
      res.status(402).json(paymentRequired);
      return;
    }

    // Allow mock payment signatures for demo/testing
    if (paymentHeader === "mock_payment" || paymentHeader?.startsWith("mock_")) {
      logger.info(`[x402 Mock Bypass] Mock payment header detected. Bypassing facilitator verification for ${req.path}.`);
      await X402Transaction.create({
        userId,
        serviceId,
        resourceId,
        amount: config.priceUsd,
        currency: "USDC",
        walletAddress: "MOCK_WALLET_ADDRESS",
        txHash: `mock_tx_${Date.now()}`,
        status: "Success"
      });
      return next();
    }

    try {
      logger.info(`Verifying pay-per-use x402 payment for endpoint ${req.path} (USDC ${config.priceUsd})`);
      // Verify payment with GoPlausible facilitator
      const { transactionHash, payer } = await verifyX402Payment(paymentHeader, paymentRequired);
      logger.info(`✓ x402 payment verified successfully for ${req.path} (tx: ${transactionHash})`);

      // Set payment response headers required by x402 client
      const paymentResponseObj = {
        success: true,
        transaction: transactionHash,
        payer,
        network: ALGORAND_MAINNET_CAIP2,
      };
      const encodedPaymentResponse = encodePaymentResponseHeader
        ? encodePaymentResponseHeader(paymentResponseObj as any)
        : Buffer.from(JSON.stringify(paymentResponseObj)).toString("base64");

      res.setHeader("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-RESPONSE, PAYMENT-REQUIRED");
      res.setHeader("X-PAYMENT-RESPONSE", encodedPaymentResponse);
      res.setHeader("PAYMENT-RESPONSE", encodedPaymentResponse);

      // Log transaction as settled to enforce future idempotency check approvals
      await X402Transaction.create({
        userId,
        serviceId,
        resourceId,
        amount: config.priceUsd,
        currency: "USDC",
        walletAddress: payer || "0xPayerWalletAddress",
        txHash: transactionHash || `tx_${Date.now()}`,
        status: "Success"
      });

      next();
    } catch (err: any) {
      logger.error(`x402 payment verification failed: ${err.message}`);
      res.status(402).json({
        success: false,
        error: "Payment verification failed",
        reason: err.message
      });
    }
  };
};
