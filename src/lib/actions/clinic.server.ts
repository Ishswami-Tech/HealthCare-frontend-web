'use server';

import { 
  CreateClinicData,
  UpdateClinicData,
  CreateClinicLocationData,
  UpdateClinicLocationData,
  AssignClinicAdminData,
  RegisterPatientData,
  ClinicWithRelations,
  ClinicLocation,
  ClinicUser,
  ClinicStats,
  ClinicSettings
} from '@/types/clinic.types';
import { getServerSession } from './auth.server';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';

/**
 * Base API call function with authentication
 */
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'Session-ID': session.session_id,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { status: response.status, data };
}

// ===== CLINIC CRUD OPERATIONS =====

/**
 * Create a new clinic
 */
export async function createClinic(data: CreateClinicData): Promise<ClinicWithRelations> {
  const response = await apiCall<ClinicWithRelations>('/clinics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get all clinics for the authenticated user
 */
export async function getAllClinics(): Promise<ClinicWithRelations[]> {
  const response = await apiCall<ClinicWithRelations[]>('/clinics');
  return response.data;
}

/**
 * Get clinic by ID
 */
export async function getClinicById(id: string): Promise<ClinicWithRelations> {
  const response = await apiCall<ClinicWithRelations>(`/clinics/${id}`);
  return response.data;
}

/**
 * Get clinic by app name
 */
export async function getClinicByAppName(appName: string): Promise<ClinicWithRelations> {
  const response = await apiCall<ClinicWithRelations>(`/clinics/app/${appName}`);
  return response.data;
}

/**
 * Update clinic
 */
export async function updateClinic(id: string, data: UpdateClinicData): Promise<ClinicWithRelations> {
  const response = await apiCall<ClinicWithRelations>(`/clinics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete clinic
 */
export async function deleteClinic(id: string): Promise<{ message: string }> {
  const response = await apiCall<{ message: string }>(`/clinics/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

// ===== CLINIC LOCATION OPERATIONS =====

/**
 * Create a new clinic location
 */
export async function createClinicLocation(
  clinicId: string, 
  data: CreateClinicLocationData
): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${clinicId}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get all locations for a clinic
 */
export async function getClinicLocations(clinicId: string): Promise<ClinicLocation[]> {
  const response = await apiCall<ClinicLocation[]>(`/clinics/${clinicId}/locations`);
  return response.data;
}

/**
 * Get clinic location by ID
 */
export async function getClinicLocationById(
  clinicId: string, 
  locationId: string
): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${clinicId}/locations/${locationId}`);
  return response.data;
}

/**
 * Update clinic location
 */
export async function updateClinicLocation(
  clinicId: string,
  locationId: string,
  data: UpdateClinicLocationData
): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${clinicId}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete clinic location
 */
export async function deleteClinicLocation(
  clinicId: string, 
  locationId: string
): Promise<{ message: string }> {
  const response = await apiCall<{ message: string }>(`/clinics/${clinicId}/locations/${locationId}`, {
    method: 'DELETE',
  });
  return response.data;
}

/**
 * Generate QR code for clinic location
 */
export async function generateLocationQR(
  clinicId: string, 
  locationId: string
): Promise<{ qrCode: string }> {
  const response = await apiCall<{ qrCode: string }>(`/clinics/${clinicId}/locations/${locationId}/qr`);
  return response.data;
}

/**
 * Verify location QR code
 */
export async function verifyLocationQR(qrData: string): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>('/clinics/locations/verify-qr', {
    method: 'POST',
    body: JSON.stringify({ qrData }),
  });
  return response.data;
}

// ===== CLINIC USER MANAGEMENT =====

/**
 * Assign clinic admin
 */
export async function assignClinicAdmin(data: AssignClinicAdminData): Promise<ClinicUser> {
  const response = await apiCall<ClinicUser>('/clinics/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get clinic doctors
 */
export async function getClinicDoctors(clinicId: string): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/doctors`);
  return response.data;
}

/**
 * Get clinic patients
 */
export async function getClinicPatients(clinicId: string): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/patients`);
  return response.data;
}

/**
 * Register patient to clinic
 */
export async function registerPatientToClinic(data: RegisterPatientData): Promise<ClinicUser> {
  const response = await apiCall<ClinicUser>('/clinics/register-patient', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get clinic users by role
 */
export async function getClinicUsersByRole(clinicId: string, role: string): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/users/role/${role}`);
  return response.data;
}

