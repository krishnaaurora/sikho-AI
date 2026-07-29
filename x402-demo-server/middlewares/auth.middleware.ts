import { Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../services/auth";
import { getUserById } from "../services/auth";
import { AuthRequest } from "../types/auth.types";
import { UserRole } from "../models/User.model";

export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check if token is in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check if token is in cookies (accessToken)
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError("You are not logged in. Please log in to get access", 401);
    }

    // Verify token
    const decoded: any = verifyAccessToken(token);

    // Check if user still exists
    const currentUser = await getUserById(decoded.userId);
    if (!currentUser) {
      throw new AppError("The user belonging to this token no longer exists", 401);
    }

    // Check if user is active
    if (!currentUser.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    // Attach user to request
    req.user = currentUser;
    next();
  }
);

export const requireLearner = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("You are not logged in", 401);
    }

    if (req.user.role !== UserRole.LEARNER && req.user.role !== UserRole.ADMIN) {
      throw new AppError("Access denied: Learners only", 403);
    }

    next();
  }
);

export const requireAdmin = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("You are not logged in", 401);
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError("Access denied: Admins only", 403);
    }

    next();
  }
);
