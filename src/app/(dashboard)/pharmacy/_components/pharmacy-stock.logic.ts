import type { PillTone } from "@/components/tbd";
import type { StockAlertRecord, StockBatchRecord } from "@/types/pharmacy.types";
import { dayLabel, todayKey, type MedicineRow } from "./pharmacy-inventory.logic";

/**
 * Pure helpers for the stock side of `/pharmacy`: batches (lots), batch alerts and the sales
 * report range. Dispensing takes stock from batches, earliest expiry first, so a batch list is the
 * truth about what can be handed over; `Medicine.stock` is the total of the batches.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A batch expiring within this many days is flagged. */
export const EXPIRY_WARNING_DAYS = 90;
/** The most days the sales route accepts between `from` and `to`. */
export const MAX_SALES_RANGE_DAYS = 366;

// ── Batches ────────────────────────────────────────────────────────────────

export type BatchState = "expired" | "expiring" | "ok";

export interface BatchRow {
  id: string;
  lotNumber: string;
  manufactureDate: string | null;
  expiryDate: string;
  /** Whole days until expiry; negative once expired. */
  daysLeft: number;
  onHand: number;
  received: number;
  costPrice: number | null;
  state: BatchState;
  label: string;
  tone: PillTone;
}

function batchState(daysLeft: number): Pick<BatchRow, "state" | "label" | "tone"> {
  if (daysLeft < 0) return { state: "expired", label: "Expired", tone: "rose" };
  if (daysLeft <= 30) return { state: "expiring", label: `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`, tone: "rose" };
  if (daysLeft <= EXPIRY_WARNING_DAYS) return { state: "expiring", label: `Expires in ${daysLeft} days`, tone: "amber" };
  return { state: "ok", label: "Fresh", tone: "green" };
}

/** Batches of one medicine as table rows, soonest expiry first. Empty lots are left out. */
export function buildBatchRows(batches: StockBatchRecord[] | undefined, now: Date = new Date()): BatchRow[] {
  return (batches ?? [])
    .filter((batch) => batch.quantityOnHand > 0)
    .map((batch): BatchRow => {
      const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - now.getTime()) / DAY_MS);
      return {
        id: batch.id,
        lotNumber: batch.lotNumber,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        daysLeft,
        onHand: batch.quantityOnHand,
        received: batch.quantityReceived,
        costPrice: batch.costPrice,
        ...batchState(daysLeft),
      };
    })
    .sort((left, right) => left.expiryDate.localeCompare(right.expiryDate));
}

/** Units that can still be dispensed: lots that have not expired. */
export function dispensableUnits(rows: BatchRow[]): number {
  return rows.filter((row) => row.state !== "expired").reduce((sum, row) => sum + row.onHand, 0);
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export interface BatchAlert {
  id: string;
  label: string;
  tone: PillTone;
  message: string;
  medicineId: string;
  /** Empty when the medicine is not in the stock list. */
  medicineName: string;
}

const ALERT_STYLE: Record<string, { label: string; tone: PillTone }> = {
  EXPIRY_CRITICAL: { label: "Expires very soon", tone: "rose" },
  EXPIRY_WARNING: { label: "Expiring soon", tone: "amber" },
  LOW_STOCK: { label: "Low stock", tone: "amber" },
  OUT_OF_STOCK: { label: "Out of stock", tone: "rose" },
  REORDER_NEEDED: { label: "Reorder", tone: "blue" },
  EXPIRED_WRITE_OFF: { label: "Written off", tone: "slate" },
};

const ALERT_RANK = ["EXPIRY_CRITICAL", "OUT_OF_STOCK", "EXPIRY_WARNING", "LOW_STOCK", "REORDER_NEEDED", "EXPIRED_WRITE_OFF"];

/** Open alerts, most urgent first, with the medicine each one is about. */
export function buildBatchAlerts(alerts: StockAlertRecord[] | undefined, medicines: MedicineRow[]): BatchAlert[] {
  const names = new Map(medicines.map((medicine) => [medicine.id, medicine.name]));
  return (alerts ?? [])
    .filter((alert) => alert.id && alert.alertType !== "EXPIRED_WRITE_OFF")
    .map((alert): BatchAlert => {
      const style = ALERT_STYLE[alert.alertType] ?? { label: "Alert", tone: "slate" as PillTone };
      return {
        id: alert.id,
        label: style.label,
        tone: style.tone,
        message: alert.message,
        medicineId: alert.productId,
        medicineName: names.get(alert.productId) ?? "",
      };
    })
    .sort((left, right) => rankOf(left) - rankOf(right));

  function rankOf(alert: BatchAlert): number {
    const type = Object.entries(ALERT_STYLE).find(([, style]) => style.label === alert.label)?.[0] ?? "";
    const rank = ALERT_RANK.indexOf(type);
    return rank === -1 ? ALERT_RANK.length : rank;
  }
}

// ── Sales range ────────────────────────────────────────────────────────────

/** The 1st of the current month as `yyyy-mm-dd` (IST). */
export function firstOfMonthKey(now: Date = new Date()): string {
  return `${todayKey(now).slice(0, 7)}-01`;
}

function dayNumber(key: string): number {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS);
}

/** Why a from/to pair cannot be sent to the sales route, or null when it can. */
export function salesRangeProblem(from: string, to: string): string | null {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(from) || !pattern.test(to)) return "Choose both dates.";
  if (from > to) return "The start date is after the end date.";
  if (dayNumber(to) - dayNumber(from) + 1 > MAX_SALES_RANGE_DAYS) {
    return `Choose a range of ${MAX_SALES_RANGE_DAYS} days or fewer.`;
  }
  return null;
}

/** "8 Oct 2026" for a `yyyy-mm-dd` key. */
export function keyLabel(key: string): string {
  return dayLabel(`${key}T12:00:00+05:30`);
}
