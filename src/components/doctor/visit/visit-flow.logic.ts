/**
 * Pure rules of the doctor's in-clinic visit (DocVisitFlow, DocCompleteVisit, DocFollowUp).
 * No React, no fetching.
 *
 * Product rules (V2): there is no vitals stage in the queue. A booked in-person visit enters the
 * queue when the patient checks in (QR at the booked location, or reception's one-click check-in);
 * the doctor sees and calls only checked-in visits, starts the consult, prescribes and completes.
 * Video visits have no queue. Only the doctor calls, starts and completes.
 */

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

const CLOSED_STATUSES = new Set(["CANCELLED", "NO_SHOW", "EXPIRED"]);

export interface VisitFacts {
  /** Appointment status code ("CONFIRMED", "IN_PROGRESS", "COMPLETED", ...). */
  status: string;
  isVideo: boolean;
  checkedInAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  /** The prescription written in this visit, when there is one. */
  prescription: { reference: string; createdAt: string } | null;
  /** Medicines handed over from clinic stock in this visit (count of hand-overs). */
  dispenseCount: number;
  lastDispensedAt: string | null;
}

export type VisitStageKey = "checked-in" | "with-doctor" | "prescription" | "dispensing" | "completed";
export type VisitStageState = "done" | "current" | "todo" | "optional" | "skipped";

export interface VisitStage {
  key: VisitStageKey;
  label: string;
  detail: string;
  state: VisitStageState;
  /** ISO time of the step, when it happened. */
  at: string | null;
}

/** What the one main button of the visit does next. */
export type VisitNextAction =
  | "WAIT_CHECK_IN"
  | "START"
  | "PRESCRIBE"
  | "COMPLETE"
  | "JOIN_VIDEO"
  | "DONE"
  | "CLOSED";

const upper = (value: string) => value.trim().toUpperCase();

export function isVisitClosed(status: string): boolean {
  return CLOSED_STATUSES.has(upper(status));
}

export function isVisitCompleted(status: string): boolean {
  return upper(status) === "COMPLETED";
}

export function isConsultRunning(facts: Pick<VisitFacts, "status" | "startedAt">): boolean {
  const status = upper(facts.status);
  return status === "IN_PROGRESS" || (Boolean(facts.startedAt) && !isVisitCompleted(status) && !isVisitClosed(status));
}

export function nextVisitAction(facts: VisitFacts): VisitNextAction {
  if (isVisitCompleted(facts.status)) return "DONE";
  if (isVisitClosed(facts.status)) return "CLOSED";
  if (facts.isVideo) return isConsultRunning(facts) ? (facts.prescription ? "COMPLETE" : "PRESCRIBE") : "JOIN_VIDEO";
  // In clinic: only a checked-in visit reaches the doctor.
  if (!facts.checkedInAt) return "WAIT_CHECK_IN";
  if (!isConsultRunning(facts)) return "START";
  return facts.prescription ? "COMPLETE" : "PRESCRIBE";
}

export function buildVisitStages(facts: VisitFacts): VisitStage[] {
  const completed = isVisitCompleted(facts.status);
  const running = isConsultRunning(facts) || completed;
  const stages: VisitStage[] = [];

  if (!facts.isVideo) {
    stages.push({
      key: "checked-in",
      label: "Checked in",
      detail: facts.checkedInAt ? "In the queue" : "Waiting for the patient to check in at the clinic",
      state: facts.checkedInAt ? "done" : "current",
      at: facts.checkedInAt,
    });
  }

  const readyForDoctor = facts.isVideo || Boolean(facts.checkedInAt);
  stages.push({
    key: "with-doctor",
    label: "With doctor",
    detail: running ? "Consult started" : facts.isVideo ? "Join the video visit to start" : "Call the patient and start the consult",
    state: running ? "done" : readyForDoctor ? "current" : "todo",
    at: facts.startedAt,
  });

  stages.push({
    key: "prescription",
    label: "Prescription",
    detail: facts.prescription ? `${facts.prescription.reference} sent to the pharmacy` : "Not written yet",
    state: facts.prescription ? "done" : running && !completed ? "current" : completed ? "skipped" : "todo",
    at: facts.prescription?.createdAt || null,
  });

  if (!facts.isVideo) {
    stages.push({
      key: "dispensing",
      label: "Dispensing",
      detail:
        facts.dispenseCount > 0
          ? `Handed over from clinic stock${facts.dispenseCount > 1 ? ` (${facts.dispenseCount} times)` : ""}`
          : "From clinic stock, if needed",
      state: facts.dispenseCount > 0 ? "done" : "optional",
      at: facts.lastDispensedAt,
    });
  }

  stages.push({
    key: "completed",
    label: "Completed",
    detail: completed ? "Visit closed" : "Only you complete the visit",
    state: completed ? "done" : "todo",
    at: facts.completedAt,
  });

  return stages;
}

