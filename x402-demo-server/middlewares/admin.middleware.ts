import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

export const adminMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Admin check logic will be implemented later
    next();
  }
);
