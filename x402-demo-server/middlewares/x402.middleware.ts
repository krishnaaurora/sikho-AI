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

    const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
    const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "");
    // Stable catalog URL: drop query string and Mongo ObjectIds so GoPlausible
    // does not register a new resource per resumeId / jobId / probe.
    const cleanPath = String(req.originalUrl || req.path)
      .split("?")[0]
      .replace(/\/[a-f\d]{24}/gi, "");

    // Canonical public origin for GoPlausible cataloging:
    // GoPlausible groups resources by merchant domain (e.g. sikho-ai.onrender.com).
    // If running locally, route to https://sikho-ai.onrender.com so the facilitator
    // associates this resource under merchant c2e058960979f0f2.
    const publicOrigin = env.PUBLIC_BACKEND_URL || "https://sikho-ai.onrender.com";
    const isLocal = !forwardedHost || forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1");
    const baseOrigin = isLocal ? publicOrigin : `${forwardedProto}://${forwardedHost}`;
    const requestUrl = `${baseOrigin}${cleanPath}`;

    // Derive service identity and unique operation resource targets
    let serviceId = "job_analysis";
    if (config.description.toLowerCase().includes("interview")) {
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
