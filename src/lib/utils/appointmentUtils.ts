import { APP_CONFIG } from '@/lib/config/config';
import {
  IST_TIMEZONE,
  formatDateInIST,
  formatDateTimeInIST,
  formatISODateInIST,
  formatMonthShortInIST,
  formatTimeInIST,
  formatTimeValueInIST,
  normalizeTimeInputToTwentyFourHour,
  parseIstDateTime,
} from './date-time';
import {
  calculateAppointmentDuration,
  getAppointmentDateTimeValue,
  getNextAvailableTime,
  isAppointmentOverdue,
} from './clock';
import type { AppointmentServiceDefinition } from '@/types/appointment.types';

export {
  IST_TIMEZONE,
  formatDateInIST,
  formatDateTimeInIST,
  formatISODateInIST,
  formatMonthShortInIST,
  formatTimeInIST,
  formatTimeValueInIST,
  normalizeTimeInputToTwentyFourHour,
  parseIstDateTime,
} from './date-time';
export {
  calculateAppointmentDuration,
  getAppointmentDateTimeValue,
  getNextAvailableTime,
  isAppointmentOverdue,
} from './clock';

export interface NormalizedPatientAppointment {
  id: string;
  raw: any;
  status: string;
  type: string;
  dateTime: Date | null;
  normalizedDate: string;
  normalizedTime: string;
  doctorName: string;
  locationName: string;
  isOnline: boolean;
}

const IN_PERSON_DEFAULT_DURATION_MINUTES = 3;
const VIDEO_DEFAULT_DURATION_MINUTES = 15;
const VIDEO_JOIN_EARLY_WINDOW_MINUTES = 20;
const VIDEO_JOIN_LATE_WINDOW_MINUTES = 300;

const COMPLETED_PAYMENT_STATUSES = new Set(['COMPLETED', 'SUCCESS', 'PAID', 'CAPTURED']);
const PENDING_PAYMENT_STATUSES = new Set([
  'PENDING',
  'PROCESSING',
  'OPEN',
  'CREATED',
  'AWAITING_PAYMENT',
  'UNPAID',
  'OVERDUE',
]);

export function normalizeAppointmentStatus(value: unknown): string {
  const normalized = String(value || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  switch (normalized) {
    // PENDING = video appointment created, payment window started, not yet paid.
    // Keep this distinct from SCHEDULED so the UI can render a countdown
    // and the auto-cancel scheduler can target the right rows.
    case 'PENDING':
      return 'PENDING';
    case 'PROPOSED':
    case 'AWAITING_PAYMENT':
    case 'PENDING_PAYMENT':
    case 'FOLLOW_UP_SCHEDULED':
    case 'RESCHEDULED':
    case 'WAITING':
      return 'SCHEDULED';
    case 'PAID':
      return 'CONFIRMED';
    case 'ACTIVE':
    case 'STARTED':
      return 'IN_PROGRESS';
    case 'ENDED':
      return 'COMPLETED';
    default:
      return normalized;
  }
}

export function isVideoNoShowEnforced(): boolean {
  return APP_CONFIG.VIDEO.NO_SHOW_ENABLED;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    const records: Record<string, unknown>[] = [];
    for (const item of value) {
      const record = asRecord(item);
      if (record) {
        records.push(record);
      }
    }
    return records;
  }

  const record = asRecord(value);
  return record ? [record] : [];
}

