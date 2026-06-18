"use client";

import { use, useEffect, useMemo, createContext } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useRBAC,
  useRoleBasedNavigation,
  useAppointmentPermissions,
} from "@/hooks/utils/useRBAC";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES, getProtectedRouteRoles } from "@/lib/config/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RouteRedirect } from "@/components/navigation/RouteRedirect";

// Layout imports
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Header } from "@/components/global/Header";
import { cn } from "@/lib/utils";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/sidebarLinks";
import { useLayoutStore } from "@/stores/layout.store";
import { PatientQrGateHost } from "@/components/patient/PatientQrGateHost";
import { useUserProfile } from "@/hooks/query/useUsers";
const DashboardShellContext = createContext<boolean>(false);

const DASHBOARD_ROUTE_TITLES: Record<string, string> = {
  "/clinic-admin/staff": "Staff Directory",
  "/patient/payments": "My Billing & Payments",
};

function resolveDisplayNameAndInitials(user: {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
}) {
  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  if (firstName || lastName) {
    return {
      displayName: [firstName, lastName].filter(Boolean).join(" ").trim(),
      initials: `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(),
    };
  }

  const rawName = String(user.name || "").trim();
  // Don't use name if it looks like a phone number or temp email
  const isPhoneOrTempEmail = /^[+\d][\d\s().-]{6,}$/.test(rawName) ||
    /@(temp|tempemail|fake|test)\./i.test(rawName);
  if (rawName && !isPhoneOrTempEmail) {
    const candidate = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    const safeCandidate = candidate || "User";
    const tokens = safeCandidate.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return {
      displayName: safeCandidate.replace(/[._-]+/g, " ").trim() || "User",
      initials: `${tokens[0]?.[0] || safeCandidate[0] || "U"}${tokens[1]?.[0] || tokens[0]?.[1] || ""}`.toUpperCase(),
    };
  }

  // Check if email is valid (not temp/fake email)
  const rawEmail = String(user.email || "").trim();
  const isFakeEmail = /@(temp|tempemail|fake|test)\./i.test(rawEmail);
  if (rawEmail && !isFakeEmail) {
    const emailPrefix = rawEmail.split("@")[0] || "";
    const emailTokens = emailPrefix.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return {
      displayName: emailPrefix.replace(/[._-]+/g, " ").trim() || "User",
      initials: `${emailTokens[0]?.[0] || "U"}${emailTokens[1]?.[0] || emailTokens[0]?.[1] || ""}`.toUpperCase(),
    };
  }

  // No valid name or email found
  // Show a friendly prompt so the user knows they need to complete their profile.
  return {
    displayName: "New Patient",
    initials: "NP",
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Optional — used for RBAC error messages and permission warnings */
  title?: string;
  allowedRole?: Role | Role[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  showPermissionWarnings?: boolean;
  customUnauthorizedMessage?: string;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
  allowedRole,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  showPermissionWarnings = true,
  customUnauthorizedMessage,
}: DashboardLayoutProps) {
  const isInsideShell = use(DashboardShellContext);

  // ─── Global Layout Store Sync ──────────────────────────────────────────────
  const setDashboardMeta = useLayoutStore((state) => state.setDashboardMeta);

  const { session, isPending } = useAuth();
  const { back, push, replace } = useRouter();
  const { user } = session || {};
  const { data: currentUserProfile } = useUserProfile();
  // RBAC hooks
  const rbac = useRBAC();
  const { getDefaultRoute } = useRoleBasedNavigation();
  const appointmentPermissions = useAppointmentPermissions();

  const authoritativeProfileComplete = useMemo(() => {
    const profile = currentUserProfile as Record<string, unknown> | undefined;
    if (!profile) return undefined;
    if (typeof profile.profileComplete === "boolean") return profile.profileComplete;
    if (typeof profile.isProfileComplete === "boolean") return profile.isProfileComplete;
    if (typeof profile.requiresProfileCompletion === "boolean") {
      return !profile.requiresProfileCompletion;
    }
    return undefined;
  }, [currentUserProfile]);

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
  const normalizedUserRole = useMemo(() => {
    return String(user?.role || "").toUpperCase().replace(/\s+/g, "_") as Role;
  }, [user?.role]);

  // Check permissions
  const hasPermissionAccess = useMemo(() => {
    if (!user) return false;

    if (requiredPermission) {
      return rbac.hasPermission(requiredPermission);
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      return requireAllPermissions
        ? rbac.hasAllPermissions(requiredPermissions)
        : rbac.hasAnyPermission(requiredPermissions);
    }

    return true;
  }, [user, rbac, requiredPermission, requiredPermissions, requireAllPermissions]);

  // Get current path for route-based protection
  const pathname = usePathname();
  const resolvedPageTitle =
    title !== "Dashboard" ? title : DASHBOARD_ROUTE_TITLES[pathname] || title;

  // Check role access (Component Props)
  const hasRoleAccess = useMemo(() => {
    if (!user || allowedRoles.length === 0) return true;
    return allowedRoles.includes(normalizedUserRole);
  }, [user, allowedRoles, normalizedUserRole]);

  // Check role access (Route Config)
  const hasRouteRoleAccess = useMemo(() => {
    if (!user || !pathname) return false;
    const routeRoles = getProtectedRouteRoles(pathname);
    if (routeRoles && routeRoles.length > 0) {
      return routeRoles.includes(normalizedUserRole);
    }
    return true;
  }, [user, pathname, normalizedUserRole]);

  // Overall access check
  const hasAccess = hasRoleAccess && hasRouteRoleAccess && hasPermissionAccess;
  const redirectTarget = useMemo(() => {
    if (isPending) return null;
    if (!user) return ROUTES.LOGIN;
    if (!hasAccess) return getDefaultRoute();
    const profileComplete = authoritativeProfileComplete ?? user?.profileComplete;
    if (normalizedUserRole === Role.PATIENT && profileComplete === false) {
      return ROUTES.PROFILE_COMPLETION;
    }
    return null;
  }, [isPending, user, hasAccess, getDefaultRoute, authoritativeProfileComplete, normalizedUserRole]);

  // ─── Fetch User Profile (React Query) ──────────────────────────────────────
  // ─── Sync Store Data (Zustand) ─────────────────────────────────────────────
  const userDisplayData = useMemo(() => {
    if (!user) return null;
    const { displayName, initials } = resolveDisplayNameAndInitials(user);

    const avatar = user.profilePicture || "";

    return {
      name: displayName,
      initials,
      role: normalizedUserRole || Role.PATIENT,
      avatar,
      email: user.email || "",
    };
  }, [user, normalizedUserRole]);

  useEffect(() => {
    setDashboardMeta({
      pageTitle: resolvedPageTitle || "Dashboard",
      displayUser: userDisplayData,
    });
  }, [resolvedPageTitle, setDashboardMeta, userDisplayData]);

  if (isPending || (!user && !session)) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background p-6",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <div className="max-w-md w-full text-center gap-y-6">
          <Shield className="mx-auto size-12 text-red-500" />
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {customUnauthorizedMessage || `Your role (${user?.role}) is not authorized for this area.`}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => back()} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => push(getDefaultRoute())} className="flex-1">Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (redirectTarget) {
    return <RouteRedirect target={redirectTarget} />;
  }

  // Profile completeness check
  const profileComplete = authoritativeProfileComplete ?? user?.profileComplete;
  if (normalizedUserRole === Role.PATIENT && profileComplete === false) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="ml-2">Redirecting to profile completion…</p>
      </div>
    );
  }

  // Shell Rendering info
  const userRole = String(userDisplayData?.role || Role.PATIENT).toUpperCase().replace(/\s+/g, "_");
  const sidebarLinks: SidebarLink[] = (sidebarLinksByRole[userRole] as SidebarLink[]) ?? [];

  // Render
  if (isInsideShell) {
    return (
      <div className="h-full w-full">
        {showPermissionWarnings && title.toLowerCase().includes("appointment") && !appointmentPermissions.canViewAppointments && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="size-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">Limited appointment access.</AlertDescription>
          </Alert>
        )}
        {children}
      </div>
    );
  }

  return (
    <DashboardShellContext.Provider value={true}>
      <div className="relative min-h-screen bg-background">
        <Sidebar
          links={sidebarLinks}
          user={{
            name: userDisplayData?.name || "User",
            avatarUrl: userDisplayData?.avatar || "",
            role: String(userDisplayData?.role || ""),
          }}
        >
          <div className="flex flex-col h-full bg-background overflow-hidden text-neutral-900 dark:text-neutral-50">
            <Header className="bg-transparent border-b border-muted transition-none" />
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-8 max-w-6xl mx-auto">
                {showPermissionWarnings && title.toLowerCase().includes("appointment") && !appointmentPermissions.canViewAppointments && (
                  <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">Limited appointment access.</AlertDescription>
                  </Alert>
                )}
                {children}
              </div>
            </main>
          </div>
        </Sidebar>
        <PatientQrGateHost />
      </div>
    </DashboardShellContext.Provider>
  );
}


