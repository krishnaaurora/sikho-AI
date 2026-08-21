import dotenv from 'dotenv';
import { env } from './env';

dotenv.config();

export const config = {
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  algorandApiKey: env.ALGORAND_API_KEY,
  algorandServer: env.ALGORAND_SERVER,
  x402ApiKey: env.X402_API_KEY,
  avmAddress: env.AVM_ADDRESS,
  facilitatorUrl: env.FACILITATOR_URL,
  groqApiKeys: env.GROQ_API_KEYS,
  apifyApiToken: env.APIFY_API_TOKEN,
  apifyLinkedInActor: env.APIFY_LINKEDIN_ACTOR,
  geminiApiKey: env.GEMINI_API_KEY
};

export { appConfig } from './app.config';
export { dbConfig } from './db.config';
export { jwtConfig } from './jwt.config';
export { multerConfig } from './multer.config';
export { loggerConfig, morganMiddleware } from './logger.config';
export { env };
