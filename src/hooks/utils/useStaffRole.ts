"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Role } from "@/types/auth.types";

/**
 * Role flags for the shared TestByDoctor screens (queue, EHR, notifications, stock), which render
 * one component with small differences per role. Backend rules still apply; these only shape the UI.
 *
 * `canSeeBillingAmounts` is false for the doctor and the assistant doctor: never render a rupee amount
 * of a bill, payment or earning for them (the backend strips the fields too).
 */
export function useStaffRole() {
  const { user } = useAuth();
  const role = String(user?.role ?? "").toUpperCase().replace(/\s+/g, "_");
  return useMemo(
    () => ({
      role,
      isDoctor: role === Role.DOCTOR,
      isAssistant: role === Role.ASSISTANT_DOCTOR,
      isReception: role === Role.RECEPTIONIST,
      isClinicAdmin: role === Role.CLINIC_ADMIN,
      isPharmacist: role === Role.PHARMACIST,
      /** Only the doctor calls, starts and completes a visit. */
      canRunVisit: role === Role.DOCTOR,
      /** Assistant drafts prescriptions (the doctor approves) and dispenses from clinic stock. */
      canDraftPrescription: role === Role.ASSISTANT_DOCTOR,
      canSeeBillingAmounts: role !== Role.DOCTOR && role !== Role.ASSISTANT_DOCTOR,
      /** Reception is the front desk: no clinical records. */
      canSeeClinicalRecords: role !== Role.RECEPTIONIST,
    }),
    [role],
  );
}
