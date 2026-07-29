import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

export const learnerMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Learner check logic will be implemented later
    next();
  }
);
