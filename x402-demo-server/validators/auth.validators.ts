import { z } from "zod";

// Password strength: at least 6 characters, required
const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(6, "Password must be at least 6 characters long");

export const registerValidator = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters long")
      .trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginValidator = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export const forgotPasswordValidator = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordValidator = z
  .object({
    resetToken: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordValidator = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileValidator = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .trim()
    .optional(),
  bio: z.string().trim().optional(),
  profileImage: z.string().optional(),
}).passthrough();
