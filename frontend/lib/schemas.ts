import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    full_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name is too long')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password is too long'),
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .toLowerCase()
    .trim(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
