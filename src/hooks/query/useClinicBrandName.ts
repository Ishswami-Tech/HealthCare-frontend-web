"use client";

import { useEffect } from "react";
import { useMyClinic } from "@/hooks/query/useClinics";
import { useAuthStore } from "@/stores";

/** Shown only when no clinic name is known at all: neutral, never a product brand. */
export const NEUTRAL_CLINIC_NAME = "Your clinic";

/** Last clinic name seen on this device, so a reload never flashes the placeholder. */
const CLINIC_NAME_CACHE_KEY = "hc:last-clinic-name";

function readCachedClinicName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(CLINIC_NAME_CACHE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

function writeCachedClinicName(name: string): void {
  try {
    window.localStorage.setItem(CLINIC_NAME_CACHE_KEY, name);
  } catch {
    // Storage can be full or blocked (private mode); the cache is only a nicety.
  }
}

export interface ClinicBrandName {
  /** Best known clinic name, else the neutral placeholder. */
  name: string;
  /** True when `name` is a real clinic name (not the placeholder). */
  isKnown: boolean;
  logoUrl: string | null;
}

/**
 * The name the portal shows as its brand: the signed-in user's clinic from the backend
 * (`GET /clinics/my-clinic`, shared React Query cache). While that loads it uses the clinic
 * name carried on the session, then the last name seen on this device, and only then the
 * neutral placeholder.
 */
export function useClinicBrandName(): ClinicBrandName {
  const { data: myClinic } = useMyClinic();
  const sessionClinicName = useAuthStore((state) => state.session?.user?.clinicName);
  const fetchedName = myClinic?.name?.trim() || "";
  const clinicName = fetchedName || sessionClinicName?.trim() || readCachedClinicName();
  const logoUrl = (myClinic as { logo?: string | null } | undefined)?.logo?.trim() || null;

  useEffect(() => {
    if (fetchedName) writeCachedClinicName(fetchedName);
  }, [fetchedName]);

  return { name: clinicName || NEUTRAL_CLINIC_NAME, isKnown: Boolean(clinicName), logoUrl };
}
