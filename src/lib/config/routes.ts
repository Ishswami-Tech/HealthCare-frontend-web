import { Role } from "@/types/auth.types";

interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
}

interface RoleRoutes {
  dashboard: string;
  routes: RouteConfig[];
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * All authentication-related paths that should be public
 */
export const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/verify-magic-link',
  '/auth/otp-login',
  '/auth/google',
  '/auth/facebook',
  '/auth/apple',
  '/auth/verify',
  '/auth/callback',
  '/auth/check-otp-status',
] as const;

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  // Auth routes
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/verify',
  '/auth/callback',
  
  // Public API routes
  '/api/public',
  
  // Public content routes
  '/',
  '/treatments',
  '/about',
  '/contact',
  '/team',
  '/gallery',
  '/treatments/panchakarma',
  '/treatments/agnikarma',
  '/treatments/viddha-karma',
  
  // Public folder pattern (for route matching)
  '/(public)',
] as const;

// ============================================================================
// AUTH-ONLY ROUTES
// ============================================================================

/**
 * Routes that require authentication but don't need profile completion
 */
export const AUTH_ONLY_ROUTES = [
  '/profile-completion',
] as const;

// ============================================================================
// PROTECTED ROUTES (Role-Based Access Control)
// ============================================================================

/**
 * Protected routes and their allowed roles
 * Role-based access control (RBAC) configuration
 */
export const PROTECTED_ROUTES: Record<string, Role[]> = {
  // Dashboard routes (role-specific)
  '/dashboard': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
  '/(dashboard)/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/(dashboard)/doctor/dashboard': [Role.DOCTOR],
  '/(dashboard)/patient/dashboard': [Role.PATIENT],
  '/(dashboard)/receptionist/dashboard': [Role.RECEPTIONIST],
  '/(dashboard)/pharmacist/dashboard': [Role.PHARMACIST],
  '/(dashboard)/super-admin/dashboard': [Role.SUPER_ADMIN],
  
  // Legacy dashboard routes (for backward compatibility)
  '/super-admin': [Role.SUPER_ADMIN],
  '/clinic-admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/receptionist': [Role.RECEPTIONIST],
  '/pharmacist': [Role.PHARMACIST],
  '/patient': [Role.PATIENT],
  
  // Shared routes (multiple roles)
  '/(shared)/appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
  '/(shared)/queue': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST],
  '/(shared)/ehr': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/(shared)/pharmacy': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PHARMACIST, Role.DOCTOR],
  '/(shared)/analytics': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/(shared)/billing': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  '/(shared)/video-appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  
  // Legacy dashboard routes (for backward compatibility - without route groups)
  '/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/doctor/dashboard': [Role.DOCTOR],
  '/patient/dashboard': [Role.PATIENT],
  '/receptionist/dashboard': [Role.RECEPTIONIST],
  '/pharmacist/dashboard': [Role.PHARMACIST],
  '/super-admin/dashboard': [Role.SUPER_ADMIN],
  
  // Settings (all authenticated users)
  '/settings': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
};

// ============================================================================
// STATIC FILE PATTERNS
// ============================================================================

/**
 * Static file patterns to skip proxy processing
 */
export const STATIC_FILE_PATTERNS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/public',
] as const;

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

/**
 * Common route paths (for easy reference)
 */
export const ROUTES = {
  // Auth routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_OTP: '/auth/verify-otp',
  VERIFY_EMAIL: '/auth/verify-email',
  CALLBACK: '/auth/callback',
  
  // Profile
  PROFILE_COMPLETION: '/profile-completion',
  SETTINGS: '/settings',
  
  // Public routes
  HOME: '/',
  TREATMENTS: '/treatments',
  ABOUT: '/about',
  CONTACT: '/contact',
  TEAM: '/team',
  GALLERY: '/gallery',
  
  // Shared routes (accessible by multiple roles)
  SHARED_APPOINTMENTS: '/(shared)/appointments',
  SHARED_QUEUE: '/(shared)/queue',
  SHARED_EHR: '/(shared)/ehr',
  SHARED_PHARMACY: '/(shared)/pharmacy',
  SHARED_ANALYTICS: '/(shared)/analytics',
  SHARED_BILLING: '/(shared)/billing',
  SHARED_VIDEO_APPOINTMENTS: '/(shared)/video-appointments',
} as const;

