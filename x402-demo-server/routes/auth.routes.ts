import express from "express";
import {
  register,
  login,
  adminLogin,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/auth";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} from "../validators";

const router = express.Router();

// Public routes
router.post("/register", validate(registerValidator), register);
router.post("/login", validate(loginValidator), login);
router.post("/admin/login", validate(loginValidator), adminLogin);
router.post("/forgot-password", validate(forgotPasswordValidator), forgotPassword);
router.post("/reset-password", validate(resetPasswordValidator), resetPassword);
router.post("/refresh", refreshToken);

// Protected routes (require authentication)
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, validate(updateProfileValidator), updateProfile);
router.put("/change-password", authenticate, validate(changePasswordValidator), changePassword);

export default router;
