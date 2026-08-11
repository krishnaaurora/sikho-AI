
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

// @ts-ignore — @x402/core/http types may not be declared
let decodePaymentSignatureHeader: (header: string) => any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  decodePaymentSignatureHeader = require("@x402/core/http").decodePaymentSignatureHeader;
} catch (e) {
  logger.warn("@x402/core/http not available, will forward raw header to facilitator");
  decodePaymentSignatureHeader = (header: string) => header;
}import { declareDiscoveryExtension } from "@x402-avm/extensions/bazaar";

/** CAIP-2 for Algorand MainNet */
const ALGORAND_MAINNET_CAIP2 =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";

/** USDC ASA on Algorand MainNet */
const USDC_MAINNET_ASA_ID = "31566704";

/** Decimal places for USDC */
const USDC_DECIMALS = 6;

/**
 * Convert a USD dollar amount (e.g. 0.02) to USDC micro-units string.
 */
function usdToUSDCAtomicStr(usd: number): string {
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
