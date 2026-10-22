'use server';

import { API_ENDPOINTS } from '../config/config';
import { clinicOpsRequest, withQuery } from './_ops-request';
import type { ActionResult } from './_shared';
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
} from '@/types/clinic-admin-ops.types';

/**
 * Clinic admin people and schedule actions (CaStaff, CaStaffAdd, CaStaffDetail, CaNotifications,
 * CaHolidayEditor): staff invites and members, the receptionist's location, leave approval,
 * clinic holidays and the audit trail. Backend roles: CLINIC_ADMIN, SUPER_ADMIN.
 */

const OPS = API_ENDPOINTS.CLINIC_ADMIN_OPS;
const LEAVE = API_ENDPOINTS.LEAVE_REQUESTS;

// ── Invites and members ───────────────────────────────────────────────────

export async function fetchStaffInvites(status?: StaffInvite['status']): Promise<ActionResult<StaffInvite[]>> {
  return clinicOpsRequest<StaffInvite[]>(withQuery(OPS.STAFF_INVITES, { status }), { what: 'Staff invites' });
}

export async function createStaffInvite(input: CreateStaffInviteInput): Promise<ActionResult<StaffInvite>> {
  return clinicOpsRequest<StaffInvite>(OPS.STAFF_INVITES, { method: 'POST', body: input, what: 'Staff invite' });
}

export async function resendStaffInvite(inviteId: string): Promise<ActionResult<StaffInvite>> {
  return clinicOpsRequest<StaffInvite>(OPS.STAFF_INVITE_RESEND(inviteId), { method: 'POST', body: {}, what: 'Staff invite' });
}

export async function revokeStaffInvite(inviteId: string): Promise<ActionResult<StaffInvite>> {
  return clinicOpsRequest<StaffInvite>(OPS.STAFF_INVITE_REVOKE(inviteId), { method: 'POST', body: {}, what: 'Staff invite' });
}

export async function fetchStaffMembers(filters: { role?: string; q?: string } = {}): Promise<ActionResult<StaffMember[]>> {
  return clinicOpsRequest<StaffMember[]>(withQuery(OPS.STAFF_MEMBERS, filters), { what: 'Staff members' });
}

export async function fetchStaffMember(userId: string): Promise<ActionResult<StaffMemberDetail>> {
  return clinicOpsRequest<StaffMemberDetail>(OPS.STAFF_MEMBER(userId), { what: 'Staff member' });
}

/**
 * The receptionist's allotted location (`Receptionist.locationId`), read from the existing
 * GET /staff/:userId profile (it includes `receptionists`). `null` when none is allotted.
 */
export async function fetchStaffLocationId(userId: string): Promise<ActionResult<string | null>> {
  const result = await clinicOpsRequest<{ receptionists?: Array<{ locationId?: string | null }> } | null>(
    API_ENDPOINTS.STAFF.GET_BY_ID(userId),
    { what: 'Staff profile' }
  );
  if (!result.success) return result;
  const locationId = result.data?.receptionists?.find((row) => row?.locationId)?.locationId ?? null;
  return { success: true, data: locationId };
}

/** Allots a staff member (receptionist: exactly one location) via the existing POST /user/:id/change-location. */
export async function changeStaffLocation(userId: string, locationId: string): Promise<ActionResult<unknown>> {
  return clinicOpsRequest<unknown>(API_ENDPOINTS.USERS.CHANGE_LOCATION(userId), {
    method: 'POST',
    body: { locationId },
    what: 'Location change',
  });
}

// ── Leave approval ────────────────────────────────────────────────────────

export async function fetchLeaveRequests(
  filters: { status?: LeaveStatus; from?: string; to?: string; userId?: string } = {}
): Promise<ActionResult<LeaveRequest[]>> {
  return clinicOpsRequest<LeaveRequest[]>(withQuery(LEAVE.LIST, filters), { what: 'Leave requests' });
}

export async function fetchLeaveImpact(leaveId: string): Promise<ActionResult<LeaveImpact>> {
  return clinicOpsRequest<LeaveImpact>(LEAVE.IMPACT(leaveId), { what: 'Leave impact' });
}

export async function decideLeaveRequest(
  leaveId: string,
  decision: 'APPROVE' | 'DECLINE',
  note?: string
): Promise<ActionResult<LeaveRequest>> {
  const endpoint = decision === 'APPROVE' ? LEAVE.APPROVE(leaveId) : LEAVE.DECLINE(leaveId);
  return clinicOpsRequest<LeaveRequest>(endpoint, {
    method: 'POST',
    body: {
      ...(note ? { note } : {}),
      ...(decision === 'APPROVE' ? { notifyPatients: true } : {}),
    },
    what: 'Leave decision',
  });
}

// ── Holidays ──────────────────────────────────────────────────────────────

export async function fetchClinicHolidays(
  filters: { from?: string; to?: string; locationId?: string } = {}
): Promise<ActionResult<ClinicHoliday[]>> {
  return clinicOpsRequest<ClinicHoliday[]>(withQuery(OPS.HOLIDAYS, filters), { what: 'Holidays' });
}

export async function createClinicHoliday(input: ClinicHolidayInput): Promise<ActionResult<ClinicHoliday>> {
  return clinicOpsRequest<ClinicHoliday>(OPS.HOLIDAYS, { method: 'POST', body: input, what: 'Holiday' });
}

export async function updateClinicHoliday(
  holidayId: string,
  input: Partial<ClinicHolidayInput>
): Promise<ActionResult<ClinicHoliday>> {
  return clinicOpsRequest<ClinicHoliday>(OPS.HOLIDAY(holidayId), { method: 'PATCH', body: input, what: 'Holiday' });
}

export async function deleteClinicHoliday(holidayId: string): Promise<ActionResult<{ id: string; deleted: boolean }>> {
  return clinicOpsRequest<{ id: string; deleted: boolean }>(OPS.HOLIDAY(holidayId), { method: 'DELETE', what: 'Holiday' });
}

// ── Audit trail ───────────────────────────────────────────────────────────

export async function fetchClinicAudit(
  filters: { entityType?: string; entityId?: string; from?: string; to?: string; limit?: number } = {}
): Promise<ActionResult<ClinicAuditEvent[]>> {
  return clinicOpsRequest<ClinicAuditEvent[]>(withQuery(OPS.AUDIT, filters), { what: 'Audit trail' });
}
