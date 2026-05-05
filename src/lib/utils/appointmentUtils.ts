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
    case 'PROPOSED':
    case 'PENDING':
    case 'AWAITING_PAYMENT':
    case 'PENDING_PAYMENT':
    case 'AWAITING_SLOT_CONFIRMATION':
    case 'FOLLOW_UP_SCHEDULED':
    case 'RESCHEDULED':
    case 'WAITING':
      return 'SCHEDULED';
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
    return value
      .map(item => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }

  const record = asRecord(value);
  return record ? [record] : [];
}

function normalizeNameCandidate(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getPersonNameCandidates(person: any): string[] {
  const nestedUser = person?.user || {};
  const nestedProfile = person?.profile || {};

  return [
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
  ]
    .map(normalizeNameCandidate)
    .filter((value) => value && !/^unknown\s+(doctor|patient)$/i.test(value));
}

function getDoctorNameCandidates(appointment: any): string[] {
  return [
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
  ]
    .map(normalizeNameCandidate)
    .filter((value) => value && !/^unknown\s+doctor$/i.test(value));
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
  return [
    appointment?.paymentCompleted,
    appointment?.isPaid,
    appointment?.paid,
    appointment?.billing?.paymentCompleted,
    appointment?.billing?.isPaid,
    appointment?.billing?.paid,
    appointment?.invoice?.paymentCompleted,
    appointment?.invoice?.isPaid,
    appointment?.invoice?.paid,
  ].filter((value): value is boolean => typeof value === 'boolean');
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

  if (getPaymentCompletionFlags(appointment).some(Boolean)) {
    return true;
  }

  return getAppointmentPaymentStatus(appointment) === 'PAID';
}

function normalizeStatusToken(value: unknown): string {
  return normalizePaymentStatusValue(value);
}

export function getAppointmentPaymentStatus(appointment: any): string {
  if (getPaymentCompletionFlags(appointment).some(Boolean)) {
    return 'PAID';
  }

  const paymentCandidates = getPaymentCandidates(appointment);
  const paymentStatusCandidates = paymentCandidates.flatMap((payment) => [
    payment?.status,
    payment?.paymentStatus,
    payment?.state,
    payment?.payment_state,
    payment?.transactionStatus,
  ]).map(normalizeStatusToken).filter(Boolean);

  const directPaymentStatus = normalizeStatusToken(
    appointment?.paymentStatus ||
      appointment?.billing?.paymentStatus ||
      appointment?.billing?.status ||
      appointment?.invoice?.paymentStatus ||
      appointment?.invoice?.status ||
      ''
  );

  const allStatuses = [...paymentStatusCandidates, directPaymentStatus].filter(Boolean);

  if (allStatuses.some((status) => COMPLETED_PAYMENT_STATUSES.has(status) || status === 'PAID')) {
    return 'PAID';
  }

  if (allStatuses.some((status) => PENDING_PAYMENT_STATUSES.has(status) || status === 'PENDING')) {
    return 'PENDING';
  }

  const firstKnown = allStatuses.find(Boolean);
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

  if (normalizedStatus === 'NO_SHOW' && !isVideoNoShowEnforced()) {
    // Test-only bypass: treat video no-show as joinable when enforcement is disabled.
  } else if (!joinableStatuses.has(normalizedStatus)) {
    return false;
  }

  if (normalizedStatus !== 'IN_PROGRESS' && !viewState.hasConfirmedSlot) {
    return false;
  }

  return viewState.paymentCompleted;
}

export function getVideoAppointmentJoinBlockedReason(appointment: any): string {
  const viewState = getAppointmentViewState(appointment);
  const normalizedStatus = viewState.normalizedStatus.toUpperCase();

  if (viewState.awaitingDoctorSlotConfirmation) {
    return 'This video appointment is still waiting for doctor slot confirmation.';
  }

  if (['CANCELLED', 'COMPLETED'].includes(normalizedStatus)) {
    return 'This video appointment is no longer available.';
  }

  if (normalizedStatus === 'NO_SHOW' && isVideoNoShowEnforced()) {
    return 'This video appointment is no longer available.';
  }

  if (!viewState.paymentCompleted) {
    return 'Payment is required before joining this video appointment.';
  }

  if (normalizedStatus !== 'IN_PROGRESS' && !viewState.hasConfirmedSlot) {
    return 'This video appointment is waiting for slot confirmation.';
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

export function getAppointmentDoctorName(appointment: any): string {
  const candidates = getDoctorNameCandidates(appointment);
  const doctorName = candidates.find((value) => value && !/^doctor(?:\s+tbd)?$/i.test(value));
  return doctorName || candidates[0] || "Doctor assigned";
}

export function getAppointmentPatientName(appointment: any): string {
  const candidates = getPersonNameCandidates(appointment?.patient);
  const patientName = normalizeNameCandidate(appointment?.patientName || candidates[0] || "");
  return patientName || "Unknown Patient";
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
  const normalizedStatus = normalizeAppointmentStatus(appointment?.status);
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
  };
  return statusNames[normalizedStatus] || normalizedStatus;
}

export function isAwaitingDoctorSlotConfirmation(appointment: any): boolean {
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  if (type !== 'VIDEO_CALL') return false;
  if (!isVideoAppointmentPaymentCompleted(appointment)) return false;

  const hasProposedSlots =
    Array.isArray(appointment?.proposedSlots) && appointment.proposedSlots.length > 0;
  const confirmedSlotIndex = appointment?.confirmedSlotIndex;
  const hasConfirmedSlot =
    confirmedSlotIndex !== null &&
    confirmedSlotIndex !== undefined &&
    confirmedSlotIndex !== '' &&
    !Number.isNaN(Number(confirmedSlotIndex));

  const status = normalizeAppointmentStatus(appointment?.status);
  const paymentStatus = getAppointmentPaymentStatus(appointment);
  const paymentCompleted = paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS' || paymentStatus === 'PAID';

  return paymentCompleted && (status === 'SCHEDULED' || status === 'PENDING') && hasProposedSlots && !hasConfirmedSlot;
}

export function getAppointmentStatusBadgeLabel(appointment: any): string {
  const normalizedStatus = normalizeAppointmentStatus(appointment?.status);

  if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED' || normalizedStatus === 'NO_SHOW') {
    return getAppointmentStatusDisplayName(normalizedStatus);
  }

  if (isAwaitingDoctorSlotConfirmation(appointment)) {
    return 'Awaiting Doctor Review';
  }

  if (
    String(appointment?.type || appointment?.appointmentType || '').toUpperCase() === 'VIDEO_CALL' &&
    hasConfirmedSlot(appointment)
  ) {
    return 'Confirmed';
  }

  return getAppointmentStatusDisplayName(String(appointment?.status || ''));
}

export type AppointmentWorkflowState =
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
  awaitingDoctorSlotConfirmation: boolean;
  awaitingPayment: boolean;
  isVideo: boolean;
  isScheduledLike: boolean;
  hasProposedSlots: boolean;
  hasConfirmedSlot: boolean;
  displayStatusLabel: string;
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
  return ['CANCELLED', 'NO_SHOW'].includes(status);
}

