import { z } from 'zod';

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLINIC_ADMIN = "CLINIC_ADMIN",
  DOCTOR = "DOCTOR",
  RECEPTIONIST = "RECEPTIONIST",
  PATIENT = "PATIENT",
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginData {
  email: string;
  password: string;
  otp?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

export interface OTPData {
  email: string;
  otp: string;
}

export interface SocialLoginData {
  provider: string;
  token: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  redirectUrl?: string;
  message?: string;
  permissions?: string[];
}

export interface Session {
  user: User;
  permissions?: string[];
  redirectPath?: string;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  deviceId: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  lastActivityAt: string;
  createdAt: string;
  isActive: boolean;
  isCurrentSession: boolean;
}

export interface LoginFormData {
  email: string;
  password?: string;
  otp?: string;
  rememberMe?: boolean;
}

export interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  terms: boolean;
}

export interface OTPFormData {
  email: string;
  otp: string;
  rememberMe?: boolean;
}

// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  profilePicture?: string;
  medicalConditions?: string[];
}

// Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.nativeEnum(Role).optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

export interface ClinicLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
}

export interface OTPRequest {
  email: string;
  otp: string;
}

export interface OTPStatus {
  hasActiveOTP: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
} 