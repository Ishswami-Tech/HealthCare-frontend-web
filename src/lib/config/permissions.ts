// Permission validation for healthcare frontend.
// This module delegates authority checks to the backend RBAC layer.

import { authenticatedApi } from '@/lib/actions/auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { Permission } from '@/types/rbac.types';

export interface PermissionCheck {
  userId: string;
  permission: string;
  resource?: string;
  resourceId?: string;
  clinicId?: string;
}

export interface PermissionResult {
  hasAccess: boolean;
  reason?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

function normalizePermissionName(permission: string): string {
  return permission.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function parseDirectPermission(permission: string): { resource: string; action: string } | null {
  const trimmed = permission.trim();
  if (!trimmed) {
    return null;
  }

  const separators = [':', '.'];
  const separator = separators.find((value) => trimmed.includes(value));
  if (!separator) {
    return null;
  }

  const [resourcePart, ...actionParts] = trimmed.split(separator);
  const resource = resourcePart?.trim().toLowerCase();
  const action = actionParts.join(separator).trim().toLowerCase();

  if (!resource || !action) {
    return null;
  }

  return { resource, action };
}

function mapPermissionToResourceAction(permission: string): { resource: string; action: string } {
  const direct = parseDirectPermission(permission);
  if (direct) {
    return direct;
  }

  const mapping: Record<string, { resource: string; action: string }> = {
    VIEW_APPOINTMENTS: { resource: 'appointments', action: 'read' },
    CREATE_APPOINTMENTS: { resource: 'appointments', action: 'create' },
    UPDATE_APPOINTMENTS: { resource: 'appointments', action: 'update' },
    DELETE_APPOINTMENTS: { resource: 'appointments', action: 'delete' },
    MANAGE_APPOINTMENT_QUEUE: { resource: 'queue', action: '*' },
    VIEW_ALL_APPOINTMENTS: { resource: 'appointments', action: 'read' },

    VIEW_VIDEO_APPOINTMENTS: { resource: 'video', action: 'read' },
    CREATE_VIDEO_APPOINTMENTS: { resource: 'video', action: 'create' },
    UPDATE_VIDEO_APPOINTMENTS: { resource: 'video', action: 'update' },
    DELETE_VIDEO_APPOINTMENTS: { resource: 'video', action: 'update' },
    JOIN_VIDEO_APPOINTMENTS: { resource: 'video', action: 'update' },
    END_VIDEO_APPOINTMENTS: { resource: 'video', action: 'update' },
    VIEW_VIDEO_RECORDINGS: { resource: 'video', action: 'read' },
    MANAGE_VIDEO_SETTINGS: { resource: 'video', action: '*' },

    VIEW_PATIENTS: { resource: 'patients', action: 'read' },
    CREATE_PATIENTS: { resource: 'patients', action: 'create' },
    UPDATE_PATIENTS: { resource: 'patients', action: 'update' },
    DELETE_PATIENTS: { resource: 'patients', action: 'delete' },
    VIEW_PATIENT_RECORDS: { resource: 'medical-records', action: 'read' },
    UPDATE_PATIENT_RECORDS: { resource: 'medical-records', action: 'update' },
    VIEW_PATIENT_MEDICAL_RECORDS: { resource: 'medical-records', action: 'read' },
    CREATE_PATIENT_MEDICAL_RECORDS: { resource: 'medical-records', action: 'create' },
    UPDATE_PATIENT_MEDICAL_RECORDS: { resource: 'medical-records', action: 'update' },

    VIEW_DOCTORS: { resource: 'users', action: 'read' },
    CREATE_DOCTORS: { resource: 'users', action: 'create' },
    UPDATE_DOCTORS: { resource: 'users', action: 'update' },
    DELETE_DOCTORS: { resource: 'users', action: 'delete' },
    MANAGE_DOCTOR_SCHEDULES: { resource: 'scheduling', action: '*' },
    MANAGE_DOCTOR_SCHEDULE: { resource: 'scheduling', action: '*' },

    VIEW_CLINICS: { resource: 'clinics', action: 'read' },
    CREATE_CLINICS: { resource: 'clinics', action: 'create' },
    UPDATE_CLINICS: { resource: 'clinics', action: 'update' },
    DELETE_CLINICS: { resource: 'clinics', action: 'delete' },
    MANAGE_CLINIC_SETTINGS: { resource: 'clinics', action: '*' },
    MANAGE_CLINIC_STAFF: { resource: 'users', action: 'update' },
    MANAGE_CLINIC_SETTINGS_ADVANCED: { resource: 'clinics', action: '*' },

    VIEW_USERS: { resource: 'users', action: 'read' },
    CREATE_USERS: { resource: 'users', action: 'create' },
    UPDATE_USERS: { resource: 'users', action: 'update' },
    DELETE_USERS: { resource: 'users', action: 'delete' },
    MANAGE_USER_ROLES: { resource: 'users', action: '*' },
    VIEW_USER_SESSIONS: { resource: 'users', action: 'read' },

    VIEW_ANALYTICS: { resource: 'reports', action: 'read' },
    VIEW_CLINIC_ANALYTICS: { resource: 'reports', action: 'read' },
    VIEW_DOCTOR_ANALYTICS: { resource: 'reports', action: 'read' },
    VIEW_PATIENT_ANALYTICS: { resource: 'reports', action: 'read' },
    VIEW_REVENUE_ANALYTICS: { resource: 'billing', action: 'read' },
    EXPORT_ANALYTICS: { resource: 'reports', action: 'export' },

    VIEW_QUEUE: { resource: 'queue', action: 'read' },
    MANAGE_QUEUE: { resource: 'queue', action: '*' },
    ADD_TO_QUEUE: { resource: 'queue', action: 'create' },
    REMOVE_FROM_QUEUE: { resource: 'queue', action: 'delete' },
    CALL_NEXT_PATIENT: { resource: 'queue', action: 'update' },
    UPDATE_QUEUE_STATUS: { resource: 'queue', action: 'update' },

    VIEW_MEDICAL_RECORDS: { resource: 'medical-records', action: 'read' },
    CREATE_MEDICAL_RECORDS: { resource: 'medical-records', action: 'create' },
    UPDATE_MEDICAL_RECORDS: { resource: 'medical-records', action: 'update' },
    DELETE_MEDICAL_RECORDS: { resource: 'medical-records', action: 'delete' },
    VIEW_ALL_MEDICAL_RECORDS: { resource: 'medical-records', action: 'read' },

    VIEW_PHARMACY: { resource: 'prescriptions', action: 'read' },
    MANAGE_MEDICINES: { resource: 'prescriptions', action: '*' },
    MANAGE_PRESCRIPTIONS: { resource: 'prescriptions', action: '*' },
    MANAGE_INVENTORY: { resource: 'prescriptions', action: '*' },
    DISPENSE_MEDICINES: { resource: 'prescriptions', action: 'update' },

    VIEW_NOTIFICATIONS: { resource: 'notifications', action: 'read' },
    SEND_NOTIFICATIONS: { resource: 'notifications', action: 'create' },
    MANAGE_NOTIFICATION_SETTINGS: { resource: 'notifications', action: '*' },
    MANAGE_NOTIFICATION_TEMPLATES: { resource: 'notifications', action: '*' },
    SEND_BULK_NOTIFICATIONS: { resource: 'notifications', action: 'create' },

    VIEW_SETTINGS: { resource: 'settings', action: 'read' },
    UPDATE_SETTINGS: { resource: 'settings', action: 'update' },
    MANAGE_SYSTEM_SETTINGS: { resource: 'settings', action: '*' },
    MANAGE_USER_SETTINGS: { resource: 'settings', action: 'update' },

    VIEW_REPORTS: { resource: 'reports', action: 'read' },
    GENERATE_REPORTS: { resource: 'reports', action: 'create' },
    EXPORT_REPORTS: { resource: 'reports', action: 'export' },
    SCHEDULE_REPORTS: { resource: 'reports', action: '*' },

    VIEW_BILLING: { resource: 'billing', action: 'read' },
    MANAGE_BILLING: { resource: 'billing', action: '*' },
    CREATE_BILLS: { resource: 'billing', action: 'create' },
    UPDATE_BILLS: { resource: 'billing', action: 'update' },
    DELETE_BILLS: { resource: 'billing', action: 'delete' },
    PROCESS_PAYMENTS: { resource: 'billing', action: 'update' },
    VIEW_FINANCIAL_REPORTS: { resource: 'billing', action: 'read' },
  };

  const normalized = normalizePermissionName(permission);
  return mapping[normalized] || { resource: normalized.toLowerCase(), action: 'read' };
}

/**
 * Validate clinic access for a user.
 * Delegates to the backend RBAC validator.
 */
export async function validateClinicAccess(
  userId: string,
  permission: string,
  clinicId?: string
): Promise<boolean> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return false;
    }

