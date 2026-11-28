"use client";

import { useMemo } from "react";
import { usePrescription } from "@/hooks/query/usePharmacy";
import { normalizeDoctorPrescriptionDetail } from "./doctor-prescriptions.logic";

/** GET /pharmacy/prescriptions/:id as the doctor's detail / print / sent screens read it (no prices). */
export function useDoctorPrescriptionDetail(prescriptionId: string) {
  const query = usePrescription(prescriptionId);
  const detail = useMemo(
    () => (query.data ? normalizeDoctorPrescriptionDetail((query.data as { prescription?: unknown }).prescription ?? query.data) : null),
    [query.data],
  );
  return {
    detail: detail && detail.id ? detail : null,
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
  };
}
