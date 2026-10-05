"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";

/** Who is signed in and which clinic the family list belongs to. */
export function useFamilyIdentity() {
  const { session, isPending } = useAuth();
  const currentClinicId = useCurrentClinicId();
  const user = session?.user;
  return {
    user,
    userId: user?.id || "",
    clinicId: user?.clinicId || currentClinicId || "",
    userName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "",
    authLoading: isPending,
  };
}
