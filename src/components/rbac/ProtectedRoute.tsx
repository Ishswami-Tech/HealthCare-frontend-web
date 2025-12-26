"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC, useRoleBasedNavigation } from "@/hooks/useRBAC";
import { Permission } from "@/types/rbac.types";
import { Role } from "@/types/auth.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  allowedRoles?: Role[];
  resource?: string;
  action?: string;
  redirectTo?: string;
  showUnauthorized?: boolean;
}

/**
 * Component that protects entire routes/pages based on user permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  allowedRoles,
  resource,
  action,
  redirectTo,
  showUnauthorized = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const rbac = useRBAC();
  const { getDefaultRoute } = useRoleBasedNavigation();

  // Check permission-based access (must be called before any early returns)
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

  // Show isLoading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    redirect("/auth/login");
  }

  const userRole = user?.role as Role;

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      if (redirectTo) {
        redirect(redirectTo);
      }

      if (showUnauthorized) {
        return <UnauthorizedAccess />;
      }

      redirect(getDefaultRoute());
    }
  }

  // Check permission-based access
  if (!hasAccess) {
    if (redirectTo) {
      redirect(redirectTo);
    }

    if (showUnauthorized) {
      return <UnauthorizedAccess />;
    }

    redirect(getDefaultRoute());
  }

  return <>{children}</>;
};

/**
 * Unauthorized access component
 */
const UnauthorizedAccess: React.FC = () => {
  const { getDefaultRoute } = useRoleBasedNavigation();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = getDefaultRoute();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Unauthorized Access</AlertTitle>
          <AlertDescription className="text-red-700">
            Your current role doesn't have the necessary permissions to view
            this content. Please contact your administrator if you believe this
            is an error.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-4">
          <Button onClick={handleGoBack} variant="outline" className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleGoHome} className="flex-1">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Higher-order component for protecting pages
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function ProtectedPageWrapper(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Higher-order component for protecting pages with permissions
 */
export function withPermissionProtection<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = false
) {
  return function ProtectedPageWrapper(props: P) {
    const permissions = Array.isArray(permission) ? permission : [permission];

    return (
      <ProtectedRoute permissions={permissions} requireAll={requireAll}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Specific route protections for common pages
 */

// Appointment pages protection
export const AppointmentRouteProtection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <ProtectedRoute permission={Permission.VIEW_APPOINTMENTS}>
    {children}
  </ProtectedRoute>
);

// Patient pages protection
export const PatientRouteProtection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <ProtectedRoute permission={Permission.VIEW_PATIENTS}>
    {children}
  </ProtectedRoute>
);

// Queue pages protection
export const QueueRouteProtection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute permission={Permission.VIEW_QUEUE}>{children}</ProtectedRoute>
);

// Analytics pages protection
export const AnalyticsRouteProtection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <ProtectedRoute permission={Permission.VIEW_ANALYTICS}>
    {children}
  </ProtectedRoute>
);

// Pharmacy pages protection
export const PharmacyRouteProtection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <ProtectedRoute permission={Permission.VIEW_PHARMACY}>
    {children}
  </ProtectedRoute>
);

// Medical records pages protection
export const MedicalRecordsRouteProtection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <ProtectedRoute permission={Permission.VIEW_MEDICAL_RECORDS}>
    {children}
  </ProtectedRoute>
);

// Admin-only pages protection
export const AdminRouteProtection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.CLINIC_ADMIN]}>
    {children}
  </ProtectedRoute>
);

// Doctor-only pages protection
export const DoctorRouteProtection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute
    allowedRoles={[Role.DOCTOR, Role.SUPER_ADMIN, Role.CLINIC_ADMIN]}
  >
    {children}
  </ProtectedRoute>
);

// Staff pages protection (excludes patients)
export const StaffRouteProtection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute
    allowedRoles={[
      Role.SUPER_ADMIN,
      Role.CLINIC_ADMIN,
      Role.DOCTOR,
      Role.RECEPTIONIST,
      Role.PHARMACIST,
    ]}
  >
    {children}
  </ProtectedRoute>
);

// Export the UnauthorizedAccess component
export { UnauthorizedAccess };
