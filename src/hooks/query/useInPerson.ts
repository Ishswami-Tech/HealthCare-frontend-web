"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryData } from "../core/useQueryData";
import { useAuth } from "../auth/useAuth";
import {
  fetchInPersonDesk,
  fetchInPersonVisit,
  fetchMyInPersonToday,
  submitInPersonCheckIn,
  submitInPersonWalkIn,
  type CheckInActionFailure,
} from "@/lib/actions/in-person.server";
import type {
  InPersonCheckInRequest,
  InPersonCheckInResult,
  InPersonDeskBoard,
  InPersonVisit,
  InPersonWalkInRequest,
  InPersonWalkInResult,
} from "@/types/in-person.types";
import { patientQueueKeys } from "./usePatientQueue";
import { useCurrentClinicId } from "./useClinics";

/**
 * In-person flow V2 hooks (one implementation for patient check-in, live queue, booking and the
 * reception desk). Data comes only from `/in-person/*` (API_CONTRACT "In-person flow V2").
 */

/** The live queue / "you're next" screens poll this often while visible. */
export const IN_PERSON_REFRESH_MS = 20 * 1000;

/** Clinic id first after the root (tbdQueryKeys convention); `all` is the every-clinic invalidation prefix. */
export const inPersonKeys = {
  all: ["inPerson"] as const,
  today: (clinicId: string, userId: string | undefined) => ["inPerson", clinicId, "today", userId] as const,
  visit: (clinicId: string, appointmentId: string | undefined) => ["inPerson", clinicId, "visit", appointmentId] as const,
  desk: (
    clinicId: string,
    date: string | undefined,
    locationId: string | undefined,
    page?: number,
    limit?: number,
  ) => ["inPerson", clinicId, "desk", date ?? null, locationId ?? null, page ?? null, limit ?? null] as const,
};

function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}

function useUserId(): string | undefined {
  const { session } = useAuth();
  return (session?.user as { id?: string } | undefined)?.id;
}

/** Today's in-person visits of the signed-in patient (stage, token, people ahead, ETA). */
export function useMyInPersonToday(options: { enabled?: boolean; live?: boolean } = {}) {
  const userId = useUserId();
  const clinicId = useCurrentClinicId();
  return useQueryData<InPersonVisit[]>(
    inPersonKeys.today(clinicId, userId),
    async () => unwrap(await fetchMyInPersonToday()),
    {
      enabled: (options.enabled ?? true) && Boolean(userId),
      staleTime: IN_PERSON_REFRESH_MS / 2,
      refetchInterval: options.live ? IN_PERSON_REFRESH_MS : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  );
}

/** One visit, polled while `live` (live queue, you're next). */
export function useInPersonVisit(appointmentId: string | undefined, options: { live?: boolean } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<InPersonVisit>(
    inPersonKeys.visit(clinicId, appointmentId),
    async () => unwrap(await fetchInPersonVisit(String(appointmentId))),
    {
      enabled: Boolean(appointmentId),
      staleTime: IN_PERSON_REFRESH_MS / 2,
      refetchInterval: options.live ? IN_PERSON_REFRESH_MS : false,
      refetchIntervalInBackground: false,
    },
  );
}

/** Reception desk board: every in-person appointment of the receptionist's location. */
export function useInPersonDesk(
  params: { date?: string; locationId?: string; page?: number; limit?: number } = {},
  enabled = true,
) {
  const clinicId = useCurrentClinicId();
  return useQueryData<InPersonDeskBoard>(
    inPersonKeys.desk(clinicId, params.date, params.locationId, params.page, params.limit),
    async () => unwrap(await fetchInPersonDesk(params)),
    { enabled, staleTime: IN_PERSON_REFRESH_MS / 2, refetchInterval: IN_PERSON_REFRESH_MS },
  );
}

/** A refused check-in, with the backend reason (WRONG_LOCATION, TOO_EARLY, ...). */
export class CheckInRefusedError extends Error {
  constructor(readonly failure: CheckInActionFailure) {
    super(failure.error);
    this.name = "CheckInRefusedError";
  }
}

/** Every read a check-in, walk-in or no-show undo changes. */
function useInvalidateVisitReads() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: inPersonKeys.all });
    void queryClient.invalidateQueries({ queryKey: patientQueueKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
    // The patient home visit card reads the dashboard summary (checkedInAt -> live queue card).
    void queryClient.invalidateQueries({ queryKey: ["patientDashboardSummary"] });
    // Staff lists (reception desk, doctor queue) read the appointment and queue caches.
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["appointment"] });
    void queryClient.invalidateQueries({ queryKey: ["queue"] });
  };
}

/**
 * The one check-in mutation: patient QR (`{ qrCode }`) or reception one-click (`{ appointmentId }`).
 * Rejects with `CheckInRefusedError` carrying the reason. Refreshes every in-person and queue read.
 */
export function useInPersonCheckIn() {
  const invalidate = useInvalidateVisitReads();
  return useMutation<InPersonCheckInResult, CheckInRefusedError, InPersonCheckInRequest>({
    mutationFn: async (request) => {
      const result = await submitInPersonCheckIn(request);
      if (!result.success) throw new CheckInRefusedError(result);
      return result.data;
    },
    onSettled: invalidate,
  });
}

/** Reception walk-in (`POST /in-person/walk-in`): creates today's visit and checks it in, idempotently. */
export function useInPersonWalkIn() {
  const invalidate = useInvalidateVisitReads();
  return useMutation<InPersonWalkInResult, CheckInRefusedError, InPersonWalkInRequest>({
    mutationFn: async (request) => {
      const result = await submitInPersonWalkIn(request);
      if (!result.success) throw new CheckInRefusedError(result);
      return result.data;
    },
    onSettled: invalidate,
  });
}
