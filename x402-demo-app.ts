import express from "express";
import cors from "cors";
import helmet from "helmet";
import { morganMiddleware } from "./config/logger.config";
import routes from "./routes";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { appConfig } from "./config/app.config";

const app = express();

// Security and configuration middleware
app.use(helmet());
app.use(cors({ origin: appConfig.corsOrigin }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(morganMiddleware);

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