// ===== CLINIC UTILITIES =====

/**
 * Validate app name availability
 */
export async function validateAppName(appName: string): Promise<{ available: boolean; message?: string }> {
  const response = await apiCall<{ available: boolean; message?: string }>('/clinics/validate-app-name', {
    method: 'POST',
    body: JSON.stringify({ appName }),
  });
  return response.data;
}

/**
 * Associate user with clinic
 */
export async function associateUserWithClinic(clinicId: string): Promise<{ message: string }> {
  const response = await apiCall<{ message: string }>('/clinics/associate-user', {
    method: 'POST',
    body: JSON.stringify({ clinicId }),
  });
  return response.data;
}

/**
 * Get clinic statistics
 */
export async function getClinicStats(clinicId: string): Promise<ClinicStats> {
  const response = await apiCall<ClinicStats>(`/clinics/${clinicId}/stats`);
  return response.data;
}

/**
 * Get clinic settings
 */
export async function getClinicSettings(clinicId: string): Promise<ClinicSettings> {
  const response = await apiCall<ClinicSettings>(`/clinics/${clinicId}/settings`);
  return response.data;
}

/**
 * Update clinic settings
 */
export async function updateClinicSettings(
  clinicId: string, 
  settings: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  const response = await apiCall<ClinicSettings>(`/clinics/${clinicId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return response.data;
}

/**
 * Get active locations for a clinic
 */
export async function getActiveLocations(clinicId: string): Promise<ClinicLocation[]> {
  const response = await apiCall<ClinicLocation[]>(`/clinics/${clinicId}/locations/active`);
  return response.data;
}

/**
 * Generate clinic token
 */
export async function generateClinicToken(clinicId: string): Promise<{ token: string }> {
  const response = await apiCall<{ token: string }>(`/clinics/${clinicId}/token`);
  return response.data;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get clinic statistics summary
 */
export interface ClinicStatsSummary {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activeLocations: number;
  completionRate: number;
}

export async function getClinicStatsSummary(clinicId: string): Promise<ClinicStatsSummary> {
  const stats = await getClinicStats(clinicId);
  
  return {
    totalUsers: stats.totalUsers || 0,
    totalDoctors: stats.totalDoctors || 0,
    totalPatients: stats.totalPatients || 0,
    totalAppointments: stats.totalAppointments || 0,
    activeLocations: stats.activeLocations || 0,
    completionRate: stats.completionRate || 0,
  };
}

/**
 * Check if user has clinic permissions
 */
export async function hasClinicPermission(clinicId: string): Promise<boolean> {
  try {
    await getClinicById(clinicId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format clinic address for display
 */
export function formatClinicAddress(clinic: ClinicWithRelations): string {
  const parts = [
    clinic.address,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Get clinic status color for UI
 */
export function getClinicStatusColor(isActive: boolean): string {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
}

/**
 * Get clinic type display name
 */
export function getClinicTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    'GENERAL': 'General Clinic',
    'SPECIALTY': 'Specialty Clinic',
    'HOSPITAL': 'Hospital',
    'DIAGNOSTIC': 'Diagnostic Center',
    'REHABILITATION': 'Rehabilitation Center',
  };
  
  return typeNames[type] || type;
}

/**
 * Validate clinic data before submission
 */
export function validateClinicData(data: CreateClinicData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Clinic name is required');
  }
  
  if (!data.email?.trim()) {
    errors.push('Clinic email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.phone?.trim()) {
    errors.push('Clinic phone is required');
  }
  
  if (!data.address?.trim()) {
    errors.push('Clinic address is required');
  }
  
  if (!data.app_name?.trim()) {
    errors.push('App name is required');
  } else if (!/^[a-z0-9-]+$/.test(data.app_name)) {
    errors.push('App name can only contain lowercase letters, numbers, and hyphens');
  }
  
  if (!data.subdomain?.trim()) {
    errors.push('Subdomain is required');
  } else if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
    errors.push('Subdomain can only contain lowercase letters, numbers, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate clinic location data
 */
export function validateClinicLocationData(data: CreateClinicLocationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Location name is required');
  }
  
  if (!data.address?.trim()) {
    errors.push('Location address is required');
  }
  
  if (!data.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!data.state?.trim()) {
    errors.push('State is required');
  }
  
  if (!data.country?.trim()) {
    errors.push('Country is required');
  }
  
  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  }
  
  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 