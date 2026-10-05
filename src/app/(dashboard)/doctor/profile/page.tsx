"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { useDoctorReviews } from "@/hooks/query/useDoctors";
import { DoctorProfileContent } from "./_components/DoctorProfileContent";
import { normalizeDoctorReviews } from "./_components/doctor-profile.logic";

export default function DoctorProfile() {
  const { session } = useAuth();
  const user = session?.user;
  const doctorId = user?.id || "";
  const {
    data: userProfile,
    isPending: isLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const {
    data: reviewsData,
    isPending: reviewsPending,
    error: reviewsError,
    refetch: refetchReviews,
  } = useDoctorReviews(doctorId);

  const reviews = useMemo(() => normalizeDoctorReviews(reviewsData), [reviewsData]);
  const reviewsNotFound = (reviewsError as { statusCode?: number } | null)?.statusCode === 404;

  return (
    <DoctorProfileContent
      key={userProfile ? "loaded" : "pending"}
      user={
        user
          ? {
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email ?? null,
              profilePicture: user.profilePicture ?? null,
            }
          : undefined
      }
      userProfile={userProfile}
      isLoading={isLoading}
      updateProfileMutation={updateProfileMutation}
      loadFailed={Boolean(profileError) && !userProfile}
      onRetryLoad={() => void refetchProfile()}
      reviews={{
        reviews,
        // Without a signed-in doctor the query is switched off and stays "pending".
        isLoading: Boolean(doctorId) && reviewsPending,
        loadFailed: Boolean(reviewsError) && !reviewsNotFound && reviews.length === 0,
        notAvailable: reviewsNotFound && reviews.length === 0,
        onRetry: () => void refetchReviews(),
      }}
    />
  );
}
