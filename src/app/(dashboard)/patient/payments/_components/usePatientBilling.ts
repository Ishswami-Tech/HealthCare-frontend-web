"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";

/** Who is signed in and which clinic the billing data belongs to. */
export function usePatientBillingIdentity() {
  const { session } = useAuth();
  const currentClinicId = useCurrentClinicId();
  const user = session?.user;
  return {
    userId: user?.id || "",
    clinicId: user?.clinicId || currentClinicId || "",
    userName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "",
  };
}
