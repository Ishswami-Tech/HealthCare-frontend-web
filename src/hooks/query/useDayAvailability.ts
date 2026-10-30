"use client";

/**
 * Per-day OPD-window overrides ("dynamic availability", L1): a dated replacement for one day
 * of the doctor's weekly OPD hours — `sessions: []` closes the day. The Schedule page's
 * emergency presets call these three routes; while an override is active the slot engine and
 * every booking path use its sessions instead of the weekly blocks for that day.
 *
 * The routes sit on the doctor resource and accept either the Doctor entity id or the doctor's
 * User id; this hook resolves the current doctor's entity id the same way the doctor
 * dashboard does (`useCurrentDoctorEntityId`, `src/hooks/query/useDoctors.ts:587`).
 */
import { useMutationOperation } from "../core/useMutationOperation";
import { useQueryData } from "../core/useQueryData";
import { useCurrentDoctorEntityId } from "./useDoctors";
import { TBD_CACHE } from "./tbdQueryKeys";
import { useCurrentClinicId } from "./useClinics";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { asList, asRecordOrEmpty, trimmedString, textOf } from "@/lib/utils/coerce";

export interface DayOverrideSession {
  /** HH:mm (24h). */
  start: string;
  end: string;
}

/** One active dated override, as the backend's `DoctorDayAvailabilityResponse` reads it. */
export interface DayOverride {
  id: string;
  /** IST calendar day, YYYY-MM-DD. */
  date: string;
  /** The OPD windows for the day; `[]` = the day is closed. */
  sessions: DayOverrideSession[];
  reason: string | null;
  createdAt: string;
}

/** Create-or-replace body of POST /doctors/:doctorId/day-availability. */
export interface DayOverrideCreateInput {
  /** IST calendar day, YYYY-MM-DD (today or later). */
  date: string;
  /** Per-day session blocks; `[]` closes the day. */
  sessions: DayOverrideSession[];
  /** Free-text emergency reason. */
  reason?: string;
  /** Optional: restrict the override to one clinic location. */
  locationId?: string | null;
}

/** Reads are keyed doctor id first so a clinic switch (or identity change) is a fresh fetch. */
const dayOverridesKey = (doctorId: string, date: string, to = "") => ["day-availability", doctorId, date, to] as const;

/** The current doctor's entity id (Doctor.id), or `""` while the clinic's doctor rows are not
 * resolved yet. Everything else in this hook is `enabled` off until it lands. */
export function useCurrentDoctorEntityIdLazy(clinicId: string) {
  return useCurrentDoctorEntityId(clinicId).doctorId;
}

/** Read one row defensively — the API surface is a list of flat rows, but tolerate the
 * `{ data: [...] }` envelope the rest of the read paths accept. */
export function toDayOverrides(raw: unknown): DayOverride[] {
  const rows = Array.isArray(raw) ? raw : asList(asRecordOrEmpty(raw).data);
  return rows.map((entry) => {
    const row = asRecordOrEmpty(entry);
    const sessions = asList(row.sessions).map((block) => {
      const record = asRecordOrEmpty(block);
      return { start: textOf(record.start), end: textOf(record.end) };
    });
    return {
      id: trimmedString(row.id),
      date: textOf(row.date).slice(0, 10),
      sessions: sessions.filter((block) => block.start && block.end),
      reason: trimmedString(row.reason) || null,
      createdAt: textOf(row.createdAt),
    };
  });
}

/**
 * The active overrides for one IST day of the current doctor, scoped `from=to=<dateKey>` so
 * the strip and the "Today" row each fetch exactly the day they render. Pass `toDayKey` to
 * widen the window (the calendar tints every day it holds) — one request covers the whole
 * month. Empty `dateKey` disables the read. `null` = not loaded, `[]` = no override in the
 * window.
 */
export function useDayAvailability(dateKey: string, toDayKey?: string) {
  const clinicId = useCurrentClinicId();
  const doctorId = useCurrentDoctorEntityIdLazy(clinicId);
  const overrides = useQueryData<DayOverride[]>(
    [...dayOverridesKey(doctorId, dateKey, toDayKey ?? "")],
    async () =>
      toDayOverrides(
        (
          await clinicApiClient.get<unknown>(API_ENDPOINTS.DOCTORS.DAY_AVAILABILITY(doctorId), {
            from: dateKey,
            to: toDayKey ?? dateKey,
          })
        ).data,
      ),
    { enabled: Boolean(doctorId && dateKey), ...TBD_CACHE.live },
  );

  /** The day's override, or `null` (list is bounded; superseded rows are soft-deleted
   * server-side, so at most one active row comes back per day). */
  const override = overrides.data?.find((row) => row.date === dateKey) ?? null;

  return { overrides, override, isPending: overrides.isPending, isFetching: overrides.isFetching, error: overrides.error, refetch: overrides.refetch };
}

/** Create-or-replace the day's override (an existing active one for the day is superseded). */
export function useCreateDayOverride() {
  const clinicId = useCurrentClinicId();
  const doctorId = useCurrentDoctorEntityIdLazy(clinicId);
  return useMutationOperation<unknown, DayOverrideCreateInput>(
    async (input) => (await clinicApiClient.post<unknown>(API_ENDPOINTS.DOCTORS.DAY_AVAILABILITY(doctorId), input)).data,
    {
      toastId: "day-override-create",
      loadingMessage: "Updating your hours...",
      successMessage: "",
      // Success toasts stay off: the presets show their own per-day feedback; the loading
      // spinner toast is replaced by the screen's inline note.
      showToast: false,
      invalidateQueries: [["day-availability"]],
    },
  );
}

/** Cancel (soft-delete) an override; the weekly hours apply to that day again. */
export function useCancelDayOverride() {
  const clinicId = useCurrentClinicId();
  const doctorId = useCurrentDoctorEntityIdLazy(clinicId);
  return useMutationOperation(
    async (id: string) => (await clinicApiClient.delete<unknown>(`${API_ENDPOINTS.DOCTORS.DAY_AVAILABILITY(doctorId)}/${id}`)).data,
    {
      toastId: "day-override-cancel",
      loadingMessage: "Restoring your weekly hours...",
      successMessage: "",
      showToast: false,
      invalidateQueries: [["day-availability"]],
    },
  );
}
