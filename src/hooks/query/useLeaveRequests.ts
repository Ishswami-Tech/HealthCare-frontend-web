"use client";

/**
 * Own leave, half days and breaks of any staff member (API_CONTRACT section 2): request, list
 * mine, cancel. Approval, decline and the "N patients will be notified" impact are clinic-admin
 * routes and live with the clinic admin screens.
 */
import { useMutationOperation } from "../core/useMutationOperation";
import { useQueryData } from "../core/useQueryData";
import { TBD_CACHE } from "./tbdQueryKeys";
import { useCurrentClinicId } from "./useClinics";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { asList, asRecordOrEmpty, textOf, trimmedString } from "@/lib/utils/coerce";

export type LeaveKind = "LEAVE" | "HALF_DAY" | "BREAK";
export type LeaveStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";

export interface LeaveRequest {
  id: string;
  kind: LeaveKind;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: LeaveStatus;
  locationId: string;
  decisionNote: string;
  impactedAppointmentCount: number | null;
  patientsNotifiedAt: string;
  createdAt: string;
}

export interface CreateLeaveInput {
  kind: LeaveKind;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  /** HH:mm, for HALF_DAY and BREAK. */
  startTime?: string;
  endTime?: string;
  reason?: string;
  locationId?: string;
}

/** Reads are keyed clinic first; mutations invalidate the ["leave-requests"] prefix (every clinic). */
const leaveKey = (clinicId: string) => ["leave-requests", clinicId, "mine"] as const;

export function toLeaveRequests(data: unknown): LeaveRequest[] {
  const rows = Array.isArray(data) ? data : asList(asRecordOrEmpty(data).data);
  return rows.map((entry) => {
    const row = asRecordOrEmpty(entry);
    const impacted = Number(row.impactedAppointmentCount);
    return {
      id: trimmedString(row.id),
      kind: (textOf(row.kind) || "LEAVE") as LeaveKind,
      startDate: textOf(row.startDate).slice(0, 10),
      endDate: textOf(row.endDate).slice(0, 10),
      startTime: textOf(row.startTime),
      endTime: textOf(row.endTime),
      reason: textOf(row.reason),
      status: (textOf(row.status) || "PENDING") as LeaveStatus,
      locationId: textOf(row.locationId),
      decisionNote: textOf(row.decisionNote),
      impactedAppointmentCount: Number.isFinite(impacted) ? impacted : null,
      patientsNotifiedAt: textOf(row.patientsNotifiedAt),
      createdAt: textOf(row.createdAt),
    };
  });
}

export function useMyLeaveRequests() {
  const clinicId = useCurrentClinicId();
  return useQueryData<LeaveRequest[]>(
    [...leaveKey(clinicId)],
    async () => toLeaveRequests((await clinicApiClient.get<unknown>(API_ENDPOINTS.LEAVE_REQUESTS.MINE)).data),
    TBD_CACHE.working,
  );
}

export function useRequestLeave() {
  return useMutationOperation(
    async (input: CreateLeaveInput) => toLeaveRequests([(await clinicApiClient.post<unknown>(API_ENDPOINTS.LEAVE_REQUESTS.CREATE, input)).data])[0],
    {
      toastId: "leave-request-create",
      loadingMessage: "Sending your leave...",
      successMessage: "Leave sent to the clinic admin",
      showToast: false,
      invalidateQueries: [["leave-requests"]],
    },
  );
}

export function useCancelLeave() {
  return useMutationOperation(
    async (id: string) => (await clinicApiClient.post<unknown>(API_ENDPOINTS.LEAVE_REQUESTS.CANCEL(id))).data,
    {
      toastId: "leave-request-cancel",
      loadingMessage: "Cancelling...",
      successMessage: "Leave cancelled",
      invalidateQueries: [["leave-requests"]],
    },
  );
}
