"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { sidebarLinksByRole, SidebarLink } from "@/lib/config/config";
import { Role } from "@/types/auth.types";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import React from "react";
import { getUserProfile } from "@/lib/actions/users.server";
import { useRouter } from "next/navigation";
import {
  DashboardStatusBar,
  FloatingStatusWidget,
} from "@/components/layout/DashboardStatusBar";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  avatarUrl?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, isAuthenticated } = useAuth();
  const { setOverlay } = useLoadingOverlay();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) {
      setOverlay({ show: true, variant: "default" });
    } else {
      setOverlay({ show: false });
    }
  }, [isLoading, setOverlay]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/(auth)/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: profile, isPending: profileLoading } =
    useQueryData<UserProfile>(
      ["user-profile"],
      async () => {
        const result = await getUserProfile();
        return result as UserProfile;
      },
      {
        enabled: !!session?.user?.id,
      }
    );

  // Show loading state
  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
  const userAvatar = profile?.avatarUrl || "/avatar.png";

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
      <GlobalSidebar
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
      </GlobalSidebar>

      {/* Floating status widget for critical issues */}
      <FloatingStatusWidget />
    </div>
  );
}
