import { Role } from './auth.types';

// Permission categories
export enum PermissionCategory {
  APPOINTMENTS = 'APPOINTMENTS',
  PATIENTS = 'PATIENTS',
  DOCTORS = 'DOCTORS',
  CLINICS = 'CLINICS',
  USERS = 'USERS',
  ANALYTICS = 'ANALYTICS',
  PHARMACY = 'PHARMACY',
  QUEUE = 'QUEUE',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SETTINGS = 'SETTINGS',
  REPORTS = 'REPORTS',
  BILLING = 'BILLING',
}

// Specific permissions
export enum Permission {
  // Appointment permissions
  VIEW_APPOINTMENTS = 'VIEW_APPOINTMENTS',
  CREATE_APPOINTMENTS = 'CREATE_APPOINTMENTS',
  UPDATE_APPOINTMENTS = 'UPDATE_APPOINTMENTS',
  DELETE_APPOINTMENTS = 'DELETE_APPOINTMENTS',
  MANAGE_APPOINTMENT_QUEUE = 'MANAGE_APPOINTMENT_QUEUE',
  VIEW_ALL_APPOINTMENTS = 'VIEW_ALL_APPOINTMENTS',
  
  // Patient permissions
  VIEW_PATIENTS = 'VIEW_PATIENTS',
  CREATE_PATIENTS = 'CREATE_PATIENTS',
  UPDATE_PATIENTS = 'UPDATE_PATIENTS',
  DELETE_PATIENTS = 'DELETE_PATIENTS',
  VIEW_PATIENT_MEDICAL_RECORDS = 'VIEW_PATIENT_MEDICAL_RECORDS',
  CREATE_PATIENT_MEDICAL_RECORDS = 'CREATE_PATIENT_MEDICAL_RECORDS',
  UPDATE_PATIENT_MEDICAL_RECORDS = 'UPDATE_PATIENT_MEDICAL_RECORDS',
  DELETE_PATIENT_MEDICAL_RECORDS = 'DELETE_PATIENT_MEDICAL_RECORDS',
  
  // Doctor permissions
  VIEW_DOCTORS = 'VIEW_DOCTORS',
  CREATE_DOCTORS = 'CREATE_DOCTORS',
  UPDATE_DOCTORS = 'UPDATE_DOCTORS',
  DELETE_DOCTORS = 'DELETE_DOCTORS',
  MANAGE_DOCTOR_SCHEDULE = 'MANAGE_DOCTOR_SCHEDULE',
  
  // Clinic permissions
  VIEW_CLINICS = 'VIEW_CLINICS',
  CREATE_CLINICS = 'CREATE_CLINICS',
  UPDATE_CLINICS = 'UPDATE_CLINICS',
  DELETE_CLINICS = 'DELETE_CLINICS',
  MANAGE_CLINIC_SETTINGS = 'MANAGE_CLINIC_SETTINGS',
  MANAGE_CLINIC_STAFF = 'MANAGE_CLINIC_STAFF',
  
  // User management permissions
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  UPDATE_USERS = 'UPDATE_USERS',
  DELETE_USERS = 'DELETE_USERS',
  MANAGE_USER_ROLES = 'MANAGE_USER_ROLES',
  VIEW_USER_SESSIONS = 'VIEW_USER_SESSIONS',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_CLINIC_ANALYTICS = 'VIEW_CLINIC_ANALYTICS',
  VIEW_DOCTOR_ANALYTICS = 'VIEW_DOCTOR_ANALYTICS',
  VIEW_PATIENT_ANALYTICS = 'VIEW_PATIENT_ANALYTICS',
  VIEW_REVENUE_ANALYTICS = 'VIEW_REVENUE_ANALYTICS',
  EXPORT_ANALYTICS = 'EXPORT_ANALYTICS',
  
