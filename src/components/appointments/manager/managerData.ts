import { statusLabel, statusTone, type PillTone } from "@/components/tbd";
import { asRow, firstText, isCheckedInClinicVisit, text, type Row } from "@/components/patient/home/homeData";
import {
  APPOINTMENT_MAX_RESCHEDULES,
  canCancelAppointment,
  canCancelVideoAppointment,
  canRescheduleInPersonAppointment,
  canRescheduleVideoAppointment,
  formatDateInIST,
  formatDoctorDisplayName,
  formatISODateInIST,
  formatTimeInIST,
  formatTimeValueInIST,
  getAppointmentDateTimeValue,
  getAppointmentLocationName,
  getAppointmentPatientName,
  getAppointmentRescheduleCount,
  getAppointmentViewState,
  getDisplayAppointmentDuration,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  getVideoSessionDecision,
  isAppointmentTimeSlotExpired,
  isTerminalAppointment,
  normalizeAppointmentStatus,
  normalizePatientAppointment,
  toTitleCase,
  wasCancelledDueToPaymentFailure,
  wasExpiredDueToPaymentFailure,
} from "@/lib/utils/appointmentUtils";
import type {
  ManagerClinicStage,
  ManagerDateRange,
  ManagerStats,
  ManagerStatusFilter,
  ManagerTab,
  ManagerVisit,
} from "./types";

/**
 * Turns API rows into the appointments-list view models (`types.ts`). Pure functions: the
 * container calls them with live data, the preview calls them with fixtures.
 */

export type { Row };

export const UPCOMING_PAGE_SIZE = 6;
export const TABLE_PAGE_SIZE = 8;
/** How many past visits the Upcoming tab shows under the cards. */
export const PAST_PREVIEW_SIZE = 3;

/** The status chips each tab offers. The Past tab holds completed visits only. */
export const STATUS_OPTIONS_BY_TAB: Record<ManagerTab, Array<{ value: ManagerStatusFilter; label: string }>> = {
  upcoming: [
    { value: "ALL", label: "All" },
    { value: "SCHEDULED", label: statusLabel("SCHEDULED") },
    { value: "CONFIRMED", label: statusLabel("CONFIRMED") },
    { value: "IN_PROGRESS", label: statusLabel("IN_PROGRESS") },
  ],
  past: [],
  cancelled: [
    { value: "ALL", label: "All" },
    { value: "CANCELLED", label: statusLabel("CANCELLED") },
    { value: "NO_SHOW", label: statusLabel("NO_SHOW") },
    { value: "EXPIRED", label: statusLabel("EXPIRED") },
  ],
};

export function getEffectiveAppointmentId(appointment: unknown): string {
  const row = asRow(appointment);
  return firstText(row?.appointmentId, row?.id);
}

/** The list inside any of the shapes the appointment hooks and server actions return. */
export function extractAppointmentList(rawData: unknown): Row[] {
  const data = asRow(rawData);
  const inner = asRow(data?.data);
  const list = Array.isArray(rawData)
    ? rawData
    : Array.isArray(inner?.appointments)
      ? inner.appointments
      : Array.isArray(data?.appointments)
        ? data.appointments
        : Array.isArray(data?.data)
          ? data.data
          : [];
  return list.filter((item): item is Row => Boolean(asRow(item)));
}

function personName(value: unknown): string {
  const person = asRow(value);
  return firstText(person?.fullName, person?.name);
}

/**
 * Removes rows that describe the same visit (same doctor, patient, date, time and place).
 * Payment retries and webhook replays can return one logical slot more than once; the first
 * row wins.
 */
