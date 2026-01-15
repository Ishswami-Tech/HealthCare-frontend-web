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

// All authentication-related paths that should be public
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
];

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

