'use server';

// ✅ User actions for frontend, matching backend endpoints
// Follows SOLID, DRY, KISS principles with consistent error handling and logging

import { authenticatedApi, getServerSession } from './auth.server';
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

async function requestUserApi<T>(
  endpoint: string,
  options: RequestInit & { omitClinicId?: boolean } = {}
): Promise<T> {
  const { data } = await authenticatedApi<T>(endpoint, {
    ...options,
    omitClinicId: options.omitClinicId ?? true,
  });
  return data;
}

export async function getUserProfile() {
  return executeAction('getUserProfile', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.PROFILE, { method: 'GET' });
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

    logger.debug('[updateUserProfile] Using profile completion endpoint (accessible to all authenticated users)');

    // Use the profile-completion endpoint which is accessible to all authenticated users
    // including PATIENT role. The users/UPDATE endpoint requires RbacGuard with ownership.
    const { data } = await authenticatedApi(API_ENDPOINTS.PROFILE_COMPLETION.UPDATE, {
      method: 'POST',
      body: JSON.stringify(profileData)
    });

    // Profile-completion endpoint returns: { success, message, user }
    // where user contains { isProfileComplete, profileComplete, ... }
    logger.info('[updateUserProfile] Raw backend response:', {
      dataType: typeof data,
      dataKeys: data && typeof data === 'object' ? Object.keys(data as Record<string, unknown>).slice(0, 20) : undefined,
    });

    const responseData = (typeof data === 'object' && data !== null) ? (data as Record<string, unknown>) : undefined;
    const responseUser =
      responseData && typeof responseData.user === 'object' && responseData.user !== null
        ? (responseData.user as Record<string, unknown>)
        : undefined;

    if (responseUser) {
      const secure = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      };
      const explicitProfileComplete =
        typeof responseUser.profileComplete === 'boolean'
          ? responseUser.profileComplete
          : typeof responseUser.isProfileComplete === 'boolean'
            ? responseUser.isProfileComplete
            : typeof responseUser.requiresProfileCompletion === 'boolean'
              ? !responseUser.requiresProfileCompletion
              : undefined;
      const firstName = typeof responseUser.firstName === 'string' ? responseUser.firstName.trim() : '';
      const lastName = typeof responseUser.lastName === 'string' ? responseUser.lastName.trim() : '';
      const userName =
        typeof responseUser.name === 'string' && responseUser.name.trim()
          ? responseUser.name.trim()
          : [firstName, lastName].filter(Boolean).join(' ').trim();
      const verifiedPhone = typeof responseUser.phone === 'string' ? responseUser.phone.trim() : '';

      if (firstName) cookieStore.set({ name: 'first_name', value: firstName, ...cookieOptions });
      if (lastName) cookieStore.set({ name: 'last_name', value: lastName, ...cookieOptions });
      if (userName) cookieStore.set({ name: 'user_name', value: userName, ...cookieOptions });
      if (verifiedPhone) cookieStore.set({ name: 'verified_phone', value: verifiedPhone, ...cookieOptions });
      if (explicitProfileComplete !== undefined) {
        cookieStore.set({
          name: 'profile_complete',
          value: explicitProfileComplete.toString(),
          ...cookieOptions,
        });
      }
    }

    // Extract profile completion status from user object
    const isProfileComplete =
      typeof responseUser?.profileComplete === 'boolean'
        ? responseUser.profileComplete
        : typeof responseUser?.isProfileComplete === 'boolean'
          ? responseUser.isProfileComplete
          : typeof responseUser?.requiresProfileCompletion === 'boolean'
            ? !responseUser.requiresProfileCompletion
            : undefined;

    logger.info('[updateUserProfile] Profile completion result:', {
      success: responseData?.success,
      isProfileComplete,
      responseUserKeys: responseUser ? Object.keys(responseUser).slice(0, 10) : undefined,
      responseUserProfileComplete: responseUser?.profileComplete,
      responseUserIsProfileComplete: responseUser?.isProfileComplete,
    });

    return {
      success: responseData?.success === true,
      message: responseData?.message as string | undefined,
      profileComplete: isProfileComplete === true,
      user: responseUser,
    };
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    logger.error('[updateUserProfile] ===== ERROR CAUGHT =====', {
      error: errorMessage,
      originalError: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });

    // Extract validation errors from nested error structures (ApiError, details, errors, etc.)
    const extractValidationErrors = (obj: unknown): Array<{ field: string; constraints: Record<string, string> }> | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;

      const record = obj as Record<string, unknown>;

      // Check for validationErrors array
      if (Array.isArray(record.validationErrors)) {
        return record.validationErrors as Array<{ field: string; constraints: Record<string, string> }>;
      }

      // Check for errors array (common pattern)
      if (Array.isArray(record.errors)) {
        const errors = record.errors as Array<Record<string, unknown>>;
        if (errors.length > 0 && typeof errors[0] === 'object') {
          return errors.map((e) => ({
            field: String(e.field || e.property || ''),
            constraints: (e.constraints as Record<string, string>) || { message: String(e.message || 'Invalid value') }
          }));
        }
      }

      // Check for details nested object
      if (record.details && typeof record.details === 'object') {
        return extractValidationErrors(record.details);
      }

      // Check for response nested object (from axios-style errors)
      if (record.response && typeof record.response === 'object') {
        return extractValidationErrors(record.response);
      }

      // Check for data nested object
      if (record.data && typeof record.data === 'object') {
        return extractValidationErrors(record.data);
      }

      return undefined;
    };

    const validationErrors = extractValidationErrors(error);

    return {
      success: false,
      error: errorMessage,
      ...(validationErrors && validationErrors.length > 0 ? { validationErrors } : {}),
    };
  }
}

