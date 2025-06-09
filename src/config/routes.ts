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
  '/auth/verify-email',
  '/auth/verify-magic-link',
  '/auth/otp-login',
  '/auth/social/google',
  '/auth/social/facebook',
  '/auth/social/apple',
  '/auth/verify',
  '/auth/check-otp-status',
];

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

// Map of path prefixes to allowed roles
export const ROLE_PATH_MAP: Record<string, Role[]> = {
  '/super-admin': [Role.SUPER_ADMIN],
  '/clinic-admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/receptionist': [Role.RECEPTIONIST],
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