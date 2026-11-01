"use client";

import { use, useEffect, useMemo, useRef, useState, createContext } from "react";
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
import { useOwnDoctorName } from "@/hooks/query/useDoctors";
import { usePrefetchAppointmentsForRole } from "@/hooks/query/useAppointments";
import { usePrefetchPatientDashboardSummary } from "@/hooks/query/usePatientDashboardSummary";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { resolveDisplayNameAndInitials } from "@/lib/utils/display-name";
import { washToneForPath } from "@/components/tbd/wash";
import { titleForRegisteredPath } from "@/lib/config/tbdRoutes";
import { buildStaffDocumentTitle } from "@/lib/utils/document-title";
import { useDocumentTitle } from "@/hooks/utils/useDocumentTitle";
import { useClinicBrandName } from "@/hooks/query/useClinicBrandName";
const DashboardShellContext = createContext<boolean>(false);

const DASHBOARD_ROUTE_TITLES: Record<string, string> = {
  "/clinic-admin/staff": "Staff Directory",
  "/clinic-admin/payments": "Payment Reconciliation",
  "/clinic-admin/earnings": "Earnings",
  "/clinic-admin/locations": "Locations",
  "/clinic-admin/schedule": "Schedule",
  "/assistant-doctor/coverage": "Coverage",
  "/assistant-doctor/dashboard": "Dashboard",
  "/receptionist/check-in": "Check-In",
  "/patient/payments": "My Billing & Payments",
  "/patient/appointments": "Appointments",
  "/patient/check-in": "Location Check-In",
  "/patient/health": "Health",
  "/patient/dashboard": "Home",
};

/**
 * Page name shown at the left of the header when a route has no explicit title:
 * the last meaningful part of the path ("/doctor/patients/abc" -> "EHR").
 */
const ROUTE_TITLE_RULES: Array<[RegExp, string]> = [
  [/\/patients\/[^/]+\/visits\/[^/]+\/diet-chart/, "Diet Chart"],
  [/^\/doctor\/patients\/[^/]+/, "EHR"],
  [/\/settings\/sessions/, "Sessions"],
  [/\/check-ins?(\/|$)/, "Check-In"],
  [/\/locations(\/|$)/, "Locations"],
  [/\/schedule(\/|$)/, "Schedule"],
  [/\/coverage(\/|$)/, "Coverage"],
  [/\/(no-show)(\/|$)/, "Missed Appointments"],
  [/\/appointments(\/|$)/, "Appointments"],
  [/\/patients(\/|$)/, "Patients"],
  [/^\/queue(\/|$)/, "Queue"],
  [/\/prescriptions(\/|$)/, "Prescriptions"],
  [/\/notifications(\/|$)/, "Notifications"],
  [/^\/doctor\/reviews(\/|$)/, "Reviews"],
  [/\/earnings(\/|$)/, "Earnings"],
  [/^\/pharmacy(\/|$)|\/inventory(\/|$)/, "Inventory"],
  [/^\/billing(\/|$)/, "Billing"],
  [/\/profile(\/|$)/, "Profile"],
  [/\/settings(\/|$)/, "Settings"],
  [/\/dashboard(\/|$)/, "Dashboard"],
];

