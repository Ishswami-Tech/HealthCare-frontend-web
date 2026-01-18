'use server';

// ✅ User actions for frontend, matching backend endpoints
// Follows SOLID, DRY, KISS principles with consistent error handling and logging

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { logger } from '@/lib/utils/logger';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';

// ✅ Helper function to wrap actions with consistent error handling and logging
async function executeAction<T>(
  operationName: string,
  action: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    logger.debug(`[${operationName}] Starting`, context || {});
    const result = await action();
    logger.info(`[${operationName}] Success`, context || {});
    return result;
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    logger.error(`[${operationName}] Failed`, { 
      ...context, 
      error: errorMessage,
      originalError: error instanceof Error ? error.message : String(error)
    });
    throw new Error(errorMessage);
  }
}

export async function getUserProfile() {
  return executeAction('getUserProfile', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.PROFILE, { method: 'GET' });
    return data;
  });
}

export async function updateUserProfile(profileData: Record<string, unknown>) {
  // Manual implementation to return error object instead of throwing
  // This ensures the client receives the actual error message avoiding Next.js error obscuring
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return { success: false, error: 'No access token found' };
    }
    
    // Decode JWT to get user ID
    const tokenParts = accessToken.split('.');
    if (tokenParts.length < 2 || !tokenParts[1]) {
      return { success: false, error: 'Invalid access token format' };
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;
    
    if (!userId) {
      return { success: false, error: 'User ID not found in token' };
    }

    logger.debug('[updateUserProfile] Extracted userId from token', { userId });
    
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.UPDATE(userId), { 
      method: 'PATCH', 
      body: JSON.stringify(profileData) 
    });
    
    return { success: true, data };
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    logger.error('[updateUserProfile] Failed', { 
      error: errorMessage, 
      originalError: error instanceof Error ? error.message : String(error) 
    });
    return { success: false, error: errorMessage };
  }
}

export async function getUserById(id: string) {
  return executeAction('getUserById', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ID(id), { method: 'GET' });
    return data;
  }, { userId: id });
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  return executeAction('updateUser', async () => {
    const { data: updatedData } = await authenticatedApi(API_ENDPOINTS.USERS.UPDATE(id), { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    });
    return updatedData;
  }, { userId: id });
}

export async function deleteUser(id: string) {
  return executeAction('deleteUser', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.DELETE(id), { method: 'DELETE' });
    return data;
  }, { userId: id });
}

export async function getAllUsers() {
  return executeAction('getAllUsers', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_ALL, { method: 'GET' });
    return data;
  });
}

export async function getPatients() {
  return executeAction('getPatients', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ROLE('patient'), { method: 'GET' });
    return data;
  });
}

export async function getDoctors() {
  return executeAction('getDoctors', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ROLE('doctors'), { method: 'GET' });
    return data;
  });
}

export async function getReceptionists() {
  return executeAction('getReceptionists', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ROLE('receptionists'), { method: 'GET' });
    return data;
  });
}

export async function getClinicAdmins() {
  return executeAction('getClinicAdmins', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ROLE('clinic-admins'), { method: 'GET' });
    return data;
  });
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
  return executeAction('createUser', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.BASE, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data;
  }, { email: userData.email, role: userData.role });
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string) {
  return executeAction('updateUserRole', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.UPDATE_ROLE(userId), {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    return data;
  }, { userId, role });
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  return executeAction('getUsersByRole', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_ROLE(role), { method: 'GET' });
    return data;
  }, { role });
}

/**
 * Get users by clinic
 */
export async function getUsersByClinic(clinicId: string) {
  return executeAction('getUsersByClinic', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_CLINIC(clinicId), { method: 'GET' });
    return data;
  }, { clinicId });
}

/**
 * Search users
 */
export async function searchUsers(query: string, filters?: {
  role?: string;
  clinicId?: string;
  isVerified?: boolean;
}) {
  return executeAction('searchUsers', async () => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const { data } = await authenticatedApi(`${API_ENDPOINTS.USERS.SEARCH}?${params.toString()}`, { method: 'GET' });
    return data;
  }, { query, filters });
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  return executeAction('getUserStats', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.STATS, { method: 'GET' });
    return data;
  });
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(userIds: string[], updates: Record<string, string | number | boolean>) {
  return executeAction('bulkUpdateUsers', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.BULK_UPDATE, {
      method: 'PATCH',
      body: JSON.stringify({ userIds, updates })
    });
    return data;
  }, { userIdsCount: userIds.length });
}

/**
 * Export users data
 */
export async function exportUsers(format: 'csv' | 'excel' = 'csv', filters?: Record<string, string | number | boolean>) {
  return executeAction('exportUsers', async () => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const { data } = await authenticatedApi(`${API_ENDPOINTS.USERS.EXPORT}?${params.toString()}`, { method: 'GET' });
    return data;
  }, { format });
}

/**
 * Change user password (admin action)
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  return executeAction('changeUserPassword', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.CHANGE_PASSWORD(userId), {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword })
    });
    return data;
  }, { userId });
}

/**
 * Toggle user verification status
 */
export async function toggleUserVerification(userId: string, isVerified: boolean) {
  return executeAction('toggleUserVerification', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.TOGGLE_VERIFICATION(userId), {
      method: 'PATCH',
      body: JSON.stringify({ isVerified })
    });
    return data;
  }, { userId, isVerified });
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(userId: string, limit: number = 50) {
  return executeAction('getUserActivityLogs', async () => {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.USERS.ACTIVITY_LOGS(userId)}?limit=${limit}`, { method: 'GET' });
    return data;
  }, { userId, limit });
}

/**
 * Get user sessions
 */
export async function getUserSessions(userId: string) {
  return executeAction('getUserSessions', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.SESSIONS(userId), { method: 'GET' });
    return data;
  }, { userId });
}

/**
 * Terminate user session
 */
export async function terminateUserSession(userId: string, sessionId: string) {
  return executeAction('terminateUserSession', async () => {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.TERMINATE_SESSION(userId, sessionId), { method: 'DELETE' });
    return data;
  }, { userId, sessionId });
}