function isActiveLike(status: string): boolean {
  return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
}

function hasProposedSlots(appointment: any): boolean {
  const proposedSlots = appointment?.proposedSlots ?? appointment?.proposed_slots;
  return Array.isArray(proposedSlots) && proposedSlots.length > 0;
}

function hasConfirmedSlot(appointment: any): boolean {
  const confirmedSlotIndex = appointment?.confirmedSlotIndex ?? appointment?.confirmed_slot_index;
  return (
    confirmedSlotIndex !== null &&
    confirmedSlotIndex !== undefined &&
    confirmedSlotIndex !== '' &&
    !Number.isNaN(Number(confirmedSlotIndex))
  );
}

export function getAppointmentViewState(appointment: any): AppointmentViewState {
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  const paymentStatus = getAppointmentPaymentStatus(appointment);
  const paymentCompleted = isVideoAppointmentPaymentCompleted(appointment);
  const proposedSlots = hasProposedSlots(appointment);
  const confirmedSlot = hasConfirmedSlot(appointment);
  const rawStatus = normalizeAppointmentStatus(appointment?.status);
  const status =
    type === 'VIDEO_CALL' &&
    confirmedSlot &&
    paymentCompleted &&
    (rawStatus === 'SCHEDULED' || rawStatus === 'PENDING' || rawStatus === 'AWAITING_SLOT_CONFIRMATION')
      ? 'CONFIRMED'
      : rawStatus;
  const awaitingDoctorSlotConfirmation =
    type === 'VIDEO_CALL' &&
    paymentCompleted &&
    (rawStatus === 'SCHEDULED' || rawStatus === 'PENDING') &&
    proposedSlots &&
    !confirmedSlot;
  const awaitingPayment = isAppointmentAwaitingPayment(appointment);
  const isVideo = type === 'VIDEO_CALL';
  const isScheduledLike = status === 'SCHEDULED' || status === 'CONFIRMED';
  const workflowState: AppointmentWorkflowState = awaitingDoctorSlotConfirmation
    ? 'awaiting_doctor_slot_confirmation'
    : status === 'IN_PROGRESS'
      ? 'in_progress'
      : status === 'COMPLETED'
        ? 'completed'
        : status === 'CANCELLED' || status === 'NO_SHOW'
          ? 'cancelled'
          : paymentCompleted && status === 'SCHEDULED' && isVideo
            ? 'awaiting_video_payment'
            : status === 'CONFIRMED'
              ? 'confirmed'
              : 'scheduled';
  const displayStatusLabel = awaitingDoctorSlotConfirmation
    ? 'Awaiting Doctor Review'
    : getAppointmentStatusBadgeLabel(appointment);
  const isDashboardVisibleStatus =
    isActiveLike(status) ||
    awaitingDoctorSlotConfirmation ||
    status === 'AWAITING_PAYMENT' ||
    status === 'PENDING_PAYMENT';

  return {
    type,
    status: rawStatus,
    normalizedStatus: status,
    workflowState,
    paymentStatus,
    paymentCompleted,
    awaitingDoctorSlotConfirmation,
    awaitingPayment,
    isVideo,
    isScheduledLike,
    hasProposedSlots: proposedSlots,
    hasConfirmedSlot: confirmedSlot,
    displayStatusLabel,
    showInDoctorWorkspace:
      !isCancelledLike(status) && isDashboardVisibleStatus,
    showInPatientWorkspace: !isCancelledLike(status) && (isActiveLike(status) || awaitingDoctorSlotConfirmation),
    showInReceptionWorkspace: !isCancelledLike(status) && isDashboardVisibleStatus,
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

export function isPaidVideoAppointmentAwaitingDoctorConfirmation(appointment: any): boolean {
  return getAppointmentViewState(appointment).awaitingDoctorSlotConfirmation;
}

export function getVideoSessionDecision(appointment: any): VideoSessionDecision {
  const viewState = getAppointmentViewState(appointment);
  const status = viewState.normalizedStatus.toUpperCase();

  if (viewState.awaitingDoctorSlotConfirmation) {
    return {
      status,
      action: 'blocked',
      label: 'Awaiting Doctor Review',
      blockedReason: 'This appointment is still waiting for doctor slot confirmation.',
      shouldCallConsultationStart: false,
      canJoin: false,
    };
  }

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

  if (!viewState.paymentCompleted) {
    return {
      status,
      action: 'blocked',
      label: 'Payment pending',
      blockedReason: 'Payment is required before joining this video appointment.',
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

  if (viewState.hasConfirmedSlot || status === 'SCHEDULED' || status === 'CONFIRMED' || status === 'QUEUED') {
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
    blockedReason: 'This video appointment is not ready to join yet.',
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
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
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

  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
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
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}
