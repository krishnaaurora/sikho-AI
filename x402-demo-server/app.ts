import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { morganMiddleware } from "./config/logger.config";
import routes from "./routes";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { appConfig } from "./config/app.config";

const app = express();

// Security and configuration middleware
app.use(helmet());
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-PAYMENT', 'PAYMENT-SIGNATURE', 'Access-Control-Expose-Headers'],
  exposedHeaders: ['X-PAYMENT-RESPONSE', 'Access-Control-Expose-Headers', 'PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'],
}));
app.use(cookieParser());
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
