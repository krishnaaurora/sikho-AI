import { Request, Response, NextFunction } from "express";
import { buildWorkspacePaymentRequired, verifyX402Payment, PaidEndpointConfig } from "../services/payment";
// @ts-ignore
import { encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import X402Transaction from "../models/X402Transaction.model";

export { PaidEndpointConfig };

/**
 * Express middleware that intercepts requests and enforces pay-per-use constraints.
 *
 * Full x402 lifecycle:
 *   1. Request arrives without payment header → return HTTP 402 with PAYMENT-REQUIRED
 *   2. Client (x402Fetch) parses 402, constructs & signs transaction, submits it
 *   3. Client retries the SAME request with X-PAYMENT or PAYMENT-SIGNATURE header
 *   4. Middleware decodes header, calls GoPlausible facilitator /settle
 *   5. Facilitator verifies on-chain confirmation, amount, asset, payTo, network
 *   6. On success → call next() to serve the protected resource
 *   7. On failure → return HTTP 402 with specific failure reason
 *
 * Checks for payment signatures via X-PAYMENT, PAYMENT-SIGNATURE, or Authorization: x402 <token> headers.
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

    // ─── STRUCTURED DEBUG LOGGING ─────────────────────────────────────────────
    logger.info(`[x402][PAYMENT_REQUIRED] ${req.method} ${req.originalUrl || req.path}`);
    logger.info(`[x402][PAYMENT_REQUIRED] amount=$${config.priceUsd} USDC | description=${config.description}`);
    logger.info(`[x402][PAYMENT_REQUIRED] payTo=${env.X402_PAY_TO} | asset=${env.X402_ASSET} | network=${env.X402_NETWORK}`);
    logger.info(`[x402][PAYMENT_REQUIRED] facilitator=${env.X402_FACILITATOR_URL || env.FACILITATOR_URL}`);
    logger.info(`[x402][WALLET] payment header present: ${paymentHeader ? "YES (token: " + paymentHeader.substring(0, 20) + "...)" : "NO"}`);

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

    // Canonical public origin: always associate with merchant domain sikho-ai-im1v.onrender.com
    const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "");
    const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "https");
    const isLocal = !forwardedHost || forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1");
    const publicOrigin = isLocal ? env.PUBLIC_BACKEND_URL : `${forwardedProto}://${forwardedHost}`;
    const requestUrl = `${publicOrigin}${cleanPath}`;

    logger.info(`[x402][PAYMENT_REQUIRED] resource URL: ${requestUrl}`);

    // Derive service identity and unique operation resource targets
    let serviceId = "job_analysis";
    if (config.description.toLowerCase().includes("download") || cleanPath.includes("download-resume")) {
      serviceId = "download_resume";
    } else if (config.description.toLowerCase().includes("visual") || cleanPath.includes("visual-explainer")) {
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
      logger.warn(`[x402][BYPASS] BYPASS_PAYMENT=true. Skipping payment verification for ${req.path}.`);
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

    // No payment header → yield 402 with full x402 payment-required payload
    if (!paymentHeader) {
      logger.info(`[x402][PAYMENT_REQUIRED] No payment header found — returning HTTP 402 challenge`);
      logger.info(`[x402][PAYMENT_REQUIRED] amount_micro_usdc=${Math.round(config.priceUsd * 1_000_000)} | payTo=${env.X402_PAY_TO}`);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      res.setHeader("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequired as any));
      res.status(402).json(paymentRequired);
      return;
    }

    try {
      logger.info(`[x402][VERIFICATION] Verifying x402 payment for ${req.path} (priceUsd=${config.priceUsd})`);
      logger.info(`[x402][VERIFICATION] Decoding payment header (first 40 chars): ${paymentHeader.substring(0, 40)}...`);

      // Verify payment with GoPlausible facilitator — this checks on-chain:
      //   sender = user wallet, receiver = X402_PAY_TO, asset = X402_ASSET (USDC),
      //   amount = exact micro-USDC, network = X402_NETWORK, confirmation status
      const { transactionHash, payer } = await verifyX402Payment(paymentHeader, paymentRequired);

      logger.info(`[x402][VERIFICATION] ✓ Payment verified successfully`);
      logger.info(`[x402][VERIFICATION] transactionHash=${transactionHash}`);
      logger.info(`[x402][VERIFICATION] payer=${payer}`);
      logger.info(`[x402][DOWNLOAD] Authorized — serving protected resource for ${req.path}`);

      // Set payment response headers required by x402 client
      const paymentResponseObj = {
        success: true,
        transaction: transactionHash,
        payer,
        network: env.X402_NETWORK,
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
        walletAddress: payer || "unknown_payer",
        txHash: transactionHash || `tx_${Date.now()}`,
        status: "Success"
      });

      next();
    } catch (err: any) {
      // Extract transaction hash from the payment header for useful error reporting
      let txHashForError = "unknown";
      try {
        const decoded = Buffer.from(
          paymentHeader.startsWith("eyJ") || !paymentHeader.includes("{")
            ? paymentHeader
            : Buffer.from(paymentHeader).toString("base64"),
          "base64"
        ).toString("utf-8");
        const parsed = JSON.parse(decoded);
        const inner = parsed?.payload;
        if (inner?.paymentGroup && Array.isArray(inner.paymentGroup)) {
          txHashForError = `group[${inner.paymentGroup.length} txns, index ${inner.paymentIndex}]`;
        }
      } catch (_) {
        // ignore parse errors in error path
      }

      const reason = err?.message || "Unknown verification error";
      logger.error(`[x402][VERIFICATION] ✗ Payment verification FAILED`);
      logger.error(`[x402][VERIFICATION] transactionRef=${txHashForError}`);
      logger.error(`[x402][VERIFICATION] reason=${reason}`);
      logger.error(`[x402][VERIFICATION] facilitator=${env.X402_FACILITATOR_URL || env.FACILITATOR_URL}`);
      logger.error(`[x402][VERIFICATION] expected: payTo=${env.X402_PAY_TO}, asset=${env.X402_ASSET}, network=${env.X402_NETWORK}, amount=${Math.round(config.priceUsd * 1_000_000)} micro-USDC`);

      // Return a useful error response — not a generic message
      res.status(402).json({
        success: false,
        error: "Payment verification failed",
        transactionRef: txHashForError,
        reason,
        expected: {
          payTo: env.X402_PAY_TO,
          asset: env.X402_ASSET,
          network: env.X402_NETWORK,
          amountMicroUSDC: Math.round(config.priceUsd * 1_000_000),
          amountUSD: config.priceUsd,
          facilitator: env.X402_FACILITATOR_URL || env.FACILITATOR_URL
        },
        hint: "If the transaction was just submitted, the network may not have confirmed it yet. Retry after ~5 seconds."
      });
    }
  };
};
