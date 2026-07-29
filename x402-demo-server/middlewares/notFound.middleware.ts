import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`404 Error: ${req.method} ${req.originalUrl}`);
  const message = "Endpoint not found";
  next(new AppError(message, 404));
};
