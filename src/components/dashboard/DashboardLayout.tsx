"use client";

import { use, useEffect, useMemo, useState, createContext } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useRBAC,
  useRoleBasedNavigation,
  useAppointmentPermissions,
} from "@/hooks/utils/useRBAC";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { Shield, AlertTriangle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES, getProtectedRouteRoles } from "@/lib/config/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RouteRedirect } from "@/components/navigation/RouteRedirect";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";

// Layout imports
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Header } from "@/components/global/Header";
import { cn } from "@/lib/utils";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/sidebarLinks";
import { useLayoutStore } from "@/stores/layout.store";
import { useAuthStore } from "@/stores";
import { PatientQrGateHost } from "@/components/patient/PatientQrGateHost";
import { useUserProfile } from "@/hooks/query/useUsers";
import { usePrefetchAppointmentsForRole } from "@/hooks/query/useAppointments";
import { usePrefetchPatientDashboardSummary } from "@/hooks/query/usePatientDashboardSummary";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { resolveDisplayNameAndInitials } from "@/lib/utils/display-name";
const DashboardShellContext = createContext<boolean>(false);

const DASHBOARD_ROUTE_TITLES: Record<string, string> = {
  "/clinic-admin/staff": "Staff Directory",
  "/patient/payments": "My Billing & Payments",
};

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
  const storeSession = useAuthStore((state) => state.session);
  const effectiveSession = session ?? storeSession;
  const [authBootstrapTimedOut, setAuthBootstrapTimedOut] = useState(false);
  const { back, push, replace } = useRouter();
  const { user } = effectiveSession || {};
  const { data: currentUserProfile, isPending: isUserProfilePending } = useUserProfile({
    enabled: !!user,
  });
  // RBAC hooks
  const rbac = useRBAC();
  const { getDefaultRoute } = useRoleBasedNavigation();
  const appointmentPermissions = useAppointmentPermissions();

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

  useEffect(() => {
    if (user || effectiveSession || !isPending) {
      setAuthBootstrapTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setAuthBootstrapTimedOut(true);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [effectiveSession, isPending, user]);

  const redirectTarget = useMemo(() => {
    if (isPending && !authBootstrapTimedOut) return null;
    if (!user) {
      const loginUrl = new URL(ROUTES.LOGIN, "http://local");
      if (pathname) {
        loginUrl.searchParams.set("callbackUrl", pathname);
        loginUrl.searchParams.set("from", pathname);
      }
      return `${loginUrl.pathname}${loginUrl.search}`;
    }
    if (!hasAccess) return getDefaultRoute();

    // Patient profile completeness check - use authoritative profile data
    if (normalizedUserRole === Role.PATIENT) {
      // Always show shell immediately - redirect decision happens after profile loads
      // If profile is loading, return null (show shell) and redirect later in a second pass
      if (isUserProfilePending) {
        return null;
      }

      // Profile loaded - make definitive redirect decision
      const profileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
        effectiveSession?.user as Record<string, unknown> | null | undefined,
        currentUserProfile as Record<string, unknown> | null | undefined,
      );

      const needsProfileCompletion = profileComplete !== true;

      if (needsProfileCompletion) {
        return ROUTES.PROFILE_COMPLETION;
      }
    }
    return null;
  }, [
    isPending,
    authBootstrapTimedOut,
    user,
    pathname,
    hasAccess,
    getDefaultRoute,
    currentUserProfile,
    isUserProfilePending,
    normalizedUserRole,
  ]);

  // ─── Fetch User Profile (React Query) ──────────────────────────────────────
  // ─── Sync Store Data (Zustand) ─────────────────────────────────────────────
  const userDisplayData = useMemo(() => {
    if (!user) return null;
    const mergedUser = {
      ...(user as unknown as Record<string, unknown>),
      ...(currentUserProfile as unknown as Record<string, unknown> | undefined),
    };
    const { displayName, initials } = resolveDisplayNameAndInitials(mergedUser);

    const avatar = user.profilePicture || "";

    return {
      name: displayName,
      initials,
      role: normalizedUserRole || Role.PATIENT,
      avatar,
      email: user.email || "",
    };
  }, [user, currentUserProfile, normalizedUserRole]);

  // ─── Role-aware prefetch for every dashboard scope ───────────────────────
  // Warms staff appointment lists as soon as the dashboard mounts. Patients
  // intentionally use `patientDashboardSummary` for dashboard appointment
  // bootstrap so the dashboard does not issue a separate `myAppointments`
  // REST request on every load.
  //
  // Previously this layout also called `usePrefetchMyAppointments()` (no
  // clinicId), which used the no-filter key and produced a duplicate fetch
  // with a different cache slot.
  usePrefetchAppointmentsForRole();

  // Prefetch the composed dashboard summary so the first paint of
  // /patient/dashboard reads from cache. Patient-only; the hook itself
  // early-returns when no user id / clinic id is resolved.
  usePrefetchPatientDashboardSummary();

  useEffect(() => {
    setDashboardMeta({
      pageTitle: resolvedPageTitle || "Dashboard",
      displayUser: userDisplayData,
    });
  }, [resolvedPageTitle, setDashboardMeta, userDisplayData]);

  if (!user && !effectiveSession) {
    if ((!isPending || authBootstrapTimedOut) && redirectTarget) {
      return <RouteRedirect target={redirectTarget} />;
    }

    return (
      <div className={cn(
        "bg-background p-4",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <DashboardPageSkeleton />
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
              <div className="px-2 pt-4 pb-24 md:px-8 md:pt-8 lg:pb-8 max-w-6xl mx-auto">
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


