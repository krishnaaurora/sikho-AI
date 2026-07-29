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
  ].filter(Boolean) as string[],
  ALGORAND_API_KEY: process.env.ALGORAND_API_KEY || "",
  ALGORAND_SERVER: process.env.ALGORAND_SERVER || "https://testnet-api.algonode.cloud",
  X402_API_KEY: process.env.X402_API_KEY || "",
  AVM_ADDRESS: process.env.AVM_ADDRESS || "",
  FACILITATOR_URL: process.env.FACILITATOR_URL || "https://facilitator.goplausible.xyz",
};
