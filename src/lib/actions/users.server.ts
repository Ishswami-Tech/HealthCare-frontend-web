'use server';

// User actions for frontend, matching backend endpoints
import { authenticatedApi } from './auth.server';

export async function getUserProfile() {
  const { data } = await authenticatedApi(`/user/profile`, { method: 'GET' });
  return data;
}

export async function updateUserProfile(profileData: Record<string, unknown>) {
  const { data } = await authenticatedApi(`/user/profile`, { method: 'PATCH', body: JSON.stringify(profileData) });
  return { status: 200, data: data };
}

export async function getUserById(id: string) {
  const { data } = await authenticatedApi(`/user/${id}`, { method: 'GET' });
  return data;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const { data: updatedData } = await authenticatedApi(`/user/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return updatedData;
}

export async function deleteUser(id: string) {
  const { data } = await authenticatedApi(`/user/${id}`, { method: 'DELETE' });
  return data;
}

export async function getAllUsers() {
  const { data } = await authenticatedApi(`/user/all`, { method: 'GET' });
  return data;
}

export async function getPatients() {
  const { data } = await authenticatedApi(`/user/role/patient`, { method: 'GET' });
  return data;
}

export async function getDoctors() {
  const { data } = await authenticatedApi(`/user/role/doctors`, { method: 'GET' });
  return data;
}

export async function getReceptionists() {
  const { data } = await authenticatedApi(`/user/role/receptionists`, { method: 'GET' });
  return data;
}

export async function getClinicAdmins() {
  const { data } = await authenticatedApi(`/user/role/clinic-admins`, { method: 'GET' });
  return data;
}

// ===== ENHANCED USER MANAGEMENT ACTIONS =====

/**
 * Create a new user
 */
export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}) {
  const { data } = await authenticatedApi('/user', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  return data;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string) {
  const { data } = await authenticatedApi(`/user/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
  return data;
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  const { data } = await authenticatedApi(`/user/role/${role}`, { method: 'GET' });
  return data;
}

/**
 * Get users by clinic
 */
export async function getUsersByClinic(clinicId: string) {
  const { data } = await authenticatedApi(`/user/clinic/${clinicId}`, { method: 'GET' });
  return data;
}

/**
 * Search users
 */
export async function searchUsers(query: string, filters?: {
  role?: string;
  clinicId?: string;
  isVerified?: boolean;
}) {
  const params = new URLSearchParams({ q: query });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const { data } = await authenticatedApi(`/user/search?${params.toString()}`, { method: 'GET' });
  return data;
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const { data } = await authenticatedApi('/user/stats', { method: 'GET' });
  return data;
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(userIds: string[], updates: Record<string, string | number | boolean>) {
  const { data } = await authenticatedApi('/user/bulk-update', {
    method: 'PATCH',
    body: JSON.stringify({ userIds, updates })
  });
  return data;
}

/**
 * Export users data
 */
export async function exportUsers(format: 'csv' | 'excel' = 'csv', filters?: Record<string, string | number | boolean>) {
  const params = new URLSearchParams({ format });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const { data } = await authenticatedApi(`/user/export?${params.toString()}`, { method: 'GET' });
  return data;
}

/**
 * Change user password (admin action)
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  const { data } = await authenticatedApi(`/user/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password: newPassword })
  });
  return data;
}

/**
 * Toggle user verification status
 */
export async function toggleUserVerification(userId: string, isVerified: boolean) {
  const { data } = await authenticatedApi(`/user/${userId}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ isVerified })
  });
  return data;
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(userId: string, limit: number = 50) {
  const { data } = await authenticatedApi(`/user/${userId}/activity?limit=${limit}`, { method: 'GET' });
  return data;
}

/**
 * Get user sessions
 */
export async function getUserSessions(userId: string) {
  const { data } = await authenticatedApi(`/user/${userId}/sessions`, { method: 'GET' });
  return data;
}

/**
 * Terminate user session
 */
export async function terminateUserSession(userId: string, sessionId: string) {
  const { data } = await authenticatedApi(`/user/${userId}/sessions/${sessionId}`, { method: 'DELETE' });
  return data;
}