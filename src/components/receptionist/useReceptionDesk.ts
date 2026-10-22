"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAppointments,
  useMarkAppointmentNoShow,
  useUpdateAppointmentStatus,
} from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { CheckInRefusedError, useInPersonCheckIn, useInPersonDesk } from "@/hooks/query/useInPerson";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { showUndoToast } from "@/components/tbd";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { APPOINTMENT_LIST_MAX_PAGE_SIZE, APPOINTMENT_LIST_MAX_PAGES } from "@/lib/api/client";
import { buildReceptionVisits, readAppointmentRows, type ReceptionVisit } from "./reception.logic";

/**
 * Desk routes, one place so every screen links the same way.
 * Patient links carry the patient's USER id (User.id): `GET /patients/:id` is keyed by it, and
 * the screens read the Patient-record id (appointments, bills) from that response.
 */
export const RECEPTION_ROUTES = {
  dashboard: "/receptionist/dashboard",
  appointments: "/receptionist/appointments",
  appointment: (id: string) => `/receptionist/appointments/${encodeURIComponent(id)}`,
  reschedule: (id: string) => `/receptionist/appointments/${encodeURIComponent(id)}/reschedule`,
  checkIn: "/receptionist/check-in",
  checkInSuccess: (id: string) => `/receptionist/check-in/success?id=${encodeURIComponent(id)}`,
  walkIn: (patientUserId?: string) =>
    patientUserId ? `/receptionist/walk-in?patientId=${encodeURIComponent(patientUserId)}` : "/receptionist/walk-in",
  patients: "/receptionist/patients",
  patient: (patientUserId: string) => `/receptionist/patients/${encodeURIComponent(patientUserId)}`,
  register: "/receptionist/patients/new",
  collect: (patientUserId?: string, appointmentId?: string) => {
    const query = new URLSearchParams();
    if (patientUserId) query.set("patientId", patientUserId);
    if (appointmentId) query.set("appointmentId", appointmentId);
    const text = query.toString();
    return text ? `/receptionist/collect?${text}` : "/receptionist/collect";
  },
  queue: "/queue",
  notifications: "/receptionist/notifications",
} as const;

/** Today in the clinic's time zone (yyyy-mm-dd). */
export function todayKey(): string {
  return formatISODateInIST(new Date());
}

/** Rows per page of the in-clinic desk board (`GET /in-person/desk?page=&limit=`). */
export const RECEPTION_DESK_PAGE_SIZE = 100;

/**
 * The receptionist's location, from the server: `GET /in-person/desk` always answers for the
 * location the receptionist is allotted to (staff location assignment), so the client never infers
 * it. A receptionist without a location gets a 403 (`RECEPTION_WRONG_LOCATION`): `locationId` is null
 * and the desk screens show "ask the clinic admin to assign your location".
 */
export function useReceptionLocation() {
  const { clinicId } = useClinicContext();
  // Page 1 of the board: the location, the day-wide counts and total, and the first rows. Shares
  // its cache entry with page 1 of `useReceptionDeskBoard`. An older backend ignores the paging
  // and answers with the whole board, as before.
  const desk = useInPersonDesk({ date: todayKey(), page: 1, limit: RECEPTION_DESK_PAGE_SIZE }, Boolean(clinicId));
  const locationId = desk.data?.locationId || null;
  return {
    clinicId: clinicId || "",
    locationId,
    locationName: desk.data?.locationName || (locationId ? "Your location" : desk.isPending ? "…" : "No location assigned"),
    isResolving: Boolean(clinicId) && desk.isPending,
    /** Today's in-clinic board of the location (server counts, up to the board's own cap). */
    desk: desk.data ?? null,
  };
}

/**
 * Today's in-clinic desk board of the reception location, one page at a time. `counts` and
 * `total` always cover the whole day. When the backend sends no paging fields (older API), the
 * whole board arrives at once and is shown as a single page, as before.
 */
export function useReceptionDeskBoard(page: number, options?: { enabled?: boolean }) {
  const { clinicId } = useClinicContext();
  const requestedPage = Math.max(1, Math.floor(page) || 1);
  const desk = useInPersonDesk(
    { date: todayKey(), page: requestedPage, limit: RECEPTION_DESK_PAGE_SIZE },
    (options?.enabled ?? true) && Boolean(clinicId),
  );
  const board = desk.data ?? null;
  const visits = board?.visits ?? [];
  const isPaged = typeof board?.page === "number";
  const total = board?.total ?? visits.length;
  const pageSize = isPaged ? board?.limit ?? RECEPTION_DESK_PAGE_SIZE : Math.max(visits.length, 1);
  const pageCount = isPaged ? Math.max(1, board?.totalPages ?? Math.ceil(total / pageSize)) : 1;
  return {
    board,
    visits,
    counts: board?.counts ?? null,
    total,
    /** true when the day has more visits than the board can return (counts then cover `visits`). */
    truncated: board?.truncated === true,
    isPaged,
    page: isPaged ? board?.page ?? requestedPage : 1,
    pageSize,
    pageCount,
    isLoading: Boolean(clinicId) && desk.isPending,
    isFetching: desk.isFetching,
    error: desk.error instanceof Error ? desk.error : null,
    refetch: desk.refetch,
  };
}

