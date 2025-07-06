"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/auth.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardByRole } from "@/config/routes";
import { useQueryData } from "@/hooks/useQueryData";
import { getUserProfile } from "@/lib/actions/users.server";
import { checkProfileCompletion, transformApiResponse } from "@/lib/profile";
import type { UserProfile } from "@/types/auth.types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  allowedRole: Role | Role[];
}

export function DashboardLayout({
  children,
  title,
  allowedRole,
}: DashboardLayoutProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { user } = session || {};

  // Fetch user profile for completeness check
  const { data: profile, isPending: loadingProfile } = useQueryData(
    ["dashboard-profile"],
    async () => {
      const response = await getUserProfile();
      // Type guard: ensure response is object
      if (typeof response === "object" && response !== null) {
        const data = (response as Record<string, unknown>).data || response;
        return transformApiResponse(data as Record<string, unknown>);
      }
      return transformApiResponse({} as Record<string, unknown>);
    },
    { enabled: !!session?.access_token }
  );

  function cleanProfile(
    profile: Partial<UserProfile>,
    user: Partial<UserProfile>
  ): UserProfile {
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
  }

  useEffect(() => {
    if (!isLoading && !loadingProfile && user && profile) {
      // Merge session user and profile data for completeness check
      const mergedProfile = cleanProfile(
        profile as Partial<UserProfile>,
        user as Partial<UserProfile>
      );
      const { isComplete } = checkProfileCompletion(mergedProfile);
      if (!isComplete) {
        router.replace("/profile-completion");
      }
    }
  }, [isLoading, loadingProfile, user, profile, router]);

  useEffect(() => {
    if (!isLoading && user) {
      const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
      if (!roles.includes(user.role)) {
        console.error(
          `Unauthorized access to ${title.toLowerCase()} dashboard`
        );
        // Redirect to appropriate dashboard based on user's role
        const redirectPath = getDashboardByRole(user.role);
        router.replace(redirectPath);
      }
    } else if (!isLoading && !user) {
      // If not loading and no user, redirect to login
      router.replace("/auth/login");
    }
  }, [user, title, allowedRole, router, isLoading]);

  // Show loading state while checking authentication or profile completeness
  if (isLoading || !user || loadingProfile || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Verify role before rendering content
  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!roles.includes(user.role)) {
    return null;
  }

  // Check profile completeness again before rendering children
  const mergedProfile = cleanProfile(
    profile as Partial<UserProfile>,
    user as Partial<UserProfile>
  );
  const { isComplete } = checkProfileCompletion(mergedProfile);
  if (!isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
