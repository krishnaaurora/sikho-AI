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

  logger.error(err.stack || err);
  return sendErrorResponse(
    res,
    null,
    error.message as string,
    500
  );
};
