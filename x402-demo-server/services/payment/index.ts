import { env } from "../../config/env";
// @ts-ignore
import { decodePaymentSignatureHeader } from "@x402/core/http";
import { logger } from "../../utils/logger";

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
 */
export function buildPaymentRequired(
  chapterId: string,
  priceUsd: number,
  requestUrl: string
): object {
  const payTo = env.AVM_ADDRESS;
  const amountStr = usdToUSDCAtomicStr(priceUsd);

  return {
    x402Version: 2,
    error: "Payment Required",
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
          resource: requestUrl,
          tag: "x402-global-challenge",
          discovery: true,
          category: "education",
        },
        description: `Unlocks one premium course chapter with AI explanations, personalized study materials, and customized quiz generation for chapter ID: ${chapterId} for $${priceUsd.toFixed(2)} USDC`,
        maxTimeoutSeconds: 300,
      },
    ],
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

  const paymentPayload = decodePaymentSignatureHeader(paymentHeader);

  const res = await fetch(`${facilitatorUrl}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements: (paymentRequired as any).accepts[0],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Facilitator rejected payment: ${res.status} ${text}`);
  }

  const body = (await res.json()) as any;
  logger.info(`Facilitator response: ${JSON.stringify(body)}`);

  if (!body.success) {
    throw new Error(
      `Payment settlement failed: ${body.errorMessage || body.errorReason || "unknown error"}`
    );
  }

  return {
    transactionHash: body.transaction || body.txid || "",
    payer: body.payer || "",
  };
}

// Placeholder service stubs for other payment routes
export const createPaymentService = async () => {};
export const getPaymentHistoryService = async () => {};
export const getPaymentByIdService = async () => {};
