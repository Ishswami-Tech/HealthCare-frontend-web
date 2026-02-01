'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== STAFF MANAGEMENT ACTIONS =====

/**
 * Get all staff members (Receptionists, Nurses, Clinic Admins)
 */
export async function getAllStaff(filters?: {
  role?: 'RECEPTIONIST' | 'CLINIC_ADMIN' | 'NURSE';
}) {
  const params = new URLSearchParams();
  if (filters?.role) {
    params.append('role', filters.role);
  }

  const endpoint = `${API_ENDPOINTS.STAFF.GET_ALL}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get staff member by ID
 */
export async function getStaffById(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.STAFF.GET_BY_ID(id));
  return data;
}

/**
 * Create or Update Staff Profile
 */
export async function createStaff(staffData: {
  userId: string;
  role: 'RECEPTIONIST' | 'CLINIC_ADMIN' | 'NURSE';
  department?: string;
  employeeId?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.STAFF.CREATE, {
    method: 'POST',
    body: JSON.stringify(staffData),
  });
  return data;
}
