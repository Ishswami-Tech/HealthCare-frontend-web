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

export const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/appointments',
  '/settings',
];

export const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

export const ROLE_ROUTES: Record<Role, RoleRoutes> = {
  SUPER_ADMIN: {
    dashboard: '/super-admin/dashboard',
    routes: [
      { path: '/super-admin/dashboard', label: 'Dashboard' },
      { path: '/super-admin/clinics', label: 'Manage Clinics' },
      { path: '/super-admin/users', label: 'User Management' },
      { path: '/super-admin/settings', label: 'System Settings' },
    ],
  },
  CLINIC_ADMIN: {
    dashboard: '/clinic-admin/dashboard',
    routes: [
      { path: '/clinic-admin/dashboard', label: 'Dashboard' },
      { path: '/clinic-admin/staff', label: 'Staff Management' },
      { path: '/clinic-admin/schedule', label: 'Schedule' },
      { path: '/clinic-admin/settings', label: 'Clinic Settings' },
    ],
  },
  DOCTOR: {
    dashboard: '/doctor/dashboard',
    routes: [
      { path: '/doctor/dashboard', label: 'Dashboard' },
      { path: '/doctor/appointments', label: 'Appointments' },
      { path: '/doctor/patients', label: 'Patients' },
    ],
  },
  RECEPTIONIST: {
    dashboard: '/receptionist/dashboard',
    routes: [
      { path: '/receptionist/dashboard', label: 'Dashboard' },
      { path: '/receptionist/appointments', label: 'Appointments' },
      { path: '/receptionist/patients', label: 'Patients' },
    ],
  },
  PATIENT: {
    dashboard: '/patient/dashboard',
    routes: [
      { path: '/patient/dashboard', label: 'Dashboard' },
      { path: '/patient/appointments', label: 'Appointments' },
      { path: '/patient/medical-records', label: 'Medical Records' },
      { path: '/patient/prescriptions', label: 'Prescriptions' },
    ],
  },
};

export const ROLE_PATH_MAP: Record<string, Role[]> = {
  '/super-admin': [Role.SUPER_ADMIN],
  '/clinic-admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/receptionist': [Role.RECEPTIONIST],
  '/patient': [Role.PATIENT],
};

export function getRoutesByRole(role?: Role): RouteConfig[] {
  if (!role) return [];
  return ROLE_ROUTES[role]?.routes || [];
}

export function getDashboardByRole(role?: Role): string {
  if (!role) return '/auth/login';
  return ROLE_ROUTES[role]?.dashboard || '/auth/login';
}

export function getAllowedRolesForPath(pathname: string): Role[] | undefined {
  const matchingPath = Object.keys(ROLE_PATH_MAP).find((path) =>
    pathname.startsWith(path)
  );
  return matchingPath ? ROLE_PATH_MAP[matchingPath] : undefined;
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname.startsWith(path));
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
} 