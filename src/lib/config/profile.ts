import { Role } from '@/types/auth.types';
import { getDashboardByRole, ROUTES, isAuthPath } from '@/lib/config/routes';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  requiredFields: string[];
  optionalFields: string[];
}

export interface UserProfileData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  medicalConditions?: string[];
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  clinicToken?: string;
  clinic?: Record<string, unknown>;
  // Emergency contact as object or string
  emergencyContact?: string | {
    id?: string;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
  };
  // Role-specific fields
  specialization?: string;
  licenseNumber?: string;
  experience?: string;
  clinicName?: string;
  clinicAddress?: string;
  profileComplete?: boolean;
}

/**
 * Check if a user's profile is complete based on their role
 */
export function checkProfileCompletion(profileData: UserProfileData): ProfileCompletionStatus {
  if (profileData.role !== Role.PATIENT) {
    return {
      isComplete: true,
      missingFields: [],
      requiredFields: [],
      optionalFields: [],
    };
  }

  const requiredFields: string[] = [
    'firstName',
    'lastName', 
    'phone'
    // emergencyContact removed - not collected in profile completion form
  ];

  const optionalFields: string[] = [];

  const missingFields: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    const value = getNestedValue(profileData, field);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  });

  if (profileData.phone && profileData.phoneVerified !== true) {
    missingFields.push('phoneVerified');
  }

  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    requiredFields,
    optionalFields
  };
}

/**
 * Get nested object value by dot notation
 */
function getNestedValue(obj: UserProfileData, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && current !== null && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Check if user should be redirected to profile completion
 */
export function shouldRedirectToProfileCompletion(
  isAuthenticated: boolean,
  profileComplete: boolean,
  currentPath: string
): boolean {
  return (
    isAuthenticated &&
    !profileComplete &&
    currentPath !== ROUTES.PROFILE_COMPLETION &&
    !isAuthPath(currentPath)
  );
}

/**
 * Calculate profile completion status from user data
 * This replaces the need for a backend profileComplete field
 */
export function calculateProfileCompletion(userData: UserProfileData): boolean {
  if (!userData) return false;

  if (userData.role !== Role.PATIENT) {
    return true;
  }

  if (typeof userData.profileComplete === 'boolean') {
    return userData.profileComplete;
  }

  // Essential required fields for all users
  const requiredFields = [
    'firstName',
    'lastName', 
    'phone'
  ];

  // Check if all required fields are present and not empty
  const missingFields = requiredFields.filter(field => {
    const value = getNestedValue(userData, field);
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  if (!missingFields.includes('phone') && userData.phone && userData.phoneVerified !== true) {
    return false;
  }

  // Profile is complete if no required fields are missing
  return missingFields.length === 0;
}

/**
 * Get profile completion status from user data and cookies
 */
export function getProfileCompletionStatus(
  userData: UserProfileData | null,
  profileCompleteCookie: string | undefined
): boolean {
  // If we have user data, calculate completion status
  if (userData) {
    if (typeof userData.profileComplete === 'boolean') {
      return userData.profileComplete;
    }
    return calculateProfileCompletion(userData);
  }
  
  // Fallback to cookie value if no user data
  return profileCompleteCookie === 'true';
}

/**
 * Get the appropriate redirect URL after profile completion
 */
export function getProfileCompletionRedirectUrl(
  userRole: Role,
  originalPath?: string
): string {
  // If original path is provided and it's not an auth route, use it
  if (originalPath && !originalPath.startsWith('/auth/')) {
    return originalPath;
  }

  // Otherwise, redirect to appropriate dashboard
  return getDashboardByRole(userRole);
}

/**
 * Get required fields for a specific role
 */
export function getRequiredFieldsForRole(role?: Role): string[] {
  if (role && role !== Role.PATIENT) {
    return [];
  }

  const baseFields = [
    'firstName',
    'lastName',
    'phone'
    // emergencyContact removed - not collected in profile completion form
  ];

  return baseFields;
}

/**
 * Get optional fields for a specific role
 */
export function getOptionalFieldsForRole(role: Role): string[] {
  switch (role) {
    case Role.DOCTOR:
    case Role.ASSISTANT_DOCTOR:
      return ['specialization', 'licenseNumber', 'experience'];
    case Role.CLINIC_ADMIN:
      return ['clinicName', 'clinicAddress'];
    default:
      return [];
  }
}

/**
 * Validate profile data for a specific role
 */
export function validateProfileData(
  data: Partial<UserProfileData>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = getRequiredFieldsForRole(data.role as Role | undefined);

  requiredFields.forEach(field => {
    const value = getNestedValue(data as UserProfileData, field);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format field name for display
 */
export function formatFieldName(field: string): string {
  return field
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletionPercentage(
  profileData: UserProfileData
): number {
  const status = checkProfileCompletion(profileData);
  const totalRequired = status.requiredFields.length;
  if (totalRequired === 0) {
    return status.isComplete ? 100 : 0;
  }
  const completed = totalRequired - status.missingFields.length;
  
  return Math.round((completed / totalRequired) * 100);
}

/**
 * Transform API response to match our expected format
 */
export function transformApiResponse(apiData: Record<string, unknown>): UserProfileData {
  const role = (apiData.role as string) || '';
  const profileComplete =
    String(role).toUpperCase() !== String(Role.PATIENT)
      ? true
      : typeof apiData.profileComplete === 'boolean'
      ? apiData.profileComplete
      : typeof apiData.isProfileComplete === 'boolean'
        ? apiData.isProfileComplete
        : typeof apiData.requiresProfileCompletion === 'boolean'
          ? !apiData.requiresProfileCompletion
          : false;

  const result: UserProfileData = {
    id: (apiData.id as string) || '',
    firstName: (apiData.firstName as string) || '',
    lastName: (apiData.lastName as string) || '',
    email: (apiData.email as string) || '',
    role,
    phone: (apiData.phone as string) || '',
    address: (apiData.address as string) || '',
    city: (apiData.city as string) || '',
    state: (apiData.state as string) || '',
    country: (apiData.country as string) || '',
    zipCode: (apiData.zipCode as string) || '',
    dateOfBirth: (apiData.dateOfBirth as string) || '',
    age: (apiData.age as number) || 0,
    gender: (apiData.gender as string) || '',
    medicalConditions: (apiData.medicalConditions as string[]) || [],
    profilePicture: (apiData.profilePicture as string) || '',
    isVerified: (apiData.isVerified as boolean) || false,
    createdAt: (apiData.createdAt as string) || '',
    updatedAt: (apiData.updatedAt as string) || '',
    clinicToken: (apiData.clinicToken as string) || '',
    clinic: (apiData.clinic as Record<string, unknown>) || {},
    // Handle emergency contact (may need to be extracted from other fields)
    emergencyContact: apiData.emergencyContact as string | {
      id?: string;
      name: string;
      relationship: string;
      phone: string;
      alternatePhone?: string;
      address?: string;
    },
    // Role-specific fields
    specialization: (apiData.specialization as string) || '',
    licenseNumber: (apiData.licenseNumber as string) || '',
    experience: (apiData.experience as string) || '',
    clinicName: (apiData.clinicName as string) || '',
    clinicAddress: (apiData.clinicAddress as string) || '',
    profileComplete
  };

  if (typeof apiData.phoneVerified === 'boolean') {
    result.phoneVerified = apiData.phoneVerified;
  }

  if (typeof apiData.phoneVerifiedAt === 'string') {
    result.phoneVerifiedAt = apiData.phoneVerifiedAt;
  }

  return result;
}