    const { resource, action } = mapPermissionToResourceAction(permission);
    const params = new URLSearchParams({ resource, action });
    if (clinicId?.trim()) {
      params.set('clinicId', clinicId.trim());
    }

    const { data } = await authenticatedApi<{ hasPermission: boolean }>(
      `${API_ENDPOINTS.AUTH.PERMISSION_VALIDATE}?${params.toString()}`
    );

    return Boolean(data?.hasPermission);
  } catch (error) {
    console.error('Permission validation failed:', error);
    return false;
  }
}

/**
 * Check if error is a 403 Forbidden (permission denied).
 * Use when handling API errors to show appropriate UI.
 */
export function isForbiddenError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { statusCode?: number; status?: number; response?: { status?: number } };
    return err.statusCode === 403 || err.status === 403 || err.response?.status === 403;
  }
  return false;
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  context?: {
    clinicId?: string;
    resourceId?: string;
    resourceType?: string;
  }
): Promise<boolean> {
  try {
    return await validateClinicAccess(userId, permission.toString(), context?.clinicId);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[],
  context?: {
    clinicId?: string;
    resourceId?: string;
    resourceType?: string;
  }
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissions.map((permission) => hasPermission(userId, permission, context))
    );
    return results.some(Boolean);
  } catch (error) {
    console.error('Any permission check failed:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Permission[],
  context?: {
    clinicId?: string;
    resourceId?: string;
    resourceType?: string;
  }
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissions.map((permission) => hasPermission(userId, permission, context))
    );
    return results.every(Boolean);
  } catch (error) {
    console.error('All permission check failed:', error);
    return false;
  }
}

/**
 * Get user's permissions
 */
export async function getUserPermissions(userId: string, clinicId?: string): Promise<Permission[]> {
  try {
    if (!userId || userId.trim() === '') {
      return [];
    }

    const params = new URLSearchParams();
    if (clinicId?.trim()) {
      params.set('clinicId', clinicId.trim());
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.AUTH.PERMISSIONS}?${params.toString()}`
      : API_ENDPOINTS.AUTH.PERMISSIONS;

    const { data } = await authenticatedApi<{ permissions?: string[] }>(endpoint);
    const backendPermissions = data?.permissions || [];
    return backendPermissions as Permission[];
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return [];
  }
}

/**
 * Check resource-specific permissions
 */
export async function checkResourcePermission(
  userId: string,
  resource: string,
  action: string,
  _resourceId?: string,
  _clinicId?: string
): Promise<boolean> {
  try {
    return await validateClinicAccess(userId, `${resource}:${action}`, _clinicId);
  } catch (error) {
    console.error('Resource permission check failed:', error);
    return false;
  }
}