export async function getUserById(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getUserById', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.GET_BY_ID(id), { method: 'GET' });
  }, { userId: id });
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('updateUser', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }, { userId: id });
}

export async function deleteUser(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('deleteUser', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.DELETE(id), { method: 'DELETE' });
  }, { userId: id });
}

export async function getAllUsers() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getAllUsers', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.GET_ALL, { method: 'GET' });
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
  clinicId?: string;
  specialization?: string;
  experience?: number;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  medicalConditions?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    policyHolder?: string;
    relationship?: string;
    coverageDetails?: string;
    expiryDate?: string;
    status?: string;
  }[];
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('createUser', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.BASE, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }, { email: userData.email, role: userData.role });
}

/**
 * Update user role
 * clinicId required when caller is clinic admin
 */
export async function updateUserRole(
  userId: string,
  role: string,
  options?: { clinicId?: string; locationId?: string; permissions?: string[] }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('updateUserRole', async () => {
    const body: { role: string; clinicId?: string; locationId?: string; permissions?: string[] } = { role };
    if (options?.clinicId) body.clinicId = options.clinicId;
    if (options?.locationId) body.locationId = options.locationId;
    if (options?.permissions) body.permissions = options.permissions;
    return await requestUserApi(API_ENDPOINTS.USERS.UPDATE_ROLE(userId), {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }, { userId, role });
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getUsersByRole', async () => {
    const normalizedRole = role.trim().toUpperCase();
    const roleEndpointMap: Record<string, string> = {
      PATIENT: API_ENDPOINTS.USERS.GET_BY_ROLE.PATIENT,
      DOCTOR: API_ENDPOINTS.USERS.GET_BY_ROLE.DOCTORS,
      ASSISTANT_DOCTOR: API_ENDPOINTS.USERS.GET_BY_ROLE.DOCTORS,
      RECEPTIONIST: API_ENDPOINTS.USERS.GET_BY_ROLE.RECEPTIONISTS,
      CLINIC_ADMIN: API_ENDPOINTS.USERS.GET_BY_ROLE.CLINIC_ADMINS,
    };

    const endpoint = roleEndpointMap[normalizedRole];
    if (endpoint) {
      return await requestUserApi(endpoint, { method: 'GET' });
    }

    const params = new URLSearchParams({ q: '', roles: role });
    return await requestUserApi(`${API_ENDPOINTS.USERS.SEARCH}?${params.toString()}`, { method: 'GET' });
  }, { role });
}

/**
 * Get users by clinic
 */
export async function getUsersByClinic(clinicId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('searchUsers', async () => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return await requestUserApi(`${API_ENDPOINTS.USERS.SEARCH}?${params.toString()}`, { method: 'GET' });
  }, { query, filters });
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getUserStats', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.STATS, { method: 'GET' });
  });
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(userIds: string[], updates: Record<string, string | number | boolean>) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('bulkUpdateUsers', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.BULK_UPDATE, {
      method: 'PATCH',
      body: JSON.stringify({ userIds, updates })
    });
  }, { userIdsCount: userIds.length });
}

/**
 * Export users data
 */
export async function exportUsers(format: 'csv' | 'excel' = 'csv', filters?: Record<string, string | number | boolean>) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('exportUsers', async () => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return await requestUserApi(`${API_ENDPOINTS.USERS.EXPORT}?${params.toString()}`, { method: 'GET' });
  }, { format });
}

/**
 * Change user password (admin action)
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('changeUserPassword', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.CHANGE_PASSWORD(userId), {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword })
    });
  }, { userId });
}

/**
 * Toggle user verification status
 */
export async function toggleUserVerification(userId: string, isVerified: boolean) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('toggleUserVerification', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.TOGGLE_VERIFICATION(userId), {
      method: 'PATCH',
      body: JSON.stringify({ isVerified })
    });
  }, { userId, isVerified });
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(userId: string, limit: number = 50) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getUserActivityLogs', async () => {
    return await requestUserApi(`${API_ENDPOINTS.USERS.ACTIVITY_LOGS(userId)}?limit=${limit}`, { method: 'GET' });
  }, { userId, limit });
}

/**
 * Get user sessions
 */
export async function getUserSessions(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('getUserSessions', async () => {
    // SESSIONS is an object, use GET_ALL and pass userId as query param
    return await requestUserApi(`${API_ENDPOINTS.USERS.SESSIONS.GET_ALL}?userId=${userId}`, { method: 'GET' });
  }, { userId });
}

/**
 * Terminate user session
 */
export async function terminateUserSession(userId: string, sessionId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('terminateUserSession', async () => {
    // TERMINATE_SESSION takes only sessionId
    return await requestUserApi(API_ENDPOINTS.USERS.TERMINATE_SESSION(sessionId), { method: 'DELETE' });
  }, { userId, sessionId });
}

/**
 * Change user location
 */
export async function changeUserLocation(userId: string, locationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return executeAction('changeUserLocation', async () => {
    return await requestUserApi(API_ENDPOINTS.USERS.CHANGE_LOCATION(userId), {
      method: 'POST',
      body: JSON.stringify({ locationId })
    });
  }, { userId, locationId });
}
