import React from 'react';
import { ProtectedComponent } from './ProtectedComponent';
import { ProtectedRoute } from './ProtectedRoute';
import { Permission } from '@/types/rbac.types';

// ===== APPOINTMENT PROTECTED COMPONENTS =====

interface AppointmentProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'create' | 'update' | 'delete' | 'manage';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const AppointmentProtectedComponent: React.FC<AppointmentProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_APPOINTMENTS;
      case 'create':
        return Permission.CREATE_APPOINTMENTS;
      case 'update':
        return Permission.UPDATE_APPOINTMENTS;
      case 'delete':
        return Permission.DELETE_APPOINTMENTS;
      case 'manage':
        return Permission.MANAGE_APPOINTMENT_QUEUE;
      default:
        return Permission.VIEW_APPOINTMENTS;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};

// ===== PATIENT PROTECTED COMPONENTS =====

interface PatientProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'create' | 'update' | 'delete' | 'manage';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const PatientProtectedComponent: React.FC<PatientProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_PATIENTS;
      case 'create':
        return Permission.CREATE_PATIENTS;
      case 'update':
        return Permission.UPDATE_PATIENTS;
      case 'delete':
        return Permission.DELETE_PATIENTS;
      case 'manage':
        return Permission.UPDATE_PATIENTS;
      default:
        return Permission.VIEW_PATIENTS;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};

// ===== PHARMACY PROTECTED COMPONENTS =====

interface PharmacyProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'manage-medicines' | 'dispense' | 'view-prescriptions' | 'manage-inventory';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const PharmacyProtectedComponent: React.FC<PharmacyProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_PHARMACY;
      case 'manage-medicines':
        return Permission.MANAGE_MEDICINES;
      case 'dispense':
        return Permission.DISPENSE_MEDICINES;
      case 'view-prescriptions':
        return Permission.MANAGE_PRESCRIPTIONS;
      case 'manage-inventory':
        return Permission.MANAGE_INVENTORY;
      default:
        return Permission.VIEW_PHARMACY;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};

// ===== QUEUE PROTECTED COMPONENTS =====

interface QueueProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'update-status' | 'call-next' | 'manage';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const QueueProtectedComponent: React.FC<QueueProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_QUEUE;
      case 'update-status':
        return Permission.MANAGE_QUEUE;
      case 'call-next':
        return Permission.MANAGE_QUEUE;
      case 'manage':
        return Permission.MANAGE_QUEUE;
      default:
        return Permission.VIEW_QUEUE;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};

// ===== MEDICAL RECORDS PROTECTED COMPONENTS =====

interface MedicalRecordsProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'import';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const MedicalRecordsProtectedComponent: React.FC<MedicalRecordsProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_MEDICAL_RECORDS;
      case 'create':
        return Permission.CREATE_MEDICAL_RECORDS;
      case 'update':
        return Permission.UPDATE_MEDICAL_RECORDS;
      case 'delete':
        return Permission.DELETE_MEDICAL_RECORDS;
      case 'export':
        return Permission.EXPORT_MEDICAL_RECORDS;
      case 'import':
        return Permission.IMPORT_MEDICAL_RECORDS;
      default:
        return Permission.VIEW_MEDICAL_RECORDS;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};

// ===== ROUTE PROTECTION COMPONENTS =====

interface MedicalRecordsRouteProtectionProps {
  children: React.ReactNode;
}

export const MedicalRecordsRouteProtection: React.FC<MedicalRecordsRouteProtectionProps> = ({
  children,
}) => {
  return (
    <ProtectedRoute
      permission={Permission.VIEW_MEDICAL_RECORDS}
      redirectTo="/dashboard"
    >
      {children}
    </ProtectedRoute>
  );
};

interface PharmacyRouteProtectionProps {
  children: React.ReactNode;
}

export const PharmacyRouteProtection: React.FC<PharmacyRouteProtectionProps> = ({
  children,
}) => {
  return (
    <ProtectedRoute
      permission={Permission.VIEW_PHARMACY}
      redirectTo="/dashboard"
    >
      {children}
    </ProtectedRoute>
  );
};

interface QueueRouteProtectionProps {
  children: React.ReactNode;
}

export const QueueRouteProtection: React.FC<QueueRouteProtectionProps> = ({
  children,
}) => {
  return (
    <ProtectedRoute
      permission={Permission.VIEW_QUEUE}
      redirectTo="/dashboard"
    >
      {children}
    </ProtectedRoute>
  );
};

// ===== ADMIN PROTECTED COMPONENTS =====

interface AdminProtectedComponentProps {
  children: React.ReactNode;
  action: 'view' | 'manage-users' | 'manage-clinics' | 'view-analytics' | 'system-settings';
  showFallback?: boolean;
  fallbackMessage?: string;
}

export const AdminProtectedComponent: React.FC<AdminProtectedComponentProps> = ({
  children,
  action,
  showFallback = false,
  fallbackMessage,
}) => {
  const getPermission = (action: string): Permission => {
    switch (action) {
      case 'view':
        return Permission.VIEW_USERS;
      case 'manage-users':
        return Permission.UPDATE_USERS;
      case 'manage-clinics':
        return Permission.UPDATE_CLINICS;
      case 'view-analytics':
        return Permission.VIEW_ANALYTICS;
      case 'system-settings':
        return Permission.MANAGE_SYSTEM_SETTINGS;
      default:
        return Permission.VIEW_USERS;
    }
  };

  return (
    <ProtectedComponent
      permission={getPermission(action)}
      showFallback={showFallback}
      fallback={fallbackMessage}
    >
      {children}
    </ProtectedComponent>
  );
};
