"use client";

import { PharmacistProfileContent } from "@/app/(dashboard)/pharmacist/profile/_components/PharmacistProfileContent";
import { useUserProfile } from "@/hooks/query/useUsers";

// AsProfile (B5): the staff profile (personal details, password) shared with the pharmacist.
export default function AssistantDoctorProfilePage() {
  const { data: userProfile, isPending, isFetching, error, refetch } = useUserProfile();

  return (
    <PharmacistProfileContent
      key={userProfile ? "loaded" : "pending"}
      userProfile={userProfile}
      isLoading={isPending && isFetching}
      loadError={error ? error.message || "Please try again." : null}
      onRetry={() => void refetch()}
      title="Assistant doctor profile"
      roleLabel="Assistant doctor"
    />
  );
}
