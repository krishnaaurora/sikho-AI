import { env } from "../../config/env";
import { ALGORAND_MAINNET_CAIP2, USDC_MAINNET_ASA_ID, usdToUSDCAtomicStr } from "./index";
// @ts-ignore
import { declareDiscoveryExtension } from "@x402-avm/extensions/bazaar";

export interface PaidEndpointConfig {
  priceUsd: number;
  description: string;
  discoveryInput?: Record<string, unknown>;
  discoveryInputSchema?: Record<string, unknown>;
  discoveryOutputExample?: unknown;
  discoveryOutputSchema?: Record<string, unknown>;
  mimeType?: string;
}

/**
 * Stamp the Bazaar discovery extension with the actual HTTP method.
 *
 * Official x402 adapters do this via bazaarResourceServerExtension.enrichDeclaration.
 * This Express server does not use that adapter, so the facilitator otherwise
 * catalogs the resource with a missing method (dashboard shows no GET/POST).
 */
function enrichDiscoveryMethod(discoveryExtension: any, method: string) {
  const upper = (method || "GET").toUpperCase();
  if (discoveryExtension?.bazaar?.info?.input) {
    discoveryExtension.bazaar.info.input.method = upper;
  }
  const inputProps = discoveryExtension?.bazaar?.schema?.properties?.input?.properties as any;
  if (inputProps?.method) {
    inputProps.method.enum = [upper];
  }
  const inputSchema = discoveryExtension?.bazaar?.schema?.properties?.input;
  if (inputSchema) {
    const reqs = (inputSchema.required as string[]) || [];
    if (!reqs.includes("method")) {
      inputSchema.required = [...reqs, "method"];
    }
  }
  return discoveryExtension;
}

/**
 * Builds generic x402 Payment Required metadata for workspace micro-transactions.
 */
export function buildWorkspacePaymentRequired(
  endpointPath: string,
  priceUsd: number,
  description: string,
  requestUrl: string,
  method: string = "GET",
  config?: Partial<PaidEndpointConfig>
): object {
  const payTo = env.AVM_ADDRESS;
  const amountStr = usdToUSDCAtomicStr(priceUsd);
  const upper = (method || "GET").toUpperCase();
  const isBody = upper === "POST" || upper === "PUT" || upper === "PATCH";
  const formattedPrice = priceUsd >= 0.01 ? priceUsd.toFixed(2) : priceUsd.toFixed(3);

  const inputExample = config?.discoveryInput || (isBody ? {} : {});
  const inputSchema = config?.discoveryInputSchema || {
    type: "object",
    properties: {},
    required: [],
  };
  const outputExample = config?.discoveryOutputExample || {
    success: true,
    message: "Payment settled and resource unlocked successfully",
  };

  // Discovery details for GoPlausible Indexer and Bazaar crawlers.
  // GET/HEAD/DELETE → query extension (method enum GET/HEAD/DELETE).
  // POST/PUT/PATCH → body extension (method enum POST/PUT/PATCH).
  const discoveryExtension = enrichDiscoveryMethod(
    declareDiscoveryExtension(
      (isBody
        ? {
            method: upper as "POST" | "PUT" | "PATCH",
            bodyType: "json" as const,
            input: inputExample,
            inputSchema: inputSchema,
            output: {
              example: outputExample,
              ...(config?.discoveryOutputSchema ? { schema: config.discoveryOutputSchema } : {}),
            },
          }
        : {
            method: upper as "GET" | "HEAD" | "DELETE",
            input: inputExample,
            inputSchema: inputSchema,
            output: {
              example: outputExample,
              ...(config?.discoveryOutputSchema ? { schema: config.discoveryOutputSchema } : {}),
            },
          }) as any
    ),
    upper
  );

  return {
    x402Version: 2,
    error: "Payment Required",
    resource: {
      url: requestUrl,
      description: `${description} for $${formattedPrice} USDC`,
      mimeType: config?.mimeType || "application/json",
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
        description: `${description} for $${formattedPrice} USDC`,
        maxTimeoutSeconds: 300,
      },
    ],
    extensions: {
      ...discoveryExtension,
    },
  };
}
