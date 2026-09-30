import dotenv from "dotenv";

dotenv.config();

export const ALGORAND_MAINNET_CAIP2 =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";
export const ALGORAND_TESTNET_CAIP2 =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
export const USDC_MAINNET_ASA_ID = "31566704";
export const USDC_TESTNET_ASA_ID = "10458941";

const rawNetwork = (
  process.env.X402_NETWORK ||
  process.env.ALGORAND_NETWORK ||
  process.env.NETWORK ||
  ""
).trim();
const isTestnet =
  rawNetwork.toLowerCase().includes("testnet") ||
  rawNetwork.includes("SGO1GK");
const resolvedNetwork = isTestnet
  ? ALGORAND_TESTNET_CAIP2
  : ALGORAND_MAINNET_CAIP2;
const resolvedAsset =
  process.env.X402_ASSET ||
  (isTestnet ? USDC_TESTNET_ASA_ID : USDC_MAINNET_ASA_ID);
const resolvedPayTo =
  process.env.X402_PAY_TO ||
  process.env.AVM_ADDRESS ||
  "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY";
const resolvedFacilitator =
  process.env.X402_FACILITATOR_URL ||
  process.env.FACILITATOR_URL ||
  "https://facilitator.goplausible.xyz";
const resolvedAlgodServer =
  process.env.ALGORAND_SERVER ||
  (isTestnet
    ? "https://testnet-api.algonode.cloud"
    : "https://mainnet-api.algonode.cloud");

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4021"),
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-education-platform",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-here",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key-change-this-in-production",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production",
  GROQ_API_KEYS: [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7,
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_9,
    process.env.GROQ_API_KEY_10,
    process.env.GROQ_API_KEY_11,
    process.env.GROQ_API_KEY_12,
    process.env.GROQ_API_KEY_13,
    process.env.GROQ_API_KEY_14,
    process.env.GROQ_API_KEY_15,
    process.env.GROQ_API_KEY_16,
    process.env.GROQ_API_KEY_17,
    process.env.GROQ_API_KEY_18,
    process.env.GROQ_API_KEY_19,
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_21,
    process.env.GROQ_API_KEY_22,
    process.env.GROQ_API_KEY_23,
    process.env.GROQ_API_KEY_24,
    process.env.GROQ_API_KEY_25,
    process.env.GROQ_API_KEY_26,
    process.env.GROQ_API_KEY_27,
  ].filter(Boolean) as string[],
  GROQ_INTERVIEW_PREP_KEYS: [
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_21,
    process.env.GROQ_API_KEY_22,
    process.env.GROQ_API_KEY_23,
    process.env.GROQ_API_KEY_24,
    process.env.GROQ_API_KEY_25,
    process.env.GROQ_API_KEY_26,
    process.env.GROQ_API_KEY_27,
  ].filter(Boolean) as string[],
  // ─── Resume Intelligence dedicated key pool ────────────────────
  GROQ_RESUME_KEYS: [
    process.env.GROQ_RESUME_KEY_1  || process.env.GROQ_API_KEY_1,
    process.env.GROQ_RESUME_KEY_2  || process.env.GROQ_API_KEY_2,
    process.env.GROQ_RESUME_KEY_3  || process.env.GROQ_API_KEY_3,
    process.env.GROQ_RESUME_KEY_4  || process.env.GROQ_API_KEY_4,
    process.env.GROQ_RESUME_KEY_5  || process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7,
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_9,
    process.env.GROQ_API_KEY_10,
    process.env.GROQ_API_KEY_11,
    process.env.GROQ_API_KEY_12,
    process.env.GROQ_API_KEY_13,
    process.env.GROQ_API_KEY_14,
    process.env.GROQ_API_KEY_15,
    process.env.GROQ_API_KEY_16,
    process.env.GROQ_API_KEY_17,
    process.env.GROQ_API_KEY_18,
    process.env.GROQ_API_KEY_19,
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_21,
    process.env.GROQ_API_KEY_22,
    process.env.GROQ_API_KEY_23,
    process.env.GROQ_API_KEY_24,
    process.env.GROQ_API_KEY_25,
    process.env.GROQ_API_KEY_26,
    process.env.GROQ_API_KEY_27,
  ].filter(Boolean) as string[],
  GROQ_RESUME_MODEL: process.env.GROQ_RESUME_MODEL || "openai/gpt-oss-120b",
  JSEARCH_API_KEY: process.env.JSEARCH_API_KEY || "",
  ALGORAND_API_KEY: process.env.ALGORAND_API_KEY || "",
  ALGORAND_SERVER: resolvedAlgodServer,
  X402_API_KEY: process.env.X402_API_KEY || "",
  AVM_ADDRESS: resolvedPayTo,
  FACILITATOR_URL: resolvedFacilitator,
  X402_NETWORK: resolvedNetwork,
  X402_ASSET: resolvedAsset,
  X402_PAY_TO: resolvedPayTo,
  X402_FACILITATOR_URL: resolvedFacilitator,
  IS_TESTNET: isTestnet,
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || "",
  APIFY_LINKEDIN_ACTOR: process.env.APIFY_LINKEDIN_ACTOR || "crawlworks~linkedin-jobs-scraper",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyAZTTsW72ILNQgzFkV_u_9I7vaw4Og9BYE",
  /**
   * Canonical public-facing URL for this merchant's site.
   * Used in x402 `resource` field and OG tags so the GoPlausible facilitator
   * can scrape merchant branding (logo, name, description, MERCHANT SITE domain).
   * Must be the Vercel production URL — NOT localhost.
   */
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || "https://sikho-ai-37ni.vercel.app",
  get PUBLIC_BACKEND_URL(): string {
    const raw = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || "https://sikho-ai-im1v.onrender.com";
    if (raw.includes("sikho-ai.onrender.com") && !raw.includes("sikho-ai-im1v")) {
      return "https://sikho-ai-im1v.onrender.com";
    }
    return raw;
  },
  get SIKHO_X402_ENDPOINT(): string {
    const raw = process.env.SIKHO_X402_ENDPOINT || "https://sikho-ai-im1v.onrender.com/api/v1/services/github-review/sikho-x402";
    if (raw.includes("sikho-ai.onrender.com") && !raw.includes("sikho-ai-im1v")) {
      return "https://sikho-ai-im1v.onrender.com/api/v1/services/github-review/sikho-x402";
    }
    return raw;
  },
  PRISM_ENDPOINT: process.env.PRISM_ENDPOINT || "https://prism-99h2.onrender.com/code-review-accurate",
  PRISM_PAYTO: process.env.PRISM_PAYTO || "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
  PRISM_PRICE_MICRO_USDC: parseInt(process.env.PRISM_PRICE_MICRO_USDC || "200000", 10),
  // ─── Brevo (Sendinblue) Email Configuration ──────────────────
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL || "sikhoaiedu@gmail.com",
  BREVO_FROM_NAME: process.env.BREVO_FROM_NAME || "Sikho AI",
};
