"use client";

import { useMyClinic } from "@/hooks/query/useClinics";

/** Shown while the clinic is loading or has no name: neutral, never a product brand. */
export const NEUTRAL_CLINIC_NAME = "Your clinic";

/**
 * The name the portal shows as its brand: the signed-in user's clinic from the backend
 * (`GET /clinics/my-clinic`, shared React Query cache), else a neutral fallback.
 */
export function useClinicBrandName(): { name: string; isKnown: boolean; logoUrl: string | null } {
  const { data: myClinic } = useMyClinic();
  const clinicName = myClinic?.name?.trim() || "";
  const logoUrl = (myClinic as { logo?: string | null } | undefined)?.logo?.trim() || null;
  return { name: clinicName || NEUTRAL_CLINIC_NAME, isKnown: Boolean(clinicName), logoUrl };
}
