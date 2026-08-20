import { z } from "zod";

// Password strength: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

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
  password: z.string().min(1, "Password is required"),
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
