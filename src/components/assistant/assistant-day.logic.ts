import type { TransformedAppointment } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import {
  TERMINAL_QUEUE_STATUSES,
  isVideoQueueEntry,
  type QueueDisplayItem,
} from "@/app/(dashboard)/queue/_components/queue.logic";

/**
 * The assistant's day, with no React in it: who is in the in-clinic queue, what each
 * appointment row lets the assistant do. Product rules (V2): no vitals stage; a checked-in
 * (confirmed) in-person appointment is in the doctor's queue; video visits have no queue;
 * only the doctor calls, starts and completes a visit.
 */

export type AssistantQueueStage = "IN_QUEUE" | "WITH_DOCTOR";

export interface AssistantQueueRow {
  key: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  token: string;
  stage: AssistantQueueStage;
  /** Minutes since check-in (or the API's wait), null when unknown. */
  waitMinutes: number | null;
  position: number;
}

function minutesSince(iso: string | undefined, now: number): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.round((now - at) / 60_000));
}

/** In-clinic queue rows in order (video and medicine-desk entries and closed visits left out). */
export function toAssistantQueueRows(entries: readonly QueueDisplayItem[], now: number = Date.now()): AssistantQueueRow[] {
  return entries
    .filter((entry) => {
      const status = String(entry.status || "").toUpperCase();
      if (TERMINAL_QUEUE_STATUSES.has(status)) return false;
      if (String(entry.queueCategory || "").toUpperCase() === "MEDICINE_DESK") return false;
      return !isVideoQueueEntry(entry);
    })
    .map((entry, index) => {
      const status = String(entry.status || "").toUpperCase();
      const apiWait = Number.parseInt(String(entry.estimatedWaitTime ?? entry.waitTime ?? ""), 10);
      const name = String(entry.patientName || "").trim();
      return {
        key: entry.id || entry.appointmentId || `${entry.patientId}-${index}`,
        appointmentId: entry.appointmentId || "",
        patientId: entry.patientId || "",
        patientName: name && name.toLowerCase() !== "unknown patient" ? name : "Patient",
        token: String(entry.token || entry.tokenNumber || "").trim(),
        stage: status === "IN_PROGRESS" || status === "CALLED" ? ("WITH_DOCTOR" as const) : ("IN_QUEUE" as const),
        waitMinutes: minutesSince(entry.checkedInAt || entry.confirmedAt, now) ?? (Number.isFinite(apiWait) && apiWait > 0 ? apiWait : null),
        position: entry.position > 0 ? entry.position : index + 1,
      };
    })
    .sort((a, b) => (a.stage === b.stage ? a.position - b.position : a.stage === "WITH_DOCTOR" ? -1 : 1));
}

export type AppointmentRowStage = "NOT_CHECKED_IN" | "IN_QUEUE" | "WITH_DOCTOR" | "COMPLETED" | "CLOSED" | "VIDEO";

const CLOSED = new Set(["CANCELLED", "NO_SHOW", "EXPIRED"]);

/** Where an appointment is today, from the assistant's point of view. */
export function appointmentStage(appointment: Pick<TransformedAppointment, "statusEnum" | "isVideo" | "checkedInAt">): AppointmentRowStage {
  const status = String(appointment.statusEnum || "").toUpperCase();
  if (status === "COMPLETED") return "COMPLETED";
  if (CLOSED.has(status)) return "CLOSED";
  if (status === "IN_PROGRESS") return "WITH_DOCTOR";
  if (appointment.isVideo) return "VIDEO";
  return appointment.checkedInAt || status === "CHECKED_IN" ? "IN_QUEUE" : "NOT_CHECKED_IN";
}

export const STAGE_LABELS: Record<AppointmentRowStage, { label: string; tone: "green" | "amber" | "blue" | "teal" | "slate" | "video" }> = {
  NOT_CHECKED_IN: { label: "Not checked in", tone: "slate" },
  IN_QUEUE: { label: "Checked in", tone: "green" },
  WITH_DOCTOR: { label: "With doctor", tone: "blue" },
  COMPLETED: { label: "Completed", tone: "teal" },
  CLOSED: { label: "Closed", tone: "slate" },
  VIDEO: { label: "Video visit", tone: "video" },
};

/** The assistant prepares a draft for a patient who is in the clinic (or on a video visit that is not closed). */
export function canPrepareDraft(stage: AppointmentRowStage): boolean {
  return stage === "IN_QUEUE" || stage === "WITH_DOCTOR" || stage === "VIDEO";
}

/** Today's counts for the dashboard tiles. */
export function assistantDayCounts(
  appointments: readonly Pick<TransformedAppointment, "statusEnum" | "isVideo" | "checkedInAt" | "scheduleState">[],
  queue: readonly AssistantQueueRow[],
): { today: number; inQueue: number; withDoctor: number } {
  return {
    today: appointments.filter((appointment) => appointment.scheduleState === "TODAY").length,
    inQueue: queue.filter((row) => row.stage === "IN_QUEUE").length,
    withDoctor: queue.filter((row) => row.stage === "WITH_DOCTOR").length,
  };
}
