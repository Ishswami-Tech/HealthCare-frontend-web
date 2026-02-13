"use client";

/**
 * ✅ Dashboard Layout
 * Protected layout for authenticated users
 * Uses inline LoadingSpinner for loading states (no blocking overlay)
 */

import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryData } from "@/hooks/core/useQueryData";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/sidebarLinks";
import { Role, type UserProfile } from "@/types/auth.types";
import React from "react";
import { getUserProfile } from "@/lib/actions/users.server";
import { useRouter, usePathname } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/loading";
import { ROUTES, getProtectedRouteRoles, getDashboardByRole } from "@/lib/config/routes";

import { Header } from "@/components/global/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isPending, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // RBAC: Check if user is allowed to access the current route
    if (!isPending && isAuthenticated && session?.user?.role) {
      const allowedRoles = getProtectedRouteRoles(pathname);
      if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
        // Redirect to their allowed dashboard
        const dashboardPath = getDashboardByRole(session.user.role as Role);
        if (pathname !== dashboardPath) {
          router.replace(dashboardPath);
        }
      }
    }
  }, [isPending, isAuthenticated, router, pathname, session]);

  const { data: profile } =
    useQueryData<UserProfile, Error>(
      ["user-profile"],
      async (): Promise<UserProfile> => {
        const result = await getUserProfile();
        if (!result || typeof result !== 'object') {
          throw new Error('Failed to fetch user profile');
        }
        return result as UserProfile;
      },
      {
        enabled: !!session?.user?.id,
        retry: 1,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      }
    );

  // ✅ Show inline loading state (only for auth check)
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" text="Checking session..." center />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" text="Redirecting..." center />
      </div>
    );
  }

  // Robust role check: fallback to 'PATIENT' if role is invalid
  const userRole: Role = (Object.values(Role) as string[]).includes(
    (session?.user?.role ?? "") as string
  )
    ? (session?.user?.role as Role)
    : Role.PATIENT;

  // Get sidebar links for the user's role
  const sidebarLinks: SidebarLink[] = sidebarLinksByRole[userRole] as SidebarLink[];

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  // User avatar fallback
  const userAvatar =
    profile?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  // Sidebar links already use correct paths (route groups don't appear in URLs)
  const updatedSidebarLinks: SidebarLink[] = sidebarLinks.map((link) => ({
    label: link.label,
    path: link.path,
    icon: link.icon,
  }));

  return (
    <div className="relative min-h-screen bg-muted/40 dark:bg-muted/10">
      <Sidebar
        links={updatedSidebarLinks}
        user={{
          name: displayName,
          avatarUrl: userAvatar,
          role: userRole,
        }}
      >
        <div className="flex-1 h-full overflow-hidden">
          <div className="flex flex-col h-full bg-background border-l border-r shadow-sm overflow-hidden">
            <Header className="bg-transparent border-b border-muted transition-none" />
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
