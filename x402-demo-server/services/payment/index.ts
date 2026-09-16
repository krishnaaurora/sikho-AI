
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

/**
 * Validates the structure of an x402 V2 PaymentPayload object according to standard x402 V2 AVM spec.
 */
export function validatePaymentPayload(payload: any): boolean {
  if (!payload || typeof payload !== "object") {
    throw new AppError("Invalid payment payload: not an object", 400);
  }
  if (payload.x402Version !== 2) {
    throw new AppError(`Invalid x402Version: expected 2, got ${payload.x402Version}`, 400);
  }
  if (payload.scheme !== "exact") {
    throw new AppError(`Invalid scheme: expected "exact", got "${payload.scheme}"`, 400);
  }
  if (!payload.network) {
    throw new AppError("Missing network in payment payload", 400);
  }
  if (!payload.payload || typeof payload.payload !== "object") {
    throw new AppError("Missing inner payload object", 400);
  }

  const inner = payload.payload;
  if (!Array.isArray(inner.paymentGroup) || inner.paymentGroup.length === 0) {
    throw new AppError("paymentGroup must be a non-empty array of transaction strings", 400);
  }
  if (typeof inner.paymentIndex !== "number" || inner.paymentIndex < 0 || inner.paymentIndex >= inner.paymentGroup.length) {
    throw new AppError(`Invalid paymentIndex: ${inner.paymentIndex} (group size: ${inner.paymentGroup.length})`, 400);
  }

  const userTxnStr = inner.paymentGroup[inner.paymentIndex];
  if (!userTxnStr || typeof userTxnStr !== "string" || userTxnStr.length === 0) {
    throw new AppError(`User payment transaction at index ${inner.paymentIndex} is empty or invalid`, 400);
  }

  return true;
}

/**
 * Safely decodes a base64 or stringified X-PAYMENT / PAYMENT-SIGNATURE header into an x402 PaymentPayload object.
 */
export function decodePaymentSignatureHeader(header: string | object): any {
  if (typeof header === "object" && header !== null) {
    validatePaymentPayload(header);
    return header;
  }
  if (!header || typeof header !== "string") {
    throw new AppError("Invalid payment signature header: input is empty or invalid", 400);
  }

  let str = header.trim();

  // If base64 encoded JSON string
  if (str.startsWith("eyJ") || !str.includes("{")) {
    try {
      str = Buffer.from(str, "base64").toString("utf-8");
    } catch (b64Err: any) {
      throw new AppError(`Invalid payment signature header: Base64 decode failed (${b64Err.message})`, 400);
    }
  }

  try {
    const payloadObj = JSON.parse(str);
    validatePaymentPayload(payloadObj);
    return payloadObj;
  } catch (jsonErr: any) {
    if (jsonErr instanceof AppError) throw jsonErr;
    throw new AppError(`Invalid payment signature header: ${jsonErr.message}`, 400);
  }
}import { declareDiscoveryExtension } from "@x402-avm/extensions/bazaar";

/** CAIP-2 for Algorand MainNet */
export const ALGORAND_MAINNET_CAIP2 =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";

/** USDC ASA on Algorand MainNet */
export const USDC_MAINNET_ASA_ID = "31566704";

/** Decimal places for USDC */
const USDC_DECIMALS = 6;

/**
 * Convert a USD dollar amount (e.g. 0.02) to USDC micro-units string.
 */
export function usdToUSDCAtomicStr(usd: number): string {
  return Math.round(usd * Math.pow(10, USDC_DECIMALS)).toString();
}

/**
 * Build the payment-required response body that the X402 client expects.
 * Returns a structured object matching the X402 payment-required spec.
 *
 * IMPORTANT: The `resource` URL is what the GoPlausible facilitator uses to:
 *   1. Determine MERCHANT SITE domain (domain of the resource URL)
 *   2. Scrape OG tags from the domain root (logo, name, description)
 *   3. Register the URL as a known x402 endpoint (shown in RESOURCES)
 *
 * We use the public unlock endpoint URL so the facilitator can probe the real
 * x402 resource. The frontend course page is not the payment endpoint.
 */
