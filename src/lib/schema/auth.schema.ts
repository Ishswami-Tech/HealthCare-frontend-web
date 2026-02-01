/**
 * ✅ CONSOLIDATED AUTH SCHEMAS
 * Single source of truth for all authentication Zod schemas
 * Following DRY, SOLID, KISS principles
 * 
 * @module Schema/Auth
 */

import * as z from 'zod';
import { Role } from '@/types/auth.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to safely use Role enum with Zod
 */
const createRoleEnum = () => {
  return z.enum([
    Role.SUPER_ADMIN,
    Role.CLINIC_ADMIN,
    Role.DOCTOR,
    Role.RECEPTIONIST,
    Role.PHARMACIST,
    Role.PATIENT,
  ] as [string, ...string[]]);
};

// ============================================================================
// LOGIN SCHEMAS
// ============================================================================

/**
 * Schema for password-based login
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

/**
 * Schema for password login (alias with stricter validation)
 */
export const passwordLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

// ============================================================================
// OTP SCHEMAS
// ============================================================================

/**
 * Schema for requesting OTP
 */
export const requestOtpSchema = z.object({
  identifier: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    { message: 'Please enter a valid email address or phone number' }
  ),
});

/**
 * Schema for OTP verification/login
 */
export const otpSchema = z.object({
  identifier: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    { message: 'Please enter a valid email address or phone number' }
  ),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  rememberMe: z.boolean().optional().default(false),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

/**
 * Alias for OTP verification
 */
export const otpVerifySchema = otpSchema;

// ============================================================================
// REGISTRATION SCHEMAS
// ============================================================================

/**
 * Password validation rules (reusable)
 */
const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Schema for user registration
 */
export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: passwordValidation,
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    role: createRoleEnum().default(Role.PATIENT),
    age: z.number().optional(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================================
// PASSWORD RESET SCHEMAS
// ============================================================================

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Schema for password reset with token
 */
export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Schema for changing password (when logged in)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

/**
 * Schema for profile completion
 */
export const profileCompletionSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      return new Date(date) <= new Date();
    }, 'Date of birth cannot be in the future')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 12;
    }, 'You must be at least 12 years old to register'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a gender',
  }),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  // Optional fields for profile updates
  specialization: z.string().optional(),
  experience: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
});

// ============================================================================
// INFERRED TYPES FROM SCHEMAS
// These are exported here for Zod resolver compatibility, and re-exported 
// from @/types for unified access
// ============================================================================

export type SchemaLoginFormData = z.infer<typeof loginSchema>;
export type SchemaPasswordLoginFormData = z.infer<typeof passwordLoginSchema>;
export type SchemaOtpRequestFormData = z.infer<typeof requestOtpSchema>;
export type SchemaOtpVerifyFormData = z.infer<typeof otpVerifySchema>;
export type SchemaRegisterFormData = z.infer<typeof registerSchema>;
export type SchemaForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SchemaResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type SchemaChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type SchemaProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

