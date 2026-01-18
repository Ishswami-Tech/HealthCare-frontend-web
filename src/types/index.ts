/**
 * ✅ CENTRAL TYPES EXPORTS
 * Import specific types from their respective files to avoid conflicts
 * 
 * Usage Examples:
 *   import { User, Role, AuthState } from '@/types/auth.types'
 *   import { Appointment, AppointmentStatus } from '@/types/appointment.types'
 *   import { Clinic, ClinicLocation } from '@/types/clinic.types'
 * 
 * Or use this index for common types:
 *   import { Role, User } from '@/types'
 * 
 * @module Types
 */

// ============================================================================
// CORE AUTH TYPES (Most commonly used)
// ============================================================================
export {
  Role,
  type RoleType,
  type AuthState,
  type User,
  type UserProfile,
  type Session,
  type SessionData,
  type SessionInfo,
  type DeviceInfo,
  type LoginData,
  type LoginFormData,
  type RegisterData,
  type RegisterFormData,
  type OTPData,
  type OTPFormData,
  type OTPRequest,
  type OTPStatus,
  type AuthResponse,
  type RefreshTokenResponse,
  type SessionError,
  type ChangePasswordData,
  type ResetPasswordFormData,
  type ForgotPasswordFormData,
  type SocialLoginData,
  type GoogleLoginResponse,
  type TokenData,
  type MessageResponse,
  type ClinicLocation,
} from './auth.types';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export {
  type ApiResponse,
  type PaginationMeta,
  type ErrorResponse,
  type ApiErrorResponse,
  type MutationResponse,
  type WebSocketEventData,
  type HealthStatus,
  type HealthStatusResponse,
  type ServiceHealth,
} from './api.types';

// ============================================================================
// NOTE: Domain types should be imported directly from their files
// to avoid naming conflicts:
// 
//   import { Appointment, AppointmentStatus } from '@/types/appointment.types'
//   import { Patient, PatientProfile } from '@/types/patient.types'
//   import { Doctor, DoctorAvailability } from '@/types/doctor.types'
//   import { Clinic, ClinicSettings } from '@/types/clinic.types'
//   import { MedicalRecord, Prescription } from '@/types/medical-records.types'
//   import { QueueEntry, QueueStats } from '@/types/queue.types'
//   import { BillingRecord, Invoice } from '@/types/billing.types'
//   import { PharmacyOrder } from '@/types/pharmacy.types'
//   import { RBACRole, Permission } from '@/types/rbac.types'
// ============================================================================
