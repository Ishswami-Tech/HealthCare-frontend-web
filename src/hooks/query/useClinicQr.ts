"use client";

import { useMemo } from "react";
import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { useCurrentClinicId } from "./useClinics";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import { dataOrThrow, listOf } from "@/lib/utils/action-result";
import { getCheckInLocations } from "@/lib/actions/appointments.server";
import { submitInPersonCheckIn } from "@/lib/actions/in-person.server";
import { inPersonKeys } from "./useInPerson";
import {
  fetchCheckInLog,
  fetchCheckInSummary,
  fetchFailedCheckIns,
  fetchLocationQr,
  regenerateLocationQr,
  resolveCheckInAttempt,
} from "@/lib/actions/clinic-qr.server";
import type {
  CheckInAttempt,
  CheckInLogFilters,
  CheckInResolution,
  CheckInSummary,
  LocationQr,
} from "@/types/clinic-admin-ops.types";

/**
 * Location QR and check-in log hooks (CaLocationQr, CaQrPrint, CaQrRegenerate, CaCheckInLog,
 * CaFailedCheckIns, CaLocationEdit). One QR per clinic location; the QR routes take the id of its
 * check-in location, which `useCheckInLocationFor` resolves from the clinic location id.
 */

export interface CheckInLocationRow {
  id: string;
  locationId: string | null;
  locationName: string;
  isActive: boolean;
  qrVersion: number | null;
  qrRotatedAt: string | null;
}

function toCheckInLocationRow(value: unknown): CheckInLocationRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  return {
    id: row.id,
    locationId: typeof row.locationId === "string" ? row.locationId : null,
    locationName: typeof row.locationName === "string" ? row.locationName : "",
    isActive: row.isActive !== false,
    qrVersion: typeof row.qrVersion === "number" ? row.qrVersion : null,
    qrRotatedAt: typeof row.qrRotatedAt === "string" ? row.qrRotatedAt : null,
  };
}

const CHECK_IN_LOCATIONS_KEY = (clinicId: string) => ["check-ins", clinicId, "check-in-locations"] as const;

/** The check-in (QR) locations of the clinic. Reuses the existing `getCheckInLocations` action. */
export function useCheckInLocationRows() {
  const clinicId = useCurrentClinicId();
  return useQueryData<CheckInLocationRow[]>(
    CHECK_IN_LOCATIONS_KEY(clinicId),
    async () => {
      const result = await getCheckInLocations();
      if (!result.success) throw new Error(result.error || "Check-in locations could not be loaded");
      return (result.data ?? []).flatMap((row) => toCheckInLocationRow(row) ?? []);
    },
    { enabled: Boolean(clinicId), ...TBD_CACHE.settings },
  );
}

/** The check-in location linked to one clinic location (`null` when the location has no QR yet). */
export function useCheckInLocationFor(clinicLocationId: string) {
  const query = useCheckInLocationRows();
  const row = useMemo(
    () =>
      query.data?.find((entry) => entry.locationId === clinicLocationId) ??
      query.data?.find((entry) => entry.id === clinicLocationId) ??
      null,
    [query.data, clinicLocationId],
  );
  return { ...query, row };
}

export function useLocationQr(checkInLocationId: string | null | undefined) {
  return useQueryData<LocationQr>(
    tbdKeys.locationQr(checkInLocationId ?? ""),
    async () => dataOrThrow(await fetchLocationQr(checkInLocationId ?? "")),
    { enabled: Boolean(checkInLocationId), ...TBD_CACHE.settings },
  );
}

export function useRegenerateLocationQr() {
  const clinicId = useCurrentClinicId();
  return useMutationOperation<LocationQr, { checkInLocationId: string; reason?: string }>(
    async ({ checkInLocationId, reason }) => dataOrThrow(await regenerateLocationQr(checkInLocationId, reason)),
    {
      toastId: "location-qr-regenerate",
      loadingMessage: "Regenerating QR…",
      successMessage: "New QR is active. Old posters stop working now.",
      invalidateQueries: [["location-qr"], [...CHECK_IN_LOCATIONS_KEY(clinicId)]],
    },
  );
}

export function useCheckInLog(filters: CheckInLogFilters, options: { refetchMs?: number } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<CheckInAttempt[]>(
    tbdKeys.checkIns.log(clinicId, { ...filters }),
    async () => listOf<CheckInAttempt>(dataOrThrow(await fetchCheckInLog(filters))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.live, refetchInterval: options.refetchMs ?? 30_000 },
  );
}

export function useCheckInSummary(date?: string) {
  const clinicId = useCurrentClinicId();
  return useQueryData<CheckInSummary>(
    [...tbdKeys.checkIns.log(clinicId, { date }), "summary"],
    async () => dataOrThrow(await fetchCheckInSummary(date)),
    { enabled: Boolean(clinicId), ...TBD_CACHE.live, refetchInterval: 30_000 },
  );
}

/** Failed scans of a day; `includeResolved` adds the resolved / ignored ones (the backend drops them otherwise). */
export function useFailedCheckIns(date?: string, options: { includeResolved?: boolean } = {}) {
  const clinicId = useCurrentClinicId();
  const includeResolved = Boolean(options.includeResolved);
  return useQueryData<CheckInAttempt[]>(
    tbdKeys.checkIns.failed(clinicId, { date, includeResolved }),
    async () => listOf<CheckInAttempt>(dataOrThrow(await fetchFailedCheckIns(date, { includeResolved }))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.live, refetchInterval: 30_000 },
  );
}

/**
 * Resolves a failed scan. `MANUAL_CHECK_IN` first checks the booked appointment in through the
 * in-person flow (same service as a QR scan), then records the resolution.
 */
export function useResolveCheckIn() {
  return useMutationOperation<CheckInAttempt, { attempt: CheckInAttempt; resolution: CheckInResolution; note?: string }>(
    async ({ attempt, resolution, note }) => {
      if (resolution === "MANUAL_CHECK_IN") {
        if (!attempt.appointmentId) throw new Error("This scan has no booking to check in. Register the patient as a walk-in.");
        // The one staff check-in call (POST /in-person/check-in { appointmentId }), same as the reception desk.
        const checkIn = await submitInPersonCheckIn({ appointmentId: attempt.appointmentId });
        if (!checkIn.success) throw new Error(checkIn.error);
      }
      return dataOrThrow(await resolveCheckInAttempt(attempt.id, resolution, note));
    },
    {
      toastId: "check-in-resolve",
      loadingMessage: "Saving…",
      successMessage: "Check-in updated",
      invalidateQueries: [["check-ins"], ["queue"], [...inPersonKeys.all]],
    },
  );
}
