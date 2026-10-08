import {
  canRescheduleInPersonAppointment,
  canRescheduleVideoAppointment,
  formatDateInIST,
  formatDoctorDisplayName,
  formatISODateInIST,
  formatTimeInIST,
  getAppointmentDateTimeValue,
  getAppointmentLocationName,
  getAppointmentViewState,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  getVideoSessionDecision,
  isTerminalAppointment,
  normalizePatientAppointment,
  shouldShowAppointmentOnPatientDashboard,
  toTitleCase,
} from "@/lib/utils/appointmentUtils";
import type { HealthLibraryListFilters, HealthLibraryPost } from "@/lib/actions/health-library.server";
import type { HomeLibraryItem, HomeLibraryTab, HomeVisit } from "./types";

/**
 * Turns API rows into the Home view models (`types.ts`). Pure functions: the page container
 * calls them with live data, the preview calls them with fixtures.
 */

// ---------------------------------------------------------------------------
// Reading loosely typed API rows
// ---------------------------------------------------------------------------

export type Row = Record<string, unknown>;

export function asRow(value: unknown): Row | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : undefined;
}

export function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function firstText(...values: unknown[]): string {
  for (const value of values) {
    const found = text(value);
    if (found) return found;
  }
  return "";
}

export function positiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// ---------------------------------------------------------------------------
// Appointment → Home visit
// ---------------------------------------------------------------------------

const ACTIVE_UPCOMING_STATUSES = new Set(["SCHEDULED", "CONFIRMED", "PENDING", "QUEUED"]);
const CLOSED_STATUSES = ["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"];

function isVideoVisit(appointment: Row): boolean {
  return normalizePatientAppointment(appointment).isOnline || getAppointmentViewState(appointment).isVideo;
}

/** An in-clinic visit the patient has already checked in for. The queue is for these only. */
export function isCheckedInClinicVisit(appointment: Row): boolean {
  if (isVideoVisit(appointment) || isTerminalAppointment(appointment)) return false;
  const rawStatus = text(appointment.status).toUpperCase().replace(/[\s-]+/g, "_");
  return Boolean(appointment.checkedInAt) || rawStatus === "CHECKED_IN" || rawStatus === "QUEUED";
}

function statusPriority(appointment: Row): number {
  const status = getAppointmentViewState(appointment).normalizedStatus.toUpperCase();
  if (status === "IN_PROGRESS") return 0;
  if (status === "QUEUED" || isCheckedInClinicVisit(appointment)) return 1;
  if (status === "CONFIRMED") return 2;
  if (status === "SCHEDULED") return 3;
  if (status === "PENDING") return 4;
  return 5;
}

/**
 * The visits the Home workspace shows: open (not cancelled, completed, missed or expired),
 * de-duplicated, most urgent first and soonest first within a status.
 */
export function selectUpcomingAppointments(appointments: Row[]): Row[] {
  const uniqueAppointments = Array.from(
    new Map(
      appointments.map((appointment) => {
        const normalized = normalizePatientAppointment(appointment);
        const dedupeKey =
          text(appointment.id) ||
          `${normalized.doctorName || "doctor"}-${normalized.normalizedDate || "date"}-${normalized.normalizedTime || "time"}-${normalized.locationName || "location"}`;
        return [dedupeKey, appointment] as const;
      })
    ).values()
  );

  const workspaceAppointments = uniqueAppointments.filter((appointment) => {
    const status = getAppointmentViewState(appointment).normalizedStatus.toUpperCase();
    return (
      !CLOSED_STATUSES.includes(status) &&
      (shouldShowAppointmentOnPatientDashboard(appointment) || isCheckedInClinicVisit(appointment))
    );
  });

  return workspaceAppointments
    .filter((appointment) => {
      const viewState = getAppointmentViewState(appointment);
      if (viewState.normalizedStatus.toUpperCase() === "IN_PROGRESS") return true;
      const status = isTerminalAppointment(appointment)
        ? viewState.normalizedStatus
        : viewState.isVideo && !viewState.paymentCompleted
          ? "SCHEDULED"
          : viewState.normalizedStatus;
      return (
        ACTIVE_UPCOMING_STATUSES.has(status) ||
        isCheckedInClinicVisit(appointment) ||
        normalizePatientAppointment(appointment).dateTime === null
      );
    })
    .sort((first, second) => {
      const byStatus = statusPriority(first) - statusPriority(second);
      if (byStatus !== 0) return byStatus;
      const firstTime = normalizePatientAppointment(first).dateTime;
      const secondTime = normalizePatientAppointment(second).dateTime;
      if (!firstTime && !secondTime) return 0;
      if (!firstTime) return 1;
      if (!secondTime) return -1;
      return firstTime.getTime() - secondTime.getTime();
    });
}

/** The checked-in visit that is still waiting (not yet with the doctor), if there is one. */
export function findQueueAppointment(upcoming: Row[]): Row | null {
  return (
    upcoming.find(
      (appointment) =>
        isCheckedInClinicVisit(appointment) &&
        getAppointmentViewState(appointment).normalizedStatus.toUpperCase() !== "IN_PROGRESS"
    ) ?? null
  );
}

