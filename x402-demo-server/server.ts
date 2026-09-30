// Sikho AI x402 Server
import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
      const shortenedPayTo =
        env.X402_PAY_TO.length > 10
          ? `${env.X402_PAY_TO.substring(0, 6)}...${env.X402_PAY_TO.substring(env.X402_PAY_TO.length - 4)}`
          : env.X402_PAY_TO;
      logger.info("--------------------------------------------------");
      logger.info(`X402 Network: ${env.IS_TESTNET ? "TESTNET" : "MAINNET"}`);
      logger.info(`USDC Asset: ${env.X402_ASSET}`);
      logger.info(`PayTo: ${shortenedPayTo}`);
      logger.info(`Facilitator: ${env.X402_FACILITATOR_URL}`);
      logger.info("--------------------------------------------------");
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
