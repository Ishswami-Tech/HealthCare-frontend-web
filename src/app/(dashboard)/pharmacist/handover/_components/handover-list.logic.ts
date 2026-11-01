/**
 * Hand-over list rules (pure, no React): who is waiting at the counter, for how long, and how
 * to tell two patients with the same name apart.
 */

import type { PillTone } from "@/components/tbd";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import type { PrescriptionRow } from "../../prescriptions/_components/pharmacist-prescriptions.logic";

export type HandoverListFilter = "waiting" | "collected";

const MINUTE = 60_000;

function isDispensed(row: PrescriptionRow): boolean {
  return row.status === "FILLED" || row.status === "PARTIAL";
}

/** Collected at the counter (verified hand-over recorded). */
export function isCollected(row: PrescriptionRow): boolean {
  return Boolean(row.handedOverAt) || String(row.handoverStatus || "").toUpperCase() === "HANDED_OVER";
}

/** Dispensed with medicines to give and not collected yet: the patient is (or will be) at the counter. */
export function isAwaitingHandover(row: PrescriptionRow): boolean {
  return isDispensed(row) && row.medicines.length > 0 && !isCollected(row);
}

const timeOf = (value: string | null): number => (value ? Date.parse(value) || 0 : 0);

/** When the row joined the counter queue: dispensed time, else when it was prescribed. */
function queuedAt(row: PrescriptionRow): string | null {
  return row.dispensedAt ?? row.prescribedAt ?? null;
}

/** Dispensed (or prescribed) on the clinic's (IST) calendar day of `nowMs`. */
export function isTodayRow(row: PrescriptionRow, nowMs: number): boolean {
  const at = queuedAt(row);
  return Boolean(at) && formatDateKeyInIST(at as string) === formatDateKeyInIST(new Date(nowMs));
}

export interface WaitingGroups {
  /** Dispensed today: the patients who are at the counter now, longest wait first. */
  today: PrescriptionRow[];
  /** Dispensed on an earlier day and never collected: backlog, longest wait first (like today). */
  older: PrescriptionRow[];
}

/**
 * The waiting list in the order the counter works it: today's patients first (who has waited
 * longest today is served first), then the older backlog (also longest wait first), so a stale
 * prior-day row never sits above a patient standing at the counter now.
 */
export function waitingGroups(rows: readonly PrescriptionRow[], nowMs: number): WaitingGroups {
  const waiting = rows.filter(isAwaitingHandover);
  return {
    today: waiting
      .filter((row) => isTodayRow(row, nowMs))
      .sort((a, b) => timeOf(queuedAt(a)) - timeOf(queuedAt(b))),
    older: waiting
      .filter((row) => !isTodayRow(row, nowMs))
      .sort((a, b) => timeOf(queuedAt(a)) - timeOf(queuedAt(b))),
  };
}

/**
 * Rows of one filter. Waiting rows: today's first (longest wait first), then older ones (see
 * waitingGroups); collected rows newest first.
 */
export function handoverRows(
  rows: readonly PrescriptionRow[],
  filter: HandoverListFilter,
  nowMs: number = Date.now(),
): PrescriptionRow[] {
  if (filter === "waiting") {
    const groups = waitingGroups(rows, nowMs);
    return [...groups.today, ...groups.older];
  }
  return rows
    .filter((row) => isDispensed(row) && row.medicines.length > 0 && isCollected(row))
    .sort((a, b) => timeOf(b.handedOverAt ?? b.dispensedAt) - timeOf(a.handedOverAt ?? a.dispensedAt));
}

/** "Showing all 23 waiting: 19 today, 4 older" — the list is never silently cut. */
export function waitingCountLabel(groups: WaitingGroups): string {
  const total = groups.today.length + groups.older.length;
  if (total === 0) return "";
  const parts = [`${groups.today.length} today`, ...(groups.older.length > 0 ? [`${groups.older.length} older`] : [])];
  return `Showing all ${total} waiting: ${parts.join(", ")}`;
}

/** "Waiting 4 min", "Waiting 1 h 05 min", "Waiting since 25 Sep" (over a day); "" without a time. */
export function waitingLabel(dispensedAt: string | null, nowMs: number, olderDayLabel: string): string {
  if (!dispensedAt) return "";
  const since = Date.parse(dispensedAt);
  if (!Number.isFinite(since)) return "";
  const minutes = Math.max(0, Math.floor((nowMs - since) / MINUTE));
  if (minutes >= 24 * 60) return olderDayLabel ? `Waiting since ${olderDayLabel}` : "Waiting over a day";
  if (minutes < 1) return "Just dispensed";
  if (minutes < 60) return `Waiting ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Waiting ${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Waited long enough to flag the row (default 15 minutes). */
export function isLongWait(dispensedAt: string | null, nowMs: number, thresholdMinutes = 15): boolean {
  if (!dispensedAt) return false;
  const since = Date.parse(dispensedAt);
  return Number.isFinite(since) && nowMs - since >= thresholdMinutes * MINUTE;
}

/** "••••1234": enough to confirm the patient at the counter without showing the whole number. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "";
}

/** UHID when issued, otherwise the masked phone. */
export function patientIdentity(row: PrescriptionRow): string {
  return row.patientUhid || maskPhone(row.patientPhone);
}

/** Name key used to group rows: trimmed, lower-cased, inner whitespace collapsed. */
export function normalizedPatientName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Who a row belongs to: the patient id, else the UHID / phone, else the row itself (so a row
 * with no identity at all is still treated as a separate person and keeps the extra detail).
 */
function patientKey(row: PrescriptionRow): string {
  const id = row.patientId?.trim();
  if (id) return `id:${id}`;
  const identity = row.patientUhid.trim() || row.patientPhone.replace(/\D/g, "");
  return identity ? `who:${identity}` : `row:${row.id}`;
}

/**
 * Normalised names shared by more than one DISTINCT patient (shown with extra detail). One
 * patient with several prescriptions is not flagged against themself.
 */
export function repeatedNames(rows: readonly PrescriptionRow[]): Set<string> {
  const patientsByName = new Map<string, Set<string>>();
  for (const row of rows) {
    const name = normalizedPatientName(row.patientName);
    const patients = patientsByName.get(name) ?? new Set<string>();
    patients.add(patientKey(row));
    patientsByName.set(name, patients);
  }
  return new Set(
    Array.from(patientsByName.entries())
      .filter(([, patients]) => patients.size > 1)
      .map(([name]) => name),
  );
}

/** Payment state for the row tag. */
export function handoverPayment(row: PrescriptionRow, formatAmount: (amount: number) => string): {
  tone: PillTone;
  label: string;
} {
  if (row.totalAmount <= 0) return { tone: "slate", label: "Nothing to pay" };
  if (row.paymentStatus === "PAID") return { tone: "green", label: "Paid" };
  const due = row.pendingAmount > 0 ? row.pendingAmount : row.totalAmount;
  return row.paymentStatus === "PARTIAL"
    ? { tone: "amber", label: `${formatAmount(due)} due` }
    : { tone: "rose", label: `Unpaid · ${formatAmount(due)}` };
}
