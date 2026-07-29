import { env } from "./env";

export const appConfig = {
  name: "AI Learning Platform",
  version: "1.0.0",
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN,
  nodeEnv: env.NODE_ENV,
};
