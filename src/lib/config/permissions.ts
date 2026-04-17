// ✅ Permission Validation for Healthcare Frontend
// This module provides permission checking for RBAC system

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

/**
 * Architecture: Zero-Trust Frontend - Backend is Single Source of Truth
 *
 * Frontend permission checks are intentionally lightweight:
 * - validateClinicAccess returns true for authenticated users
 * - Backend RBAC enforces actual permissions on every API call
 * - 403 responses are handled by error-handler and QueryProvider (redirect/toast)
 *
 * When backend returns 403:
 * - handleApiError maps to user-friendly "Access denied" message
 * - QueryProvider triggers toast and optional redirect
 * - UI should disable/hide actions that consistently return 403
 */

/**
 * Validate clinic access for a user.
 * Returns true for authenticated users; backend RBAC enforces actual permissions.
 */
export async function validateClinicAccess(
  userId: string,
  _permission: string,
  _clinicId?: string
): Promise<boolean> {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return false;
    }
    return true;
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
    // Map permission to string for validation
    const permissionString = permission.toString();
    
    return await validateClinicAccess(userId, permissionString, context?.clinicId);
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
    for (const permission of permissions) {
      if (await hasPermission(userId, permission, context)) {
        return true;
      }
    }
    return false;
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
    for (const permission of permissions) {
      if (!(await hasPermission(userId, permission, context))) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('All permission check failed:', error);
    return false;
  }
}

/**
 * Get user's permissions
 */
export async function getUserPermissions(_userId: string): Promise<Permission[]> {
  try {
    // TODO: Implement actual permission retrieval from your backend
    // const response = await fetch(`/api/auth/permissions/${userId}`);
    // const result = await response.json();
    // return result.permissions;

    // Development fallback - return all permissions
    if (process.env.NODE_ENV === 'development') {
      return Object.values(Permission);
    }

    return [];
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
    const permissionString = `${resource}:${action}`;
    return await validateClinicAccess(userId, permissionString, _clinicId);
  } catch (error) {
    console.error('Resource permission check failed:', error);
    return false;
  }
}
