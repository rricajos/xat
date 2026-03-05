import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountName: z.string().min(1, "Account name is required").max(255),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  locale: z.string().max(10).default("en"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  displayName: z.string().max(255).optional(),
  availability: z.number().min(0).max(2).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
