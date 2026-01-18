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
import { useRouter } from "next/navigation";

import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";
import { LoadingSpinner } from "@/components/ui/loading";
import { NotificationBell } from "@/components/notifications";
import { ROUTES } from "@/lib/config/routes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isPending, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isPending, isAuthenticated, router]);

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
        retry: 1,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      }
    );

  // ✅ Show inline loading state (non-blocking)
  if (isPending || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" text="Loading dashboard..." center />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !session?.user) {
    return null;
  }

  // Robust role check: fallback to 'PATIENT' if role is invalid
  const userRole: Role = (Object.values(Role) as string[]).includes(
    (session?.user?.role ?? "") as string
  )
    ? (session?.user?.role as Role)
    : Role.PATIENT;

  // Get sidebar links for the user's role
  const sidebarLinks: SidebarLink[] = sidebarLinksByRole[userRole] as SidebarLink[];

  // User avatar fallback
  const userAvatar = profile?.profilePicture || "/avatar.png";

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  // Sidebar links already use correct paths (route groups don't appear in URLs)
  const updatedSidebarLinks = sidebarLinks.map((link) => ({
    ...link,
    icon: link.icon(),
    href: link.path,
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
        <div className="flex flex-col min-h-screen relative">
          <div className="absolute top-4 right-8 z-10 flex items-center gap-4">
             <NotificationBell />
             <MinimalStatusIndicator />
          </div>
          <main className="flex-1 p-8 pt-16">{children}</main>
        </div>
      </Sidebar>
    </div>
  );
}
