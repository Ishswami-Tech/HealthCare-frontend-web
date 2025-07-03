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
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID;

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
    'X-Session-ID': session.session_id,
    ...(CLINIC_ID ? { 'X-Clinic-ID': CLINIC_ID } : {}),
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
  const response = await apiCall<ClinicWithRelations>(`/clinics`, {
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
  if (!id) throw new Error('Clinic ID is required');
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
  data: CreateClinicLocationData,
  
): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${CLINIC_ID}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get all locations for a clinic
 */
export async function getClinicLocations(): Promise<ClinicLocation[]> {
  const response = await apiCall<ClinicLocation[]>(`/clinics/${CLINIC_ID}/locations`);
  return response.data;
}

/**
 * Get clinic location by ID
 */
export async function getClinicLocationById(locationId: string): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${CLINIC_ID}/locations/${locationId}`);
  return response.data;
}

/**
 * Update clinic location
 */
export async function updateClinicLocation(locationId: string, data: UpdateClinicLocationData): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/${CLINIC_ID}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete clinic location
 */
export async function deleteClinicLocation(locationId: string): Promise<{ message: string }> {
  const response = await apiCall<{ message: string }>(`/clinics/${CLINIC_ID}/locations/${locationId}`, {
    method: 'DELETE',
  });
  return response.data;
}

/**
 * Generate QR code for clinic location
 */
export async function generateLocationQR(locationId: string): Promise<{ qrCode: string }> {
  const response = await apiCall<{ qrCode: string }>(`/clinics/${CLINIC_ID}/locations/${locationId}/qr`);
  return response.data;
}

/**
 * Verify location QR code
 */
export async function verifyLocationQR(qrData: string): Promise<ClinicLocation> {
  const response = await apiCall<ClinicLocation>(`/clinics/locations/verify-qr`, {
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
  const response = await apiCall<ClinicUser>(`/clinics/admin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get clinic doctors
 */
export async function getClinicDoctors(): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${CLINIC_ID}/doctors`);
  return response.data;
}

/**
 * Get clinic patients
 */
export async function getClinicPatients(): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${CLINIC_ID}/patients`);
  return response.data;
}

/**
 * Register patient to clinic
 */
export async function registerPatientToClinic(data: RegisterPatientData): Promise<ClinicUser> {
  const response = await apiCall<ClinicUser>(`/clinics/register-patient`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get clinic users by role
 */
export async function getClinicUsersByRole(role: string): Promise<ClinicUser[]> {
  const response = await apiCall<ClinicUser[]>(`/clinics/${CLINIC_ID}/users/role/${role}`);
  return response.data;
}

// ===== CLINIC UTILITIES =====

/**
 * Validate app name availability
 */
export async function validateAppName(appName: string): Promise<{ available: boolean; message?: string }> {
  const response = await apiCall<{ available: boolean; message?: string }>(`/clinics/validate-app-name`, {
    method: 'POST',
    body: JSON.stringify({ appName }),
  });
  return response.data;
}

/**
 * Associate user with clinic
 */
export async function associateUserWithClinic(): Promise<{ message: string }> {
  const response = await apiCall<{ message: string }>(`/clinics/associate-user`, {
    method: 'POST',
    body: JSON.stringify({ clinicId: CLINIC_ID }),
  });
  return response.data;
}

/**
 * Get clinic statistics
 */
export async function getClinicStats(): Promise<ClinicStats> {
  const response = await apiCall<ClinicStats>(`/clinics/${CLINIC_ID}/stats`);
  return response.data;
}

/**
 * Get clinic settings
 */
export async function getClinicSettings(): Promise<ClinicSettings> {
  const response = await apiCall<ClinicSettings>(`/clinics/${CLINIC_ID}/settings`);
  return response.data;
}

/**
 * Update clinic settings
 */
export async function updateClinicSettings(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const response = await apiCall<ClinicSettings>(`/clinics/${CLINIC_ID}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return response.data;
}

/**
 * Get active locations for a clinic
 */
export async function getActiveLocations(): Promise<ClinicLocation[]> {
  const response = await apiCall<ClinicLocation[]>(`/clinics/${CLINIC_ID}/locations/active`);
  return response.data;
}

/**
 * Generate clinic token
 */
export async function generateClinicToken(): Promise<{ token: string }> {
  const response = await apiCall<{ token: string }>(`/clinics/${CLINIC_ID}/token`);
  return response.data;
}


