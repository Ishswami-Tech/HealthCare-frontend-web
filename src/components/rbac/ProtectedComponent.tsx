'use client';

import React from 'react';
import { useRBAC, useAppointmentPermissions, usePatientPermissions, useQueuePermissions } from '@/hooks/utils/useRBAC';
import { Permission } from '@/types/rbac.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  fallback,
  showFallback = true,
}) => {
  const rbac = useRBAC();

  const hasAccess = React.useMemo(() => {
    // Check single permission
    if (permission) {
      return rbac.hasPermission(permission);
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      return requireAll 
        ? rbac.hasAllPermissions(permissions)
        : rbac.hasAnyPermission(permissions);
    }

    // Check resource-action combination
    if (resource && action) {
      return rbac.canAccess(resource, action);
    }

    // If no permission criteria specified, allow access
    return true;
  }, [rbac, permission, permissions, requireAll, resource, action]);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showFallback) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You don't have permission to access this feature.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for protecting components with permissions
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = false
) {
  return function ProtectedComponentWrapper(props: P) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    return (
      <ProtectedComponent 
        permissions={permissions} 
        requireAll={requireAll}
        showFallback={true}
      >
        <Component {...props} />
      </ProtectedComponent>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export const useConditionalRender = () => {
  const rbac = useRBAC();

  return {
    renderIf: (condition: boolean, component: React.ReactNode) => {
      return condition ? component : null;
    },
    
    renderWithPermission: (permission: Permission, component: React.ReactNode) => {
      return rbac.hasPermission(permission) ? component : null;
    },
    
    renderWithAnyPermission: (permissions: Permission[], component: React.ReactNode) => {
      return rbac.hasAnyPermission(permissions) ? component : null;
    },
    
    renderWithAllPermissions: (permissions: Permission[], component: React.ReactNode) => {
      return rbac.hasAllPermissions(permissions) ? component : null;
    },
    
    renderWithAccess: (resource: string, action: string, component: React.ReactNode) => {
      return rbac.canAccess(resource, action) ? component : null;
    },
  };
};

// Specific protected components for common use cases

/**
 * Protected button that only shows if user has permission
 */
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  children: React.ReactNode;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  permission,
  permissions,
  requireAll,
  resource,
  action,
  children,
  ...buttonProps
}) => {
  return (
    <ProtectedComponent
      {...(permission && { permission })}
      {...(permissions && { permissions })}
      {...(requireAll !== undefined && { requireAll })}
      {...(resource && { resource })}
      {...(action && { action })}
      showFallback={false}
    >
      <button {...buttonProps}>
        {children}
      </button>
    </ProtectedComponent>
  );
};

/**
 * Protected link that only shows if user has permission
 */
interface ProtectedLinkProps {
  href: string;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}

export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  href,
  permission,
  permissions,
  requireAll,
  resource,
  action,
  children,
  className,
}) => {
  return (
    <ProtectedComponent
      {...(permission && { permission })}
      {...(permissions && { permissions })}
      {...(requireAll !== undefined && { requireAll })}
      {...(resource && { resource })}
      {...(action && { action })}
      showFallback={false}
    >
      <a href={href} className={className}>
        {children}
      </a>
    </ProtectedComponent>
  );
};

// Appointment-specific protected components
export const AppointmentProtectedComponent: React.FC<{
  children: React.ReactNode;
  action: 'view' | 'create' | 'update' | 'delete' | 'manage';
  fallback?: React.ReactNode;
}> = ({ children, action, fallback }) => {
  const permissions = useAppointmentPermissions();
  
  const hasAccess = React.useMemo(() => {
    switch (action) {
      case 'view':
        return permissions.canViewAppointments;
      case 'create':
        return permissions.canCreateAppointments;
      case 'update':
        return permissions.canUpdateAppointments;
      case 'delete':
        return permissions.canDeleteAppointments;
      case 'manage':
        return permissions.canManageQueue;
      default:
        return false;
    }
  }, [permissions, action]);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Patient-specific protected components
export const PatientProtectedComponent: React.FC<{
  children: React.ReactNode;
  action: 'view' | 'create' | 'update' | 'delete' | 'medical-records';
  fallback?: React.ReactNode;
}> = ({ children, action, fallback }) => {
  const permissions = usePatientPermissions();
  
  const hasAccess = React.useMemo(() => {
    switch (action) {
      case 'view':
        return permissions.canViewPatients;
      case 'create':
        return permissions.canCreatePatients;
      case 'update':
        return permissions.canUpdatePatients;
      case 'delete':
        return permissions.canDeletePatients;
      case 'medical-records':
        return permissions.canViewMedicalRecords;
      default:
        return false;
    }
  }, [permissions, action]);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Queue-specific protected components
export const QueueProtectedComponent: React.FC<{
  children: React.ReactNode;
  action: 'view' | 'manage' | 'call-next' | 'update-status';
  fallback?: React.ReactNode;
}> = ({ children, action, fallback }) => {
  const permissions = useQueuePermissions();
  
  const hasAccess = React.useMemo(() => {
    switch (action) {
      case 'view':
        return permissions.canViewQueue;
      case 'manage':
        return permissions.canManageQueue;
      case 'call-next':
        return permissions.canCallNextPatient;
      case 'update-status':
        return permissions.canUpdateQueueStatus;
      default:
        return false;
    }
  }, [permissions, action]);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