export const ROLE_ROUTES: Record<Role, RoleRoutes> = {
  SUPER_ADMIN: {
    dashboard: '/(dashboard)/super-admin/dashboard',
    routes: [
      { path: '/(dashboard)/super-admin/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/super-admin/clinics', label: 'Manage Clinics' },
      { path: '/(dashboard)/super-admin/users', label: 'User Management' },
      { path: '/(dashboard)/super-admin/settings', label: 'System Settings' },
      { path: '/(dashboard)/super-admin/profile', label: 'Profile' },
    ],
  },
  CLINIC_ADMIN: {
    dashboard: '/(dashboard)/clinic-admin/dashboard',
    routes: [
      { path: '/(dashboard)/clinic-admin/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/clinic-admin/staff', label: 'Staff Management' },
      { path: '/(dashboard)/clinic-admin/schedule', label: 'Schedule' },
      { path: '/(dashboard)/clinic-admin/locations', label: 'Locations' },
      { path: '/(dashboard)/clinic-admin/settings', label: 'Clinic Settings' },
      { path: '/(dashboard)/clinic-admin/profile', label: 'Profile' },
    ],
  },
  DOCTOR: {
    dashboard: '/(dashboard)/doctor/dashboard',
    routes: [
      { path: '/(dashboard)/doctor/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/doctor/appointments', label: 'Appointments' },
      { path: '/(dashboard)/doctor/patients', label: 'Patients' },
      { path: '/(dashboard)/doctor/profile', label: 'Profile' },
    ],
  },
  RECEPTIONIST: {
    dashboard: '/(dashboard)/receptionist/dashboard',
    routes: [
      { path: '/(dashboard)/receptionist/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/receptionist/appointments', label: 'Appointments' },
      { path: '/(dashboard)/receptionist/patients', label: 'Patients' },
      { path: '/(dashboard)/receptionist/profile', label: 'Profile' },
    ],
  },
  PHARMACIST: {
    dashboard: '/(dashboard)/pharmacist/dashboard',
    routes: [
      { path: '/(dashboard)/pharmacist/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/pharmacist/prescriptions', label: 'Prescriptions' },
      { path: '/(dashboard)/pharmacist/inventory', label: 'Inventory' },
      { path: '/(dashboard)/pharmacist/profile', label: 'Profile' },
    ],
  },
  PATIENT: {
    dashboard: '/(dashboard)/patient/dashboard',
    routes: [
      { path: '/(dashboard)/patient/dashboard', label: 'Dashboard' },
      { path: '/(dashboard)/patient/appointments', label: 'Appointments' },
      { path: '/(dashboard)/patient/medical-records', label: 'Medical Records' },
      { path: '/(dashboard)/patient/prescriptions', label: 'Prescriptions' },
      { path: '/(dashboard)/patient/profile', label: 'Profile' },
    ],
  },
};

// Map of path prefixes to allowed roles
export const ROLE_PATH_MAP: Record<string, Role[]> = {
  '/(dashboard)/super-admin': [Role.SUPER_ADMIN],
  '/(dashboard)/clinic-admin': [Role.CLINIC_ADMIN],
  '/(dashboard)/doctor': [Role.DOCTOR],
  '/(dashboard)/receptionist': [Role.RECEPTIONIST],
  '/(dashboard)/pharmacist': [Role.PHARMACIST],
  '/(dashboard)/patient': [Role.PATIENT],
  // ✅ Removed: Legacy paths - use new route format with (dashboard) prefix
};

/**
 * Get all routes available for a specific role
 */
export function getRoutesByRole(role?: Role): RouteConfig[] {
  if (!role) return [];
  return ROLE_ROUTES[role]?.routes || [];
}

/**
 * Get the dashboard path for a specific role
 */
export function getDashboardByRole(role?: Role): string {
  if (!role) return '/auth/login';
  return ROLE_ROUTES[role]?.dashboard || '/auth/login';
}

/**
 * Get allowed roles for a specific path
 */
export function getAllowedRolesForPath(pathname: string): Role[] | undefined {
  const matchingPath = Object.keys(ROLE_PATH_MAP).find((path) =>
    pathname.startsWith(path)
  );
  return matchingPath ? ROLE_PATH_MAP[matchingPath] : undefined;
}

/**
 * Check if a path is an authentication path
 */
export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if a route is public
 * @param pathname - Request pathname
 * @returns boolean indicating if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    
    // Handle public folder pattern
    if (route === '/(public)') {
      return (
        pathname === '/' ||
        pathname.startsWith('/treatments') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/contact') ||
        pathname.startsWith('/team') ||
        pathname.startsWith('/gallery')
      );
    }
    
    return false;
  });
}

/**
 * Check if a route requires authentication only (no profile completion)
 * @param pathname - Request pathname
 * @returns boolean indicating if route is auth-only
 */
export function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Check if a path is a static file or API route
 * @param pathname - Request pathname
 * @returns boolean indicating if should skip proxy
 */
export function shouldSkipProxy(pathname: string): boolean {
  return (
    STATIC_FILE_PATTERNS.some(pattern => pathname.startsWith(pattern)) ||
    pathname.includes('.') // Static files with extensions
  );
}

/**
 * Check if path matches any pattern in the list
 * @param pathname - Request pathname
 * @param patterns - List of patterns to match
 * @returns boolean indicating if path matches
 */
export function matchesPath(pathname: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => 
    pathname === pattern || 
    pathname.startsWith(pattern + '/') ||
    pathname.startsWith(pattern)
  );
}

/**
 * Get protected route configuration for a pathname
 * @param pathname - Request pathname
 * @returns Array of allowed roles or undefined
 */
export function getProtectedRouteRoles(pathname: string): Role[] | undefined {
  const matchedRoute = Object.entries(PROTECTED_ROUTES).find(([routePath]) => 
    pathname === routePath || pathname.startsWith(routePath + '/')
  );
  
  return matchedRoute ? matchedRoute[1] : undefined;
}

/**
 * Check if a pathname is a protected route
 * @param pathname - Request pathname
 * @returns boolean indicating if route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return Object.keys(PROTECTED_ROUTES).some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

