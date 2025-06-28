"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { sidebarLinksByRole, SidebarLink } from "@/config/sidebarLinks";
import { Role } from "@/types/auth.types";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import React from "react";
import { getUserProfile } from "@/lib/actions/users.server";
import { useAppointments } from "@/hooks/useAppointments";
import { Bell, Calendar } from "lucide-react";

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
  const { session, isLoading } = useAuth();
  const { setOverlay } = useLoadingOverlay();

  React.useEffect(() => {
    if (isLoading) {
      setOverlay({ show: true, variant: "default" });
    } else {
      setOverlay({ show: false });
    }
  }, [isLoading, setOverlay]);

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

  // Fetch appointments for notifications
  const { data: appointments } = useAppointments();

  // Robust role check: fallback to 'PATIENT' if role is invalid
  const userRole: Role = (Object.values(Role) as string[]).includes((session?.user?.role ?? "") as string)
    ? (session?.user?.role as Role)
    : Role.PATIENT;
  const sidebarLinks: SidebarLink[] = sidebarLinksByRole[userRole as Role] as SidebarLink[];

  // User avatar fallback
  const userAvatar = profile?.avatarUrl || "/avatar.png";

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  // Calculate appointment notifications
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments?.filter(apt => {
    if (userRole === Role.DOCTOR) {
      return apt.date?.startsWith(today) && apt.doctorId === session?.user?.id;
    } else if (userRole === Role.PATIENT) {
      return apt.date?.startsWith(today) && apt.patientId === session?.user?.id;
    } else {
      return apt.date?.startsWith(today);
    }
  }) || [];
  const pendingAppointments = appointments?.filter(apt => {
    if (userRole === Role.DOCTOR) {
      return apt.status === 'PENDING' && apt.doctorId === session?.user?.id;
    } else if (userRole === Role.PATIENT) {
      return apt.status === 'PENDING' && apt.patientId === session?.user?.id;
    } else {
      return apt.status === 'PENDING';
    }
  }) || [];

  return (
    <div className="min-h-screen flex">
      <GlobalSidebar
        links={sidebarLinks.map(link => ({
          ...link,
          icon: link.icon(),
          href: link.path // Ensure href is present for SidebarLinkItem type
        }))}
        user={{ 
          name: displayName, 
          avatarUrl: userAvatar
        }}
      >
        <main className="flex-1 p-8">{children}</main>
      </GlobalSidebar>
    </div>
  );
}
