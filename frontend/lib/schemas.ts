import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;


/**
 * Indian mobile number, as the candidate types it — ten digits, no country
 * code. The form prints a fixed "+91" beside the field and strips anything
 * that is not a digit as it is typed, so there is nothing to prefix and
 * nothing to clean up here.
 *
 * Every real Indian mobile number begins 6, 7, 8 or 9. People habitually
 * prefix a 0 out of landline habit, which is the single most common way this
 * field is filled in wrong, so that case gets its own message rather than a
 * generic "invalid number".
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .regex(/^\d+$/, 'Digits only')
  .refine((v) => !v.startsWith('0'), {
    message: 'Drop the leading 0 — enter the 10 digits after +91',
  })
  .refine((v) => v.length === 10, { message: 'Enter exactly 10 digits' })
  .refine((v) => /^[6-9]/.test(v), {
    message: 'An Indian mobile number starts with 6, 7, 8 or 9',
  });

export const fatherNameSchema = z
  .string()
  .trim()
  .min(2, "Father's name must be at least 2 characters")
  .max(50, "Father's name is too long");

export const registerSchema = z.object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name is too long'),
    father_name: fatherNameSchema,
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .toLowerCase(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * The fields an account can be missing.
 *
 * Accounts created before phone and father's name were collected have neither,
 * and existing candidates must not be locked out of a row that was valid when
 * it was written — so the app asks for them on the next sign-in instead.
 */
export const completeProfileSchema = z.object({
  father_name: fatherNameSchema,
  phone: phoneSchema,
});

export type CompleteProfileFormData = z.input<typeof completeProfileSchema>;
