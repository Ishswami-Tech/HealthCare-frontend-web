"use client";

import { useCallback } from "react";
import { useCurrentClinic, useUpdateClinic } from "./useClinics";

/**
 * Reads one section of the current clinic's `settings` JSON through `read` and saves a patch of
 * it with the existing `useUpdateClinic` (PATCH /clinics/:id; the server merges one level deep, so
 * other sections are kept). Used for the fee schedule and the print settings.
 */
export function useClinicSettingsSection<T>(read: (settings: unknown) => T) {
  const clinicQuery = useCurrentClinic();
  const updateClinic = useUpdateClinic();
  const clinic = clinicQuery.data as { id?: string; name?: string; settings?: unknown } | null | undefined;
  const value = read(clinic?.settings);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!clinic?.id) throw new Error("Clinic is not loaded yet");
      await updateClinic.mutateAsync({ id: clinic.id, data: { settings: patch } });
    },
    [clinic?.id, updateClinic],
  );

  return {
    value,
    clinicName: clinic?.name ?? "",
    isPending: clinicQuery.isPending,
    error: (clinicQuery.error ?? null) as Error | null,
    refetch: clinicQuery.refetch,
    save,
    isSaving: updateClinic.isPending,
  };
}
