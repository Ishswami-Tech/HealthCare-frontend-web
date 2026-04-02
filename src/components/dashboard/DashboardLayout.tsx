"use client";

import { useEffect, useMemo, createContext, useContext } from "react";
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
import { useQueryData } from "@/hooks/core/useQueryData";
import { getUserProfile } from "@/lib/actions/users.server";
import { transformApiResponse } from "@/lib/config/profile";
import { ROUTES, getProtectedRouteRoles } from "@/lib/config/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/auth.types";

// Layout imports
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Header } from "@/components/global/Header";
import { cn } from "@/lib/utils";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/sidebarLinks";
import { useLayoutStore } from "@/stores/layout.store";
const DashboardShellContext = createContext<boolean>(false);

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
  const isInsideShell = useContext(DashboardShellContext);

  // ─── Global Layout Store Sync ──────────────────────────────────────────────
  const setDashboardMounted = useLayoutStore((state) => state.setDashboardMounted);
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);
  const setDisplayUser = useLayoutStore((state) => state.setDisplayUser);

  const { session, isPending } = useAuth();
  const router = useRouter();
  const { user } = session || {};

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

  // ─── Fetch User Profile (React Query) ──────────────────────────────────────
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

  // Memoize merged profile
  const mergedProfile = useMemo(() => {
    if (!user || !profile) return null;
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
  }, [user, profile]);

  // ─── Sync Store Data (Zustand) ─────────────────────────────────────────────
  const userDisplayData = useMemo(() => {
    if (!user) return null;
    
    // Use profile data if available, fall back to basic user data
    const profileData = profile || {};
    const firstName = (profileData as any).firstName || user.firstName || "User";
    const lastName = (profileData as any).lastName || user.lastName || "";
    
    const displayName = lastName ? `${firstName} ${lastName}` : firstName;
    
    // Generate initials (more robustly)
    const initials = `${(firstName?.[0] || "U")}${(lastName?.[0] || "")}`.toUpperCase();

    const avatar = (profileData as any).profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&format=png`;

    return {
      name: displayName,
      initials,
      role: normalizedUserRole || Role.PATIENT,
      avatar,
      email: user.email || "",
    };
  }, [user, profile, normalizedUserRole]);

  useEffect(() => {
    if (userDisplayData) {
      setDisplayUser(userDisplayData);
    }
  }, [userDisplayData, setDisplayUser]);

  // Sync page title
  useEffect(() => {
    if (title) {
      setPageTitle(title);
    }
  }, [title, setPageTitle]);

  // Authorization effect
  useEffect(() => {
    if (isPending || loadingProfile) return;
    
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    
    if (!hasAccess) {
      router.replace(getDefaultRoute());
      return;
    }
    
    if (user?.profileComplete === false) {
      router.replace(ROUTES.PROFILE_COMPLETION);
    }
  }, [isPending, loadingProfile, user, mergedProfile, hasAccess, getDefaultRoute, router]);

  // Shell detection effect (for other store consumers)
  useEffect(() => {
    setDashboardMounted(true);
    return () => setDashboardMounted(false);
  }, [setDashboardMounted]);

  if (isPending || (!user && !session)) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background p-6",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <div className="max-w-md w-full text-center space-y-6">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {customUnauthorizedMessage || `Your role (${user?.role}) is not authorized for this area.`}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => router.back()} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => router.push(getDefaultRoute())} className="flex-1">Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  // Profile completeness check
  if (user?.profileComplete === false) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-background",
        isInsideShell ? "h-[400px] w-full" : "min-h-screen"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2">Redirecting to profile completion...</p>
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
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
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
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">Limited appointment access.</AlertDescription>
                  </Alert>
                )}
                {children}
              </div>
            </main>
          </div>
        </Sidebar>
      </div>
    </DashboardShellContext.Provider>
  );
}
