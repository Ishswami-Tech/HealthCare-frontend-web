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
  // Dashboard routes (role-specific) - using actual URLs (route groups don't appear in URLs)
  '/dashboard': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
  '/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/doctor/dashboard': [Role.DOCTOR],
  '/patient/dashboard': [Role.PATIENT],
  '/receptionist/dashboard': [Role.RECEPTIONIST],
  '/pharmacist/dashboard': [Role.PHARMACIST],
  '/super-admin/dashboard': [Role.SUPER_ADMIN],
  
  // Shared routes (multiple roles) - using actual URLs
  '/appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
  '/queue': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST],
  '/ehr': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/pharmacy': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PHARMACIST, Role.DOCTOR],
  '/analytics': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/billing': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  '/video-appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  
  // Profile routes (role-specific)
  '/super-admin/profile': [Role.SUPER_ADMIN],
  '/clinic-admin/profile': [Role.CLINIC_ADMIN],
  '/doctor/profile': [Role.DOCTOR],
  '/receptionist/profile': [Role.RECEPTIONIST],
  '/pharmacist/profile': [Role.PHARMACIST],
  '/patient/profile': [Role.PATIENT],
  
  // Super Admin specific routes
  '/super-admin/clinics': [Role.SUPER_ADMIN],
  '/super-admin/users': [Role.SUPER_ADMIN],
  '/super-admin/settings': [Role.SUPER_ADMIN],
  '/super-admin/health': [Role.SUPER_ADMIN],
  '/super-admin/video': [Role.SUPER_ADMIN],
  
  // Clinic Admin specific routes
  '/clinic-admin/staff': [Role.CLINIC_ADMIN],
  '/clinic-admin/schedule': [Role.CLINIC_ADMIN],
  '/clinic-admin/locations': [Role.CLINIC_ADMIN],
  '/clinic-admin/settings': [Role.CLINIC_ADMIN],
  '/clinic-admin/video': [Role.CLINIC_ADMIN],
  
  // Doctor specific routes
  '/doctor/appointments': [Role.DOCTOR],
  '/doctor/patients': [Role.DOCTOR],
  '/doctor/video': [Role.DOCTOR],
  
  // Receptionist specific routes
  '/receptionist/appointments': [Role.RECEPTIONIST],
  '/receptionist/patients': [Role.RECEPTIONIST],
  '/receptionist/video': [Role.RECEPTIONIST],
  
  // Pharmacist specific routes
  '/pharmacist/prescriptions': [Role.PHARMACIST],
  '/pharmacist/inventory': [Role.PHARMACIST],
  
  // Patient specific routes
  '/patient/appointments': [Role.PATIENT],
  '/patient/medical-records': [Role.PATIENT],
  '/patient/prescriptions': [Role.PATIENT],
  '/patient/video': [Role.PATIENT],
  
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
  
  // Shared routes (accessible by multiple roles) - using actual URLs
  SHARED_APPOINTMENTS: '/appointments',
  SHARED_QUEUE: '/queue',
  SHARED_EHR: '/ehr',
  SHARED_PHARMACY: '/pharmacy',
  SHARED_ANALYTICS: '/analytics',
  SHARED_BILLING: '/billing',
  SHARED_VIDEO_APPOINTMENTS: '/video-appointments',
} as const;

export const ROLE_ROUTES: Record<Role, RoleRoutes> = {
  SUPER_ADMIN: {
    dashboard: '/super-admin/dashboard',
    routes: [
      { path: '/super-admin/dashboard', label: 'Dashboard' },
      { path: '/super-admin/clinics', label: 'Manage Clinics' },
      { path: '/super-admin/users', label: 'User Management' },
      { path: '/super-admin/settings', label: 'System Settings' },
      { path: '/super-admin/profile', label: 'Profile' },
    ],
  },
  CLINIC_ADMIN: {
    dashboard: '/clinic-admin/dashboard',
    routes: [
      { path: '/clinic-admin/dashboard', label: 'Dashboard' },
      { path: '/clinic-admin/staff', label: 'Staff Management' },
      { path: '/clinic-admin/schedule', label: 'Schedule' },
      { path: '/clinic-admin/locations', label: 'Locations' },
      { path: '/clinic-admin/settings', label: 'Clinic Settings' },
      { path: '/clinic-admin/profile', label: 'Profile' },
    ],
  },
  DOCTOR: {
    dashboard: '/doctor/dashboard',
    routes: [
      { path: '/doctor/dashboard', label: 'Dashboard' },
      { path: '/doctor/appointments', label: 'Appointments' },
      { path: '/doctor/patients', label: 'Patients' },
      { path: '/doctor/profile', label: 'Profile' },
    ],
  },
  RECEPTIONIST: {
    dashboard: '/receptionist/dashboard',
    routes: [
      { path: '/receptionist/dashboard', label: 'Dashboard' },
      { path: '/receptionist/appointments', label: 'Appointments' },
      { path: '/receptionist/patients', label: 'Patients' },
      { path: '/receptionist/profile', label: 'Profile' },
    ],
  },
  PHARMACIST: {
    dashboard: '/pharmacist/dashboard',
    routes: [
      { path: '/pharmacist/dashboard', label: 'Dashboard' },
      { path: '/pharmacist/prescriptions', label: 'Prescriptions' },
      { path: '/pharmacist/inventory', label: 'Inventory' },
      { path: '/pharmacist/profile', label: 'Profile' },
    ],
  },
  PATIENT: {
    dashboard: '/patient/dashboard',
    routes: [
      { path: '/patient/dashboard', label: 'Dashboard' },
      { path: '/patient/appointments', label: 'Appointments' },
      { path: '/patient/medical-records', label: 'Medical Records' },
      { path: '/patient/prescriptions', label: 'Prescriptions' },
      { path: '/patient/profile', label: 'Profile' },
    ],
  },
};

// Map of path prefixes to allowed roles (using actual URLs, route groups don't appear in URLs)
export const ROLE_PATH_MAP: Record<string, Role[]> = {
  '/super-admin': [Role.SUPER_ADMIN],
  '/clinic-admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/receptionist': [Role.RECEPTIONIST],
  '/pharmacist': [Role.PHARMACIST],
  '/patient': [Role.PATIENT],
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
 * @param role - User role
 * @returns Dashboard path for the role, or login page if role is invalid/unknown
 */
/**
 * Get the dashboard path for a specific role
 * @param role - User role
 * @returns Dashboard path for the role, or login page if role is invalid/unknown
 * 
 * ✅ Comprehensive role-based redirection:
 * - Validates role exists in ROLE_ROUTES
 * - Handles unknown roles gracefully (fallback to patient dashboard)
 * - Ensures all roles have proper dashboard routes
 * - Used consistently across all redirection scenarios
 */
export function getDashboardByRole(role?: Role): string {
  if (!role) return ROUTES.LOGIN;
  
  // Validate role exists in ROLE_ROUTES
  if (!ROLE_ROUTES[role]) {
    // Fallback to patient dashboard for unknown roles (graceful degradation)
    // This ensures users with unknown roles can still access the system
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unknown role: ${role}, redirecting to patient dashboard`);
    }
    return ROLE_ROUTES[Role.PATIENT]?.dashboard || ROUTES.LOGIN;
  }
  
  const dashboardPath = ROLE_ROUTES[role]?.dashboard;
  
  // Ensure we always return a valid path
  if (!dashboardPath || dashboardPath === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`No dashboard path configured for role: ${role}, redirecting to login`);
    }
    return ROUTES.LOGIN;
  }
  
  return dashboardPath;
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