  // Pharmacy permissions
  VIEW_PHARMACY = 'VIEW_PHARMACY',
  MANAGE_MEDICINES = 'MANAGE_MEDICINES',
  MANAGE_PRESCRIPTIONS = 'MANAGE_PRESCRIPTIONS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  DISPENSE_MEDICINES = 'DISPENSE_MEDICINES',
  
  // Queue permissions
  VIEW_QUEUE = 'VIEW_QUEUE',
  MANAGE_QUEUE = 'MANAGE_QUEUE',
  CALL_NEXT_PATIENT = 'CALL_NEXT_PATIENT',
  UPDATE_QUEUE_STATUS = 'UPDATE_QUEUE_STATUS',
  
  // Medical records permissions
  VIEW_MEDICAL_RECORDS = 'VIEW_MEDICAL_RECORDS',
  CREATE_MEDICAL_RECORDS = 'CREATE_MEDICAL_RECORDS',
  UPDATE_MEDICAL_RECORDS = 'UPDATE_MEDICAL_RECORDS',
  DELETE_MEDICAL_RECORDS = 'DELETE_MEDICAL_RECORDS',
  VIEW_ALL_MEDICAL_RECORDS = 'VIEW_ALL_MEDICAL_RECORDS',
  
  // Notification permissions
  VIEW_NOTIFICATIONS = 'VIEW_NOTIFICATIONS',
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',
  MANAGE_NOTIFICATION_TEMPLATES = 'MANAGE_NOTIFICATION_TEMPLATES',
  SEND_BULK_NOTIFICATIONS = 'SEND_BULK_NOTIFICATIONS',
  
  // Settings permissions
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  MANAGE_CLINIC_SETTINGS_ADVANCED = 'MANAGE_CLINIC_SETTINGS_ADVANCED',
  MANAGE_USER_SETTINGS = 'MANAGE_USER_SETTINGS',
  
  // Reports permissions
  VIEW_REPORTS = 'VIEW_REPORTS',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  SCHEDULE_REPORTS = 'SCHEDULE_REPORTS',
  
