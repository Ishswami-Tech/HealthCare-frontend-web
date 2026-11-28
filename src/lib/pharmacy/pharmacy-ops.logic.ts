import type { PillTone } from "@/components/tbd";
import type { StockBatchRecord } from "@/types/pharmacy.types";

/**
 * Pure rules shared by the pharmacy-ops screens (no React): expiry buckets (PhExpiry), reorder
 * suggestions (CaInventory, PhInventoryAlertSettings), the supplier message of a purchase order
 * (CaPurchaseOrder) and reading the patient's hand-over code (PhHandover).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Expiry ─────────────────────────────────────────────────────────────────

export type ExpiryBucket = "expired" | "within30" | "within90" | "watch" | "later";

export const EXPIRY_BUCKET_LABEL: Record<ExpiryBucket, string> = {
  expired: "Already expired",
  within30: "Within 30 days",
  within90: "31 to 90 days",
  watch: "Watch list (91 to 180 days)",
  later: "Later",
};

export interface ExpiryRow {
  batchId: string;
  productId: string;
  medicineName: string;
  lotNumber: string;
  expiryDate: string;
  daysLeft: number;
  onHand: number;
  /** Cost of one unit when the API sends it (pharmacist and clinic admin only). */
  costPrice: number | null;
  bucket: ExpiryBucket;
  tone: PillTone;
  daysLabel: string;
}

export function expiryBucket(daysLeft: number): ExpiryBucket {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "within30";
  if (daysLeft <= 90) return "within90";
  if (daysLeft <= 180) return "watch";
  return "later";
}

const BUCKET_TONE: Record<ExpiryBucket, PillTone> = {
  expired: "rose",
  within30: "rose",
  within90: "amber",
  watch: "blue",
  later: "green",
};

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Expired ${-daysLeft} ${daysLeft === -1 ? "day" : "days"} ago`;
  if (daysLeft === 0) return "Expires today";
  return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
}

/**
 * Batches that still hold stock and expire within 180 days (or already have), soonest first.
 * `names` maps medicine ids to names for batches the API sends without one.
 */
export function buildExpiryRows(
  batches: StockBatchRecord[] | undefined,
  names: Map<string, string>,
  now: Date = new Date(),
): ExpiryRow[] {
  return (batches ?? [])
    .filter((batch) => batch.quantityOnHand > 0 && batch.expiryDate)
    .map((batch): ExpiryRow => {
      const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - now.getTime()) / DAY_MS);
      const bucket = expiryBucket(daysLeft);
      return {
        batchId: batch.id,
        productId: batch.productId,
        medicineName: batch.medicineName || names.get(batch.productId) || "Medicine",
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
        daysLeft,
        onHand: batch.quantityOnHand,
        costPrice: batch.costPrice,
        bucket,
        tone: BUCKET_TONE[bucket],
        daysLabel: daysLabel(daysLeft),
      };
    })
    .filter((row) => row.bucket !== "later")
    .sort((left, right) => left.expiryDate.localeCompare(right.expiryDate));
}

export function countByBucket(rows: ExpiryRow[]): Record<Exclude<ExpiryBucket, "later">, number> {
  const counts = { expired: 0, within30: 0, within90: 0, watch: 0 };
  rows.forEach((row) => {
    if (row.bucket !== "later") counts[row.bucket] += 1;
  });
  return counts;
}

// ── Reorder suggestions ────────────────────────────────────────────────────

export interface ReorderCandidate {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  maxStock: number;
  price: number;
}

export interface ReorderLine {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  quantity: number;
  /** quantity x unit price; 0 when the price is not known. */
  cost: number;
}

/**
 * Units to order for a medicine at or below its level: up to the maximum level when one is set,
 * otherwise twice the minimum level; at least 1.
 */
export function suggestReorderQuantity(row: Pick<ReorderCandidate, "stock" | "minStock" | "maxStock">): number {
  const target = row.maxStock > row.minStock ? row.maxStock : row.minStock * 2;
  return Math.max(1, Math.ceil(target - row.stock));
}

/**
 * Reorder lines: the quantity a reorder rule suggests when there is a rule for the medicine,
 * otherwise `suggestReorderQuantity`.
 */
export function buildReorderLines(
  candidates: ReorderCandidate[],
  ruleSuggestions: Array<{ productId: string; suggestedQuantity: number | null }> = [],
): ReorderLine[] {
  const fromRules = new Map(
    ruleSuggestions
      .filter((rule) => rule.suggestedQuantity !== null && rule.suggestedQuantity > 0)
      .map((rule) => [rule.productId, rule.suggestedQuantity as number]),
  );
  return candidates.map((row) => {
    const quantity = fromRules.get(row.id) ?? suggestReorderQuantity(row);
    return {
      id: row.id,
      name: row.name,
      stock: row.stock,
      minStock: row.minStock,
      quantity,
      cost: Number((quantity * (row.price || 0)).toFixed(2)),
    };
  });
}

// ── Purchase order message ─────────────────────────────────────────────────

/** WhatsApp / email text asking the supplier to confirm a purchase order. */
export function purchaseOrderMessage(order: {
  reference: string;
  supplierName: string;
  expectedLabel: string;
  lines: Array<{ name: string; quantity: number }>;
  clinicName?: string;
}): string {
  const items = order.lines.map((line) => `${line.quantity} x ${line.name}`).join(", ");
  const greeting = order.supplierName ? `Hello ${order.supplierName},` : "Hello,";
  const from = order.clinicName ? ` from ${order.clinicName}` : "";
  const delivery = order.expectedLabel ? ` Delivery needed by ${order.expectedLabel}.` : "";
  return `${greeting} this is a purchase order${from}. Please confirm ${order.reference}: ${items}.${delivery}`;
}

/** wa.me link for an Indian mobile number, or null when the number is not usable. */
export function whatsAppLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  if (number.length < 11) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ── Hand-over code ─────────────────────────────────────────────────────────

/** Longest thing the hand-over field accepts: `TBD-HO:` + a 36-char UUID + `:` + 6 digits, plus slack. */
export const HANDOVER_INPUT_MAX_LENGTH = 64;

const HANDOVER_QR_TEXT = /^TBD-HO:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d{6})$/i;

/**
 * Cleans what a keyboard-wedge scanner or a paste puts in the field: drops line breaks, tabs
 * and spaces (scanners often append Enter/Tab) and keeps only characters a code or QR text can hold.
 */
export function normalizeHandoverInput(input: string): string {
  return input.replace(/\s+/g, "").replace(/[^0-9A-Za-z:-]/g, "").slice(0, HANDOVER_INPUT_MAX_LENGTH);
}

/**
 * Reads what the counter got from the patient: the 6-digit code typed in, or the QR payload
 * `TBD-HO:<handoverId>:<code>` from the scanner (camera, wedge scanner or paste). The QR text is
 * sent as-is (prefix upper-cased, id lower-cased) so the API can also check it names this hand-over.
 * Null when it is neither.
 */
export function parseHandoverCode(input: string): { code: string; method: "QR" | "OTP" } | null {
  const value = normalizeHandoverInput(input);
  const qr = HANDOVER_QR_TEXT.exec(value);
  if (qr?.[1] && qr[2]) return { code: `TBD-HO:${qr[1].toLowerCase()}:${qr[2]}`, method: "QR" };
  return /^\d{6}$/.test(value) ? { code: value, method: "OTP" } : null;
}
