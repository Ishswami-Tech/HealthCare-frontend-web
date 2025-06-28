// Clinic Types for Frontend Integration

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  subdomain: string;
  app_name: string;
  logo?: string;
  website?: string;
  description?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ClinicLocation {
  id: string;
  clinicId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  workingHours?: Record<string, { start: string; end: string } | null>;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicUser {
  id: string;
  userId: string;
  clinicId: string;
  role: string;
  isOwner: boolean;
  assignedAt: string;
  assignedBy: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name: string;
    role: string;
    isVerified: boolean;
    profilePicture?: string;
  };
}

export interface ClinicStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalReceptionists: number;
  totalClinicAdmins: number;
  totalAppointments: number;
  activeLocations: number;
  completionRate: number;
  avgWaitTime: number;
  totalRevenue?: number;
  monthlyGrowth?: number;
}

export interface ClinicSettings {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  appointmentSettings: {
    maxAdvanceBooking: number; // days
    minAdvanceBooking: number; // hours
    appointmentDuration: number; // minutes
    allowRescheduling: boolean;
    allowCancellation: boolean;
    cancellationWindow: number; // hours
  };
  paymentSettings: {
    currency: string;
    paymentMethods: string[];
    autoBilling: boolean;
  };
  securitySettings: {
    twoFactorAuth: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
  };
}

// DTOs for API calls
export interface CreateClinicData {
  name: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  app_name: string;
  mainLocation: CreateClinicLocationData;
  clinicAdminIdentifier?: string;
  logo?: string;
  website?: string;
  description?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  databaseName?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateClinicData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  website?: string;
  description?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export interface CreateClinicLocationData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  workingHours?: Record<string, { start: string; end: string } | null>;
  settings?: Record<string, any>;
}

export interface UpdateClinicLocationData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  workingHours?: Record<string, { start: string; end: string } | null>;
  settings?: Record<string, any>;
}

export interface AssignClinicAdminData {
  userId: string;
  clinicId: string;
  isOwner?: boolean;
}

export interface RegisterPatientData {
  appName: string;
}

export interface AppNameValidationData {
  appName: string;
}

// Extended types with relations
export interface ClinicWithRelations extends Clinic {
  locations?: ClinicLocation[];
  users?: ClinicUser[];
  stats?: ClinicStats;
  settings?: ClinicSettings;
}

export interface ClinicLocationWithClinic extends ClinicLocation {
  clinic?: Clinic;
}

// API Response types
export interface ClinicResponse {
  success: boolean;
  data: ClinicWithRelations;
  message?: string;
}

export interface ClinicListResponse {
  success: boolean;
  data: ClinicWithRelations[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

export interface ClinicLocationResponse {
  success: boolean;
  data: ClinicLocation;
  message?: string;
}

export interface ClinicLocationListResponse {
  success: boolean;
  data: ClinicLocation[];
  total: number;
  message?: string;
}

export interface ClinicUserResponse {
  success: boolean;
  data: ClinicUser;
  message?: string;
}

export interface ClinicUserListResponse {
  success: boolean;
  data: ClinicUser[];
  total: number;
  message?: string;
}

export interface ClinicStatsResponse {
  success: boolean;
  data: ClinicStats;
  message?: string;
}

export interface ClinicSettingsResponse {
  success: boolean;
  data: ClinicSettings;
  message?: string;
}

// Error types
export interface ClinicError {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Filter and query types
export interface ClinicFilters {
  isActive?: boolean;
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
}

export interface ClinicLocationFilters {
  isActive?: boolean;
  search?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ClinicUserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

// Utility types
export interface ClinicPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageLocations: boolean;
  canManageSettings: boolean;
}

export interface ClinicContext {
  clinicId: string;
  clinicName: string;
  userRole: string;
  permissions: ClinicPermission;
}

// Form types for UI components
export interface ClinicFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  app_name: string;
  logo?: string;
  website?: string;
  description?: string;
  timezone: string;
  currency: string;
  language: string;
  mainLocation: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    email: string;
    timezone: string;
  };
}

export interface ClinicLocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  workingHours: Record<string, { start: string; end: string } | null>;
}

// Enum types
export enum ClinicType {
  GENERAL = 'GENERAL',
  SPECIALTY = 'SPECIALTY',
  HOSPITAL = 'HOSPITAL',
  DIAGNOSTIC = 'DIAGNOSTIC',
  REHABILITATION = 'REHABILITATION'
}

export enum ClinicStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
} 