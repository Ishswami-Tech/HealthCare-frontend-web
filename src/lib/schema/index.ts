/**
 * ✅ CENTRAL SCHEMA EXPORTS
 * Single entry point for all Zod validation schemas
 * 
 * Usage:
 *   import { loginSchema, registerSchema } from '@/lib/schema'
 * 
 * For types, import from @/types:
 *   import { LoginFormData, RegisterFormData } from '@/types/auth.types'
 * 
 * @module Schema
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================
export {
  // Login
  loginSchema,
  passwordLoginSchema,
  // OTP
  requestOtpSchema,
  otpSchema,
  otpVerifySchema,
  // Registration
  registerSchema,
  // Password Reset
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  // Profile
  profileCompletionSchema,
  // Schema-inferred types (for Zod resolver compatibility)
  type SchemaLoginFormData,
  type SchemaPasswordLoginFormData,
  type SchemaOtpRequestFormData,
  type SchemaOtpVerifyFormData,
  type SchemaRegisterFormData,
  type SchemaForgotPasswordFormData,
  type SchemaResetPasswordFormData,
  type SchemaChangePasswordFormData,
  type SchemaProfileCompletionFormData,
} from './auth.schema';

// ============================================================================
// NOTE: All TypeScript types are in @/types
// For form validation with Zod, use Schema* types from here
// For general types, import from @/types
// ============================================================================