function normalizeNameCandidate(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function isGenericAppointmentName(value: string, kind: "doctor" | "patient" | "any" = "any"): boolean {
  const normalized = value.trim();
  if (!normalized) return true;

  const genericPatterns = [
    /^unknown\s+(doctor|patient)$/i,
    /^doctor(?:\s+tbd)?$/i,
    /^patient(?:\s+tbd)?$/i,
    /^doctor\s+assigned$/i,
    /^patient\s+assigned$/i,
    /^doctor\s+details\s+pending$/i,
    /^patient\s+details\s+pending$/i,
    /^consultation(?:\s+.*)?$/i,
    /^video\s+appointment(?:\s+.*)?$/i,
    /^appointment(?:\s+.*)?$/i,
    /^room(?:\s+.*)?$/i,
  ];

  if (genericPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

function getPersonNameCandidates(person: any): string[] {
  const nestedUser = person?.user || {};
  const nestedProfile = person?.profile || {};

  const candidates = [
    person?.name,
    person?.displayName,
    person?.display_name,
    person?.fullName,
    person?.full_name,
    person?.firstName && person?.lastName ? `${person.firstName} ${person.lastName}` : "",
    person?.first_name && person?.last_name ? `${person.first_name} ${person.last_name}` : "",
    person?.firstName,
    person?.lastName,
    person?.first_name,
    person?.last_name,
    nestedUser?.name,
    nestedUser?.displayName,
    nestedUser?.display_name,
    nestedUser?.fullName,
    nestedUser?.full_name,
    nestedUser?.firstName && nestedUser?.lastName ? `${nestedUser.firstName} ${nestedUser.lastName}` : "",
    nestedUser?.first_name && nestedUser?.last_name ? `${nestedUser.first_name} ${nestedUser.last_name}` : "",
    nestedUser?.firstName,
    nestedUser?.lastName,
    nestedUser?.first_name,
    nestedUser?.last_name,
    nestedProfile?.name,
    nestedProfile?.displayName,
    nestedProfile?.display_name,
    nestedProfile?.fullName,
    nestedProfile?.full_name,
    nestedProfile?.firstName && nestedProfile?.lastName ? `${nestedProfile.firstName} ${nestedProfile.lastName}` : "",
    nestedProfile?.first_name && nestedProfile?.last_name ? `${nestedProfile.first_name} ${nestedProfile.last_name}` : "",
  ];

  const normalizedCandidates: string[] = [];
  for (const candidate of candidates) {
    const value = normalizeNameCandidate(candidate);
    if (value && !/^unknown\s+(doctor|patient)$/i.test(value)) {
      normalizedCandidates.push(value);
    }
  }

  return normalizedCandidates;
}

function getVideoJoinWindow(appointment: any): { start: Date | null; end: Date | null } {
  const startSource =
    getAppointmentDateTimeValue(appointment) ||
    appointment?.startTime ||
    appointment?.appointmentDate ||
    appointment?.scheduledFor ||
    appointment?.createdAt ||
    null;

  const start = startSource ? new Date(startSource) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return { start: null, end: null };
  }

  const explicitEndSource = appointment?.endTime || appointment?.scheduledEndTime || null;
  const explicitEnd = explicitEndSource ? new Date(explicitEndSource) : null;
  const fallbackEnd = new Date(start.getTime() + VIDEO_JOIN_LATE_WINDOW_MINUTES * 60_000);
  const end = explicitEnd && !Number.isNaN(explicitEnd.getTime()) ? explicitEnd : fallbackEnd;
  return { start, end };
}

function isWithinVideoJoinWindow(appointment: any, now = new Date()): boolean {
  const window = getVideoJoinWindow(appointment);
  if (!window.start || !window.end) {
    return true;
  }

  const earlyJoinTime = new Date(window.start.getTime() - VIDEO_JOIN_EARLY_WINDOW_MINUTES * 60_000);
  return now >= earlyJoinTime && now <= window.end;
}

function getDoctorNameCandidates(appointment: any): string[] {
  const candidates = [
    ...getPersonNameCandidates(appointment?.doctor),
    ...getPersonNameCandidates(appointment?.assignedDoctor),
    ...getPersonNameCandidates(appointment?.primaryDoctor),
    ...getPersonNameCandidates(appointment?.doctorUser),
    ...getPersonNameCandidates(appointment?.doctorProfile),
    ...getPersonNameCandidates(appointment?.provider),
    ...getPersonNameCandidates(appointment?.practitioner),
    ...getPersonNameCandidates(appointment?.physician),
    normalizeNameCandidate(appointment?.doctorName),
    normalizeNameCandidate(appointment?.doctorDisplayName),
    normalizeNameCandidate(appointment?.doctorFullName),
    normalizeNameCandidate(appointment?.doctor_user_name),
    normalizeNameCandidate(appointment?.doctor_user_full_name),
    normalizeNameCandidate(appointment?.assignedDoctorName),
    normalizeNameCandidate(appointment?.assignedDoctorDisplayName),
    normalizeNameCandidate(appointment?.primaryDoctorName),
    normalizeNameCandidate(appointment?.primaryDoctorDisplayName),
    normalizeNameCandidate(appointment?.attendingDoctorName),
    normalizeNameCandidate(appointment?.consultingDoctorName),
    normalizeNameCandidate(appointment?.consultingDoctorDisplayName),
    normalizeNameCandidate(appointment?.practitionerName),
    normalizeNameCandidate(appointment?.physicianName),
    normalizeNameCandidate(appointment?.providerName),
  ];

  const normalizedCandidates: string[] = [];
  for (const candidate of candidates) {
    const value = normalizeNameCandidate(candidate);
    if (value && !/^unknown\s+doctor$/i.test(value)) {
      normalizedCandidates.push(value);
    }
  }

  return normalizedCandidates;
}

function normalizeViewerRole(role: unknown): string {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isDoctorLikeRole(role: unknown): boolean {
  const normalizedRole = normalizeViewerRole(role);
  return [
    "DOCTOR",
    "ASSISTANT_DOCTOR",
    "THERAPIST",
    "COUNSELOR",
  ].includes(normalizedRole);
}

function isPatientLikeRole(role: unknown): boolean {
  return normalizeViewerRole(role) === "PATIENT";
}

function getPaymentCandidates(appointment: any): Record<string, unknown>[] {
  return [
    ...asRecordArray(appointment?.payment),
    ...asRecordArray(appointment?.payments),
    ...asRecordArray(appointment?.billing?.payment),
    ...asRecordArray(appointment?.billing?.payments),
    ...asRecordArray(appointment?.invoice?.payment),
    ...asRecordArray(appointment?.invoice?.payments),
  ];
}

function getPaymentCompletionFlags(appointment: any): boolean[] {
  const flags = [
    appointment?.paymentCompleted,
    appointment?.isPaid,
    appointment?.paid,
    appointment?.billing?.paymentCompleted,
    appointment?.billing?.isPaid,
    appointment?.billing?.paid,
    appointment?.invoice?.paymentCompleted,
    appointment?.invoice?.isPaid,
    appointment?.invoice?.paid,
  ];

  const completionFlags: boolean[] = [];
  for (const flag of flags) {
    if (typeof flag === 'boolean') {
      completionFlags.push(flag);
    }
  }

  return completionFlags;
}

function hasExplicitVideoPaymentRequirement(appointment: any): boolean {
  if (!appointment || typeof appointment !== 'object') {
    return false;
  }

  const directRequirementFlags = [
    appointment?.requiresPayment,
    appointment?.paymentRequired,
    appointment?.billing?.requiresPayment,
    appointment?.invoice?.requiresPayment,
    appointment?.payment?.requiresPayment,
  ];

  if (directRequirementFlags.some((value) => value === true)) {
    return true;
  }

  const candidateFees = [
    appointment?.videoConsultationFee,
    appointment?.service?.videoConsultationFee,
    appointment?.appointmentService?.videoConsultationFee,
  ];

  return candidateFees.some((value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0;
  });
}

function getBackendVideoAccessState(appointment: any): {
  canJoin?: boolean;
  paymentRequired?: boolean;
  paymentCompleted?: boolean;
  joinBlockedReason?: string | null;
  scheduledStartTime?: string | Date | null;
  scheduledEndTime?: string | Date | null;
  joinWindowStart?: string | Date | null;
  joinWindowEnd?: string | Date | null;
} | null {
  if (!appointment || typeof appointment !== 'object') {
    return null;
  }

  const record = appointment as Record<string, unknown>;
  const hasJoinStateSignal = [
    'canJoin',
    'paymentRequired',
    'paymentCompleted',
    'joinBlockedReason',
    'scheduledStartTime',
    'scheduledEndTime',
    'joinWindowStart',
    'joinWindowEnd',
  ].some((key) => key in record);

  if (!hasJoinStateSignal) {
    return null;
  }

  const joinBlockedReason =
    typeof record.joinBlockedReason === 'string'
      ? record.joinBlockedReason
      : record.joinBlockedReason === null
        ? null
        : undefined;

  const state: {
    canJoin?: boolean;
    paymentRequired?: boolean;
    paymentCompleted?: boolean;
    joinBlockedReason?: string | null;
    scheduledStartTime?: string | Date | null;
    scheduledEndTime?: string | Date | null;
    joinWindowStart?: string | Date | null;
    joinWindowEnd?: string | Date | null;
  } = {};

  if (typeof record.canJoin === 'boolean') {
    state.canJoin = record.canJoin;
  }
  if (typeof record.paymentRequired === 'boolean') {
    state.paymentRequired = record.paymentRequired;
  }
  if (typeof record.paymentCompleted === 'boolean') {
    state.paymentCompleted = record.paymentCompleted;
  }
  if (joinBlockedReason !== undefined) {
    state.joinBlockedReason = joinBlockedReason;
  }
  if (typeof record.scheduledStartTime === 'string' || record.scheduledStartTime instanceof Date) {
    state.scheduledStartTime = record.scheduledStartTime;
  } else if ('scheduledStartTime' in record) {
    state.scheduledStartTime = null;
  }
  if (typeof record.scheduledEndTime === 'string' || record.scheduledEndTime instanceof Date) {
    state.scheduledEndTime = record.scheduledEndTime;
  } else if ('scheduledEndTime' in record) {
    state.scheduledEndTime = null;
  }
  if (typeof record.joinWindowStart === 'string' || record.joinWindowStart instanceof Date) {
    state.joinWindowStart = record.joinWindowStart;
  } else if ('joinWindowStart' in record) {
    state.joinWindowStart = null;
  }
  if (typeof record.joinWindowEnd === 'string' || record.joinWindowEnd instanceof Date) {
    state.joinWindowEnd = record.joinWindowEnd;
  } else if ('joinWindowEnd' in record) {
    state.joinWindowEnd = null;
  }

  return state;
}

function normalizePaymentStatusValue(value: unknown): string {
  const normalized = String(value || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (!normalized) {
    return '';
  }

  if (COMPLETED_PAYMENT_STATUSES.has(normalized)) {
    return 'PAID';
  }

  if (PENDING_PAYMENT_STATUSES.has(normalized)) {
    return 'PENDING';
  }

  if (normalized === 'FAILED' || normalized === 'VOID' || normalized === 'UNCOLLECTIBLE') {
    return normalized;
  }

  return normalized;
}

export function isVideoAppointmentPaymentCompleted(appointment: any): boolean {
  if (!appointment) return false;

  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  if (type !== 'VIDEO_CALL') {
    return true;
  }

  const backendAccessState = getBackendVideoAccessState(appointment);
  if (backendAccessState?.canJoin === true) {
    return true;
  }
  if (typeof backendAccessState?.paymentCompleted === 'boolean') {
    return backendAccessState.paymentCompleted;
  }
  if (backendAccessState?.paymentRequired === false) {
    return true;
  }

  if (!hasExplicitVideoPaymentRequirement(appointment)) {
    return true;
  }

  if (getPaymentCompletionFlags(appointment).some(Boolean)) {
    return true;
  }

  return getAppointmentPaymentStatus(appointment) === 'PAID';
}

function normalizeStatusToken(value: unknown): string {
  return normalizePaymentStatusValue(value);
}

function getAppointmentStatusWithPaymentFallback(appointment: any): string {
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  const normalizedStatus = normalizeAppointmentStatus(appointment?.status);

  if (
    type === 'VIDEO_CALL' &&
    normalizedStatus === 'SCHEDULED' &&
    isVideoAppointmentPaymentCompleted(appointment)
  ) {
    return 'CONFIRMED';
  }

  return normalizedStatus;
}

export function getAppointmentPaymentStatus(appointment: any): string {
  if (getPaymentCompletionFlags(appointment).some(Boolean)) {
    return 'PAID';
  }

  const paymentCandidates = getPaymentCandidates(appointment);
  const paymentStatusCandidates: string[] = [];
  for (const payment of paymentCandidates) {
    const statuses = [
      payment?.status,
      payment?.paymentStatus,
      payment?.state,
      payment?.payment_state,
      payment?.transactionStatus,
    ];

    for (const status of statuses) {
      const normalized = normalizeStatusToken(status);
      if (normalized) {
        paymentStatusCandidates.push(normalized);
      }
    }
  }

  const directPaymentStatus = normalizeStatusToken(
    appointment?.paymentStatus ||
      appointment?.billing?.paymentStatus ||
      appointment?.billing?.status ||
      appointment?.invoice?.paymentStatus ||
      appointment?.invoice?.status ||
      ''
  );

  const allStatuses: string[] = [...paymentStatusCandidates];
  if (directPaymentStatus) {
    allStatuses.push(directPaymentStatus);
  }

  if (allStatuses.some((status) => COMPLETED_PAYMENT_STATUSES.has(status) || status === 'PAID')) {
    return 'PAID';
  }

  if (allStatuses.some((status) => PENDING_PAYMENT_STATUSES.has(status) || status === 'PENDING')) {
    return 'PENDING';
  }

  const firstKnown = allStatuses[0];
  if (firstKnown) {
    return firstKnown;
  }

  return 'N_A';
}

export function isAppointmentAwaitingPayment(appointment: any): boolean {
  const paymentStatus = getAppointmentPaymentStatus(appointment);
  return paymentStatus === 'PENDING' || paymentStatus === 'OVERDUE';
}

export function isVideoAppointmentJoinable(appointment: any): boolean {
  const viewState = getAppointmentViewState(appointment);
  const normalizedStatus = viewState.normalizedStatus.toUpperCase();
  const joinableStatuses = new Set(['SCHEDULED', 'CONFIRMED', 'QUEUED', 'IN_PROGRESS']);

  if (isTerminalAppointment(appointment)) {
    return false;
  }

  if (normalizedStatus === 'NO_SHOW' && !isVideoNoShowEnforced()) {
    // Test-only bypass: treat video no-show as joinable when enforcement is disabled.
  } else if (!joinableStatuses.has(normalizedStatus)) {
    return false;
  }

  return viewState.paymentCompleted;
}

export function getVideoAppointmentJoinBlockedReason(appointment: any): string {
  const viewState = getAppointmentViewState(appointment);
  const normalizedStatus = viewState.normalizedStatus.toUpperCase();

  if (['CANCELLED', 'COMPLETED'].includes(normalizedStatus)) {
    return 'This video appointment is no longer available.';
  }

  if (normalizedStatus === 'NO_SHOW' && isVideoNoShowEnforced()) {
    return 'This video appointment is no longer available.';
  }

  if (!viewState.paymentCompleted) {
    return 'Payment is required before joining this video appointment.';
  }

  return 'This video appointment is not ready to join yet.';
}

export type AppointmentPaymentDisplayState = {
  paymentStatus: string;
  paymentCompleted: boolean;
  paymentPending: boolean;
  paymentLabel: string;
};

export function getAppointmentPaymentDisplayState(appointment: any): AppointmentPaymentDisplayState {
  const viewState = getAppointmentViewState(appointment);
  const paymentCompleted = viewState.paymentCompleted;
  const paymentPending = viewState.isVideo ? !paymentCompleted : viewState.awaitingPayment;

  return {
    paymentStatus: viewState.paymentStatus,
    paymentCompleted,
    paymentPending,
    paymentLabel: paymentCompleted ? 'Payment verified' : 'Payment pending',
  };
}

/**
 * Extract a numeric payment amount (in INR / base currency units) from an appointment.
 * Walks nested billing/invoice/payment objects to find a positive fee.
 * Returns 0 when no fee can be determined.
 */
export function getAppointmentPaymentAmount(appointment: any): number {
  if (!appointment || typeof appointment !== 'object') return 0;

  const candidates: unknown[] = [
    appointment?.videoConsultationFee,
    appointment?.consultationFee,
    appointment?.amount,
    appointment?.price,
    appointment?.fee,
    appointment?.billing?.amount,
    appointment?.billing?.totalAmount,
    appointment?.billing?.total,
    appointment?.billing?.price,
    appointment?.billing?.fee,
    appointment?.billing?.videoConsultationFee,
    appointment?.billing?.consultationFee,
    appointment?.invoice?.amount,
    appointment?.invoice?.totalAmount,
    appointment?.invoice?.total,
    appointment?.invoice?.price,
    appointment?.invoice?.fee,
    appointment?.invoice?.videoConsultationFee,
    appointment?.invoice?.consultationFee,
    appointment?.service?.videoConsultationFee,
    appointment?.service?.consultationFee,
    appointment?.service?.amount,
    appointment?.service?.price,
    appointment?.service?.fee,
    appointment?.appointmentService?.videoConsultationFee,
    appointment?.appointmentService?.consultationFee,
    appointment?.appointmentService?.amount,
    appointment?.appointmentService?.price,
    appointment?.appointmentService?.fee,
    appointment?.payment?.amount,
  ];

  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      return amount;
    }
  }

  return 0;
}

export function getAppointmentDoctorName(appointment: any): string {
  const candidates = getDoctorNameCandidates(appointment);
  const doctorName = candidates.find((value) => value && !isGenericAppointmentName(value, "doctor"));
  return doctorName || candidates[0] || "Doctor assigned";
}

export function getAppointmentPatientName(appointment: any): string {
  const candidates = getPersonNameCandidates(appointment?.patient);
  const patientName = candidates.find((value) => value && !isGenericAppointmentName(value, "patient"));
  const explicitPatientName = normalizeNameCandidate(appointment?.patientName || "");
  const resolvedPatientName = !isGenericAppointmentName(explicitPatientName, "patient")
    ? explicitPatientName
    : patientName || candidates[0] || "";
  return resolvedPatientName || "Unknown Patient";
}

export function getAppointmentCounterpartyName(
  appointment: any,
  viewerRole?: string | null
): string {
  const doctorName = getAppointmentDoctorName(appointment);
  const patientName = getAppointmentPatientName(appointment);

  if (isPatientLikeRole(viewerRole)) {
    return doctorName;
  }

  if (isDoctorLikeRole(viewerRole)) {
    return patientName;
  }

  if (doctorName && !isGenericAppointmentName(doctorName, "doctor")) {
    return doctorName;
  }

  if (patientName && !isGenericAppointmentName(patientName, "patient")) {
    return patientName;
  }

  return doctorName || patientName || "Participant";
}

export function getAppointmentLocationName(appointment: any): string {
  return (
    (typeof appointment?.location === 'string'
      ? appointment.location
      : appointment?.location?.name ||
        appointment?.location?.address ||
        appointment?.locationName) ||
    appointment?.clinic?.name ||
    'Location TBD'
  );
}

export function normalizePatientAppointment(appointment: any): NormalizedPatientAppointment {
  const dateTime = getAppointmentDateTimeValue(appointment);
  const normalizedStatus = getAppointmentStatusWithPaymentFallback(appointment);
  const normalizedTime =
    (typeof appointment?.time === 'string' && appointment.time
      ? formatTimeValueInIST(appointment.time)
      : '') ||
    (dateTime
      ? formatTimeInIST(dateTime, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '');

  return {
    id: appointment?.id || '',
    raw: appointment,
    status: normalizedStatus,
    type: appointment?.type || appointment?.appointmentType || 'Consultation',
    dateTime,
    normalizedDate: dateTime ? formatISODateInIST(dateTime) : appointment?.date || '',
    normalizedTime,
    doctorName: getAppointmentDoctorName(appointment),
    locationName: getAppointmentLocationName(appointment),
    isOnline:
      Boolean(appointment?.isOnline) ||
      appointment?.type === 'VIDEO_CALL' ||
      appointment?.appointmentType === 'VIDEO_CALL',
  };
}

export function getDisplayAppointmentDuration(appointment: any): number | undefined {
  const rawDuration = Number(appointment?.duration);
  const hasNumericDuration = Number.isFinite(rawDuration) && rawDuration > 0;
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();

  if (type === 'VIDEO_CALL') {
    if (!hasNumericDuration || rawDuration <= IN_PERSON_DEFAULT_DURATION_MINUTES) {
      return VIDEO_DEFAULT_DURATION_MINUTES;
    }
    return rawDuration;
  }

  if (hasNumericDuration) {
    return rawDuration;
  }

  if (type === 'IN_PERSON') {
    return IN_PERSON_DEFAULT_DURATION_MINUTES;
  }

  return undefined;
}

export function getAppointmentStatusDisplayName(status: string): string {
  const normalizedStatus = normalizeAppointmentStatus(status);
  const statusNames: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
    EXPIRED: 'Expired',
  };
  return statusNames[normalizedStatus] || normalizedStatus;
}

export function isAwaitingDoctorSlotConfirmation(appointment: any): boolean {
  return false;
}

export function getAppointmentStatusBadgeLabel(appointment: any): string {
  const normalizedStatus = getAppointmentStatusWithPaymentFallback(appointment);

  if (
    normalizedStatus === 'COMPLETED' ||
    normalizedStatus === 'CANCELLED' ||
    normalizedStatus === 'NO_SHOW'
  ) {
    return getAppointmentStatusDisplayName(normalizedStatus);
  }

  return getAppointmentStatusDisplayName(normalizedStatus);
}

export type AppointmentWorkflowState =
  | 'pending_payment'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'awaiting_video_payment'
  | 'awaiting_doctor_slot_confirmation';

export type AppointmentViewState = {
  type: string;
  status: string;
  normalizedStatus: string;
  workflowState: AppointmentWorkflowState;
  paymentStatus: string;
  paymentCompleted: boolean;
  awaitingPayment: boolean;
  isVideo: boolean;
  isScheduledLike: boolean;
  displayStatusLabel: string;
  /**
   * ISO-8601 timestamp after which the backend will auto-cancel a
   * PENDING video appointment. Frontend renders a live countdown against
   * this value. `null` when no payment window is active.
   */
  paymentExpiresAt: string | null;
  /**
   * Snapshot of the configured payment window length (minutes) used to
   * drive the ring / progress bar visual.
   */
  paymentWindowMinutes: number | null;
  showInDoctorWorkspace: boolean;
  showInPatientWorkspace: boolean;
  showInReceptionWorkspace: boolean;
};

export type VideoSessionAction = 'blocked' | 'start' | 'join' | 'resume';

export type VideoSessionDecision = {
  status: string;
  action: VideoSessionAction;
  label: string;
  blockedReason: string | null;
  shouldCallConsultationStart: boolean;
  canJoin: boolean;
};

function isCancelledLike(status: string): boolean {
  return ['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(status);
}

export function isTerminalAppointmentStatus(status: unknown): boolean {
  const normalized = normalizeAppointmentStatus(status);
  return ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'VOID', 'REJECTED', 'EXPIRED'].includes(normalized);
}

export function isTerminalAppointment(appointment: any): boolean {
  if (!appointment || typeof appointment !== 'object') {
    return false;
  }

  if (isTerminalAppointmentStatus(appointment?.status)) {
    return true;
  }

  return Boolean(
    appointment?.completedAt ||
      appointment?.completed_at ||
      appointment?.cancelledAt ||
      appointment?.cancelled_at ||
      appointment?.closedAt ||
      appointment?.closed_at
  );
}

function isActiveLike(status: string): boolean {
  return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
}

export function getAppointmentViewState(appointment: any): AppointmentViewState {
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  const backendAccessState = getBackendVideoAccessState(appointment);
  const paymentStatus = getAppointmentPaymentStatus(appointment);
  const paymentCompleted =
    backendAccessState?.canJoin === true
      ? true
      : typeof backendAccessState?.paymentCompleted === 'boolean'
        ? backendAccessState.paymentCompleted
        : isVideoAppointmentPaymentCompleted(appointment);
  const rawStatus = normalizeAppointmentStatus(appointment?.status);
  const terminalStatus = isTerminalAppointment(appointment)
    ? (rawStatus === 'COMPLETED'
        ? 'COMPLETED'
        : rawStatus === 'NO_SHOW'
          ? 'NO_SHOW'
          : rawStatus === 'EXPIRED'
            ? 'EXPIRED'
          : 'CANCELLED')
    : null;
  const status = terminalStatus || getAppointmentStatusWithPaymentFallback(appointment);
  const awaitingPayment =
    type === 'VIDEO_CALL'
      ? backendAccessState?.paymentRequired === true
        ? !paymentCompleted
        : isAppointmentAwaitingPayment(appointment)
      : false;
  const isVideo = type === 'VIDEO_CALL';
  const isScheduledLike = status === 'SCHEDULED' || status === 'CONFIRMED';
  // ─── Payment-window metadata ────────────────────────────
  // PENDING video appointments carry an ISO `paymentExpiresAt` timestamp.
  // Fall back to a window-start derived from the metadata if the field
  // is missing, so the countdown still works for older payloads.
  const meta = (appointment?.metadata && typeof appointment.metadata === 'object'
    ? appointment.metadata
    : {}) as Record<string, unknown>;
  const paymentWindowMinutes = typeof meta['paymentWindowMinutes'] === 'number'
    ? (meta['paymentWindowMinutes'] as number)
    : null;
  const rawExpires = appointment?.paymentExpiresAt;
  let paymentExpiresAt: string | null = null;
  if (typeof rawExpires === 'string' && rawExpires) {
    paymentExpiresAt = rawExpires;
  } else if (typeof meta['paymentWindowStartedAt'] === 'string' && paymentWindowMinutes) {
    const startedMs = Date.parse(meta['paymentWindowStartedAt'] as string);
    if (Number.isFinite(startedMs)) {
      paymentExpiresAt = new Date(startedMs + paymentWindowMinutes * 60_000).toISOString();
    }
  }
  const workflowState: AppointmentWorkflowState =
    status === 'PENDING'
      ? 'pending_payment'
      : status === 'IN_PROGRESS'
        ? 'in_progress'
        : status === 'COMPLETED'
          ? 'completed'
          : status === 'CANCELLED' || status === 'NO_SHOW' || status === 'EXPIRED'
            ? 'cancelled'
            : paymentCompleted && status === 'SCHEDULED' && isVideo
              ? 'awaiting_video_payment'
              : status === 'CONFIRMED'
                ? 'confirmed'
                : 'scheduled';
  const displayStatusLabel = getAppointmentStatusBadgeLabel(appointment);
  const isDashboardVisibleStatus =
    isActiveLike(status) ||
    status === 'AWAITING_PAYMENT' ||
    status === 'PENDING' ||
    status === 'PENDING_PAYMENT';

  return {
    type,
    status: rawStatus,
    normalizedStatus: status,
    workflowState,
    paymentStatus,
    paymentCompleted,
    awaitingPayment,
    isVideo,
    isScheduledLike,
    displayStatusLabel,
    paymentExpiresAt,
    paymentWindowMinutes,
    showInDoctorWorkspace:
      !isCancelledLike(status) && isDashboardVisibleStatus,
    showInPatientWorkspace:
      !isCancelledLike(status) && (isActiveLike(status) || status === 'PENDING'),
    showInReceptionWorkspace:
      !isCancelledLike(status) && isDashboardVisibleStatus,
  };
}

export function shouldShowAppointmentOnDoctorDashboard(appointment: any): boolean {
  return getAppointmentViewState(appointment).showInDoctorWorkspace;
}

export function shouldShowAppointmentOnPatientDashboard(appointment: any): boolean {
  return getAppointmentViewState(appointment).showInPatientWorkspace;
}

export function shouldShowAppointmentOnReceptionistDashboard(appointment: any): boolean {
  return getAppointmentViewState(appointment).showInReceptionWorkspace;
}

export function shouldShowAppointmentOnReceptionDashboard(appointment: any): boolean {
  return shouldShowAppointmentOnReceptionistDashboard(appointment);
}

/**
 * Convert a name to Title Case for consistent display.
 * Handles null/empty/undefined gracefully.
 * Example: "dr.chandrakumar deshmukh" -> "Dr.Chandrakumar Deshmukh"
 */
export function toTitleCase(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determine if an appointment's time slot has already passed (with grace).
 * Used to prevent retrying payment for an appointment whose window is gone.
 *
 * - Returns true when the appointment's start time + duration is in the past
 *   beyond a 5-minute grace window.
 * - Returns false if we cannot resolve a time (so we don't over-restrict).
 * - For appointments that are still CONFIRMED/SCHEDULED and ongoing, returns false.
 */
export function isAppointmentTimeSlotExpired(
  appointment: any,
  graceMinutes: number = 5,
): boolean {
  if (!appointment || typeof appointment !== 'object') {
    return false;
  }

  const startTime = getAppointmentDateTimeValue(appointment);
  if (!startTime) {
    return false;
  }

  // Prefer explicit endTime if present on the appointment, otherwise
  // estimate end = start + 30 minutes (typical video consultation length).
  const rawEnd = (appointment as { endTime?: string | Date | null }).endTime;
  let endTime: Date | null = null;
  if (rawEnd) {
    const parsed = new Date(rawEnd);
    if (!Number.isNaN(parsed.getTime())) {
      endTime = parsed;
    }
  }
  if (!endTime) {
    endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  }

  const now = Date.now();
  const graceMs = graceMinutes * 60 * 1000;
  return now > endTime.getTime() + graceMs;
}

/**
 * Determine if a cancelled appointment was cancelled due to payment failure
 * (rather than a user-initiated cancellation or a doctor-side no-show).
 *
 * Heuristics:
 *  - cancelledBy is "system" (auto-cancellation)
 *  - cancellationReason mentions payment/slot expiry
 *  - payment status is PENDING/FAILED/OVERDUE (no COMPLETED payment)
 *  - appointment is video (where payment is most relevant)
 */
export function wasCancelledDueToPaymentFailure(appointment: any): boolean {
  if (!appointment || typeof appointment !== 'object') {
    return false;
  }
  const rawStatus = normalizeAppointmentStatus(appointment?.status);
  if (rawStatus !== 'CANCELLED') {
    return false;
  }
  const cancelledBy = String(appointment?.cancelledBy || '').toLowerCase();
  const reason = String(appointment?.cancellationReason || '').toLowerCase();
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  const isVideo = type === 'VIDEO_CALL';

  // If a user explicitly cancelled (not system), it's not a payment failure.
  if (cancelledBy && cancelledBy !== 'system' && cancelledBy !== 'auto') {
    return false;
  }

  // If the cancellation reason explicitly mentions a non-payment cause, skip.
  if (reason && !/payment|slot|expired|timeout|3 hour|grace/i.test(reason)) {
    // Reason is set but doesn't look payment-related — could be a doctor
    // reschedule, patient no-show, or operational cancellation. Be safe and
    // only treat as payment-failure when the reason mentions payment context.
    if (cancelledBy !== 'system' && cancelledBy !== 'auto') {
      return false;
    }
  }

  // No payment completed.
  if (isVideoAppointmentPaymentCompleted(appointment)) {
    return false;
  }

  // For video appointments, system cancellation with no completed payment
  // is treated as payment failure (the user can retry booking/payment).
  if (isVideo) {
    return true;
  }

  // For in-person appointments, treat as payment failure only if there's
  // an explicit FAILED/PENDING payment record OR the reason mentions payment.
  if (reason && /payment|paid|unpaid/i.test(reason)) {
    return true;
  }

  const paymentStatus = String(getAppointmentPaymentStatus(appointment) || '').toUpperCase();
  if (paymentStatus === 'FAILED' || paymentStatus === 'PENDING' || paymentStatus === 'OVERDUE') {
    return true;
  }

  return false;
}

export function getVideoSessionDecision(appointment: any): VideoSessionDecision {
  const viewState = getAppointmentViewState(appointment);
  const status = viewState.normalizedStatus.toUpperCase();

  if (status === 'CANCELLED' || status === 'COMPLETED') {
    return {
      status,
      action: 'blocked',
      label: getAppointmentStatusDisplayName(status),
      blockedReason:
        status === 'CANCELLED'
          ? 'This appointment was cancelled and cannot be joined.'
          : 'This appointment has already been completed.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

  if (status === 'NO_SHOW' && isVideoNoShowEnforced()) {
    return {
      status,
      action: 'blocked',
      label: 'No Show',
      blockedReason: 'This appointment was marked as a no-show and cannot be joined.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

  const backendAccessState = getBackendVideoAccessState(appointment);
  if (backendAccessState?.canJoin === true) {
    const status = viewState.normalizedStatus.toUpperCase();
    return {
      status,
      action: status === 'IN_PROGRESS' ? 'resume' : 'join',
      label: status === 'IN_PROGRESS' ? 'Resume Video Call' : 'Join Session',
      blockedReason: null,
      shouldCallConsultationStart: status !== 'IN_PROGRESS',
      canJoin: true,
    };
  }

  if (backendAccessState?.canJoin === false) {
    return {
      status: viewState.normalizedStatus.toUpperCase(),
      action: 'blocked',
      label: backendAccessState.paymentRequired ? 'Payment pending' : getAppointmentStatusDisplayName(viewState.normalizedStatus),
      blockedReason:
        backendAccessState.joinBlockedReason ||
        'This video appointment is not ready to join yet.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

  if (!viewState.paymentCompleted && hasExplicitVideoPaymentRequirement(appointment)) {
    return {
      status,
      action: 'blocked',
      label: 'Payment pending',
      blockedReason: 'Payment is required before joining this video appointment.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

  if (!isWithinVideoJoinWindow(appointment)) {
    return {
      status,
      action: 'blocked',
      label: status === 'IN_PROGRESS' ? 'Resume Video Call' : 'Join Session',
      blockedReason:
        'Join opens 20 minutes before your visit and stays open for 5 hours after start.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      status,
      action: 'resume',
      label: 'Resume Video Call',
      blockedReason: null,
      shouldCallConsultationStart: false,
      canJoin: true,
    };
  }

  if (status === 'SCHEDULED' || status === 'CONFIRMED' || status === 'QUEUED') {
    return {
      status,
      action: 'join',
      label: 'Join Session',
      blockedReason: null,
      shouldCallConsultationStart: true,
      canJoin: true,
    };
  }

  return {
    status,
    action: 'blocked',
    label: getAppointmentStatusDisplayName(status),
    blockedReason:
      'Join opens 20 minutes before your visit and stays open for 5 hours after start.',
    shouldCallConsultationStart: false,
    canJoin: false,
  };
}

export function getAppointmentServiceMatch(
  appointment: any,
  appointmentServices: AppointmentServiceDefinition[] = []
): AppointmentServiceDefinition | null {
  const treatmentType = String(appointment?.treatmentType || '').trim().toUpperCase();
  if (!treatmentType) {
    return null;
  }

  return (
    appointmentServices.find((service) => String(service?.treatmentType || '').toUpperCase() === treatmentType) ||
    null
  );
}

export function getAppointmentServiceLabel(
  appointment: any,
  appointmentServices: AppointmentServiceDefinition[] = []
): string {
  const service = getAppointmentServiceMatch(appointment, appointmentServices);
  return (
    service?.label ||
    String(appointment?.treatmentType || '')
      .trim()
      .replace(/_/g, ' ') ||
    'Virtual Consultation'
  );
}

export function getVideoAppointmentFee(
  appointment: any,
  appointmentServices: AppointmentServiceDefinition[] = []
): number {
  const service = getAppointmentServiceMatch(appointment, appointmentServices);
  const candidateValues = [
    appointment?.invoice?.amount,
    appointment?.invoice?.totalAmount,
    appointment?.payment?.amount,
    appointment?.amount,
    appointment?.videoConsultationFee,
    appointment?.service?.videoConsultationFee,
    service?.videoConsultationFee,
  ];

  for (const value of candidateValues) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      return amount;
    }
  }

  return 0;
}

// Theme-aware status colors
export function getAppointmentStatusColor(status: string): string {
  // Normalize status to lowercase for comparison if needed, or match keys exactly
  // Assuming keys are uppercase from backend
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-primary/10 text-primary border-primary/20',
    CONFIRMED: 'bg-primary/10 text-primary border-primary/20',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    COMPLETED: 'bg-green-500/10 text-green-700 border-green-500/20', // Distinct green for completed
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
    NO_SHOW: 'bg-destructive/10 text-destructive border-destructive/20',
    EXPIRED: 'bg-muted/80 text-muted-foreground border-border',
  };
  
  // Handle lowercase variants just in case
  const normalizedStatus = normalizeAppointmentStatus(status);
  return statusColors[normalizedStatus] || 'bg-muted text-muted-foreground border-border';
}

export function formatAppointmentDateTime(date: string, time: string): string {
  const dateTime = getAppointmentDateTimeValue({ date, time });
  if (dateTime) {
    return formatDateTimeInIST(dateTime);
  }

  const formattedDate = formatAppointmentDate(date);
  const formattedTime = formatAppointmentTime(time);
  return `${formattedDate}${formattedTime ? ` ${formattedTime}` : ''}`.trim();
}

export function formatAppointmentDate(dateString: string): string {
  return formatDateInIST(
    dateString,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    },
    'en-IN'
  );
}

export function formatAppointmentTime(timeString: string): string {
  return formatTimeValueInIST(timeString, 'en-IN');
}

/**
 * Parse a receptionist appointment raw API object into a Date.
 *
 * The backend may return:
 *   - startTime: "HH:mm" (time-only) + appointmentDate: "YYYY-MM-DD" or full ISO
 *   - time: "HH:mm" (alias) + date/appointmentDate
 *   - startTime: full ISO string
 *   - date: "YYYY-MM-DD" + time: "HH:mm"
 *
 * Handles all variants without producing Invalid Date.
 */
export function parseReceptionistAppointmentDateTime(app: Record<string, unknown>): Date | null {
  const startTime = typeof app.startTime === 'string' ? app.startTime : '';
  const timeField = typeof app.time === 'string' ? app.time : '';
  const appointmentDate =
    typeof app.appointmentDate === 'string' ? app.appointmentDate : '';
  const date = typeof app.date === 'string' ? app.date : '';

  // Determine the effective time string (prefer startTime, fall back to time)
  const effectiveTime = startTime || timeField;

  // Case 1: time value is "HH:mm" (time-only) — combine with date field
  if (effectiveTime && !effectiveTime.includes('T')) {
    const datePart = formatISODateInIST(appointmentDate || date);
    const normalizedTime = normalizeTimeInputToTwentyFourHour(effectiveTime);
    if (!normalizedTime) {
      return null;
    }
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const d = new Date(`${datePart}T${normalizedTime}+05:30`);
      if (!Number.isNaN(d.getTime())) return d;
    }
    // time-only with no usable date context - use dummy date for time display
    const d = new Date(`2000-01-01T${normalizedTime}+05:30`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 2: startTime is a full ISO datetime
  if (startTime && startTime.includes('T')) {
    const d = new Date(startTime);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 3: appointmentDate is a full ISO datetime (may include time)
  if (appointmentDate) {
    const d = new Date(appointmentDate);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 4: date + time
  if (date) {
    const normalizedTime = timeField ? normalizeTimeInputToTwentyFourHour(timeField) : '00:00:00';
    if (!normalizedTime) {
      return null;
    }
    const d = new Date(`${date}T${normalizedTime}+05:30`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/** Formats any raw date/ISO string into a readable date label in IST. */
function formatRawDateLabel(raw: string, locale: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns a human-readable date label for a receptionist appointment row.
 * Falls back to 'TBD' if no valid date can be parsed.
 */
export function getReceptionistAppointmentDateLabel(
  app: Record<string, unknown>,
  locale = 'en-IN'
): string {
  const parsed = parseReceptionistAppointmentDateTime(app);
  const startTime = typeof app.startTime === 'string' ? app.startTime : '';
  const timeField = typeof app.time === 'string' ? app.time : '';
  const effectiveTime = startTime || timeField;
  const appointmentDate = typeof app.appointmentDate === 'string' ? app.appointmentDate : '';
  const date = typeof app.date === 'string' ? app.date : '';

  if (!parsed) {
    // Try to format the raw date string nicely
    const rawDate = appointmentDate || date;
    return rawDate ? formatRawDateLabel(rawDate, locale) : 'TBD';
  }

  // If time-only with no real date context (dummy 2000-01-01), return TBD for date
  const hasDateContext = Boolean(appointmentDate || date);
  const isTimeOnlyField =
    Boolean(effectiveTime) &&
    Boolean(normalizeTimeInputToTwentyFourHour(effectiveTime)) &&
    !effectiveTime.includes('T');
  if (isTimeOnlyField && !hasDateContext) {
    return 'TBD';
  }

  // If parsed from dummy date (2000-01-01), don't show that fake date
  if (parsed.getFullYear() === 2000 && parsed.getMonth() === 0 && parsed.getDate() === 1 && isTimeOnlyField) {
    return 'TBD';
  }

  return parsed.toLocaleDateString(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns a human-readable time label for a receptionist appointment row.
 * Falls back to 'TBD' if no valid time can be parsed.
 */
export function getReceptionistAppointmentTimeLabel(
  app: Record<string, unknown>,
  locale = 'en-IN'
): string {
  const parsed = parseReceptionistAppointmentDateTime(app);
  if (!parsed) {
    const startTime = typeof app.startTime === 'string' ? app.startTime : '';
    const time = typeof app.time === 'string' ? app.time : '';
    return formatTimeValueInIST(startTime || time, locale) || 'TBD';
  }
  return parsed.toLocaleTimeString(locale, {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
