import { Role } from '@/types/auth.types';
import { getSidebarLinksByRole, SidebarLink } from './sidebarLinks';

export const ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_OTP: '/auth/verify-otp',
  PROFILE_COMPLETION: '/profile-completion',
  STATUS: '/status',
  DASHBOARD: {
    SUPER_ADMIN: '/super-admin/dashboard',
    CLINIC_ADMIN: '/clinic-admin/dashboard',
    DOCTOR: '/doctor/dashboard',
    ASSISTANT_DOCTOR: '/assistant-doctor/dashboard',
    PATIENT: '/patient/dashboard',
    RECEPTIONIST: '/receptionist/dashboard',
    PHARMACIST: '/pharmacist/dashboard',
    CLINIC_LOCATION_HEAD: '/clinic-location-head/dashboard',
    THERAPIST: '/therapist/dashboard',
    LAB_TECHNICIAN: '/lab-technician/dashboard',
    SUPPORT_STAFF: '/support-staff/dashboard',
    NURSE: '/nurse/dashboard',
    FINANCE_BILLING: '/finance-billing/dashboard',
    COUNSELOR: '/counselor/dashboard',
  },
  SHARED_ANALYTICS: '/analytics',
  SHARED_EHR: '/ehr',
  SHARED_APPOINTMENTS: '/appointments',
  SHARED_QUEUE: '/queue',
  SHARED_PHARMACY: '/pharmacy',
  SHARED_SETTINGS: '/settings',
  SHARED_PROFILE: '/profile',
  HOME: '/',
};

export const ROLE_DASHBOARDS = {
  SUPER_ADMIN: ROUTES.DASHBOARD.SUPER_ADMIN,
  CLINIC_ADMIN: ROUTES.DASHBOARD.CLINIC_ADMIN,
  DOCTOR: ROUTES.DASHBOARD.DOCTOR,
  ASSISTANT_DOCTOR: ROUTES.DASHBOARD.ASSISTANT_DOCTOR,
  PATIENT: ROUTES.DASHBOARD.PATIENT,
  RECEPTIONIST: ROUTES.DASHBOARD.RECEPTIONIST,
  PHARMACIST: ROUTES.DASHBOARD.PHARMACIST,
  CLINIC_LOCATION_HEAD: ROUTES.DASHBOARD.CLINIC_LOCATION_HEAD,
  THERAPIST: ROUTES.DASHBOARD.THERAPIST,
  LAB_TECHNICIAN: ROUTES.DASHBOARD.LAB_TECHNICIAN,
  SUPPORT_STAFF: ROUTES.DASHBOARD.SUPPORT_STAFF,
  NURSE: ROUTES.DASHBOARD.NURSE,
  FINANCE_BILLING: ROUTES.DASHBOARD.FINANCE_BILLING,
  COUNSELOR: ROUTES.DASHBOARD.COUNSELOR,
};

export function getDashboardByRole(role: string): string {
  // Replace any whitespace sequence with '_' so 'CLINIC ADMIN' → 'CLINIC_ADMIN'
  const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
  return ROLE_DASHBOARDS[normalizedRole as keyof typeof ROLE_DASHBOARDS] || ROUTES.LOGIN;
}

export function isAuthPath(path: string): boolean {
  return path.startsWith('/auth/');
}

export function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.VERIFY_OTP,
    '/',
    '/status',
    '/about',
    '/gallery',
    '/team',
    '/treatments',
    '/contact',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/payment/callback',
  ];

  // Check if path matches a public route or any subpage of a public route
  return publicRoutes.includes(path) ||
         publicRoutes.some(route => path.startsWith(route + '/')) ||
         path.startsWith('/api/public');
}

export function isAuthOnlyRoute(path: string): boolean {
  return path === ROUTES.PROFILE_COMPLETION;
}

export function isProtectedRoute(path: string): boolean {
  return !isPublicRoute(path) && !isAuthOnlyRoute(path);
}

export function shouldSkipProxy(path: string): boolean {
  return (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.includes('.') ||
    path.startsWith('/favicon.ico')
  );
}

export function getProtectedRouteRoles(path: string): string[] {
  if (path.startsWith('/super-admin')) return [Role.SUPER_ADMIN];
  if (path.startsWith('/clinic-admin')) return [Role.CLINIC_ADMIN];
  if (path.startsWith('/doctor')) return [Role.DOCTOR, Role.ASSISTANT_DOCTOR];
  if (path.startsWith('/assistant-doctor')) return [Role.ASSISTANT_DOCTOR];
  if (path.startsWith('/patient')) return [Role.PATIENT];
  if (path.startsWith('/receptionist')) return [Role.RECEPTIONIST];
  if (path.startsWith('/pharmacist')) return [Role.PHARMACIST];
  if (path.startsWith('/clinic-location-head')) return [Role.CLINIC_LOCATION_HEAD];
  if (path.startsWith('/therapist')) return [Role.THERAPIST];
  if (path.startsWith('/lab-technician')) return [Role.LAB_TECHNICIAN];
  if (path.startsWith('/support-staff')) return [Role.SUPPORT_STAFF];
  if (path.startsWith('/nurse')) return [Role.NURSE];
  if (path.startsWith('/finance-billing')) return [Role.FINANCE_BILLING];
  if (path.startsWith('/counselor')) return [Role.COUNSELOR];

  // Shared routes — proxy-level RBAC matching sidebar access and backend controller roles
  if (path.startsWith('/queue')) return [
    Role.SUPER_ADMIN, Role.CLINIC_ADMIN,
    Role.DOCTOR, Role.ASSISTANT_DOCTOR,
    Role.RECEPTIONIST, Role.CLINIC_LOCATION_HEAD,
    Role.THERAPIST, Role.NURSE, Role.COUNSELOR,
    Role.PATIENT,
  ];

  if (path.startsWith('/billing')) return [
    Role.SUPER_ADMIN, Role.CLINIC_ADMIN,
    Role.DOCTOR, Role.ASSISTANT_DOCTOR,
    Role.RECEPTIONIST, Role.PHARMACIST,
    Role.CLINIC_LOCATION_HEAD, Role.THERAPIST,
    Role.NURSE, Role.COUNSELOR,
    Role.LAB_TECHNICIAN, Role.SUPPORT_STAFF,
    Role.FINANCE_BILLING,
  ];

  if (path.startsWith('/pharmacy')) return [
    Role.PHARMACIST, Role.CLINIC_ADMIN, Role.SUPER_ADMIN,
  ];

  if (path.startsWith('/video-appointments')) return [
    Role.THERAPIST, Role.COUNSELOR,
    Role.DOCTOR, Role.ASSISTANT_DOCTOR,
    Role.NURSE, Role.RECEPTIONIST,
    Role.PATIENT, Role.SUPER_ADMIN, Role.CLINIC_ADMIN,
  ];

  return [];
}

/** @alias getProtectedRouteRoles — kept for backwards compatibility */
export const getAllowedRolesForPath = getProtectedRouteRoles;

export function getRoutesByRole(role: string): SidebarLink[] {
  return getSidebarLinksByRole(role);
}
