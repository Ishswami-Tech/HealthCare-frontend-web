/**
 * Batch (lot) choice of the dispense form. Pure helpers, no React.
 *
 * The server consumes stock earliest expiry first (FEFO) and honours a batch the pharmacist
 * picks (it checks the batch belongs to the medicine, is not expired and has the units). So the
 * form pre-fills the FEFO batches, shows their expiry read-only (it comes from the stock record,
 * never typed) and lets the pharmacist change the batch from the list of usable lots. A medicine
 * with no tracked batch keeps typed batch number and expiry, which the server records as given.
 */

import type { StockBatchRecord } from "@/types/pharmacy.types";

/** A usable lot of one medicine: in stock and not expired. */
export type BatchOption = {
  lotNumber: string;
  /** yyyy-mm-dd */
  expiryDate: string;
  quantityOnHand: number;
};

/** Usable lots per medicine id. A medicine missing from the map has not been loaded. */
export type BatchOptionsByMedicine = ReadonlyMap<string, readonly BatchOption[]>;

export type AllocatedBatchRow = {
  quantity: string;
  batchNumber: string;
  expiryDate: string;
};

function dayKey(value: string): string {
  return value ? value.slice(0, 10) : "";
}

/** Lots that can be dispensed now, earliest expiry first. */
export function usableBatchOptions(records: readonly StockBatchRecord[], nowMs: number): BatchOption[] {
  return records
    .filter((record) => record.lotNumber && record.quantityOnHand > 0)
    .filter((record) => {
      const expiry = Date.parse(record.expiryDate);
      return Number.isFinite(expiry) && expiry > nowMs;
    })
    .sort((a, b) => Date.parse(a.expiryDate) - Date.parse(b.expiryDate))
    .map((record) => ({
      lotNumber: record.lotNumber,
      expiryDate: dayKey(record.expiryDate),
      quantityOnHand: record.quantityOnHand,
    }));
}

/**
 * Splits `quantity` over the lots earliest expiry first, as the server would. Units no lot
 * covers stay on a row without a batch (the server takes them from un-batched stock).
 */
export function allocateFefoRows(quantity: number, options: readonly BatchOption[]): AllocatedBatchRow[] {
  const rows: AllocatedBatchRow[] = [];
  let remaining = Math.max(0, Math.floor(quantity));
  for (const option of options) {
    if (remaining <= 0) break;
    const take = Math.min(option.quantityOnHand, remaining);
    if (take <= 0) continue;
    rows.push({ quantity: String(take), batchNumber: option.lotNumber, expiryDate: option.expiryDate });
    remaining -= take;
  }
  if (remaining > 0 || rows.length === 0) {
    rows.push({ quantity: String(remaining), batchNumber: "", expiryDate: "" });
  }
  return rows;
}

export function findBatchOption(
  options: readonly BatchOption[] | undefined,
  lotNumber: string,
): BatchOption | undefined {
  const wanted = lotNumber.trim().toUpperCase();
  if (!wanted || !options) return undefined;
  return options.find((option) => option.lotNumber.trim().toUpperCase() === wanted);
}

export type BatchRowCheck = { error: string } | { error?: undefined };

/**
 * Checks one batch row of a medicine whose lots are known.
 * - Tracked medicine (lots listed): a chosen lot must be one of them and hold the units; an
 *   empty lot lets the server pick earliest expiry first.
 * - No tracked batch: batch number and expiry are typed from the pack and both required.
 */
export function checkBatchRow(
  medicineName: string,
  row: { quantity: number; batchNumber: string; expiryDate: string },
  options: readonly BatchOption[],
): BatchRowCheck {
  const batchNumber = row.batchNumber.trim();
  if (options.length > 0) {
    if (!batchNumber) return {};
    const option = findBatchOption(options, batchNumber);
    if (!option) {
      return { error: `Batch ${batchNumber} is not in stock for ${medicineName}. Pick one from the list.` };
    }
    if (row.quantity > option.quantityOnHand) {
      return { error: `Batch ${option.lotNumber} of ${medicineName} has only ${option.quantityOnHand} left.` };
    }
    return {};
  }
  if (!batchNumber) return { error: `Enter a batch number for ${medicineName}.` };
  if (!row.expiryDate.trim()) return { error: `Enter an expiry date for ${medicineName}.` };
  return {};
}
