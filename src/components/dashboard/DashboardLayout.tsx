"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useRBAC,
  useRoleBasedNavigation,
  useAppointmentPermissions,
  useQueuePermissions,
} from "@/hooks/useRBAC";
import { ProtectedRoute } from "@/components/rbac";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardByRole } from "@/config/routes";
import { useQueryData } from "@/hooks/useQueryData";
import { getUserProfile } from "@/lib/actions/users.server";
import { checkProfileCompletion, transformApiResponse } from "@/lib/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/auth.types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  allowedRole?: Role | Role[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  showPermissionWarnings?: boolean;
  customUnauthorizedMessage?: string;
}

export function DashboardLayout({
  children,
  title,
  allowedRole,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  showPermissionWarnings = true,
  customUnauthorizedMessage,
}: DashboardLayoutProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { user } = session || {};

  // RBAC hooks
  const rbac = useRBAC();
  const { getDefaultRoute } = useRoleBasedNavigation();
  const appointmentPermissions = useAppointmentPermissions();
  const queuePermissions = useQueuePermissions();

  // Memoize allowed roles array
  const allowedRoles = useMemo(
    () =>
      allowedRole
        ? Array.isArray(allowedRole)
          ? allowedRole
          : [allowedRole]
        : [],
    [allowedRole]
  );

  // Check permissions
  const hasPermissionAccess = useMemo(() => {
    if (!user) return false;

    // Check single permission
    if (requiredPermission) {
      return rbac.hasPermission(requiredPermission);
    }

    // Check multiple permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      return requireAllPermissions
        ? rbac.hasAllPermissions(requiredPermissions)
        : rbac.hasAnyPermission(requiredPermissions);
    }

    return true; // No permission requirements
  }, [
    user,
    rbac,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions,
  ]);

  // Check role access
  const hasRoleAccess = useMemo(() => {
    if (!user || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role as Role);
  }, [user, allowedRoles]);

  // Overall access check
  const hasAccess = hasRoleAccess && hasPermissionAccess;

  // Fetch user profile for completeness check
  const { data: profile, isPending: loadingProfile } = useQueryData(
    ["dashboard-profile"],
    async () => {
      const response = await getUserProfile();
      if (typeof response === "object" && response !== null) {
        const data = (response as Record<string, unknown>).data || response;
        return transformApiResponse(data as Record<string, unknown>);
      }
      return transformApiResponse({} as Record<string, unknown>);
    },
    { enabled: !!session?.access_token }
  );

  // Memoize profile cleaning function
  const cleanProfile = useMemo(() => {
    return (
      profile: Partial<UserProfile>,
      user: Partial<UserProfile>
    ): UserProfile => {
      const dateOfBirthRaw = profile?.dateOfBirth ?? user?.dateOfBirth;
      const genderRaw = profile?.gender ?? user?.gender;
      const allowedGenders = ["male", "female", "other"];
      let gender: "male" | "female" | "other" | undefined = undefined;

      if (allowedGenders.includes((genderRaw || "").toLowerCase())) {
        gender = genderRaw as "male" | "female" | "other";
      }

      return {
        ...profile,
        ...user,
        dateOfBirth: dateOfBirthRaw === null ? undefined : dateOfBirthRaw,
        gender,
      } as UserProfile;
    };
  }, []);

  // Memoize merged profile
  const mergedProfile = useMemo(() => {
    if (!user || !profile) return null;
    return cleanProfile(
      profile as Partial<UserProfile>,
      user as Partial<UserProfile>
    );
  }, [user, profile, cleanProfile]);

  // Consolidated authentication and authorization effect
  useEffect(() => {
    // Skip if still loading
    if (isLoading || loadingProfile) return;

    // Redirect to login if no user
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Check comprehensive access (role + permissions)
    if (!hasAccess) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `Unauthorized access to ${title.toLowerCase()} dashboard`,
          {
            userRole: user.role,
            allowedRoles,
            hasRoleAccess,
            hasPermissionAccess,
            requiredPermission,
            requiredPermissions,
          }
        );
      }

      // Redirect to appropriate dashboard based on user's role
      const redirectPath = getDefaultRoute();
      router.replace(redirectPath);
      return;
    }

    // Check profile completeness
    if (mergedProfile) {
      const { isComplete } = checkProfileCompletion(mergedProfile);
      if (!isComplete) {
        router.replace("/profile-completion");
        return;
      }
    }
  }, [
    isLoading,
    loadingProfile,
    user,
    mergedProfile,
    allowedRoles,
    title,
    router,
  ]);

  // Show loading state while checking authentication or profile completeness
  if (isLoading || !user || loadingProfile || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized access message
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              {customUnauthorizedMessage ||
                `You don't have permission to access the ${title.toLowerCase()}.`}
            </p>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {!hasRoleAccess && allowedRoles.length > 0 && (
                <>
                  Your role ({user.role}) is not authorized for this area.
                  Required roles: {allowedRoles.join(", ")}.
                </>
              )}
              {!hasPermissionAccess && (
                <>
                  You don't have the required permissions to access this
                  feature.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={() => router.push(getDefaultRoute())}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check profile completeness before rendering children
  if (!mergedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { isComplete } = checkProfileCompletion(mergedProfile);
  if (!isComplete) {
    return null; // Will redirect in useEffect
  }

  // Render permission warnings if enabled
  const renderPermissionWarnings = () => {
    if (!showPermissionWarnings) return null;

    const warnings = [];

    // Check for common permission warnings
    if (
      !appointmentPermissions.canViewAppointments &&
      title.toLowerCase().includes("appointment")
    ) {
      warnings.push(
        "Limited appointment access - some features may not be available."
      );
    }

    if (
      !queuePermissions.canManageQueue &&
      title.toLowerCase().includes("queue")
    ) {
      warnings.push("Read-only queue access - you cannot modify queue status.");
    }

    if (warnings.length === 0) return null;

    return (
      <div className="mb-6">
        {warnings.map((warning, index) => (
          <Alert key={index} className="mb-2 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {warning}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Role: {user.role}</span>
          </div>
        </div>

        {renderPermissionWarnings()}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
