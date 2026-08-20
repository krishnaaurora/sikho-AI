import { env } from "../../config/env";
import { ALGORAND_MAINNET_CAIP2, USDC_MAINNET_ASA_ID, usdToUSDCAtomicStr } from "./index";
// @ts-ignore
import { declareDiscoveryExtension } from "@x402-avm/extensions/bazaar";

export interface X402EndpointConfig {
  path: string;
  name: string;
  description: string;
  priceUsd: number;
}

/**
 * Builds generic x402 Payment Required metadata for workspace micro-transactions.
 */
export function buildWorkspacePaymentRequired(
  endpointPath: string,
  priceUsd: number,
  description: string,
  requestUrl: string
): object {
  const payTo = env.AVM_ADDRESS;
  const amountStr = usdToUSDCAtomicStr(priceUsd);

  // Discovery details for GoPlausible Indexer and Bazaar crawlers
  const discoveryExtension = declareDiscoveryExtension({
    input: {},
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    output: {
      example: {
        success: true,
        message: "Payment settled and resource unlocked successfully"
      }
    }
  });

  return {
    x402Version: 2,
    error: "Payment Required",
    resource: {
      url: requestUrl,
      description: `${description} for $${priceUsd.toFixed(3)} USDC`,
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
          resource: requestUrl,
          tag: "x402-global-challenge",
          discovery: true,
          category: "education",
          feePayer: "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
        },
        description: `${description} for $${priceUsd.toFixed(3)} USDC`,
        maxTimeoutSeconds: 300,
      },
    ],
    extensions: {
      ...discoveryExtension
    }
  };
}
