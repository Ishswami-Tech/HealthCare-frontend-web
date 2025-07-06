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
import { authenticatedApi } from './auth.server';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID;

// ===== CLINIC CRUD OPERATIONS =====

/**
 * Create a new clinic
 */
export async function createClinic(data: CreateClinicData): Promise<ClinicWithRelations> {
  const { data: result } = await authenticatedApi<ClinicWithRelations>(`/clinics`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Get all clinics for the authenticated user
 */
export async function getAllClinics(): Promise<ClinicWithRelations[]> {
  const { data } = await authenticatedApi<ClinicWithRelations[]>('/clinics');
  return data;
}

/**
 * Get clinic by ID
 */
export async function getClinicById(id: string): Promise<ClinicWithRelations> {
  if (!id) throw new Error('Clinic ID is required');
  const { data } = await authenticatedApi<ClinicWithRelations>(`/clinics/${id}`);
  return data;
}

/**
 * Get clinic by app name
 */
export async function getClinicByAppName(appName: string): Promise<ClinicWithRelations> {
  const { data } = await authenticatedApi<ClinicWithRelations>(`/clinics/app/${appName}`);
  return data;
}

/**
 * Update clinic
 */
export async function updateClinic(id: string, data: UpdateClinicData): Promise<ClinicWithRelations> {
  const { data: result } = await authenticatedApi<ClinicWithRelations>(`/clinics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Delete clinic
 */
export async function deleteClinic(id: string): Promise<{ message: string }> {
  const { data } = await authenticatedApi<{ message: string }>(`/clinics/${id}`, {
    method: 'DELETE',
  });
  return data;
}

// ===== CLINIC LOCATION OPERATIONS =====

/**
 * Create a new clinic location
 */
export async function createClinicLocation(
  data: CreateClinicLocationData,
  
): Promise<ClinicLocation> {
  const { data: result } = await authenticatedApi<ClinicLocation>(`/clinics/${CLINIC_ID}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Get all locations for a clinic
 */
export async function getClinicLocations(): Promise<ClinicLocation[]> {
  const { data } = await authenticatedApi<ClinicLocation[]>(`/clinics/${CLINIC_ID}/locations`);
  return data;
}

/**
 * Get clinic location by ID
 */
export async function getClinicLocationById(locationId: string): Promise<ClinicLocation> {
  const { data } = await authenticatedApi<ClinicLocation>(`/clinics/${CLINIC_ID}/locations/${locationId}`);
  return data;
}

/**
 * Update clinic location
 */
export async function updateClinicLocation(locationId: string, data: UpdateClinicLocationData): Promise<ClinicLocation> {
  const { data: result } = await authenticatedApi<ClinicLocation>(`/clinics/${CLINIC_ID}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Delete clinic location
 */
export async function deleteClinicLocation(locationId: string): Promise<{ message: string }> {
  const { data } = await authenticatedApi<{ message: string }>(`/clinics/${CLINIC_ID}/locations/${locationId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Generate QR code for clinic location
 */
export async function generateLocationQR(locationId: string): Promise<{ qrCode: string }> {
  const { data } = await authenticatedApi<{ qrCode: string }>(`/clinics/${CLINIC_ID}/locations/${locationId}/qr`);
  return data;
}

/**
 * Verify location QR code
 */
export async function verifyLocationQR(qrData: string): Promise<ClinicLocation> {
  const { data } = await authenticatedApi<ClinicLocation>(`/clinics/locations/verify-qr`, {
    method: 'POST',
    body: JSON.stringify({ qrData }),
  });
  return data;
}

// ===== CLINIC USER MANAGEMENT =====

/**
 * Assign clinic admin
 */
export async function assignClinicAdmin(data: AssignClinicAdminData): Promise<ClinicUser> {
  const { data: result } = await authenticatedApi<ClinicUser>(`/clinics/admin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Get clinic doctors
 */
export async function getClinicDoctors(): Promise<ClinicUser[]> {
  const { data } = await authenticatedApi<ClinicUser[]>(`/clinics/${CLINIC_ID}/doctors`);
  return data;
}

/**
 * Get clinic patients
 */
export async function getClinicPatients(): Promise<ClinicUser[]> {
  const { data } = await authenticatedApi<ClinicUser[]>(`/clinics/${CLINIC_ID}/patients`);
  return data;
}

/**
 * Register patient to clinic
 */
export async function registerPatientToClinic(data: RegisterPatientData): Promise<ClinicUser> {
  const { data: result } = await authenticatedApi<ClinicUser>(`/clinics/register-patient`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Get clinic users by role
 */
export async function getClinicUsersByRole(role: string): Promise<ClinicUser[]> {
  const { data } = await authenticatedApi<ClinicUser[]>(`/clinics/${CLINIC_ID}/users/role/${role}`);
  return data;
}

// ===== CLINIC UTILITIES =====

/**
 * Validate app name availability
 */
export async function validateAppName(appName: string): Promise<{ available: boolean; message?: string }> {
  const { data } = await authenticatedApi<{ available: boolean; message?: string }>(`/clinics/validate-app-name`, {
    method: 'POST',
    body: JSON.stringify({ appName }),
  });
  return data;
}

/**
 * Associate user with clinic
 */
export async function associateUserWithClinic(): Promise<{ message: string }> {
  const { data } = await authenticatedApi<{ message: string }>(`/clinics/associate-user`, {
    method: 'POST',
    body: JSON.stringify({ clinicId: CLINIC_ID }),
  });
  return data;
}

/**
 * Get clinic statistics
 */
export async function getClinicStats(): Promise<ClinicStats> {
  const { data } = await authenticatedApi<ClinicStats>(`/clinics/${CLINIC_ID}/stats`);
  return data;
}

/**
 * Get clinic settings
 */
export async function getClinicSettings(): Promise<ClinicSettings> {
  const { data } = await authenticatedApi<ClinicSettings>(`/clinics/${CLINIC_ID}/settings`);
  return data;
}

/**
 * Update clinic settings
 */
export async function updateClinicSettings(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const { data: result } = await authenticatedApi<ClinicSettings>(`/clinics/${CLINIC_ID}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return result;
}

/**
 * Get active locations for a clinic
 */
export async function getActiveLocations(): Promise<ClinicLocation[]> {
  const { data } = await authenticatedApi<ClinicLocation[]>(`/clinics/${CLINIC_ID}/locations/active`);
  return data;
}

/**
 * Generate clinic token
 */
export async function generateClinicToken(): Promise<{ token: string }> {
  const { data } = await authenticatedApi<{ token: string }>(`/clinics/${CLINIC_ID}/token`);
  return data;
}


