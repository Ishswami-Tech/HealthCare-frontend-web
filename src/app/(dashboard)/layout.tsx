"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryData } from "@/hooks/core/useQueryData";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/sidebarLinks";
import { Role, type UserProfile } from "@/types/auth.types";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import React from "react";
import { getUserProfile } from "@/lib/actions/users.server";
import { useRouter } from "next/navigation";
import {
  DashboardStatusBar,
  FloatingStatusWidget,
} from "@/components/dashboard/DashboardStatusBar";
import { LoadingSpinner } from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, isAuthenticated } = useAuth();
  const { setOverlay } = useLoadingOverlay();
  const router = useRouter();

  // ✅ Only show overlay for auth loading, not for profile loading
  // Profile loading is handled by the early return below
  // Note: Overlay is managed by GlobalLoadingOverlayListener for route transitions
  // Use ref to avoid dependency issues
  const setOverlayRef = React.useRef(setOverlay);
  React.useEffect(() => {
    setOverlayRef.current = setOverlay;
  }, [setOverlay]);

  React.useEffect(() => {
    if (isLoading) {
      setOverlayRef.current({ show: true, variant: "default", message: "Authenticating..." });
      return undefined;
    } else {
      // ✅ Ensure overlay is hidden when auth loading completes
      // Add small delay to prevent flicker
      const timeoutId = setTimeout(() => {
        setOverlayRef.current({ show: false });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);
  
  // ✅ Safety timeout: Always hide overlay after max 10 seconds to prevent hanging
  React.useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setOverlayRef.current({ show: false });
    }, 10000);
    return () => clearTimeout(safetyTimeout);
  }, []);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/(auth)/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: profile, isPending: profileLoading } =
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
        // ✅ Add timeout and retry configuration to prevent hanging
        retry: 1, // Only retry once
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }
    );

  // ✅ Show loading state immediately - prevent content flash
  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" color="primary" text="Loading dashboard..." />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !session?.user) {
    return null;
  }

  // Profile error handling is now handled by React Query

  // Robust role check: fallback to 'PATIENT' if role is invalid
  const userRole: Role = (Object.values(Role) as string[]).includes(
    (session?.user?.role ?? "") as string
  )
    ? (session?.user?.role as Role)
    : Role.PATIENT;

  // Get sidebar links for the user's role
  const sidebarLinks: SidebarLink[] = sidebarLinksByRole[
    userRole
  ] as SidebarLink[];

  // User avatar fallback
  const userAvatar = profile?.profilePicture || "/avatar.png";

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  // Update sidebar links to use new route structure
  const updatedSidebarLinks = sidebarLinks.map((link) => ({
    ...link,
    icon: link.icon(),
    href: link.path.startsWith("/") ? `/(dashboard)${link.path}` : link.path, // Update paths for new route structure
  }));

  return (
    <div className="relative min-h-screen">
      <Sidebar
        links={updatedSidebarLinks}
        user={{
          name: displayName,
          avatarUrl: userAvatar,
        }}
      >
        <div className="flex flex-col min-h-screen">
          {/* Main status bar at the top */}
          <DashboardStatusBar variant="compact" position="top" />

          {/* Main content area */}
          <main className="flex-1 p-8">{children}</main>

          {/* Footer status bar */}
          <DashboardStatusBar variant="minimal" position="bottom" />
        </div>
      </Sidebar>

      {/* Floating status widget for critical issues */}
      <FloatingStatusWidget />
    </div>
  );
}
