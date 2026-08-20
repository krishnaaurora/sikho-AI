import dotenv from "dotenv";

dotenv.config();

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
  ALGORAND_API_KEY: process.env.ALGORAND_API_KEY || "",
  ALGORAND_SERVER: process.env.ALGORAND_SERVER || "https://mainnet-api.algonode.cloud",
  X402_API_KEY: process.env.X402_API_KEY || "",
  AVM_ADDRESS: process.env.AVM_ADDRESS || "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
  FACILITATOR_URL: process.env.FACILITATOR_URL || "https://facilitator.goplausible.xyz",
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || "",
  APIFY_LINKEDIN_ACTOR: process.env.APIFY_LINKEDIN_ACTOR || "crawlworks~linkedin-jobs-scraper",
  /**
   * Canonical public-facing URL for this merchant's site.
   * Used in x402 `resource` field and OG tags so the GoPlausible facilitator
   * can scrape merchant branding (logo, name, description, MERCHANT SITE domain).
   * Must be the Vercel production URL — NOT localhost.
   */
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || "https://sikho-ai-37ni.vercel.app",
};
