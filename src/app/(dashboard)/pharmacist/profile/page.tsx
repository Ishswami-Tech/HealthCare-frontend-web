"use client";

import { useUserProfile } from "@/hooks/query/useUsers";
import { PharmacistProfileContent } from "./_components/PharmacistProfileContent";

export default function PharmacistProfile() {
  const { data: userProfile, isPending, isFetching, error, refetch } = useUserProfile();

  return (
    <PharmacistProfileContent
      // The form starts from the loaded profile, so it is mounted again once the profile arrives.
      key={userProfile ? "loaded" : "pending"}
      userProfile={userProfile}
      isLoading={isPending && isFetching}
      loadError={error ? error.message || "Please try again." : null}
      onRetry={() => void refetch()}
    />
  );
}
