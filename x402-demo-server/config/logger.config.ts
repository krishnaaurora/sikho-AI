import morgan from "morgan";
import { env } from "./env";

export const loggerConfig = {
  format: env.NODE_ENV === "production" ? "combined" : "dev",
};

export const morganMiddleware = morgan(loggerConfig.format);
