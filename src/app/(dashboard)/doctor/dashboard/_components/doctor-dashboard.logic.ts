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
} from "@/lib/utils/appointmentUtils";

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
  | { type: "setActiveDoctorQueueLane"; value: string };

export interface DoctorDashboardStats {
  todayAppointments: number;
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
    default:
      return state;
  }
}

export const getDisplayDoctorName = (name?: string | null) => {
  const cleaned = String(name || "")
    .replace(/^dr\.?\s+/i, "")
    .trim();

  return cleaned || "Doctor";
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
  };
}

export function buildDoctorDashboardStats(
  appointmentsArray: AppointmentWithRelations[],
  appointmentTimeline: TransformedAppointment[]
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
