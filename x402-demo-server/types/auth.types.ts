import { Request } from "express";
import { IUser } from "../models/User.model";

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  profileImage?: string;
}

export interface AuthResponse {
  user: Omit<IUser, "password" | "comparePassword">;
  accessToken: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}