  // Billing permissions
  VIEW_BILLING = 'VIEW_BILLING',
  MANAGE_BILLING = 'MANAGE_BILLING',
  PROCESS_PAYMENTS = 'PROCESS_PAYMENTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // All permissions for super admin
    ...Object.values(Permission)
  ],
  
  [Role.CLINIC_ADMIN]: [
    // Appointment permissions
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.DELETE_APPOINTMENTS,
    Permission.MANAGE_APPOINTMENT_QUEUE,
    Permission.VIEW_ALL_APPOINTMENTS,
    
    // Patient permissions
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.UPDATE_PATIENTS,
    Permission.DELETE_PATIENTS,
    Permission.VIEW_PATIENT_MEDICAL_RECORDS,
    
    // Doctor permissions
    Permission.VIEW_DOCTORS,
    Permission.CREATE_DOCTORS,
    Permission.UPDATE_DOCTORS,
    Permission.DELETE_DOCTORS,
    Permission.MANAGE_DOCTOR_SCHEDULE,
    
    // Clinic permissions
    Permission.VIEW_CLINICS,
    Permission.UPDATE_CLINICS,
    Permission.MANAGE_CLINIC_SETTINGS,
    Permission.MANAGE_CLINIC_STAFF,
    
    // User management
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.VIEW_USER_SESSIONS,
    
    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CLINIC_ANALYTICS,
    Permission.VIEW_DOCTOR_ANALYTICS,
    Permission.VIEW_PATIENT_ANALYTICS,
    Permission.VIEW_REVENUE_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    
    // Pharmacy
    Permission.VIEW_PHARMACY,
    Permission.MANAGE_MEDICINES,
    Permission.MANAGE_PRESCRIPTIONS,
    Permission.MANAGE_INVENTORY,
    
    // Queue
    Permission.VIEW_QUEUE,
    Permission.MANAGE_QUEUE,
    Permission.CALL_NEXT_PATIENT,
    Permission.UPDATE_QUEUE_STATUS,
    
    // Medical records
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.VIEW_ALL_MEDICAL_RECORDS,
    
    // Notifications
    Permission.VIEW_NOTIFICATIONS,
    Permission.SEND_NOTIFICATIONS,
    Permission.MANAGE_NOTIFICATION_TEMPLATES,
    Permission.SEND_BULK_NOTIFICATIONS,
    
    // Settings
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_CLINIC_SETTINGS_ADVANCED,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.SCHEDULE_REPORTS,
    
    // Billing
    Permission.VIEW_BILLING,
    Permission.MANAGE_BILLING,
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_FINANCIAL_REPORTS,
  ],
  
  [Role.DOCTOR]: [
    // Appointment permissions
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.MANAGE_APPOINTMENT_QUEUE,
    
    // Patient permissions
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.UPDATE_PATIENTS,
    Permission.VIEW_PATIENT_MEDICAL_RECORDS,
    Permission.CREATE_PATIENT_MEDICAL_RECORDS,
    Permission.UPDATE_PATIENT_MEDICAL_RECORDS,
    
    // Doctor permissions (own schedule)
    Permission.MANAGE_DOCTOR_SCHEDULE,
    
    // Pharmacy
    Permission.VIEW_PHARMACY,
    Permission.MANAGE_PRESCRIPTIONS,
    
    // Queue
    Permission.VIEW_QUEUE,
    Permission.CALL_NEXT_PATIENT,
    Permission.UPDATE_QUEUE_STATUS,
    
    // Medical records
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.CREATE_MEDICAL_RECORDS,
    Permission.UPDATE_MEDICAL_RECORDS,
    
    // Notifications
    Permission.VIEW_NOTIFICATIONS,
    Permission.SEND_NOTIFICATIONS,
    
    // Settings (personal)
    Permission.MANAGE_USER_SETTINGS,
    
    // Analytics (limited)
    Permission.VIEW_DOCTOR_ANALYTICS,
  ],
  
  [Role.RECEPTIONIST]: [
    // Appointment permissions
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.MANAGE_APPOINTMENT_QUEUE,
    Permission.VIEW_ALL_APPOINTMENTS,
    
    // Patient permissions
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.UPDATE_PATIENTS,
    
    // Queue
    Permission.VIEW_QUEUE,
    Permission.MANAGE_QUEUE,
    Permission.CALL_NEXT_PATIENT,
    Permission.UPDATE_QUEUE_STATUS,
    
    // Notifications
    Permission.VIEW_NOTIFICATIONS,
    Permission.SEND_NOTIFICATIONS,
    
    // Settings (personal)
    Permission.MANAGE_USER_SETTINGS,
  ],
  
  [Role.PHARMACIST]: [
    // Pharmacy permissions
    Permission.VIEW_PHARMACY,
    Permission.MANAGE_MEDICINES,
    Permission.MANAGE_PRESCRIPTIONS,
    Permission.MANAGE_INVENTORY,
    Permission.DISPENSE_MEDICINES,
    
    // Patient permissions (limited)
    Permission.VIEW_PATIENTS,
    
    // Notifications
    Permission.VIEW_NOTIFICATIONS,
    Permission.SEND_NOTIFICATIONS,
    
    // Settings (personal)
    Permission.MANAGE_USER_SETTINGS,
  ],
  
  [Role.PATIENT]: [
    // Appointment permissions (own only)
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    
    // Medical records (own only)
    Permission.VIEW_MEDICAL_RECORDS,
    
    // Notifications
    Permission.VIEW_NOTIFICATIONS,
    
    // Settings (personal)
    Permission.MANAGE_USER_SETTINGS,
  ],
};

// Permission check interface
export interface PermissionCheck {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

// Resource-action mapping for more granular control
export interface ResourceAction {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// Context-based permissions (e.g., own resources vs all resources)
export interface PermissionContext {
  userId?: string;
  clinicId?: string;
  doctorId?: string;
  patientId?: string;
  resourceOwnerId?: string;
}

// Permission result with context
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  context?: PermissionContext;
}
