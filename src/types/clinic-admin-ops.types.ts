/**
 * Response shapes of the clinic admin round-3 backend routes (API_CONTRACT.md §2, 3, 7, 9, 10, 15
 * and In-person V2). Amount fields are rupees; they are absent for DOCTOR / ASSISTANT_DOCTOR tokens.
 */

// ── Billing ops (§7) ──────────────────────────────────────────────────────

export interface MoneyCount {
  amount: number;
  count: number;
}

export interface BillingOpsSummary {
  from: string;
  to: string;
  billed: MoneyCount;
  collected: MoneyCount;
  outstanding: MoneyCount;
  overdue: MoneyCount;
}

export interface OverdueInvoice {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string | null;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  billType: string | null;
  remindersSent: number;
  lastReminderAt: string | null;
}

export type ReminderChannel = 'WHATSAPP' | 'SMS';
export type ReminderLanguage = 'en' | 'mr' | 'hi';

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  channel: ReminderChannel;
  language: ReminderLanguage;
  message: string;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SendReminderInput {
  channel?: ReminderChannel;
  language?: ReminderLanguage;
  message?: string;
  scheduledFor?: string;
}

export interface ReceiptLineItem {
  description?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  rate?: number;
  amount?: number;
  total?: number;
}

export interface InvoiceReceipt {
  receiptNumber: string;
  invoiceId: string;
  status: string;
  issuedAt: string;
  clinic: { name: string; address: string | null; phone: string | null };
  patientName: string;
  billType: string | null;
  description: string | null;
  lineItems: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payments: Array<{ method: string; amount: number; paidAt: string }>;
}

// ── Staff admin (§9) ──────────────────────────────────────────────────────

/**
 * Roles a clinic admin may invite. Mirrors `INVITABLE_ROLES` of CreateStaffInviteDto in
 * HealthCareBackend/src/services/clinic-ops/dto/clinic-ops.dto.ts (`@IsIn`, any other role is a 400):
 * keep the two lists identical.
 */
export const INVITABLE_ROLES = [
  'RECEPTIONIST',
  'PHARMACIST',
  'NURSE',
  'ASSISTANT_DOCTOR',
  'THERAPIST',
  'CLINIC_ADMIN',
] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export interface StaffInvite {
  id: string;
  role: InvitableRole;
  name: string | null;
  phone: string | null;
  email: string | null;
  locationIds: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  lastSentAt: string | null;
  resendCount: number;
  createdAt: string;
  /** Only on create / resend. */
  inviteToken?: string;
  inviteLinkPath?: string;
}

export interface CreateStaffInviteInput {
  role: InvitableRole;
  name?: string;
  phone?: string;
  email?: string;
  locationIds?: string[];
}

export interface StaffMember {
  userId: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  lastLogin: string | null;
  onLeaveToday: boolean;
}

export interface StaffMemberDetail extends StaffMember {
  joinedAt: string | null;
  pendingLeaveRequests: number;
  upcomingLeave: Array<{ id: string; kind: LeaveKind; startDate: string; endDate: string; status: LeaveStatus }>;
}

// ── Leave & holidays (§2) ─────────────────────────────────────────────────

export type LeaveKind = 'LEAVE' | 'HALF_DAY' | 'BREAK';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  userId: string;
  requesterName: string;
  requesterRole: string;
  locationId: string | null;
  kind: LeaveKind;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  status: LeaveStatus;
  coverUserId: string | null;
  coverName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  impactedAppointmentCount: number;
  createdAt: string;
}

export interface LeaveImpact {
  leaveRequestId: string;
  impactedAppointmentCount: number;
  appointments: Array<{ appointmentId: string; date: string; time: string; type: string; status: string; patientName: string }>;
}

export type HolidayKind = 'HOLIDAY' | 'CLOSURE' | 'DOCTOR_LEAVE';

export interface ClinicHoliday {
  id: string;
  title: string;
  kind: HolidayKind;
  locationId: string | null;
  startDate: string;
  endDate: string;
  notifyPatients: boolean;
  notifiedCount: number;
  messageTemplate: string | null;
  createdAt: string;
}

export interface ClinicHolidayInput {
  title: string;
  kind?: HolidayKind;
  startDate: string;
  endDate: string;
  locationId?: string;
  notifyPatients?: boolean;
  messageTemplate?: string;
}

// ── Check-in log and QR (§3, §10, In-person V2) ───────────────────────────

export type CheckInMethod = 'QR' | 'MANUAL' | 'WALK_IN';
export type CheckInOutcome = 'SUCCESS' | 'FAILED';
export type CheckInFailureReason =
  | 'EXPIRED_QR'
  | 'INVALID_QR'
  | 'WRONG_LOCATION'
  | 'NOT_BOOKED'
  | 'TOO_EARLY'
  | 'TOO_LATE'
  | 'EXPIRED'
  | 'ALREADY_CHECKED_IN'
  | 'LOCATION_INACTIVE'
  | 'LOCATION_REQUIRED'
  | 'TOO_FAR'
  /** In-person visit not covered by an active monthly plan (backend code NO_ACTIVE_PLAN). */
  | 'NO_ACTIVE_PLAN'
  | 'OTHER';
export type CheckInResolution = 'MANUAL_CHECK_IN' | 'CALLED' | 'IGNORED';

export interface CheckInAttempt {
  id: string;
  at: string;
  locationId: string | null;
  appointmentId: string | null;
  patientId: string | null;
  patientName: string | null;
  method: CheckInMethod;
  outcome: CheckInOutcome;
  failureReason: CheckInFailureReason | null;
  failureDetail: string | null;
  tokenLabel: string | null;
  resolution: CheckInResolution | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  needsAttention: boolean;
}

export interface CheckInSummary {
  date: string;
  total: number;
  succeeded: number;
  failed: number;
  unresolvedFailures: number;
  byMethod: Partial<Record<CheckInMethod, number>>;
  byFailureReason: Partial<Record<CheckInFailureReason, number>>;
}

export interface CheckInLogFilters {
  date?: string;
  from?: string;
  to?: string;
  locationId?: string;
  outcome?: CheckInOutcome;
  method?: CheckInMethod;
}

export interface LocationQr {
  locationId: string;
  locationName?: string;
  qrVersion?: number;
  /** data:image/png;base64,… */
  qrCode: string;
  qrCodeString?: string;
  rotatedAt?: string | null;
}

// ── Audit (§15) ───────────────────────────────────────────────────────────

export interface ClinicAuditEvent {
  id: string;
  at: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  detail: Record<string, unknown> | string | null;
}
