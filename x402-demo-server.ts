import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectToDatabase } from "./database/connection";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info("Database connected successfully");

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      server.close(async () => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received. Shutting down gracefully...");
      server.close(async () => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
