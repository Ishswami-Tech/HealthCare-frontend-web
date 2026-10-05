import type { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment.types";
import type { CanonicalQueueEntry } from "@/types/queue.types";
import { resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";
import {
  formatDateInIST,
  getAppointmentDateTimeValue,
  getAppointmentPaymentDisplayState,
  getAppointmentPatientName,
  getDisplayAppointmentDuration,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  VIDEO_JOIN_EARLY_WINDOW_MINUTES,
  VIDEO_JOIN_LATE_WINDOW_MINUTES,
} from "@/lib/utils/appointmentUtils";
import { resolveDisplayNameAndInitials } from "@/lib/utils/display-name";

export interface TransformedAppointment {
  id: string;
  patientName: string;
  dateLabel: string;
  timeLabel: string;
  time: string;
  scheduleState: "PAST" | "TODAY" | "UPCOMING";
  status: string;
  statusEnum: AppointmentStatus;
  type: string;
  duration: string;
  notes: string;
  isVideo: boolean;
  priority: string;
  patientId: string;
  doctorId: string;
  paymentStatus: string;
  paymentCompleted: boolean;
  paymentPending: boolean;
  checkedInAt: string | null;
  /** Scheduled start as a timestamp; null when the date or time is missing. */
  startAtMs: number | null;
  /** When the consultation was started; null until the doctor starts it. */
  startedAt: string | null;
  /** "38 years · Female" — only the parts the record has. */
  patientMeta: string;
  /** Why the patient is visiting, as written at booking. */
  reason: string;
  /** True when this visit's medicines were sent to the pharmacy. */
  sentToPharmacy: boolean;
}

export type DoctorAppointmentFilter = "ALL" | "CONFIRMED" | "COMPLETED";

/** What a row of "Today's Appointments" lets the doctor do. */
export type DoctorTodayRowAction = "START" | "START_LOCKED" | "JOIN" | "PRESCRIBE" | "COMPLETE" | "NONE";

export interface DoctorTodayRow {
  appointment: TransformedAppointment;
  /** Second line under the time: check-in, join or completion state. */
  hint: { text: string; tone: "ok" | "muted" } | null;
  action: DoctorTodayRowAction;
}

/** The join state of a video visit, from `getVideoSessionDecision` on the full appointment. */
export interface DoctorVideoJoinState {
  canJoin: boolean;
  /** True when the visit is blocked because payment is not confirmed. */
  paymentPending: boolean;
}

/** The patient the "Next patient" card shows, and the one thing the doctor can do. */
export interface DoctorNextPatient {
  appointment: TransformedAppointment;
  action: "START" | "JOIN" | "WAIT_CHECK_IN" | "WAIT_JOIN";
  hint: string;
}

/** What was really saved when a visit was completed. Shown as the confirmation strip. */
export interface CompletedVisitSummary {
  appointmentId: string;
  patientName: string;
  completedAtMs: number;
  /** Medicines saved to the pharmacy prescription. 0 when the visit had no medicine. */
  pharmacyMedicineCount: number;
  /** Medicines written in the notes only (not in pharmacy stock). */
  outsideMedicineCount: number;
  prescriptionNumber: string | null;
  followUpDate: string | null;
}

/** One line of the right-rail Live Queue. */
export interface DoctorQueueLine {
  key: string;
  position: number;
  patientName: string;
  label: string;
  status: "IN_PROGRESS" | "CHECKED_IN" | "QUEUED";
  /** Minutes of waiting, when the queue reports them. */
  waitMinutes: number | null;
}

export interface PrescriptionModalState {
  isOpen: boolean;
  activePatient: { id: string; name: string } | null;
  activeAppointmentId: string | null;
  skipMedicineSelected: boolean;
}

export type DoctorDashboardState = {
  searchTerm: string;
  consultSummary: string;
  prescriptionModal: PrescriptionModalState;
  consultTick: number;
  consultStartOverrides: Record<string, string>;
  activeDoctorQueueLane: string;
  appointmentFilter: DoctorAppointmentFilter;
  lastCompletedVisit: CompletedVisitSummary | null;
};

export type DoctorDashboardAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setConsultSummary"; value: string }
  | { type: "setPrescriptionModal"; value: PrescriptionModalState }
  | {
      type: "updatePrescriptionModal";
      value: Partial<PrescriptionModalState> | ((current: PrescriptionModalState) => PrescriptionModalState);
    }
  | { type: "setConsultTick"; value: number }
  | {
      type: "setConsultStartOverrides";
      value: Record<string, string> | ((current: Record<string, string>) => Record<string, string>);
    }
  | { type: "setActiveDoctorQueueLane"; value: string }
  | { type: "setAppointmentFilter"; value: DoctorAppointmentFilter }
  | { type: "setLastCompletedVisit"; value: CompletedVisitSummary | null };

export interface DoctorDashboardStats {
  todayAppointments: number;
  confirmedToday: number;
  inPersonToday: number;
  liveQueueCount: number;
  checkedInPatients: number;
  completedToday: number;
  totalPatients: number;
  nextAppointment: TransformedAppointment | null;
}

export interface DoctorQueueSection {
  key: string;
  title: string;
  items: CanonicalQueueEntry[];
}

export const initialDoctorDashboardState: DoctorDashboardState = {
  searchTerm: "",
  consultSummary: "",
  prescriptionModal: {
    isOpen: false,
    activePatient: null,
    activeAppointmentId: null,
    skipMedicineSelected: false,
  },
  consultTick: Date.now(),
  consultStartOverrides: {},
  activeDoctorQueueLane: "",
  appointmentFilter: "ALL",
  lastCompletedVisit: null,
};

export function doctorDashboardReducer(
  state: DoctorDashboardState,
  action: DoctorDashboardAction
): DoctorDashboardState {
  const resolveRecord = (
    value: Record<string, string> | ((current: Record<string, string>) => Record<string, string>),
    current: Record<string, string>
  ) => (typeof value === "function" ? value(current) : value);

  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setConsultSummary":
      return { ...state, consultSummary: action.value };
    case "setPrescriptionModal":
      return { ...state, prescriptionModal: action.value };
    case "updatePrescriptionModal":
      return {
        ...state,
        prescriptionModal:
          typeof action.value === "function"
            ? action.value(state.prescriptionModal)
            : { ...state.prescriptionModal, ...action.value },
      };
    case "setConsultTick":
      return { ...state, consultTick: action.value };
    case "setConsultStartOverrides":
      return {
        ...state,
        consultStartOverrides: resolveRecord(action.value, state.consultStartOverrides),
      };
    case "setActiveDoctorQueueLane":
      return { ...state, activeDoctorQueueLane: action.value };
    case "setAppointmentFilter":
      return { ...state, appointmentFilter: action.value };
    case "setLastCompletedVisit":
      return { ...state, lastCompletedVisit: action.value };
    default:
      return state;
  }
}

export const getDisplayDoctorName = (name?: string | null) => {
  const resolvedName = resolveDisplayNameAndInitials({
    name: name || undefined,
    role: "DOCTOR",
  }).displayName;
  const cleaned = String(resolvedName || "")
    .replace(/^dr\.?\s+/i, "")
    .trim();

  return cleaned === "User" ? "Doctor" : cleaned || "Doctor";
};

export function normalizeQueueToken(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

export function hasQueueTaxonomy(
  entry: Pick<
    CanonicalQueueEntry,
    "queueCategory" | "queueType" | "serviceBucket" | "treatmentType" | "displayLabel" | "serviceType"
  >
): boolean {
  return Boolean(
    entry.queueCategory ||
      entry.queueType ||
      entry.serviceBucket ||
      entry.treatmentType ||
      entry.displayLabel ||
      entry.serviceType
  );
}

export function isAnalyticsQueueEntry(entry: CanonicalQueueEntry): boolean {
  const tokens = [
    entry.queueCategory,
    entry.queueType,
    entry.serviceBucket,
    entry.treatmentType,
    entry.displayLabel,
    entry.serviceType,
    resolveQueueDisplayLabel(entry),
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));

  return tokens.some((token) => token.includes("ANALYTICS"));
}

export function getDoctorQueueLaneLabel(entry: CanonicalQueueEntry): string {
  return !hasQueueTaxonomy(entry) || isAnalyticsQueueEntry(entry)
    ? "Uncategorized"
    : resolveQueueDisplayLabel(entry);
}

export function buildDoctorQueueSections(entries: CanonicalQueueEntry[]): DoctorQueueSection[] {
  const sectionMap = new Map<string, DoctorQueueSection>();

  entries.forEach((entry) => {
    const title = getDoctorQueueLaneLabel(entry);
    const key = normalizeQueueToken(title);
    const section = sectionMap.get(key);

    if (section) {
      section.items.push(entry);
      return;
    }

    sectionMap.set(key, {
      key,
      title,
      items: [entry],
    });
  });

  return Array.from(sectionMap.values()).sort(
    (a, b) => (a.items[0]?.position ?? 0) - (b.items[0]?.position ?? 0) || a.title.localeCompare(b.title)
  );
}

export function mapDoctorAppointmentToTimelineItem(
  apt: AppointmentWithRelations,
  today: string
): TransformedAppointment {
  const patientName = getAppointmentPatientName(apt);
  const displayDuration = getDisplayAppointmentDuration(apt);
  const paymentDisplay = getAppointmentPaymentDisplayState(apt);
  const dateLabel = getReceptionistAppointmentDateLabel(apt as unknown as Record<string, unknown>);
  const timeLabel = getReceptionistAppointmentTimeLabel(apt as unknown as Record<string, unknown>);
  const appointmentMoment = getAppointmentDateTimeValue(apt);
  const appointmentDay = appointmentMoment
    ? formatDateInIST(appointmentMoment, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")
    : "";
  const scheduleState =
    appointmentDay && appointmentDay < today
      ? "PAST"
      : appointmentDay && appointmentDay === today
        ? "TODAY"
        : "UPCOMING";

  let displayStatus = apt.status as string;
  if (apt.status === "IN_PROGRESS") displayStatus = "IN PROGRESS";

  return {
    id: apt.id,
    patientName,
    dateLabel,
    timeLabel,
    patientId: apt.patientId,
    time: `${dateLabel} - ${timeLabel}`,
    scheduleState,
    status: displayStatus.replace(/_/g, " "),
    statusEnum: apt.status,
    type: apt.type || "Consultation",
    duration: `${displayDuration || 30} min`,
    notes: apt.notes || "",
    isVideo: apt.type === "VIDEO_CALL",
    priority: (apt as any).priority || "NORMAL",
    doctorId: apt.doctorId,
    paymentStatus: paymentDisplay.paymentStatus,
    paymentCompleted: paymentDisplay.paymentCompleted,
    paymentPending: paymentDisplay.paymentPending,
    checkedInAt: apt.checkedInAt ? new Date(apt.checkedInAt).toISOString() : null,
    startAtMs: appointmentMoment ? appointmentMoment.getTime() : null,
    startedAt: toIsoOrNull(apt.startedAt),
    patientMeta: getPatientMetaLabel(apt),
    reason: getVisitReason(apt),
    sentToPharmacy: apt.metadata?.sentToPharmacy === true,
  };
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function readText(source: unknown, key: string): string {
  if (!source || typeof source !== "object") return "";
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

/** "38 years · Female" from the patient on the appointment. Missing parts are left out. */
export function getPatientMetaLabel(apt: AppointmentWithRelations): string {
  const patient = apt.patient as unknown;
  const patientUser = patient && typeof patient === "object" ? (patient as Record<string, unknown>).user : null;
  const parts: string[] = [];

  const rawAge = patient && typeof patient === "object" ? (patient as Record<string, unknown>).age : null;
  const dateOfBirth = readText(patient, "dateOfBirth") || readText(patientUser, "dateOfBirth");
  let age: number | null = typeof rawAge === "number" && rawAge > 0 ? Math.floor(rawAge) : null;
  if (age === null && dateOfBirth) {
    const born = new Date(dateOfBirth);
    if (!Number.isNaN(born.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - born.getFullYear();
      const beforeBirthday =
        now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
      if (beforeBirthday) years -= 1;
      age = years >= 0 && years < 130 ? years : null;
    }
  }
  if (age !== null) parts.push(age === 1 ? "1 year" : `${age} years`);

  const gender = readText(patient, "gender") || readText(patientUser, "gender");
  if (gender) parts.push(gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase());

  return parts.join(" · ");
}

/** The reason for the visit: the booking reason, else the listed symptoms, else the booking note. */
export function getVisitReason(apt: AppointmentWithRelations): string {
  const reason = readText(apt, "reason") || readText(apt, "chiefComplaint");
  if (reason) return reason;
  if (Array.isArray(apt.symptoms) && apt.symptoms.length > 0) {
    return apt.symptoms.filter((symptom) => typeof symptom === "string" && symptom.trim()).join(", ");
  }
  return (apt.notes || "").trim();
}

const clockFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

/** "11:48 am" in clinic time. Empty when the value is not a date. */
export function formatClock(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : clockFormatter.format(parsed);
}

/** When the join button of a video visit opens. */
export function getVideoJoinOpensAtMs(appointment: Pick<TransformedAppointment, "startAtMs">): number | null {
  return appointment.startAtMs === null
    ? null
    : appointment.startAtMs - VIDEO_JOIN_EARLY_WINDOW_MINUTES * 60_000;
}

/** When an open video visit closes (and expires if it was not completed). */
export function getVideoVisitClosesAtMs(appointment: Pick<TransformedAppointment, "startAtMs">): number | null {
  return appointment.startAtMs === null
    ? null
    : appointment.startAtMs + VIDEO_JOIN_LATE_WINDOW_MINUTES * 60_000;
}

/**
 * One row of "Today's Appointments": what the second line says and which button the row gets.
 * In-clinic visits start only after check-in; a video visit can be joined only while its join
 * state says so (`videoJoin` comes from `getVideoSessionDecision`).
 */
export function buildDoctorTodayRow(
  appointment: TransformedAppointment,
  videoJoin: DoctorVideoJoinState | null,
  nowMs: number
): DoctorTodayRow {
  const status = appointment.statusEnum;

  if (status === "COMPLETED") {
    return {
      appointment,
      hint: appointment.sentToPharmacy ? { text: "Sent to pharmacy", tone: "ok" } : null,
      action: "NONE",
    };
  }

  if (status === "IN_PROGRESS") {
    const startedAt = formatClock(appointment.startedAt);
    return {
      appointment,
      hint: startedAt ? { text: `Started ${startedAt}`, tone: "ok" } : null,
      action: appointment.isVideo ? "COMPLETE" : "PRESCRIBE",
    };
  }

  if (appointment.isVideo) {
    const joinable = status === "CONFIRMED" || (status === "SCHEDULED" && appointment.paymentCompleted);
    if (joinable && videoJoin?.canJoin) {
      return { appointment, hint: { text: "Join is open", tone: "ok" }, action: "JOIN" };
    }
    if (!joinable && status !== "SCHEDULED" && status !== "PENDING") {
      return { appointment, hint: null, action: "NONE" };
    }
    if (videoJoin?.paymentPending || appointment.paymentPending) {
      return { appointment, hint: { text: "Payment not confirmed", tone: "muted" }, action: "NONE" };
    }
    const opensAtMs = getVideoJoinOpensAtMs(appointment);
    const closesAtMs = getVideoVisitClosesAtMs(appointment);
    if (opensAtMs !== null && nowMs < opensAtMs) {
      return { appointment, hint: { text: `Join opens ${formatClock(opensAtMs)}`, tone: "muted" }, action: "NONE" };
    }
    if (closesAtMs !== null && nowMs > closesAtMs) {
      return { appointment, hint: { text: "Join window closed", tone: "muted" }, action: "NONE" };
    }
    return { appointment, hint: { text: "Join is not open yet", tone: "muted" }, action: "NONE" };
  }

  const checkedInAt = formatClock(appointment.checkedInAt);
  const checkInHint: DoctorTodayRow["hint"] = appointment.checkedInAt
    ? { text: checkedInAt ? `Checked in ${checkedInAt}` : "Checked in", tone: "ok" }
    : { text: "Not checked in", tone: "muted" };

  if (status === "CONFIRMED") {
    return { appointment, hint: checkInHint, action: appointment.checkedInAt ? "START" : "START_LOCKED" };
  }

  const waiting = status === "SCHEDULED" || status === "PENDING";
  return { appointment, hint: waiting ? checkInHint : null, action: "NONE" };
}

/**
 * Who the doctor sees next: the checked-in in-clinic patient at the head of the queue or the
 * video visit that can be joined now, whichever is scheduled earlier. With nobody ready, the
 * next confirmed visit of the day is shown with the reason it cannot start yet.
 */
export function pickDoctorNextPatient(
  rows: DoctorTodayRow[],
  inClinicReady: { appointment: TransformedAppointment; queuePosition: number | null } | null
): DoctorNextPatient | null {
  const byTime = (a: DoctorTodayRow, b: DoctorTodayRow) =>
    (a.appointment.startAtMs ?? Number.MAX_SAFE_INTEGER) - (b.appointment.startAtMs ?? Number.MAX_SAFE_INTEGER);
  const sorted = rows.toSorted(byTime);
  const joinable = sorted.find((row) => row.action === "JOIN") ?? null;

  const inClinicStart = inClinicReady?.appointment.startAtMs ?? Number.MAX_SAFE_INTEGER;
  const joinStart = joinable?.appointment.startAtMs ?? Number.MAX_SAFE_INTEGER;

  if (inClinicReady && (!joinable || inClinicStart <= joinStart)) {
    const checkedInAt = formatClock(inClinicReady.appointment.checkedInAt);
    const place =
      inClinicReady.queuePosition === 1
        ? ", first in the queue"
        : inClinicReady.queuePosition && inClinicReady.queuePosition > 1
          ? `, number ${inClinicReady.queuePosition} in the queue`
          : "";
    return {
      appointment: inClinicReady.appointment,
      action: "START",
      hint: `${checkedInAt ? `Checked in at ${checkedInAt}` : "Checked in"}${place}.`,
    };
  }

  if (joinable) {
    const startsAt = formatClock(joinable.appointment.startAtMs);
    return {
      appointment: joinable.appointment,
      action: "JOIN",
      hint: startsAt ? `Video join is open. The visit time is ${startsAt}.` : "Video join is open.",
    };
  }

  const waiting = sorted.find(
    (row) =>
      row.action === "START_LOCKED" ||
      (row.appointment.isVideo && row.appointment.statusEnum === "CONFIRMED" && row.hint?.text.startsWith("Join opens"))
  );
  if (!waiting) return null;

  if (waiting.appointment.isVideo) {
    return { appointment: waiting.appointment, action: "WAIT_JOIN", hint: `${waiting.hint?.text ?? "Join is not open yet"}.` };
  }
  return {
    appointment: waiting.appointment,
    action: "WAIT_CHECK_IN",
    hint: "Not checked in yet. You can start once the front desk checks the patient in.",
  };
}

/**
 * Live Queue lines for the right rail. The queue is for in-clinic, checked-in patients only,
 * so video visits and medicine-desk entries are left out.
 */
export function buildDoctorQueueLines(
  entries: CanonicalQueueEntry[],
  appointmentById: Map<string, Pick<TransformedAppointment, "isVideo" | "checkedInAt" | "patientName">>
): DoctorQueueLine[] {
  const lines: DoctorQueueLine[] = [];

  entries.forEach((entry) => {
    const appointment = entry.appointmentId ? appointmentById.get(entry.appointmentId) : undefined;
    const tokens = [entry.queueCategory, entry.queueType, entry.serviceType].map((token) => normalizeQueueToken(token));
    const isVideo = appointment?.isVideo === true || tokens.some((token) => token.includes("VIDEO"));
    const isMedicineDesk = normalizeQueueToken(entry.queueCategory) === "MEDICINE_DESK";
    if (isVideo || isMedicineDesk) return;

    const status = normalizeQueueToken(entry.status);
    const checkedIn = Boolean(entry.checkedInAt || appointment?.checkedInAt) || status === "CHECKED_IN";
    const lineStatus: DoctorQueueLine["status"] =
      status === "IN_PROGRESS" ? "IN_PROGRESS" : checkedIn && status !== "WAITING" && status !== "QUEUED" ? "CHECKED_IN" : "QUEUED";

    const rawWait = entry.estimatedWaitTime ?? entry.waitTime;
    const wait = typeof rawWait === "number" ? rawWait : Number.parseInt(String(rawWait ?? ""), 10);
    const queueName = String(entry.patientName || "").trim();
    const hasQueueName = queueName !== "" && queueName.toLowerCase() !== "unknown patient";

    lines.push({
      key: entry.entryId || entry.appointmentId || `${entry.patientId}-${entry.position}`,
      position: entry.position > 0 ? entry.position : lines.length + 1,
      patientName: hasQueueName ? queueName : appointment?.patientName || "Patient",
      label: getDoctorQueueLaneLabel(entry) === "Uncategorized" ? "General Consultation" : getDoctorQueueLaneLabel(entry),
      status: lineStatus,
      waitMinutes: Number.isFinite(wait) && wait > 0 ? wait : null,
    });
  });

  return lines;
}

export function buildDoctorDashboardStats(
  appointmentsArray: AppointmentWithRelations[],
  appointmentTimeline: TransformedAppointment[],
  liveQueueEntries: CanonicalQueueEntry[] = []
): DoctorDashboardStats {
  const todayStr = formatDateInIST(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
  const todayApts = appointmentsArray.filter((apt: AppointmentWithRelations) => {
    const dateTime = getAppointmentDateTimeValue(apt);
    const aptDate =
      (dateTime
        ? formatDateInIST(dateTime, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")
        : "") ||
      apt.date ||
      (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] ||
      "";
    return aptDate === todayStr;
  });

  return {
    todayAppointments: todayApts.length,
    confirmedToday: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "CONFIRMED").length,
    inPersonToday: todayApts.filter((apt: AppointmentWithRelations) => String(apt.type || "").toUpperCase() === "IN_PERSON").length,
    liveQueueCount: liveQueueEntries.length,
    checkedInPatients: todayApts.filter((apt: AppointmentWithRelations) => Boolean((apt as any).checkedInAt)).length,
    completedToday: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "COMPLETED").length,
    totalPatients: new Set(appointmentsArray.map((apt: AppointmentWithRelations) => apt.patientId)).size,
    nextAppointment:
      appointmentTimeline.find(
        (a: TransformedAppointment) =>
          a.statusEnum === "SCHEDULED" ||
          a.statusEnum === "CONFIRMED" ||
          a.statusEnum === "IN_PROGRESS"
      ) ?? null,
  };
}
