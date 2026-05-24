"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { DoctorProfileContent } from "./_components/DoctorProfileContent";

export default function DoctorProfile() {
  const { session } = useAuth();
  const user = session?.user;
  const { data: userProfile, isPending: isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

  return (
    <DoctorProfileContent
      key={userProfile ? "loaded" : "pending"}
      user={
        user
          ? {
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email ?? null,
            }
          : undefined
      }
      userProfile={userProfile}
      isLoading={isLoading}
      updateProfileMutation={updateProfileMutation}
    />
  );
}