export function buildPaymentRequired(
  chapterId: string,
  priceUsd: number,
  requestUrl: string
): object {
  const payTo = env.AVM_ADDRESS;
  const amountStr = usdToUSDCAtomicStr(priceUsd);

  // Use the actual public x402 unlock endpoint so the facilitator can catalog
  // and probe the real resource instead of the front-end SPA route.
  const resourceUrl = requestUrl;

  // Declare discovery extension for the Bazaar Discovery Extension
  const discoveryExtension = declareDiscoveryExtension({
    input: { chapterId },
    inputSchema: {
      type: "object",
      properties: {
        chapterId: { type: "string", description: "The ID of the premium course chapter to unlock" }
      },
      required: ["chapterId"]
    },
    output: {
      example: {
        success: true,
        message: "Chapter unlocked successfully",
        purchase: {
          chapterId: chapterId,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        }
      }
    }
  });

  // Manually enrich the HTTP method info since we are not registering via standard server middleware adapter
  if (discoveryExtension.bazaar?.info?.input) {
    (discoveryExtension.bazaar.info.input as any).method = "GET";
  }
  const inputProps = discoveryExtension.bazaar?.schema?.properties?.input?.properties as any;
  if (inputProps?.method) {
    inputProps.method.enum = ["GET"];
  }
  if (discoveryExtension.bazaar?.schema?.properties?.input?.required) {
    const reqs = discoveryExtension.bazaar.schema.properties.input.required as any[];
    if (!reqs.includes("method")) {
      reqs.push("method");
    }
  }

  return {
    x402Version: 2,
    error: "Payment Required",
    resource: {
      url: resourceUrl,
      description: `Unlocks one premium course chapter with AI explanations, personalized study materials, and customized quiz generation for chapter ID: ${chapterId} for $${priceUsd.toFixed(2)} USDC`,
    },
    accepts: [
      {
        scheme: "exact",
        network: ALGORAND_MAINNET_CAIP2,
        payTo,
        amount: amountStr,
        asset: USDC_MAINNET_ASA_ID,
        extra: {
          name: "USDC",
          version: "1",
          resource: resourceUrl,
          tag: "x402-global-challenge",
          discovery: true,
          category: "education",
          feePayer: "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
        },
        description: `Unlocks one premium course chapter with AI explanations, personalized study materials, and customized quiz generation for chapter ID: ${chapterId} for $${priceUsd.toFixed(2)} USDC`,
        maxTimeoutSeconds: 300,
      },
    ],
    extensions: {
      ...discoveryExtension
    }
  };
}

/**
 * Verify an X-PAYMENT header by forwarding to the GoPlausible facilitator.
 * Returns the transaction hash and payer on success, or throws on failure.
 */
export async function verifyX402Payment(
  paymentHeader: string,
  paymentRequired: object
): Promise<{ transactionHash: string; payer: string }> {
  const facilitatorUrl =
    env.FACILITATOR_URL || "https://facilitator.goplausible.xyz";

  // Decode the payment signature header — fall back to raw string if decoder unavailable
  let paymentPayload: any;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentHeader);
  } catch (decodeErr: any) {
    logger.error(`Failed to decode X-PAYMENT header: ${decodeErr?.message}`);
    throw new AppError(`Invalid payment header: ${decodeErr?.message}`, 400);
  }

  const settleBody = {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: (paymentRequired as any).accepts[0],
  };

  logger.info(`Sending to facilitator (${facilitatorUrl}/settle): ${JSON.stringify(settleBody)}`);

  let res: Response;
  try {
    res = await fetch(`${facilitatorUrl}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settleBody),
    }) as unknown as Response;
  } catch (networkErr: any) {
    logger.error(`Network error reaching facilitator: ${networkErr?.message}`);
    throw new AppError(`Cannot reach payment facilitator: ${networkErr?.message}`, 502);
  }

  const rawText = await (res as any).text();
  logger.info(`Facilitator raw response [${(res as any).status}]: ${rawText}`);

  if (!(res as any).ok) {
    throw new AppError(
      `Facilitator rejected payment (${(res as any).status}): ${rawText}`,
      402
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawText);
  } catch {
    throw new AppError(`Facilitator returned non-JSON response: ${rawText}`, 502);
  }

  if (!body.success) {
    throw new AppError(
      `Payment settlement failed: ${body.errorMessage || body.errorReason || body.error || "unknown error"}`,
      402
    );
  }

  return {
    transactionHash: body.transaction || body.txid || body.transactionId || "",
    payer: body.payer || "",
  };
}

// Placeholder service stubs for other payment routes
export const createPaymentService = async () => { };
export const getPaymentHistoryService = async () => { };
export const getPaymentByIdService = async () => { };

export { buildWorkspacePaymentRequired, PaidEndpointConfig } from "./workspacePayment";
