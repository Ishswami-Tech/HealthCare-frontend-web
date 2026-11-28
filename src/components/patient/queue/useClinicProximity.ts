"use client";

import { useEffect, useState } from "react";
import { AT_CLINIC_DISPLAY_METERS, distanceMeters, readFixIfGranted } from "./deviceLocation";

export interface ClinicProximity {
  /** Metres to the clinic, from the device position. */
  meters: number;
  /** Close enough to say "You're at the clinic" (display hint; the server decides at check-in). */
  atClinic: boolean;
}

/**
 * How far the patient is from the clinic, only when the browser already has location permission
 * (never prompts). Null until known, or when there is no permission or no clinic pin.
 */
export function useClinicProximity(
  target: { lat: number; lng: number } | null,
  enabled = true,
): ClinicProximity | null {
  const [proximity, setProximity] = useState<ClinicProximity | null>(null);
  const lat = target?.lat;
  const lng = target?.lng;

  useEffect(() => {
    if (!enabled || lat === undefined || lng === undefined) return;
    let cancelled = false;
    void readFixIfGranted().then((fix) => {
      if (cancelled || !fix) return;
      const meters = distanceMeters(fix, { lat, lng });
      setProximity({ meters, atClinic: meters <= AT_CLINIC_DISPLAY_METERS });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, lat, lng]);

  return enabled ? proximity : null;
}
