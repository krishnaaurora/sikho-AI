import { Request, Response, NextFunction } from "express";
import { buildWorkspacePaymentRequired, verifyX402Payment } from "../services/payment";
// @ts-ignore
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { logger } from "../utils/logger";

export interface PaidEndpointConfig {
  priceUsd: number;
  description: string;
}

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
    const requestUrl = `${forwardedProto}://${forwardedHost}${req.originalUrl}`;

    // Build requirement metadata mapping
    const paymentRequired = buildWorkspacePaymentRequired(
      req.path,
      config.priceUsd,
      config.description,
      requestUrl
    );

    // No payment header → yield 402
    if (!paymentHeader) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      res.setHeader("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequired as any));
      res.status(402).json(paymentRequired);
      return;
    }

    try {
      logger.info(`Verifying pay-per-use x402 payment for endpoint ${req.path} (USDC ${config.priceUsd})`);
      // Verify payment with GoPlausible facilitator
      await verifyX402Payment(paymentHeader, paymentRequired);
      logger.info(`✓ x402 payment verified successfully for ${req.path}`);
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
