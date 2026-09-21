import crypto from "crypto";
import jwt from "jsonwebtoken";
import User, { IUser, UserRole } from "../../models/User.model";
import { jwtConfig } from "../../config";
import { AppError } from "../../utils/errors";
import { toUserResponse } from "../../types/user.types";
import { sendWelcomeEmail } from "../email.service";

// JWT Service
export const generateAccessToken = (user: IUser) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    jwtConfig.accessSecret as string,
    {
      expiresIn: jwtConfig.accessExpiresIn,
    } as any
  );
};

export const generateRefreshToken = (user: IUser) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    jwtConfig.refreshSecret as string,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as any
  );
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, jwtConfig.accessSecret);
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

// Token Service for Password Reset
export const generateResetPasswordToken = () => {
  const resetToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return { resetToken, hashedToken, expire };
};

// User Service
export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  const cleanEmail = (email || "").toLowerCase().trim();
  return await User.findOne({ email: cleanEmail, isDeleted: false }).select("+password");
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  return await User.findOne({ _id: id, isDeleted: false });
};

// Auth Service
export const registerService = async (
  fullName: string,
  email: string,
  password: string,
  extraOnboarding: any = {}
) => {
  const cleanEmail = (email || "").toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  // Validate name
  if (!fullName || !fullName.trim()) {
    throw new AppError("Full name is required.", 400);
  }

  // Validate password length
  if (!password || password.length < 6) {
    throw new AppError("Password must be at least 6 characters long.", 400);
  }

  // Check if user already exists (including soft-deleted accounts with same email)
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new AppError("An account with this email address already exists. Please log in or use a different email address.", 409);
  }

  // Create new user
  const user = await User.create({
    fullName: fullName.trim(),
    email: cleanEmail,
    password,
    role: UserRole.LEARNER,
    welcomeEmailSent: false,
    ...extraOnboarding
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send welcome email in background (non-blocking so registration response returns immediately)
  if (!user.welcomeEmailSent) {
    console.log(`[RegisterService] Initiating welcome email to: ${cleanEmail}`);
    sendWelcomeEmail(cleanEmail, user.fullName)
      .then(async (sent) => {
        if (sent) {
          await User.findByIdAndUpdate(user._id, { welcomeEmailSent: true });
          console.log(`[RegisterService] ✅ Welcome email delivered to ${cleanEmail}`);
        } else {
          console.warn(`[RegisterService] ⚠️ Welcome email not delivered to ${cleanEmail}`);
        }
      })
      .catch((emailErr: any) => {
        console.error(`[RegisterService] ❌ Welcome email error for ${cleanEmail}:`, emailErr?.message || emailErr);
      });
  }

  return { user: toUserResponse(user), accessToken, refreshToken };
};


export const loginService = async (email: string, password: string) => {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  // Compare password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Retry welcome email on login if previously missed (e.g. if SMTP timed out during initial registration)
  if (!user.welcomeEmailSent) {
    console.log(`[LoginService] Retrying missed welcome email for: ${user.email}`);
    sendWelcomeEmail(user.email, user.fullName)
      .then(async (sent) => {
        if (sent) {
          await User.findByIdAndUpdate(user._id, { welcomeEmailSent: true });
          console.log(`[LoginService] ✅ Missed welcome email delivered to ${user.email}`);
        }
      })
      .catch((emailErr: any) => {
        console.error(`[LoginService] ❌ Welcome email retry error for ${user.email}:`, emailErr?.message || emailErr);
      });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: toUserResponse(user), accessToken, refreshToken };
};

export const adminLoginService = async (email: string, password: string) => {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check if account is active and is admin
  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  if (user.role !== UserRole.ADMIN) {
    throw new AppError("Access denied: Admin only", 403);
  }

  // Compare password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: toUserResponse(user), accessToken, refreshToken };
};

export const forgotPasswordService = async (email: string) => {
  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    // Return success even if user not found (security)
    return { message: "If an account with that email exists, a reset link has been sent" };
  }

  const { resetToken, hashedToken, expire } = generateResetPasswordToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expire;
  await user.save({ validateBeforeSave: false });

  // TODO: In production, send email with resetToken
  console.log(`Password reset token for ${email}: ${resetToken}`);

  return {
    message: "If an account with that email exists, a reset link has been sent",
    resetToken, // Only for development/testing
  };
};

export const resetPasswordService = async (
  resetToken: string,
  password: string
) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { message: "Password reset successfully" };
};

export const changePasswordService = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new AppError("Old password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully" };
};

export const updateProfileService = async (
  userId: string,
  updateData: any
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toUserResponse(user);
};