function titleForPath(pathname?: string | null): string | undefined {
  const path = String(pathname ?? "");
  return ROUTE_TITLE_RULES.find(([pattern]) => pattern.test(path))?.[1];
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
  const storeSession = useAuthStore((state) => state.session);
  const effectiveSession = session ?? storeSession;
  const [isMounted, setIsMounted] = useState(false);
  // Keep last known user so soft navigations never blank the sidebar if auth
  // state briefly flickers while React Query/session hooks settle.
  const lastUserRef = useRef<NonNullable<typeof effectiveSession>["user"] | null>(null);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { back, push, replace } = useRouter();
  const { user: sessionUser } = effectiveSession || {};
  if (sessionUser) {
    lastUserRef.current = sessionUser;
  } else if (!isPending && !effectiveSession) {
    lastUserRef.current = null;
  }
  // During auth settle / soft nav, reuse last user so the shell never blanks.
  // Once auth is settled with no session, clear so logout can redirect.
  const user = sessionUser ?? (isPending ? lastUserRef.current ?? undefined : undefined);
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
  const routePageTitle =
    DASHBOARD_ROUTE_TITLES[pathname] || titleForRegisteredPath(pathname) || titleForPath(pathname);
  const resolvedPageTitle = title !== "Dashboard" ? title : routePageTitle || title;

  // Browser-tab title for staff routes ("Queue - Reception - Clinic"); patient routes set their
  // own through segment metadata. Only the outer shell sets it.
  const clinicBrand = useClinicBrandName();
  const isPatientRoute = Boolean(pathname?.startsWith("/patient"));
  const staffDocumentTitle =
    !isInsideShell && user && !isPatientRoute && pathname
      ? buildStaffDocumentTitle({
          pathname,
          pageName: title !== "Dashboard" ? title : routePageTitle,
          role: normalizedUserRole,
          clinicName: clinicBrand.isKnown ? clinicBrand.name : null,
        })
      : null;
  useDocumentTitle(staffDocumentTitle);

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
    // Never treat a slow session bootstrap as logged-out. Payment returns and
    // cold loads can take longer than a fixed timeout while refresh is in flight.
    if (isPending) return null;
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
    user,
    pathname,
    hasAccess,
    getDefaultRoute,
    currentUserProfile,
    isUserProfilePending,
    normalizedUserRole,
    effectiveSession?.user,
  ]);

  // ─── Fetch User Profile (React Query) ──────────────────────────────────────
  // ─── Sync Store Data (Zustand) ─────────────────────────────────────────────
  // A doctor's profile may have only `users.name` (no first/last name); the profile endpoint does
  // not return it, the clinic doctor list does.
  const ownDoctorName = useOwnDoctorName(
    normalizedUserRole === Role.DOCTOR || normalizedUserRole === Role.ASSISTANT_DOCTOR
  );
  const userDisplayData = useMemo(() => {
    if (!user) return null;
    const merged: Record<string, unknown> = {
      ...(user as unknown as Record<string, unknown>),
      ...(currentUserProfile as unknown as Record<string, unknown> | undefined),
    };
    const hasOwnName = typeof merged.name === "string" && merged.name.trim().length > 0;
    const mergedUser = !hasOwnName && ownDoctorName ? { ...merged, name: ownDoctorName } : merged;
    const { displayName, initials } = resolveDisplayNameAndInitials(mergedUser);

    const avatar = user.profilePicture || "";

    return {
      name: displayName,
      initials,
      role: normalizedUserRole || Role.PATIENT,
      avatar,
      email: user.email || "",
    };
  }, [user, currentUserProfile, normalizedUserRole, ownDoctorName]);

  // ─── Role-aware prefetch for every dashboard scope ───────────────────────
  // Warms staff appointment lists as soon as the dashboard mounts. Patients
  // intentionally use `patientDashboardSummary` for dashboard appointment
  // bootstrap so the dashboard does not issue a separate `myAppointments`
  // REST request on every load.
  //
  // Previously this layout also called `usePrefetchMyAppointments()` (no
  // clinicId), which used the no-filter key and produced a duplicate fetch
  // with a different cache slot.
  // Staff dashboards fetch their own day-bounded appointment list; skip the unbounded warm-up
  // there so the dashboard's first paint does not wait behind a duplicate request.
  usePrefetchAppointmentsForRole({ skip: /^\/[a-z-]+\/dashboard\/?$/.test(pathname ?? "") });

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

  // Keep SSR and the client's first paint identical for the *outer* shell only.
  // Nested DashboardLayout (appointments/check-in) must not remount a skeleton
  // on every soft nav — that made Payments → Appointments feel multi-second.
  if (!isMounted && !isInsideShell) {
    return (
      <div className="bg-background p-4 min-h-screen">
        <DashboardPageSkeleton />
      </div>
    );
  }

  // Auth bootstrap: never tear down the whole shell (sidebar + header) once we
  // already have a session in memory. That flash made soft navigations look
  // like full page refreshes.
  if (!user) {
    if (!isPending && redirectTarget) {
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:min-h-11 focus:rounded-xl focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg focus:ring-2 focus:ring-brand"
        >
          Skip to main content
        </a>
        <Sidebar
          links={sidebarLinks}
          user={{
            name: userDisplayData?.name || "User",
            avatarUrl: userDisplayData?.avatar || "",
            role: String(userDisplayData?.role || ""),
          }}
        >
          {/* Section wash behind the header and the page; the tone follows the route. */}
          <div
            className="tbd-wash flex flex-col h-full overflow-hidden text-ink"
            data-tone={washToneForPath(pathname)}
          >
            <Header className="bg-transparent transition-none" />
            <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto focus:outline-none">
              <div className="mx-auto w-full max-w-[1160px] px-4 pt-1 pb-24 sm:px-6 md:px-8 lg:pb-10">
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


