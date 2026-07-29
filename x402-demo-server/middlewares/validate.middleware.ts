import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

export const validate = (schema: ZodSchema) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }
  });
