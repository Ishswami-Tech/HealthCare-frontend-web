"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMyClinic } from "@/hooks/query/useClinics";
import { refetchClinicSettingsQueries } from "@/lib/clinics/clinic-settings-queries";
import {
  readOpdServiceToggles,
  resolveConsultationModes,
  type ConsultationModeAvailability,
  type OpdServiceToggles,
} from "@/lib/clinics/opd-controls.logic";

/** Re-reads every cached clinic read, e.g. after the backend refused a switched-off action. */
export function useRefreshClinicSettings() {
  const queryClient = useQueryClient();
  return useCallback(() => refetchClinicSettingsQueries(queryClient), [queryClient]);
}

/**
 * The signed-in user's clinic switches (QR self check-in, video, in-person), read from
 * `GET /clinics/my-clinic`. Until the clinic loads every switch reads as on, so nothing is hidden
 * by mistake; the backend still refuses a switched-off action.
 */
export function useClinicServiceToggles(options?: { enabled?: boolean }): OpdServiceToggles & {
  isLoaded: boolean;
  /** At least one consultation type (video or in-person) can be booked online. */
  onlineBookingEnabled: boolean;
  resolveModes: (doctorId?: string | null) => ConsultationModeAvailability;
} {
  const { data: clinic, isFetched } = useMyClinic(
    options?.enabled === undefined ? undefined : { enabled: options.enabled },
  );
  const settings = clinic?.settings;
  const toggles = useMemo(() => readOpdServiceToggles(settings), [settings]);
  const resolveModes = useCallback(
    (doctorId?: string | null) => resolveConsultationModes(settings, doctorId),
    [settings],
  );
  return {
    ...toggles,
    isLoaded: isFetched && Boolean(clinic),
    onlineBookingEnabled: toggles.videoConsultationEnabled || toggles.generalConsultationEnabled,
    resolveModes,
  };
}
