import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { sendErrorResponse } from "../utils/response";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message || "An error occurred";
  error.statusCode = err.statusCode || 500;

  if (err instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(err.stack || err.message || "Unknown error");
    } else {
      logger.warn(`${error.message} (${error.statusCode})`);
    }
    return sendErrorResponse(
      res,
      null,
      error.message as string,
      error.statusCode
    );
  }

  // Handle MongoDB duplicate key error (E11000) - return clean 409 Conflict
  if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000)) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    let userMessage = "An account with this email address already exists. Please log in or use a different email address.";
    if (field !== "email") {
      userMessage = `A record with this ${field} already exists.`;
    }
    logger.warn(`Duplicate key conflict on field '${field}': ${err.message}`);
    return sendErrorResponse(res, null, userMessage, 409);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((e: any) => e.message).join(", ");
    logger.warn(`Validation error: ${messages}`);
    return sendErrorResponse(res, null, messages, 400);
  }

  logger.error(err.stack || err);
  return sendErrorResponse(
    res,
    null,
    "An unexpected error occurred. Please try again.",
    500
  );
};
