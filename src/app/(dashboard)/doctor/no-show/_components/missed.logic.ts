import { formatDateInIST, formatTimeInIST, getAppointmentDateTimeValue, getAppointmentPatientName } from "@/lib/utils/appointmentUtils";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";

/** One missed (no-show) visit, as the follow-up list needs it. */
export interface MissedVisit {
  appointmentId: string;
  /** Patient-record id (Book again). */
  patientId: string;
  /** Patient's user id (messages go to the user). */
  patientUserId: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  isVideo: boolean;
  startsAt: string;
  whenLabel: string;
  complaint: string;
}

/** The favourite key that marks a missed visit as archived (per doctor, kind OTHER). */
export const archiveKey = (appointmentId: string) => `missed-archive:${appointmentId}`.slice(0, 120);

function listOf(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecordOrEmpty(data);
  for (const key of ["data", "appointments", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

export function toMissedVisits(data: unknown): MissedVisit[] {
  return listOf(data)
    .map(asRecordOrEmpty)
    .filter((appointment) => textOf(appointment.status).toUpperCase() === "NO_SHOW")
    .map((appointment) => {
      const patient = asRecordOrEmpty(appointment.patient);
      const user = asRecordOrEmpty(patient.user);
      const startsAt = getAppointmentDateTimeValue(appointment);
      const isVideo = textOf(appointment.type || appointment.appointmentType).toUpperCase().includes("VIDEO");
      return {
        appointmentId: textOf(appointment.id),
        patientId: textOf(appointment.patientId) || textOf(patient.id),
        patientUserId: textOf(patient.userId) || textOf(user.id),
        doctorId: textOf(appointment.doctorId) || textOf(asRecordOrEmpty(appointment.doctor).id),
        patientName: getAppointmentPatientName(appointment) || textOf(patient.name) || "Patient",
        patientPhone: textOf(patient.phone) || textOf(user.phone),
        isVideo,
        startsAt: startsAt ? startsAt.toISOString() : textOf(appointment.startTime),
        whenLabel: startsAt
          ? `${formatDateInIST(startsAt, { weekday: "short", day: "numeric", month: "short" })}, ${formatTimeInIST(startsAt)}`
          : "",
        complaint: textOf(appointment.chiefComplaint) || textOf(appointment.reason) || textOf(appointment.notes),
      };
    })
    .filter((visit) => visit.appointmentId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** The WhatsApp text for one patient; `{name}` and `{date}` are filled per patient. */
export const DEFAULT_MISSED_MESSAGE =
  "Hello {name}, you missed your visit with the doctor on {date}. Please book a new time in the app, or reply to this message and the clinic will help you.";

export function messageFor(template: string, visit: Pick<MissedVisit, "patientName" | "whenLabel">): string {
  const firstName = visit.patientName.split(/\s+/)[0] || visit.patientName;
  return template.replace(/\{name\}/g, firstName).replace(/\{date\}/g, visit.whenLabel || "your booked day");
}

/** Ids of the archived missed visits among the doctor's OTHER favourites. */
export function archivedIds(favourites: readonly { itemKey: string }[]): Set<string> {
  return new Set(
    favourites.filter((favourite) => favourite.itemKey.startsWith("missed-archive:")).map((favourite) => favourite.itemKey.slice("missed-archive:".length)),
  );
}

