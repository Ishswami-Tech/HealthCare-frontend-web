import { z } from 'zod';

// Define Role as both enum and type for backward compatibility
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  PATIENT = 'PATIENT'
}

// Keep the type definition for better type safety
export type RoleType = keyof typeof Role;

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: SessionData | null;
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
  access_token: string;
  refresh_token: string;
  session_id: string;
  message?: string;
  redirectUrl?: string;
  isNewUser?: boolean;
}

export interface Session {
  user: User;
  access_token: string;
  session_id: string;
  isAuthenticated: boolean;
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
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  clinicId?: string;
  appName?: string;
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
  role: Role | string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isVerified?: boolean;
  profileComplete?: boolean;
  profilePicture?: string;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
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

// Helper function to safely use Role enum with Zod
const createRoleEnum = () => {
  return z.enum([
    Role.SUPER_ADMIN,
    Role.CLINIC_ADMIN,
    Role.DOCTOR,
    Role.RECEPTIONIST,
    Role.PATIENT
  ] as [string, ...string[]]);
};

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
  role: createRoleEnum().optional(),
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

export interface RegisterData extends RegisterFormData {
  clinicId: string;
  appName: string;
}

export interface GoogleLoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: Role;
    isNewUser?: boolean;
    googleId?: string;
    profileComplete?: boolean;
  };
  token?: string;
  redirectUrl?: string;
}

export interface TokenData {
  token: string;
  expiresAt: number;
}

export interface SessionData {
  accessToken: TokenData;
  refreshToken: TokenData;
  sessionId: string;
  lastActivity: string;
  deviceInfo: DeviceInfo;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SessionError {
  message: string;
  code: 'SESSION_EXPIRED' | 'INVALID_TOKEN' | 'INVALID_SESSION' | 'UNAUTHORIZED' | 'UNKNOWN';
  status: number;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
} 