function doctorDetail(appointment: Row): string | undefined {
  const doctor = asRow(appointment.doctor);
  if (!doctor) return undefined;
  const rawQualification = doctor.qualification ?? doctor.qualifications ?? doctor.degree;
  const qualification = Array.isArray(rawQualification)
    ? rawQualification.map(text).filter(Boolean).join(", ")
    : text(rawQualification);
  const years = positiveNumber(doctor.experience ?? doctor.yearsOfExperience);
  return [qualification, years ? `${years}+ years` : ""].filter(Boolean).join(" · ") || undefined;
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

function clinicContact(appointment: Row): Pick<HomeVisit, "locationLabel" | "clinicPhone" | "directionsUrl"> {
  const location = asRow(appointment.location);
  const clinic = asRow(appointment.clinic);
  const name = getAppointmentLocationName(appointment);
  const hasName = Boolean(name) && name !== "Location TBD";
  const address = firstText(location?.address, clinic?.address);
  const phone = firstText(location?.phone, location?.phoneNumber, clinic?.phone, clinic?.phoneNumber, clinic?.contactNumber);
  const latitude = Number(location?.latitude ?? clinic?.latitude);
  const longitude = Number(location?.longitude ?? clinic?.longitude);
  const hasPoint =
    Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
  const place = [hasName ? name : "", address && address !== name ? address : ""].filter(Boolean).join(", ");

  return {
    ...(hasName ? { locationLabel: name } : {}),
    ...(phone ? { clinicPhone: phone.replace(/[^\d+]/g, "") } : {}),
    ...(hasPoint
      ? { directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` }
      : place
        ? { directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` }
        : {}),
  };
}

export function toHomeVisit(appointment: Row, now: number): HomeVisit {
  const normalized = normalizePatientAppointment(appointment);
  const viewState = getAppointmentViewState(appointment);
  const isVideo = isVideoVisit(appointment);
  const dateTime = getAppointmentDateTimeValue(appointment);
  const dateLabel = dateTime
    ? formatDateInIST(dateTime, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : getReceptionistAppointmentDateLabel(appointment);
  const timeLabel = (
    dateTime
      ? formatTimeInIST(dateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
      : getReceptionistAppointmentTimeLabel(appointment)
  ).replace(/\b(am|pm)\b/i, (meridiem) => meridiem.toUpperCase());

  // Paid, and the join decision says yes: a confirmed visit inside its join window, or one the
  // doctor has already started (the patient can rejoin until the doctor completes it).
  const decision = isVideo ? getVideoSessionDecision(appointment) : null;
  const canJoin = Boolean(isVideo && viewState.paymentCompleted && decision?.canJoin);

  const treatment = text(appointment.treatmentType).replace(/_/g, " ");
  const metadata = asRow(appointment.metadata);
  const token = firstText(appointment.tokenNumber, metadata?.tokenNumber);

  return {
    id: text(appointment.id),
    kind: isVideo ? "video" : "clinic",
    doctorName: formatDoctorDisplayName(normalized.doctorName),
    doctorPhotoUrl: doctorPhoto(appointment),
    visitLabel: treatment ? toTitleCase(treatment) : isVideo ? "Video consultation" : "Clinic visit",
    doctorDetail: doctorDetail(appointment),
    dateLabel: dateLabel || "Date to be confirmed",
    timeLabel: timeLabel || "",
    startsAt: dateTime ? dateTime.toISOString() : null,
    isToday: dateTime ? formatISODateInIST(dateTime) === formatISODateInIST(new Date(now)) : false,
    statusCode: isTerminalAppointment(appointment)
      ? viewState.normalizedStatus
      : viewState.isVideo && !viewState.paymentCompleted
        ? "SCHEDULED"
        : normalized.status || "SCHEDULED",
    statusLabel: viewState.displayStatusLabel,
    confirmationExpiresAt: viewState.confirmationExpiresAt,
    confirmationWindowMinutes: viewState.confirmationWindowMinutes,
    canJoin,
    joinAction: canJoin ? (decision?.action === "resume" ? "resume" : "join") : null,
    joinBlockedReason: canJoin ? null : (decision?.blockedReason ?? null),
    awaitingPayment: isVideo && viewState.awaitingPayment,
    // A patient can never cancel a video visit; moving a visit follows the shared reschedule rule.
    canReschedule: isVideo
      ? canRescheduleVideoAppointment(appointment, new Date(now))
      : !isTerminalAppointment(appointment) && canRescheduleInPersonAppointment(appointment),
    clinicStage: isVideo
      ? "upcoming"
      : viewState.normalizedStatus.toUpperCase() === "IN_PROGRESS"
        ? "in_progress"
        : isCheckedInClinicVisit(appointment)
          ? "queue"
          : "upcoming",
    ...(isVideo ? {} : clinicContact(appointment)),
    ...(token ? { tokenLabel: token } : {}),
  };
}

// ---------------------------------------------------------------------------
// Health library
// ---------------------------------------------------------------------------

export const LIBRARY_STRIP_SIZE = 3;

/** How each tab of the strip maps to the `GET health-library` filters. */
export const LIBRARY_FILTERS: Record<HomeLibraryTab, HealthLibraryListFilters> = {
  articles: { tab: "ARTICLES", limit: LIBRARY_STRIP_SIZE },
  videos: { mediaType: "VIDEO", limit: LIBRARY_STRIP_SIZE },
  guides: { tab: "GUIDES", limit: LIBRARY_STRIP_SIZE },
  courses: { tab: "COURSES", limit: LIBRARY_STRIP_SIZE },
};

export function toLibraryItem(post: HealthLibraryPost): HomeLibraryItem {
  const isVideo = post.mediaType === "VIDEO";
  const minutes =
    typeof post.videoDurationSeconds === "number" && post.videoDurationSeconds > 0
      ? `${Math.max(1, Math.round(post.videoDurationSeconds / 60))} min video`
      : "";
  return {
    id: post.id,
    title: post.title,
    meta: [post.category, post.readTime || minutes].filter(Boolean).join(" · "),
    coverImageUrl: post.coverImageUrl,
    isVideo,
  };
}
