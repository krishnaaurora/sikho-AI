import { Request, Response, NextFunction } from "express";
import { buildWorkspacePaymentRequired, verifyX402Payment, PaidEndpointConfig } from "../services/payment";
// @ts-ignore
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { logger } from "../utils/logger";
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
    const paymentHeader = (req.headers["x-payment"] || req.headers["payment-signature"]) as string | undefined;

    const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
    const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "");
    // Stable catalog URL: drop query string and Mongo ObjectIds so GoPlausible
    // does not register a new resource per resumeId / jobId / probe.
    const cleanPath = String(req.originalUrl || req.path)
      .split("?")[0]
      .replace(/\/[a-f\d]{24}/gi, "");
    const requestUrl = `${forwardedProto}://${forwardedHost}${cleanPath}`;

    // Derive service identity and unique operation resource targets
    let serviceId = "job_analysis";
    if (config.description.toLowerCase().includes("improvement")) {
      serviceId = "resume_improvement";
    } else if (config.description.toLowerCase().includes("project")) {
      serviceId = "project_generation";
    } else if (config.description.toLowerCase().includes("job discovery") || config.description.toLowerCase().includes("find-jobs") || config.description.toLowerCase().includes("exploration")) {
      serviceId = "job_discovery";
    }

    const resourceId = req.params.jobId || req.params.resumeId || req.body.jobId || req.body.resumeId || req.path;
    const userId = (req as any).user?._id?.toString() || "user_01";

    // ─── Idempotency Check ───
    try {
      const existingTx = await X402Transaction.findOne({
        userId,
        serviceId,
        resourceId,
        status: "Success"
      });

      if (existingTx) {
        logger.info(`✓ Idempotency Check: Existing transaction found for user=${userId} service=${serviceId} resource=${resourceId}. Bypassing payment.`);
        return next();
      }
    } catch (dbErr: any) {
      logger.warn(`Idempotency database lookup failed, continuing checkout workflow: ${dbErr.message}`);
    }

    // Build requirement metadata mapping
    const paymentRequired = buildWorkspacePaymentRequired(
      cleanPath,
      config.priceUsd,
      config.description,
      requestUrl,
      req.method,
      config
    );

    // Allow complete payment bypass in development/demo mode if configured
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
      logger.info(`✓ x402 payment verified successfully for ${req.path}`);

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
        message: err.message,
        reason: err.message
      });
    }
  };
};
