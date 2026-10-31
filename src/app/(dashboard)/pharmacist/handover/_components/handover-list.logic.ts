/**
 * Hand-over list rules (pure, no React): who is waiting at the counter, for how long, and how
 * to tell two patients with the same name apart.
 */

import type { PillTone } from "@/components/tbd";
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

/**
 * Rows of one filter. Waiting rows come oldest first (who has waited longest is served first);
 * collected rows newest first.
 */
export function handoverRows(rows: readonly PrescriptionRow[], filter: HandoverListFilter): PrescriptionRow[] {
  const time = (value: string | null): number => (value ? Date.parse(value) || 0 : 0);
  if (filter === "waiting") {
    return rows.filter(isAwaitingHandover).sort((a, b) => time(a.dispensedAt) - time(b.dispensedAt));
  }
  return rows
    .filter((row) => isDispensed(row) && row.medicines.length > 0 && isCollected(row))
    .sort((a, b) => time(b.handedOverAt ?? b.dispensedAt) - time(a.handedOverAt ?? a.dispensedAt));
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

/** Lower-cased names that appear on more than one row (shown with extra detail). */
export function repeatedNames(rows: readonly PrescriptionRow[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.patientName.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
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