export function dedupeAppointments(list: Row[]): Row[] {
  if (list.length === 0) return list;
  const seen = new Map<string, Row>();
  for (const appointment of list) {
    const doctor = firstText(personName(appointment.doctor), appointment.doctorLabel, appointment.doctorName) || "doctor";
    const patient = firstText(personName(appointment.patient), appointment.patientLabel, appointment.patientName) || "patient";
    const date = firstText(appointment.date, appointment.scheduledDate, appointment.appointmentDate);
    const time = firstText(appointment.time, appointment.startTime, appointment.scheduledStartTime, appointment.slot);
    const location =
      firstText(asRow(appointment.location)?.name, appointment.locationLabel, appointment.locationName) || "location";
    const key = `${doctor}|${patient}|${date}|${time}|${location}`;
    if (!seen.has(key)) seen.set(key, appointment);
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Appointment → list visit
// ---------------------------------------------------------------------------

export interface ManagerVisitOptions {
  now: number;
  viewerRole?: string | null | undefined;
  /** Staff lists (reception, clinic) lead with the patient's name. */
  staffView: boolean;
}

function normalizeRole(role?: string | null): string {
  return String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/** The viewer is the patient. With no role yet, a personal list is treated as the patient's. */
export function isPatientViewer(viewerRole: string | null | undefined, staffView: boolean): boolean {
  const role = normalizeRole(viewerRole);
  return role ? role === "PATIENT" : !staffView;
}

function upperMeridiem(value: string): string {
  return value.replace(/\b(am|pm)\b/i, (meridiem) => meridiem.toUpperCase());
}

function doctorPhoto(appointment: Row): string | undefined {
  const doctor = asRow(appointment.doctor);
  const doctorUser = asRow(doctor?.user);
  const url = firstText(
    doctor?.profilePicture,
    doctor?.avatar,
    doctor?.photoUrl,
    doctorUser?.profilePicture,
    doctorUser?.avatar,
  );
  return /^(https?:)?\/\//.test(url) || url.startsWith("/") ? url : undefined;
}

function directionsUrl(appointment: Row): string | undefined {
  const location = asRow(appointment.location);
  const clinic = asRow(appointment.clinic);
  const name = getAppointmentLocationName(appointment);
  const hasName = Boolean(name) && name !== "Location TBD";
  const address = firstText(location?.address, clinic?.address);
  const latitude = Number(location?.latitude ?? clinic?.latitude);
  const longitude = Number(location?.longitude ?? clinic?.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  const place = [hasName ? name : "", address && address !== name ? address : ""].filter(Boolean).join(", ");
  return place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : undefined;
}

function proposedSlotLabels(appointment: Row): string[] {
  if (!Array.isArray(appointment.proposedSlots)) return [];
  return appointment.proposedSlots
    .map((slot) => {
      const row = asRow(slot);
      const date = text(row?.date);
      const time = text(row?.time);
      if (!date) return "";
      const parsed = new Date(`${date.slice(0, 10)}T00:00:00+05:30`);
      const dateLabel = Number.isNaN(parsed.getTime())
        ? date
        : formatDateInIST(parsed, { weekday: "short", day: "numeric", month: "short" });
      const timeLabel = time ? upperMeridiem(formatTimeValueInIST(time) || time) : "";
      return [dateLabel, timeLabel].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
}

function isAwaitingSlot(appointment: Row, isVideo: boolean): boolean {
  if (!isVideo) return false;
  if (normalizeAppointmentStatus(appointment.status) === "AWAITING_SLOT_CONFIRMATION") return true;
  const hasProposedSlots = Array.isArray(appointment.proposedSlots) && appointment.proposedSlots.length > 0;
  const confirmed = appointment.confirmedSlotIndex;
  const hasConfirmedSlot = confirmed !== null && confirmed !== undefined && !Number.isNaN(Number(confirmed));
  return hasProposedSlots && !hasConfirmedSlot;
}

function closedNote(appointment: Row, status: string, isVideo: boolean, paymentFailure: boolean, slotPassed: boolean): string | null {
  if (status === "COMPLETED") return null;
  if (status === "EXPIRED") {
    return wasExpiredDueToPaymentFailure(appointment)
      ? "Payment was not completed in time."
      : "The visit time passed.";
  }
  if (status === "NO_SHOW") return "This visit was missed.";
  if (paymentFailure) {
    if (slotPassed) return "Payment was not completed and the visit time has passed.";
    return isVideo ? "Payment was not completed. You can still pay before the visit time." : "Payment was not completed.";
  }
  return "This visit was cancelled.";
}

export function toManagerVisit(appointment: Row, options: ManagerVisitOptions): ManagerVisit {
  const { now, viewerRole, staffView } = options;
  const viewerIsPatient = isPatientViewer(viewerRole, staffView);
  const normalized = normalizePatientAppointment(appointment);
  const viewState = getAppointmentViewState(appointment);
  const isVideo = normalized.isOnline || viewState.isVideo;
  const terminal = isTerminalAppointment(appointment);
  const status = viewState.normalizedStatus.toUpperCase();
  const id = getEffectiveAppointmentId(appointment);

  // ── when ──
  const dateTime = getAppointmentDateTimeValue(appointment);
  const isToday = dateTime ? formatISODateInIST(dateTime) === formatISODateInIST(new Date(now)) : false;
  const sameYear = dateTime ? formatISODateInIST(dateTime).slice(0, 4) === formatISODateInIST(new Date(now)).slice(0, 4) : true;
  const fallbackDate = getReceptionistAppointmentDateLabel(appointment);
  const dayLabel = dateTime
    ? isToday
      ? "Today"
      : formatDateInIST(dateTime, {
          weekday: "short",
          day: "numeric",
          month: "short",
          ...(sameYear ? {} : { year: "numeric" as const }),
        })
    : fallbackDate && fallbackDate !== "TBD"
      ? fallbackDate
      : "Date to be confirmed";
  const rawTime = dateTime
    ? formatTimeInIST(dateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
    : getReceptionistAppointmentTimeLabel(appointment);
  const timeLabel = rawTime && rawTime !== "TBD" ? upperMeridiem(rawTime) : "";
  const dateLabel = dateTime
    ? formatDateInIST(dateTime, { day: "numeric", month: "short", year: "numeric" })
    : dayLabel;

  // ── who ──
  const doctorName = formatDoctorDisplayName(firstText(appointment.doctorLabel) || normalized.doctorName);
  const patientName = toTitleCase(firstText(appointment.patientLabel) || getAppointmentPatientName(appointment));
  const hasPatientName = Boolean(patientName) && patientName !== "Unknown Patient";
  const treatment = text(appointment.treatmentType).replace(/_/g, " ");
  const visitLabel = treatment ? toTitleCase(treatment) : isVideo ? "Video consultation" : "Clinic visit";
  const duration = getDisplayAppointmentDuration(appointment);
  const specialization = text(asRow(appointment.doctor)?.specialization);
  const locationName = firstText(appointment.locationLabel) || normalized.locationName;
  const hasLocation = Boolean(locationName) && locationName !== "Location TBD" && locationName !== doctorName;
  const subtitle = staffView
    ? [`with ${doctorName}`, visitLabel].join(" · ")
    : [specialization, visitLabel].filter(Boolean).join(" · ");

  // ── state ──
  const unpaid = isVideo && !viewState.paymentCompleted && !terminal;
  const awaitingSlot = !terminal && !unpaid && isAwaitingSlot(appointment, isVideo);
  const checkedIn = !isVideo && isCheckedInClinicVisit(appointment);
  const clinicStage: ManagerClinicStage = isVideo
    ? "upcoming"
    : status === "IN_PROGRESS"
      ? "in_progress"
      : checkedIn
        ? "queue"
        : "upcoming";
  const tab: ManagerTab = !terminal ? "upcoming" : status === "COMPLETED" ? "past" : "cancelled";

  const statusCode = terminal
    ? status
    : unpaid
      ? "PAYMENT_PENDING"
      : awaitingSlot
        ? "AWAITING_SLOT_CONFIRMATION"
        : clinicStage === "queue"
          ? "CHECKED_IN"
          : status || "SCHEDULED";
  const checkInOpen =
    viewerIsPatient && !isVideo && !terminal && clinicStage === "upcoming" && isToday;
  const tone: PillTone = checkInOpen ? "amber" : statusTone(statusCode);
  const label = checkInOpen ? "Check-in open" : statusLabel(statusCode);
  const filterStatus = unpaid ? "SCHEDULED" : normalizeAppointmentStatus(status);

  // ── video ──
  const showJoin = isVideo && !terminal && !unpaid && !awaitingSlot;
  const decision = showJoin ? getVideoSessionDecision(appointment) : null;
  const canJoin = Boolean(showJoin && viewState.paymentCompleted && decision?.canJoin);

  // ── moving and cancelling ──
  // A visit can be moved APPOINTMENT_MAX_RESCHEDULES times; the backend counts every type.
  // Video: only while confirmed. In-person: any state but done, cancelled, no-show, expired or in progress.
  const movesUsed = getAppointmentRescheduleCount(appointment);
  const canReschedule =
    !terminal &&
    !unpaid &&
    (isVideo
      ? canRescheduleVideoAppointment(appointment, new Date(now))
      : canRescheduleInPersonAppointment(appointment));
  const changesLeft = Math.max(0, APPOINTMENT_MAX_RESCHEDULES - movesUsed);
  // A patient can never cancel a video visit; nobody cancels a paid one.
  const canCancel =
    !terminal && (isVideo ? canCancelVideoAppointment(appointment, viewerIsPatient) : canCancelAppointment(status));

  // ── closed visits ──
  const paymentFailure = status === "CANCELLED" && wasCancelledDueToPaymentFailure(appointment);
  const slotPassed = isAppointmentTimeSlotExpired(appointment);
  const canRetryPayment = paymentFailure && isVideo && !slotPassed;
  // An expired visit has no actions.
  const canBookAgain = (status === "CANCELLED" || status === "NO_SHOW") && terminal && !canRetryPayment;
  // Booking saves the reason for the visit in `notes`.
  const reason = firstText(appointment.chiefComplaint, appointment.notes).split("\n")[0] ?? "";
  const summaryHref =
    tab === "past" && viewerIsPatient && id
      ? isVideo
        ? `/meet/${encodeURIComponent(id)}/summary`
        : "/patient/health"
      : null;

  const directions = isVideo ? undefined : directionsUrl(appointment);
  const photo = staffView ? undefined : doctorPhoto(appointment);

  return {
    id,
    kind: isVideo ? "video" : "clinic",
    tab,
    title: staffView && hasPatientName ? patientName : doctorName,
    subtitle,
    doctorName,
    avatarName: staffView && hasPatientName ? patientName : doctorName,
    ...(photo ? { photoUrl: photo } : {}),
    visitTitle: tab === "past" && reason ? reason : visitLabel,
    whenLabel: [dayLabel, timeLabel, !terminal && isVideo && duration ? `${duration} min` : ""].filter(Boolean).join(" · "),
    dateLabel,
    typeLabel: isVideo ? "Video" : hasLocation ? `In-Clinic · ${locationName}` : "In-Clinic",
    startsAt: dateTime ? dateTime.toISOString() : null,
    startsAtMs: dateTime ? dateTime.getTime() : null,
    statusTone: tone,
    statusLabel: label,
    statusDot: checkInOpen,
    filterStatus,
    searchText: [
      doctorName,
      hasPatientName ? patientName : "",
      hasLocation ? locationName : "",
      label,
      filterStatus,
      paymentFailure ? "payment failed" : "",
    ]
      .join(" ")
      .toLowerCase(),
    canJoin,
    joinAction: canJoin ? (decision?.action === "resume" ? "resume" : "join") : null,
    joinBlockedReason: canJoin ? null : (decision?.blockedReason ?? null),
    showJoin,
    awaitingPayment: unpaid,
    paymentExpiresAt: unpaid ? viewState.paymentExpiresAt : null,
    paymentWindowMinutes: viewState.paymentWindowMinutes,
    awaitingSlot,
    proposedSlots: awaitingSlot ? proposedSlotLabels(appointment) : [],
    // Only the doctor answers proposed times (the backend allows nobody else).
    canDeclineSlots: awaitingSlot && normalizeRole(viewerRole) === "DOCTOR",
    confirmationExpiresAt: viewState.confirmationExpiresAt,
    confirmationWindowMinutes: viewState.confirmationWindowMinutes,
    canReschedule,
    rescheduleHint: canReschedule
      ? `${changesLeft} of ${APPOINTMENT_MAX_RESCHEDULES} changes left`
      : null,
    canCancel,
    clinicStage,
    ...(directions ? { directionsUrl: directions } : {}),
    canCheckIn: checkInOpen,
    canTrackQueue: viewerIsPatient && clinicStage === "queue",
    closedNote: terminal ? closedNote(appointment, status, isVideo, paymentFailure, slotPassed) : null,
    canBookAgain,
    canRetryPayment,
    summaryHref,
    summaryLabel: isVideo ? "Summary" : "Records",
  };
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

/** Upcoming: a visit in progress first, then the soonest. Past and cancelled: the latest first. */
export function sortVisits(visits: ManagerVisit[], tab: ManagerTab): ManagerVisit[] {
  const list = visits.filter((visit) => visit.tab === tab);
  if (tab === "upcoming") {
    return list.sort((first, second) => {
      const firstLive = first.filterStatus === "IN_PROGRESS" ? 0 : 1;
      const secondLive = second.filterStatus === "IN_PROGRESS" ? 0 : 1;
      if (firstLive !== secondLive) return firstLive - secondLive;
      if (first.startsAtMs === null && second.startsAtMs === null) return 0;
      if (first.startsAtMs === null) return 1;
      if (second.startsAtMs === null) return -1;
      return first.startsAtMs - second.startsAtMs;
    });
  }
  return list.sort((first, second) => (second.startsAtMs ?? 0) - (first.startsAtMs ?? 0));
}

function dayStart(value: string, endOfDay: boolean): number | null {
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

/** Search text and date range. A visit with no date never matches a date range. */
export function filterVisits(visits: ManagerVisit[], search: string, range: ManagerDateRange): ManagerVisit[] {
  const query = search.trim().toLowerCase();
  const from = dayStart(range.start, false);
  const to = dayStart(range.end, true);
  if (!query && from === null && to === null) return visits;
  return visits.filter((visit) => {
    if (query && !visit.searchText.includes(query)) return false;
    if (from !== null && (visit.startsAtMs === null || visit.startsAtMs < from)) return false;
    if (to !== null && (visit.startsAtMs === null || visit.startsAtMs > to)) return false;
    return true;
  });
}

export function filterByStatus(visits: ManagerVisit[], status: ManagerStatusFilter): ManagerVisit[] {
  return status === "ALL" ? visits : visits.filter((visit) => visit.filterStatus === status);
}

export function countStats(visits: ManagerVisit[]): ManagerStats {
  return {
    total: visits.length,
    upcoming: visits.filter((visit) => visit.filterStatus === "SCHEDULED" || visit.filterStatus === "CONFIRMED").length,
    inProgress: visits.filter((visit) => visit.filterStatus === "IN_PROGRESS").length,
    completed: visits.filter((visit) => visit.filterStatus === "COMPLETED").length,
  };
}
