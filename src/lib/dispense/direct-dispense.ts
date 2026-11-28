/**
 * Direct dispensing from clinic stock (API_CONTRACT §6, `/direct-dispense/*`): the shapes the
 * screens use and the pure helpers around them. Shared by the doctor (DocDispense) and the
 * assistant doctor (AsDispense, AsStockView); the hooks live in `hooks/query/useDirectDispense.ts`.
 *
 * Billing blindness: for DOCTOR / ASSISTANT_DOCTOR the server strips `price`, `unitPrice`,
 * `lineAmount`, `totalAmount` and `settled*`, so none of them is read here.
 */

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

export type StockStatus = "IN_STOCK" | "LOW" | "OUT";

export interface DispenseStockItem {
  medicineId: string;
  name: string;
  category: string;
  unit: string;
  manufacturer: string;
  quantityOnHand: number;
  minStockThreshold: number;
  status: StockStatus;
  /** ISO date of the batch that goes first (FEFO); "" when unknown. */
  nearestExpiry: string;
  expiringSoon: boolean;
}

export interface DispenseBatch {
  lotNumber: string;
  quantity: number;
  expiryDate: string;
}

export interface DirectDispenseLine {
  medicineId: string;
  medicineName: string;
  quantity: number;
  batches: DispenseBatch[];
}

export type DirectDispenseStatus = "DISPENSED" | "REVERSED";

export interface DirectDispense {
  id: string;
  status: DirectDispenseStatus;
  patientId: string;
  patientName: string;
  prescriptionId: string;
  note: string;
  dispensedByUserId: string;
  dispensedByRole: string;
  dispensedByName: string;
  createdAt: string;
  undoUntil: string;
  canUndo: boolean;
  reversedAt: string;
  reverseReason: string;
  items: DirectDispenseLine[];
}

/** Who the medicines are for: a registered patient or a walk-in. */
export type DispenseRecipient =
  | { kind: "patient"; patientId: string; name: string }
  | { kind: "walk-in"; name: string; phone: string };

/** One line of the hand-over list being built. */
export interface DispenseDraftLine {
  medicineId: string;
  name: string;
  unit: string;
  quantity: number;
  quantityOnHand: number;
  minStockThreshold: number;
  nearestExpiry: string;
  expiringSoon: boolean;
}

export interface CreateDirectDispenseInput {
  patientId?: string;
  walkInName?: string;
  walkInPhone?: string;
  prescriptionId?: string;
  locationId?: string;
  note?: string;
  items: Array<{ medicineId: string; quantity: number }>;
}

function toStockStatus(value: unknown, onHand: number, threshold: number): StockStatus {
  const status = text(value).toUpperCase();
  if (status === "IN_STOCK" || status === "LOW" || status === "OUT") return status;
  if (onHand <= 0) return "OUT";
  return threshold > 0 && onHand <= threshold ? "LOW" : "IN_STOCK";
}

export function normalizeStockItem(input: unknown): DispenseStockItem {
  const raw = asRecord(input);
  const quantityOnHand = num(raw.quantityOnHand);
  const minStockThreshold = num(raw.minStockThreshold);
  return {
    medicineId: text(raw.medicineId) || text(raw.id),
    name: text(raw.name) || "Medicine",
    category: text(raw.category),
    unit: text(raw.unit),
    manufacturer: text(raw.manufacturer),
    quantityOnHand,
    minStockThreshold,
    status: toStockStatus(raw.status, quantityOnHand, minStockThreshold),
    nearestExpiry: text(raw.nearestExpiry),
    expiringSoon: raw.expiringSoon === true,
  };
}

/** `{ items, total }` (or a bare list) -> stock rows. */
export function normalizeStockList(payload: unknown): { items: DispenseStockItem[]; total: number } {
  const record = asRecord(payload);
  const list = Array.isArray(payload) ? payload : asList(record.items);
  const items = list.map(normalizeStockItem).filter((item) => item.medicineId);
  return { items, total: num(record.total) || items.length };
}

export function normalizeDirectDispense(input: unknown): DirectDispense {
  const raw = asRecord(input);
  return {
    id: text(raw.id),
    status: text(raw.status).toUpperCase() === "REVERSED" ? "REVERSED" : "DISPENSED",
    patientId: text(raw.patientId),
    patientName: text(raw.patientName) || "Walk-in",
    prescriptionId: text(raw.prescriptionId),
    note: text(raw.note),
    dispensedByUserId: text(raw.dispensedByUserId),
    dispensedByRole: text(raw.dispensedByRole).toUpperCase(),
    dispensedByName: text(raw.dispensedByName),
    createdAt: text(raw.createdAt),
    undoUntil: text(raw.undoUntil),
    canUndo: raw.canUndo === true,
    reversedAt: text(raw.reversedAt),
    reverseReason: text(raw.reverseReason),
    items: asList(raw.items).map((entry) => {
      const item = asRecord(entry);
      return {
        medicineId: text(item.medicineId),
        medicineName: text(item.medicineName) || "Medicine",
        quantity: num(item.quantity),
        batches: asList(item.batches).map((batch) => {
          const b = asRecord(batch);
          return { lotNumber: text(b.lotNumber), quantity: num(b.quantity), expiryDate: text(b.expiryDate) };
        }),
      };
    }),
  };
}

