// Note: Zod schemas moved to @/lib/schema/auth.schema.ts

// ✅ Consolidated: Role enum - single source of truth
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

export interface RegisterData extends RegisterFormData {
  name?: string;
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
  message?: string;
  redirectUrl?: string;
  isNewUser?: boolean;
  requiresVerification?: boolean;
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
  clinicId?: string | undefined;
  appName?: string | undefined;
  // Optional fields that may be provided during registration
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  age?: number; // Frontend-only field, will be converted to dateOfBirth
}

export interface OTPFormData {
  identifier: string;
  otp: string;
  rememberMe?: boolean;
  isRegistration?: boolean;
  firstName?: string;
  lastName?: string;
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
  phone?: string;
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
// ============================================================================
// ZOD SCHEMAS - MOVED TO @/lib/schema/auth.schema.ts
// ============================================================================
// ✅ All Zod validation schemas are now consolidated in:
//    import { loginSchema, registerSchema, ... } from '@/lib/schema'
// ============================================================================

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

// RegisterData is now consolidated above using the extended RegisterFormData


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

// ============================================================================
// FORM DATA TYPES
// These types are used for form validation with Zod schemas from @/lib/schema
// ============================================================================

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordLoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OtpRequestFormData {
  identifier: string;
  isRegistration?: boolean;
}

export interface OtpVerifyFormData {
  identifier: string;
  otp: string;
  rememberMe?: boolean;
  isRegistration?: boolean;
  firstName?: string;
  lastName?: string;
}

export interface ProfileCompletionFormData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  specialization?: string;
  experience?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export interface ProfileData extends Omit<ProfileCompletionFormData, 'emergencyContact'> {
  profileComplete: boolean;
  emergencyContact: string;
}
 