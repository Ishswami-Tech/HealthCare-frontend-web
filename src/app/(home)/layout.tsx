"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getRoutesByRole } from "@/config/routes";
import { getUserProfile } from "@/lib/actions/users.server";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { sidebarLinksByRole, SidebarLink } from "@/config/sidebarLinks";
import { Role } from "@/types/auth.types";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import React from "react";

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

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setShow } = useLoadingOverlay();

  React.useEffect(() => {
    setShow(false);
  }, [setShow]);

  // Fetch user profile for display
  const { data: profile } = useQueryData<UserProfile>(
    ["layout-profile"],
    async () => {
      const response = await getUserProfile();
      return response.data || response;
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Get navigation links based on user role
  const navLinks = getRoutesByRole(session?.user?.role);

  const handleLogout = async () => {
    try {
      await logout();
      // The useAuth hook will handle the redirection and state cleanup
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = `/auth/login?t=${Date.now()}`;
    }
  };

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Robust role check: fallback to 'PATIENT' if role is invalid
  const userRole: Role = (Object.values(Role) as string[]).includes((session?.user?.role ?? "") as string)
    ? (session?.user?.role as Role)
    : Role.PATIENT;
  const sidebarLinks: SidebarLink[] = sidebarLinksByRole[userRole as Role] as SidebarLink[];

  // User avatar fallback
  const userAvatar = profile?.avatarUrl || "/avatar.png";

  return (
    <div className="min-h-screen flex">
      <GlobalSidebar
        links={sidebarLinks.map(link => ({
          ...link,
          icon: link.icon(),
          href: link.path // Ensure href is present for SidebarLinkItem type
        }))}
        user={{ name: displayName, avatarUrl: userAvatar }}
      >
        <main className="flex-1 p-8">{children}</main>
      </GlobalSidebar>
    </div>
  );
}