export function normalizeDirectDispenses(payload: unknown): DirectDispense[] {
  const record = asRecord(payload);
  const list = Array.isArray(payload) ? payload : asList(record.items).length ? asList(record.items) : asList(record.data);
  return list.map(normalizeDirectDispense).filter((row) => row.id);
}

/** A stock row turned into a hand-over line with a starting quantity (never above what is on hand). */
export function draftLineFromStock(item: DispenseStockItem, quantity = 1): DispenseDraftLine {
  return {
    medicineId: item.medicineId,
    name: item.name,
    unit: item.unit,
    quantity: clampQuantity(quantity, item.quantityOnHand),
    quantityOnHand: item.quantityOnHand,
    minStockThreshold: item.minStockThreshold,
    nearestExpiry: item.nearestExpiry,
    expiringSoon: item.expiringSoon,
  };
}

/** Whole number between 1 and what is on hand (0 when nothing is on hand). */
export function clampQuantity(value: number, onHand: number): number {
  if (onHand <= 0) return 0;
  const whole = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.min(Math.max(whole, 1), onHand);
}

export function stockAfter(line: Pick<DispenseDraftLine, "quantity" | "quantityOnHand">): number {
  return Math.max(0, line.quantityOnHand - line.quantity);
}

/** True when the hand-over leaves the item at or below its reorder level. */
export function leavesLowStock(line: Pick<DispenseDraftLine, "quantity" | "quantityOnHand" | "minStockThreshold">): boolean {
  return line.minStockThreshold > 0 && stockAfter(line) <= line.minStockThreshold;
}

export function totalUnits(lines: ReadonlyArray<Pick<DispenseDraftLine, "quantity">>): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Why the hand-over cannot be confirmed yet; null when it can. */
export function dispenseBlocker(recipient: DispenseRecipient | null, lines: readonly DispenseDraftLine[]): string | null {
  if (!recipient) return "Choose who the medicines are for.";
  if (recipient.kind === "walk-in" && recipient.name.trim().length < 2) return "Enter the walk-in patient's name.";
  if (lines.length === 0) return "Add at least one medicine from stock.";
  const bad = lines.find((line) => line.quantity < 1 || line.quantity > line.quantityOnHand);
  return bad ? `Check the quantity of ${bad.name}: ${bad.quantityOnHand} in stock.` : null;
}

/** The request body for POST /direct-dispense. */
export function buildDispenseRequest(
  recipient: DispenseRecipient,
  lines: readonly DispenseDraftLine[],
  extra: { prescriptionId?: string | undefined; locationId?: string | undefined; note?: string | undefined } = {},
): CreateDirectDispenseInput {
  const note = extra.note?.trim();
  return {
    ...(recipient.kind === "patient"
      ? { patientId: recipient.patientId }
      : { walkInName: recipient.name.trim(), ...(recipient.phone.trim() ? { walkInPhone: recipient.phone.trim() } : {}) }),
    ...(extra.prescriptionId ? { prescriptionId: extra.prescriptionId } : {}),
    ...(extra.locationId ? { locationId: extra.locationId } : {}),
    ...(note ? { note } : {}),
    items: lines.map((line) => ({ medicineId: line.medicineId, quantity: line.quantity })),
  };
}

/**
 * Prescription lines matched to clinic stock: the hand-over list "Load from prescription" fills in.
 * A line whose medicine is not in stock (or has none on hand) is reported in `missing`.
 */
export function linesFromPrescription(
  prescriptionItems: ReadonlyArray<{ medicineId: string; name: string; quantity: number }>,
  stock: readonly DispenseStockItem[],
): { lines: DispenseDraftLine[]; missing: string[] } {
  const byId = new Map(stock.map((item) => [item.medicineId, item]));
  const lines: DispenseDraftLine[] = [];
  const missing: string[] = [];
  for (const item of prescriptionItems) {
    const stocked = item.medicineId ? byId.get(item.medicineId) : undefined;
    if (!stocked || stocked.quantityOnHand <= 0) {
      missing.push(item.name);
      continue;
    }
    lines.push(draftLineFromStock(stocked, item.quantity > 0 ? item.quantity : 1));
  }
  return { lines, missing };
}

/** "Paracetamol 650 × 9, Cetirizine 10 × 5" */
export function dispenseItemsLabel(items: ReadonlyArray<{ medicineName: string; quantity: number }>): string {
  return items.map((item) => `${item.medicineName} × ${item.quantity}`).join(", ");
}

/** "06/2027" from an ISO date; "" when unknown. */
export function expiryLabel(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}
