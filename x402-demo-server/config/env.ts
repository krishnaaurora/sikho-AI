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
  ].filter(Boolean) as string[],
  ALGORAND_API_KEY: process.env.ALGORAND_API_KEY || "",
  ALGORAND_SERVER: process.env.ALGORAND_SERVER || "https://mainnet-api.algonode.cloud",
  X402_API_KEY: process.env.X402_API_KEY || "",
  AVM_ADDRESS: process.env.AVM_ADDRESS || "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
  FACILITATOR_URL: process.env.FACILITATOR_URL || "https://facilitator.goplausible.xyz",
  /**
   * Canonical public-facing URL for this merchant's site.
   * Used in x402 `resource` field and OG tags so the GoPlausible facilitator
   * can scrape merchant branding (logo, name, description, MERCHANT SITE domain).
   * Must be the Vercel production URL — NOT localhost.
   */
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || "https://sikho-ai-37ni.vercel.app",
};
