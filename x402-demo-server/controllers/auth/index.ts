import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import {
  registerService,
  loginService,
  adminLoginService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  updateProfileService,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getUserById,
} from "../../services/auth";
import { AuthRequest } from "../../types/auth.types";
import { jwtConfig, appConfig } from "../../config";
import { toUserResponse } from "../../types/user.types";

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: appConfig.nodeEnv === "production",
    sameSite: appConfig.nodeEnv === "production" ? "strict" : "lax",
    maxAge: jwtConfig.cookieMaxAge,
    path: "/",
  });
};

// Helper to set access token cookie
const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: appConfig.nodeEnv === "production",
    sameSite: appConfig.nodeEnv === "production" ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });
};

// Helper to clear tokens cookies
const clearTokensCookies = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: appConfig.nodeEnv === "production",
    sameSite: appConfig.nodeEnv === "production" ? "strict" : "lax",
    path: "/",
  });
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: appConfig.nodeEnv === "production",
    sameSite: appConfig.nodeEnv === "production" ? "strict" : "lax",
    path: "/",
  });
};

export const register = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { fullName, email, password } = req.body;

    const result = await registerService(fullName, email, password);

    // Set tokens in cookies
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    sendSuccessResponse(
      res,
      { user: result.user, accessToken: result.accessToken },
      "User registered successfully",
      201
    );
  }
);

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const result = await loginService(email, password);

  // Set tokens in cookies
  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.refreshToken);

  sendSuccessResponse(
    res,
    { user: result.user, accessToken: result.accessToken },
    "Login successful"
  );
});

export const adminLogin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await adminLoginService(email, password);

    // Set tokens in cookies
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    sendSuccessResponse(
      res,
      { user: result.user, accessToken: result.accessToken },
      "Admin login successful"
    );
  }
);

export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      sendSuccessResponse(
        res,
        null,
        "No refresh token provided",
        401
      );
      return;
    }

    // Verify refresh token
    const decoded: any = verifyRefreshToken(refreshToken);

    // Get user
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      clearTokensCookies(res);
      sendSuccessResponse(
        res,
        null,
        "Invalid refresh token",
        401
      );
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Set new tokens in cookies
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    sendSuccessResponse(
      res,
      { user: toUserResponse(user), accessToken: newAccessToken },
      "Token refreshed successfully"
    );
  }
);

export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    clearTokensCookies(res);

    sendSuccessResponse(res, null, "Logged out successfully");
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      sendSuccessResponse(
        res,
        null,
        "User not found",
        404
      );
      return;
    }

    sendSuccessResponse(
      res,
      { user: toUserResponse(req.user) },
      "User retrieved successfully"
    );
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      sendSuccessResponse(
        res,
        null,
        "User not found",
        404
      );
      return;
    }

    const { fullName, bio, profileImage } = req.body;

    const updatedUser = await updateProfileService(req.user._id.toString(), {
      fullName,
      bio,
      profileImage,
    });

    sendSuccessResponse(
      res,
      { user: updatedUser },
      "Profile updated successfully"
    );
  }
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      sendSuccessResponse(
        res,
        null,
        "User not found",
        404
      );
      return;
    }

    const { oldPassword, password } = req.body;

    const result = await changePasswordService(
      req.user._id.toString(),
      oldPassword,
      password
    );

    sendSuccessResponse(res, result, "Password changed successfully");
  }
);

export const forgotPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    const result = await forgotPasswordService(email);

    sendSuccessResponse(res, result, result.message);
  }
);

export const resetPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { resetToken, password } = req.body;

    const result = await resetPasswordService(resetToken, password);

    sendSuccessResponse(res, result, "Password reset successfully");
  }
);
