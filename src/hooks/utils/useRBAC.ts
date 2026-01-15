import { useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { Role } from '@/types/auth.types';
import { 
  Permission, 
  ROLE_PERMISSIONS, 
  PermissionCheck, 
  PermissionContext, 
  PermissionResult
} from '@/types/rbac.types';
import { ROUTES } from '@/lib/config/routes';

/**
 * Main RBAC hook for permission checking
 */
export const useRBAC = (): PermissionCheck => {
  const { user } = useAuth();
  
  const userRole = user?.role as Role;
  const userPermissions = useMemo(() => {
    if (!userRole || !ROLE_PERMISSIONS[userRole]) return [];
    return ROLE_PERMISSIONS[userRole];
  }, [userRole]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !userRole) return false;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || !userRole) return false;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user || !userRole) return false;
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!user || !userRole) return false;
    
    // Map resource-action combinations to permissions
    const resourceActionMap: Record<string, Permission> = {
      'appointments:create': Permission.CREATE_APPOINTMENTS,
      'appointments:read': Permission.VIEW_APPOINTMENTS,
      'appointments:update': Permission.UPDATE_APPOINTMENTS,
      'appointments:delete': Permission.DELETE_APPOINTMENTS,
      'appointments:manage': Permission.MANAGE_APPOINTMENT_QUEUE,
      
      'patients:create': Permission.CREATE_PATIENTS,
      'patients:read': Permission.VIEW_PATIENTS,
      'patients:update': Permission.UPDATE_PATIENTS,
      'patients:delete': Permission.DELETE_PATIENTS,
      
      'doctors:create': Permission.CREATE_DOCTORS,
      'doctors:read': Permission.VIEW_DOCTORS,
      'doctors:update': Permission.UPDATE_DOCTORS,
      'doctors:delete': Permission.DELETE_DOCTORS,
      
      'clinics:create': Permission.CREATE_CLINICS,
      'clinics:read': Permission.VIEW_CLINICS,
      'clinics:update': Permission.UPDATE_CLINICS,
      'clinics:delete': Permission.DELETE_CLINICS,
      'clinics:manage': Permission.MANAGE_CLINIC_SETTINGS,
      
      'users:create': Permission.CREATE_USERS,
      'users:read': Permission.VIEW_USERS,
      'users:update': Permission.UPDATE_USERS,
      'users:delete': Permission.DELETE_USERS,
      'users:manage': Permission.MANAGE_USER_ROLES,
      
      'analytics:read': Permission.VIEW_ANALYTICS,
      'analytics:export': Permission.EXPORT_ANALYTICS,
      
      'pharmacy:read': Permission.VIEW_PHARMACY,
      'pharmacy:manage': Permission.MANAGE_MEDICINES,
      
      'queue:read': Permission.VIEW_QUEUE,
      'queue:manage': Permission.MANAGE_QUEUE,
      
      'medical-records:create': Permission.CREATE_MEDICAL_RECORDS,
      'medical-records:read': Permission.VIEW_MEDICAL_RECORDS,
      'medical-records:update': Permission.UPDATE_MEDICAL_RECORDS,
      'medical-records:delete': Permission.DELETE_MEDICAL_RECORDS,
      
      'notifications:read': Permission.VIEW_NOTIFICATIONS,
      'notifications:send': Permission.SEND_NOTIFICATIONS,
      
      'settings:read': Permission.VIEW_SETTINGS,
      'settings:manage': Permission.MANAGE_SYSTEM_SETTINGS,
      
      'reports:read': Permission.VIEW_REPORTS,
      'reports:generate': Permission.GENERATE_REPORTS,
      'reports:export': Permission.EXPORT_REPORTS,
      
      'billing:read': Permission.VIEW_BILLING,
      'billing:manage': Permission.MANAGE_BILLING,
    };

    const key = `${resource}:${action}`;
    const requiredPermission = resourceActionMap[key];
    
    if (!requiredPermission) return false;
    return hasPermission(requiredPermission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
  };
};

/**
 * Hook for checking specific appointment permissions
 */
