"use client";

import { useUserProfile } from "@/hooks/query/useUsers";
import { PatientPersonalDetailsContent } from "../_components/PatientPersonalDetailsContent";

/** Personal details: the patient's own profile form. */
export default function PatientPersonalDetailsPage() {
  const { data: userProfile, isPending, isFetching, error, refetch } = useUserProfile();

  return (
    <PatientPersonalDetailsContent
      // The form starts from the loaded profile, so it is mounted again once the profile arrives.
      key={userProfile ? "loaded" : "pending"}
      userProfile={userProfile}
      isLoading={isPending && isFetching}
      loadError={error ? error.message || "Please try again." : null}
      onRetry={() => void refetch()}
    />
  );
}