/** Queue token as the server prints it (location prefix, e.g. "B-001"), from the queue entry or the appointment. */
export function visitTokenLabel(...sources: unknown[]): string {
  for (const source of sources) {
    const record = asRecord(source);
    const token = text(record.token) || text(record.tokenLabel) || text(record.queueToken);
    if (token) return token;
  }
  for (const source of sources) {
    const number = text(asRecord(source).tokenNumber);
    if (number) return `#${number}`;
  }
  return "";
}

/** "6:42" / "1:02:10" between two timestamps. */
export function elapsedLabel(startMs: number | null, nowMs: number): string {
  if (!startMs || Number.isNaN(startMs) || nowMs < startMs) return "0:00";
  const totalSeconds = Math.floor((nowMs - startMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Whole minutes between two timestamps (0 when unknown). */
export function minutesBetween(fromIso: string | null, toMs: number): number {
  if (!fromIso) return 0;
  const from = Date.parse(fromIso);
  return Number.isNaN(from) ? 0 : Math.max(0, Math.round((toMs - from) / 60_000));
}

// ── Prescription of this visit ─────────────────────────────────────────────

export interface VisitPrescriptionCandidate {
  id: string;
  date: string;
  appointmentId?: string;
  visitId?: string;
  /** Raw status code ("PENDING", "CANCELLED", ...). */
  statusCode: string;
}

/**
 * The prescription written in this visit: the one linked to the appointment or the OPD visit, else
 * the newest one of the patient written today (IST) after the consult started. Cancelled ones never count.
 */
export function pickVisitPrescription<T extends VisitPrescriptionCandidate>(
  rows: readonly T[],
  visit: { appointmentId: string; visitId: string; todayKey: string; startedAt: string | null },
  toDateKey: (iso: string) => string,
): T | null {
  const live = rows.filter((row) => upper(row.statusCode) !== "CANCELLED");
  const linked = live.find(
    (row) => (row.appointmentId && row.appointmentId === visit.appointmentId) || (visit.visitId && row.visitId === visit.visitId),
  );
  if (linked) return linked;
  const started = visit.startedAt ? Date.parse(visit.startedAt) : Number.NaN;
  const today = live
    .filter((row) => row.date && toDateKey(row.date) === visit.todayKey)
    .filter((row) => Number.isNaN(started) || Date.parse(row.date) >= started - 60_000)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return today[0] ?? null;
}

// ── Follow-up ──────────────────────────────────────────────────────────────

export interface FollowUpPreset {
  key: string;
  label: string;
  days: number;
  /** YYYY-MM-DD */
  dateKey: string;
}

/** YYYY-MM-DD + n days (calendar arithmetic in UTC, so no timezone drift). */
export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Review in 3 days, 1 week, 2 weeks, 1 month from `todayKey`. */
export function followUpPresets(todayKey: string): FollowUpPreset[] {
  return [
    { key: "3d", label: "Review in 3 days", days: 3 },
    { key: "1w", label: "1 week", days: 7 },
    { key: "2w", label: "2 weeks", days: 14 },
    { key: "1m", label: "1 month", days: 30 },
  ].map((preset) => ({ ...preset, dateKey: addDaysToKey(todayKey, preset.days) }));
}

/** "Fri 23 Oct" for a YYYY-MM-DD key. */
export function shortDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

/** Query string the follow-up screen hands back to the complete-visit screen. */
export function followUpQuery(input: { date: string; time: string; appointmentId?: string }): string {
  const params = new URLSearchParams({ followUpDate: input.date, followUpTime: input.time });
  if (input.appointmentId) params.set("followUpAppointmentId", input.appointmentId);
  return params.toString();
}