export const useAppointmentPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewAppointments: rbac.hasPermission(Permission.VIEW_APPOINTMENTS),
    canCreateAppointments: rbac.hasPermission(Permission.CREATE_APPOINTMENTS),
    canUpdateAppointments: rbac.hasPermission(Permission.UPDATE_APPOINTMENTS),
    canDeleteAppointments: rbac.hasPermission(Permission.DELETE_APPOINTMENTS),
    canManageQueue: rbac.hasPermission(Permission.MANAGE_APPOINTMENT_QUEUE),
    canViewAllAppointments: rbac.hasPermission(Permission.VIEW_ALL_APPOINTMENTS),
  };
};

/**
 * Hook for checking patient permissions
 */
export const usePatientPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewPatients: rbac.hasPermission(Permission.VIEW_PATIENTS),
    canCreatePatients: rbac.hasPermission(Permission.CREATE_PATIENTS),
    canUpdatePatients: rbac.hasPermission(Permission.UPDATE_PATIENTS),
    canDeletePatients: rbac.hasPermission(Permission.DELETE_PATIENTS),
    canViewMedicalRecords: rbac.hasPermission(Permission.VIEW_MEDICAL_RECORDS),
    canCreateMedicalRecords: rbac.hasPermission(Permission.CREATE_MEDICAL_RECORDS),
    canUpdateMedicalRecords: rbac.hasPermission(Permission.UPDATE_MEDICAL_RECORDS),
    canDeleteMedicalRecords: rbac.hasPermission(Permission.DELETE_MEDICAL_RECORDS),
  };
};

/**
 * Hook for checking doctor permissions
 */
export const useDoctorPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewDoctors: rbac.hasPermission(Permission.VIEW_DOCTORS),
    canCreateDoctors: rbac.hasPermission(Permission.CREATE_DOCTORS),
    canUpdateDoctors: rbac.hasPermission(Permission.UPDATE_DOCTORS),
    canDeleteDoctors: rbac.hasPermission(Permission.DELETE_DOCTORS),
    canManageSchedule: rbac.hasPermission(Permission.UPDATE_DOCTORS),
  };
};

/**
 * Hook for checking clinic permissions
 */
export const useClinicPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewClinics: rbac.hasPermission(Permission.VIEW_CLINICS),
    canCreateClinics: rbac.hasPermission(Permission.CREATE_CLINICS),
    canUpdateClinics: rbac.hasPermission(Permission.UPDATE_CLINICS),
    canDeleteClinics: rbac.hasPermission(Permission.DELETE_CLINICS),
    canManageSettings: rbac.hasPermission(Permission.UPDATE_CLINICS),
    canManageStaff: rbac.hasPermission(Permission.UPDATE_CLINICS),
  };
};

/**
 * Hook for checking analytics permissions
 */
export const useAnalyticsPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewAnalytics: rbac.hasPermission(Permission.VIEW_ANALYTICS),
    canViewClinicAnalytics: rbac.hasPermission(Permission.VIEW_CLINIC_ANALYTICS),
    canViewDoctorAnalytics: rbac.hasPermission(Permission.VIEW_DOCTOR_ANALYTICS),
    canViewPatientAnalytics: rbac.hasPermission(Permission.VIEW_PATIENT_ANALYTICS),
    canViewRevenueAnalytics: rbac.hasPermission(Permission.VIEW_REVENUE_ANALYTICS),
    canExportAnalytics: rbac.hasPermission(Permission.EXPORT_ANALYTICS),
  };
};

/**
 * Hook for checking pharmacy permissions
 */
export const usePharmacyPermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewPharmacy: rbac.hasPermission(Permission.VIEW_PHARMACY),
    canManageMedicines: rbac.hasPermission(Permission.MANAGE_MEDICINES),
    canManagePrescriptions: rbac.hasPermission(Permission.MANAGE_PRESCRIPTIONS),
    canManageInventory: rbac.hasPermission(Permission.MANAGE_INVENTORY),
    canDispenseMedicines: rbac.hasPermission(Permission.DISPENSE_MEDICINES),
  };
};

