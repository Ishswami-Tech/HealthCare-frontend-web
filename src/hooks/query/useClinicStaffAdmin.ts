"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { useCurrentClinicId } from "./useClinics";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import { dataOrThrow, listOf } from "@/lib/utils/action-result";
import {
  changeStaffLocation,
  createClinicHoliday,
  createStaffInvite,
  decideLeaveRequest,
  deleteClinicHoliday,
  fetchClinicAudit,
  fetchClinicHolidays,
  fetchLeaveImpact,
  fetchLeaveRequests,
  fetchStaffInvites,
  fetchStaffLocationId,
  fetchStaffMember,
  fetchStaffMembers,
  resendStaffInvite,
  revokeStaffInvite,
  updateClinicHoliday,
} from "@/lib/actions/clinic-staff-admin.server";
import type {
  ClinicAuditEvent,
  ClinicHoliday,
  ClinicHolidayInput,
  CreateStaffInviteInput,
  LeaveImpact,
  LeaveRequest,
  LeaveStatus,
  StaffInvite,
  StaffMember,
  StaffMemberDetail,
} from "@/types/clinic-admin-ops.types";

/** Clinic admin staff, leave, holiday and audit hooks (CaStaff*, CaNotifications, CaHolidayEditor). */

const STAFF_FAMILIES = [["staff"], ["clinic-staff-admin"]];
const LEAVE_FAMILIES = [["clinic-leave"], ["staff"], ["clinic-alerts"]];

export function useStaffMembers(filters: { role?: string; q?: string } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<StaffMember[]>(
    ["clinic-staff-admin", clinicId, "members", filters],
    async () => listOf<StaffMember>(dataOrThrow(await fetchStaffMembers(filters))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.working },
  );
}

export function useStaffMember(userId: string) {
  const clinicId = useCurrentClinicId();
  return useQueryData<StaffMemberDetail>(
    tbdKeys.staff.detail(clinicId, userId),
    async () => dataOrThrow(await fetchStaffMember(userId)),
    { enabled: Boolean(clinicId && userId), ...TBD_CACHE.working },
  );
}

export function useStaffLocationId(userId: string, enabled = true) {
  const clinicId = useCurrentClinicId();
  return useQueryData<string | null>(
    [...tbdKeys.staff.detail(clinicId, userId), "location"],
    async () => dataOrThrow(await fetchStaffLocationId(userId)),
    { enabled: Boolean(clinicId && userId) && enabled, ...TBD_CACHE.working },
  );
}

export function useChangeStaffLocation() {
  return useMutationOperation<unknown, { userId: string; locationId: string }>(
    async ({ userId, locationId }) => dataOrThrow(await changeStaffLocation(userId, locationId)),
    {
      toastId: "staff-change-location",
      loadingMessage: "Saving location…",
      successMessage: "Location updated",
      invalidateQueries: [...STAFF_FAMILIES, ["in-person"]],
    },
  );
}

export function useStaffInvites(status?: StaffInvite["status"]) {
  const clinicId = useCurrentClinicId();
  return useQueryData<StaffInvite[]>(
    [...tbdKeys.staff.invites(clinicId), status ?? "all"],
    async () => listOf<StaffInvite>(dataOrThrow(await fetchStaffInvites(status))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.working },
  );
}

export function useCreateStaffInvite() {
  return useMutationOperation<StaffInvite, CreateStaffInviteInput>(
    async (input) => dataOrThrow(await createStaffInvite(input)),
    { toastId: "staff-invite-create", loadingMessage: "Sending invite…", successMessage: "Invite sent", invalidateQueries: STAFF_FAMILIES },
  );
}

export function useStaffInviteAction() {
  return useMutationOperation<StaffInvite, { inviteId: string; action: "resend" | "revoke" }>(
    async ({ inviteId, action }) => dataOrThrow(await (action === "resend" ? resendStaffInvite(inviteId) : revokeStaffInvite(inviteId))),
    { toastId: "staff-invite-action", loadingMessage: "Updating invite…", successMessage: "Invite updated", invalidateQueries: STAFF_FAMILIES },
  );
}

// ── Leave ─────────────────────────────────────────────────────────────────

export function useLeaveRequests(filters: { status?: LeaveStatus; userId?: string; from?: string; to?: string } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<LeaveRequest[]>(
    ["clinic-leave", clinicId, filters],
    async () => listOf<LeaveRequest>(dataOrThrow(await fetchLeaveRequests(filters))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.live },
  );
}

export function useLeaveImpact(leaveId: string | null) {
  const clinicId = useCurrentClinicId();
  return useQueryData<LeaveImpact>(
    ["clinic-leave", clinicId, "impact", leaveId],
    async () => dataOrThrow(await fetchLeaveImpact(leaveId ?? "")),
    { enabled: Boolean(clinicId && leaveId), ...TBD_CACHE.live },
  );
}

export function useDecideLeave() {
  return useMutationOperation<LeaveRequest, { leaveId: string; decision: "APPROVE" | "DECLINE"; note?: string }>(
    async ({ leaveId, decision, note }) => dataOrThrow(await decideLeaveRequest(leaveId, decision, note)),
    { toastId: "leave-decision", loadingMessage: "Saving decision…", successMessage: "Leave request updated", invalidateQueries: LEAVE_FAMILIES },
  );
}

// ── Holidays ──────────────────────────────────────────────────────────────

export function useClinicHolidays(filters: { from?: string; to?: string; locationId?: string } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<ClinicHoliday[]>(
    [...tbdKeys.holidays(clinicId), filters],
    async () => listOf<ClinicHoliday>(dataOrThrow(await fetchClinicHolidays(filters))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.working },
  );
}

export function useSaveClinicHoliday() {
  return useMutationOperation<ClinicHoliday, { id?: string; input: ClinicHolidayInput }>(
    async ({ id, input }) => dataOrThrow(await (id ? updateClinicHoliday(id, input) : createClinicHoliday(input))),
    {
      toastId: "clinic-holiday-save",
      loadingMessage: "Saving…",
      successMessage: "Holiday saved",
      invalidateQueries: [["clinic-holidays"], ["clinicSettings"], ["appointments"]],
    },
  );
}

export function useDeleteClinicHoliday() {
  return useMutationOperation<{ id: string; deleted: boolean }, string>(
    async (id) => dataOrThrow(await deleteClinicHoliday(id)),
    { toastId: "clinic-holiday-delete", loadingMessage: "Removing…", successMessage: "Holiday removed", invalidateQueries: [["clinic-holidays"]] },
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────

export function useClinicAudit(filters: { entityType?: string; entityId?: string; limit?: number }, enabled = true) {
  const clinicId = useCurrentClinicId();
  return useQueryData<ClinicAuditEvent[]>(
    ["clinic-audit", clinicId, filters],
    async () => listOf<ClinicAuditEvent>(dataOrThrow(await fetchClinicAudit(filters))),
    { enabled: Boolean(clinicId) && enabled, ...TBD_CACHE.working },
  );
}
