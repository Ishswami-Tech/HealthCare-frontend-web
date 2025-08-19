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
 * Get current user's clinic
 */
export async function getMyClinic(): Promise<ClinicWithRelations> {
  const { data } = await authenticatedApi<ClinicWithRelations>('/clinics/my-clinic');
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

// ===== ENHANCED CLINIC MANAGEMENT =====

/**
 * Get clinic analytics
 */
export async function getClinicAnalytics(clinicId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/analytics?period=${period}`);
  return data;
}

/**
 * Get clinic performance metrics
 */
export async function getClinicPerformanceMetrics(clinicId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const { data } = await authenticatedApi(`/clinics/${clinicId}/performance?${params.toString()}`);
  return data;
}

/**
 * Get clinic inventory
 */
export async function getClinicInventory(clinicId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/inventory`);
  return data;
}

/**
 * Update clinic inventory
 */
export async function updateClinicInventory(clinicId: string, inventoryData: {
  itemId: string;
  quantity: number;
  action: 'add' | 'remove' | 'set';
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/inventory`, {
    method: 'PATCH',
    body: JSON.stringify(inventoryData),
  });
  return data;
}

/**
 * Get clinic staff
 */
export async function getClinicStaff(clinicId: string, role?: string) {
  const params = role ? `?role=${role}` : '';
  const { data } = await authenticatedApi(`/clinics/${clinicId}/staff${params}`);
  return data;
}

/**
 * Add staff to clinic
 */
export async function addClinicStaff(clinicId: string, staffData: {
  userId: string;
  role: string;
  permissions?: string[];
  schedule?: Record<string, string | number | boolean>;
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/staff`, {
    method: 'POST',
    body: JSON.stringify(staffData),
  });
  return data;
}

/**
 * Remove staff from clinic
 */
export async function removeClinicStaff(clinicId: string, userId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/staff/${userId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Update staff permissions
 */
export async function updateStaffPermissions(clinicId: string, userId: string, permissions: string[]) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/staff/${userId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
  return data;
}

/**
 * Get clinic departments
 */
export async function getClinicDepartments(clinicId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/departments`);
  return data;
}

/**
 * Create clinic department
 */
export async function createClinicDepartment(clinicId: string, departmentData: {
  name: string;
  description?: string;
  headOfDepartment?: string;
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/departments`, {
    method: 'POST',
    body: JSON.stringify(departmentData),
  });
  return data;
}

/**
 * Get clinic services
 */
export async function getClinicServices(clinicId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/services`);
  return data;
}

/**
 * Create clinic service
 */
export async function createClinicService(clinicId: string, serviceData: {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/services`, {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
  return data;
}

/**
 * Update clinic service
 */
export async function updateClinicService(clinicId: string, serviceId: string, serviceData: Partial<{
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  isActive: boolean;
}>) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(serviceData),
  });
  return data;
}

/**
 * Get clinic equipment
 */
export async function getClinicEquipment(clinicId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/equipment`);
  return data;
}

/**
 * Add clinic equipment
 */
export async function addClinicEquipment(clinicId: string, equipmentData: {
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'retired';
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/equipment`, {
    method: 'POST',
    body: JSON.stringify(equipmentData),
  });
  return data;
}

/**
 * Update equipment status
 */
export async function updateEquipmentStatus(clinicId: string, equipmentId: string, status: 'active' | 'maintenance' | 'retired') {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/equipment/${equipmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data;
}