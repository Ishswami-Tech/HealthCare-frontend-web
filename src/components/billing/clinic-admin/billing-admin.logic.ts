/**
 * Pure helpers of the clinic admin billing screens (CaBilling, CaInvoices, CaInvoiceDetail,
 * CaNewInvoice, CaSendReminders). No React, no fetching: unit-testable and shared by the pages.
 */
import type { PillTone } from "@/components/tbd";
import type { OverdueInvoice, ReminderLanguage } from "@/types/clinic-admin-ops.types";

// ── Invoice status ────────────────────────────────────────────────────────

export type InvoiceStatusKey = "PAID" | "PENDING" | "PARTIAL" | "REFUNDED" | "VOID";

export function invoiceStatusKey(status: unknown): InvoiceStatusKey {
  const key = String(status ?? "").toUpperCase();
  if (key === "PAID" || key === "COMPLETED") return "PAID";
  if (key === "PARTIAL" || key === "PARTIALLY_PAID" || key === "PART_PAID") return "PARTIAL";
  if (key === "REFUNDED") return "REFUNDED";
  if (key === "VOID" || key === "CANCELLED") return "VOID";
  return "PENDING";
}

export const INVOICE_STATUS_TONE: Record<InvoiceStatusKey, PillTone> = {
  PAID: "green",
  PENDING: "amber",
  PARTIAL: "amber",
  REFUNDED: "slate",
  VOID: "slate",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatusKey, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  PARTIAL: "Part paid",
  REFUNDED: "Refunded",
  VOID: "Void",
};

// ── New invoice draft ─────────────────────────────────────────────────────

export interface DraftLine {
  key: string;
  label: string;
  detail?: string;
  quantity: number;
  /** Rupees. */
  rate: number;
}

export interface DraftTotals {
  subtotal: number;
  discount: number;
  total: number;
}

const money = (value: number) => Math.round(value * 100) / 100;

/**
 * Subtotal of the lines, the discount clamped to [0, subtotal] and the payable total.
 * `total` mirrors the server's invoice total (amount + tax - discount, no tax at the desk), so
 * POST /billing/invoices must send `amount: subtotal` and `discount`, never `amount: total`.
 */
export function draftTotals(lines: DraftLine[], discount: number): DraftTotals {
  const subtotal = money(
    lines.reduce((sum, line) => sum + Math.max(0, line.quantity) * Math.max(0, line.rate), 0),
  );
  const applied = money(Math.min(Math.max(0, Number.isFinite(discount) ? discount : 0), subtotal));
  return { subtotal, discount: applied, total: money(subtotal - applied) };
}

/** Discount amount for a preset: a percent of the subtotal, or the whole bill for "waive". */
export function discountForPreset(subtotal: number, preset: "5" | "10" | "WAIVE"): number {
  if (preset === "WAIVE") return subtotal;
  return money((subtotal * Number(preset)) / 100);
}

/** `lineItems` JSON sent with POST /billing/invoices. */
export function lineItemsPayload(lines: DraftLine[]): Record<string, unknown> {
  return {
    items: lines.map((line) => ({
      description: line.detail ? `${line.label} (${line.detail})` : line.label,
      quantity: line.quantity,
      unitPrice: line.rate,
      total: money(line.quantity * line.rate),
    })),
  };
}

// ── Reminders ─────────────────────────────────────────────────────────────

export interface ReminderMessageInput {
  patientName: string;
  clinicName: string;
  invoiceNumber: string;
  amountLabel: string;
  sinceLabel: string;
}

/** The reminder text for one invoice; the same template the preview shows. */
export function reminderMessage(input: ReminderMessageInput, language: ReminderLanguage): string {
  const { patientName, clinicName, invoiceNumber, amountLabel, sinceLabel } = input;
  if (language === "mr") {
    return `नमस्कार ${patientName}, ${clinicName} येथून ही सौम्य आठवण. बिल क्र. ${invoiceNumber} चे ${amountLabel} ${sinceLabel} पासून बाकी आहेत. कृपया UPI ने किंवा रिसेप्शनवर भरा. धन्यवाद.`;
  }
  if (language === "hi") {
    return `नमस्ते ${patientName}, ${clinicName} की ओर से विनम्र याद दिलाना: बिल ${invoiceNumber} के ${amountLabel} ${sinceLabel} से बाकी हैं. कृपया UPI से या रिसेप्शन पर भुगतान करें. धन्यवाद.`;
  }
  return `Hello ${patientName}, this is a gentle reminder from ${clinicName}. Invoice ${invoiceNumber} of ${amountLabel} is pending since ${sinceLabel}. You can pay by UPI at the front desk or in the TestByDoctor app. Thank you.`;
}

export type ReminderFilter = "ALL" | "OVERDUE" | "NEVER";

/** Overdue 7+ days counts as "overdue" on the reminders screen (design: "Overdue 7+ days"). */
export const OVERDUE_DAYS = 7;

export function filterOverdue(rows: OverdueInvoice[], filter: ReminderFilter): OverdueInvoice[] {
  if (filter === "OVERDUE") return rows.filter((row) => row.daysOverdue >= OVERDUE_DAYS);
  if (filter === "NEVER") return rows.filter((row) => row.remindersSent === 0);
  return rows;
}

export interface AgeingBucket {
  label: string;
  amount: number;
  count: number;
}

/** Dues ageing: 0 – 7, 8 – 30 and 30+ days. */
export function duesAgeing(rows: OverdueInvoice[]): AgeingBucket[] {
  const buckets: AgeingBucket[] = [
    { label: "0 – 7 days", amount: 0, count: 0 },
    { label: "8 – 30 days", amount: 0, count: 0 },
    { label: "30+ days", amount: 0, count: 0 },
  ];
  for (const row of rows) {
    const index = row.daysOverdue <= 7 ? 0 : row.daysOverdue <= 30 ? 1 : 2;
    const bucket = buckets[index];
    if (!bucket) continue;
    bucket.amount = money(bucket.amount + (Number(row.amount) || 0));
    bucket.count += 1;
  }
  return buckets;
}

// ── CSV export ────────────────────────────────────────────────────────────

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Browser-only: saves `csv` as a file. */
export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