/**
 * Hook for checking queue permissions
 */
export const useQueuePermissions = () => {
  const rbac = useRBAC();
  
  return {
    canViewQueue: rbac.hasPermission(Permission.VIEW_QUEUE),
    canManageQueue: rbac.hasPermission(Permission.MANAGE_QUEUE),
    canCallNextPatient: rbac.hasPermission(Permission.CALL_NEXT_PATIENT),
    canUpdateQueueStatus: rbac.hasPermission(Permission.UPDATE_QUEUE_STATUS),
  };
};

/**
 * Hook for role-based navigation
 */
export const useRoleBasedNavigation = () => {
  const { user } = useAuth();
  const rbac = useRBAC();
  
  const getDefaultRoute = (): string => {
    if (!user) return ROUTES.LOGIN;
    
    const role = user.role as Role;
    
    // ✅ Consolidated: Use new route format (removed legacy routes)
    switch (role) {
      case Role.SUPER_ADMIN:
        return '/(dashboard)/super-admin/dashboard';
      case Role.CLINIC_ADMIN:
        return '/(dashboard)/clinic-admin/dashboard';
      case Role.DOCTOR:
        return '/(dashboard)/doctor/dashboard';
      case Role.RECEPTIONIST:
        return '/(dashboard)/receptionist/dashboard';
      case Role.PHARMACIST:
        return '/(dashboard)/pharmacist/dashboard';
      case Role.PATIENT:
        return '/(dashboard)/patient/dashboard';
      default:
        return '/(dashboard)/patient/dashboard';
    }
  };

  const getAvailableRoutes = () => {
    const routes = [];
    
    if (rbac.canAccess('appointments', 'read')) {
      routes.push({ path: '/appointments', label: 'Appointments' });
    }
    
    if (rbac.canAccess('patients', 'read')) {
      routes.push({ path: '/patients', label: 'Patients' });
    }
    
    if (rbac.canAccess('doctors', 'read')) {
      routes.push({ path: '/doctors', label: 'Doctors' });
    }
    
    if (rbac.canAccess('queue', 'read')) {
      routes.push({ path: '/queue', label: 'Queue' });
    }
    
    if (rbac.canAccess('pharmacy', 'read')) {
      routes.push({ path: '/pharmacy', label: 'Pharmacy' });
    }
    
    if (rbac.canAccess('analytics', 'read')) {
      routes.push({ path: '/analytics', label: 'Analytics' });
    }
    
    if (rbac.canAccess('medical-records', 'read')) {
      routes.push({ path: '/ehr', label: 'Medical Records' });
    }
    
    return routes;
  };

  return {
    getDefaultRoute,
    getAvailableRoutes,
  };
};

/**
 * Context-aware permission checking
 */
export const useContextualPermissions = (context: PermissionContext) => {
  const { user } = useAuth();
  const rbac = useRBAC();
  
  const canAccessResource = (_resourceId: string, resourceType: string): PermissionResult => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }
    
    const userRole = user.role as Role;
    
    // Super admin can access everything
    if (userRole === Role.SUPER_ADMIN) {
      return { allowed: true, context };
    }
    
    // Check if user owns the resource
    const isOwner = context.resourceOwnerId === user.id;
    
    // Patients can only access their own resources
    if (userRole === Role.PATIENT) {
      if (isOwner || context.patientId === user.id) {
        return { allowed: true, context };
      }
      return { allowed: false, reason: 'Can only access own resources' };
    }
    
    // Doctors can access their patients' resources
    if (userRole === Role.DOCTOR && resourceType === 'patient') {
      // Check if patient is assigned to this doctor (would need additional logic)
      return { allowed: true, context };
    }
    
    // Clinic-level access control
    if (context.clinicId && (user as any).clinicId && context.clinicId !== (user as any).clinicId) {
      return { allowed: false, reason: 'Resource belongs to different clinic' };
    }
    
    return { allowed: true, context };
  };

  return {
    canAccessResource,
    ...rbac,
  };
};