/**
 * Rows per server batch of the desk lists: the most one logical `GET /appointments` request reads
 * (backend pages of 100, fetched in parallel). Busier ranges are paged with `range.page`.
 */
export const RECEPTION_VISITS_BATCH = APPOINTMENT_LIST_MAX_PAGE_SIZE * APPOINTMENT_LIST_MAX_PAGES;

function readListTotal(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const meta = (data as { meta?: unknown }).meta;
  if (!meta || typeof meta !== "object") return null;
  const total = Number((meta as { total?: unknown }).total);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

/**
 * The desk's appointments between two days (inclusive), mapped to `ReceptionVisit`s of the
 * reception location. Live through the realtime socket; `now` is taken once per render of the data.
 */
export function useReceptionVisits(
  range: { from: string; to?: string; patientId?: string; page?: number },
  options?: { enabled?: boolean },
) {
  useWebSocketQuerySync();
  const { clinicId, locationId, locationName, isResolving } = useReceptionLocation();
  const filters = useMemo(
    () => ({
      ...(clinicId ? { clinicId } : {}),
      startDate: range.from,
      endDate: range.to ?? range.from,
      ...(range.patientId ? { patientId: range.patientId } : {}),
      ...(locationId ? { locationId } : {}),
      page: Math.max(1, range.page ?? 1),
      limit: RECEPTION_VISITS_BATCH,
    }),
    [clinicId, locationId, range.from, range.to, range.patientId, range.page],
  );
  // Server-filtered by clinic + the server-given location + day range; never the whole clinic.
  const query = useAppointments(filters, {
    enabled: (options?.enabled ?? true) && Boolean(clinicId) && Boolean(locationId),
  });
  const visits = useMemo<ReceptionVisit[]>(
    () => buildReceptionVisits(query.data, locationId, Date.now()),
    [query.data, locationId],
  );
  // Server total of the range (all rows the filters match, before the location filter above);
  // `truncated` = more rows exist than this batch holds, so callers show the real total and page.
  const fetchedRows = readAppointmentRows(query.data).length;
  const total = readListTotal(query.data) ?? fetchedRows;
  const page = Math.max(1, range.page ?? 1);
  const batchCount = Math.max(1, Math.ceil(total / RECEPTION_VISITS_BATCH));
  return {
    visits,
    total,
    truncated: batchCount > 1,
    page,
    batchCount,
    locationId,
    locationName,
    clinicId,
    isLoading: isResolving || (Boolean(locationId) && query.isPending && !query.data),
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * One click check-in at the desk: the shared in-person check-in (`POST /in-person/check-in
 * { appointmentId }`), the same backend service as the patient's QR scan. Idempotent; the server
 * enforces the receptionist's location. `openSuccess` shows the success screen after the call.
 * No Undo is offered: the backend has no undo check-in route (only undo-no-show under /in-person).
 */
export function useReceptionCheckIn({ openSuccess = false }: { openSuccess?: boolean } = {}) {
  const router = useRouter();
  const mutation = useInPersonCheckIn();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const checkIn = useCallback(
    async (visit: Pick<ReceptionVisit, "id">) => {
      setPendingId(visit.id);
      try {
        const result = await mutation.mutateAsync({ appointmentId: visit.id });
        const token = result.result === "CHECKED_IN" ? result.visit?.token : null;
        showSuccessToast(token ? `Checked in · token ${token}` : "Checked in", { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
        if (openSuccess) router.push(RECEPTION_ROUTES.checkInSuccess(visit.id));
        return true;
      } catch (error) {
        const message =
          error instanceof CheckInRefusedError && error.failure.reason === "RECEPTION_WRONG_LOCATION"
            ? "This visit is booked at another location, or your desk has no location yet. Ask the clinic admin."
            : error instanceof Error
              ? error.message
              : "The patient could not be checked in.";
        showErrorToast(message, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [mutation, openSuccess, router],
  );

  return { checkIn, pendingId, isPending: mutation.isPending };
}

/**
 * Marks a visit as missed, with a 5 s Undo that puts the previous status back
 * (`PATCH /appointments/:id/status`; contract 18.6: on a NO_SHOW this runs the same-day undo-no-show
 * path, so a checked-in patient goes back into the queue).
 */
export function useReceptionNoShow() {
  const markNoShow = useMarkAppointmentNoShow();
  const updateStatus = useUpdateAppointmentStatus();

  const mark = useCallback(
    async (visit: Pick<ReceptionVisit, "id" | "patientName" | "status">) => {
      const previousStatus = visit.status || "CONFIRMED";
      try {
        await markNoShow.mutateAsync(visit.id);
        showUndoToast({
          id: `no-show-${visit.id}`,
          message: `${visit.patientName} marked as missed`,
          onUndo: () => updateStatus.mutateAsync({ appointmentId: visit.id, status: previousStatus }).then(() => undefined),
        });
      } catch (error) {
        // Surface the backend's reason (e.g. a status it does not allow) in the same toast slot.
        showErrorToast(error instanceof Error && error.message ? error.message : "The visit could not be marked as missed.", {
          id: TOAST_IDS.APPOINTMENT.UPDATE,
        });
      }
    },
    [markNoShow, updateStatus],
  );

  return { mark, isPending: markNoShow.isPending };
}
