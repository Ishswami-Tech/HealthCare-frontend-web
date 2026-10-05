import { normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { formatDateInIST, formatDateKeyInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";

/**
 * Pure helpers for the pharmacy dashboard: they turn the raw payloads of
 * `useMedicineDeskQueue`, `usePrescriptions`, `useInventory` and `usePharmacyStats`
 * into the small view models the cards render. No React, no fetching.
 */

export type DeskQueueState =
  | "ready_to_dispense"
  | "partially_dispensed"
  | "awaiting_payment"
  | "payment_expired";

export interface DeskQueueLine {
  id: string;
  name: string;
  /** Prescribed quantity; 0 when the API sent only the medicine name. */
  quantity: number;
  /** Quantity still to hand over. */
  remaining: number;
  /** "5 ml · twice a day · 5 days" — whatever the doctor filled in. */
  directions: string;
  unitPrice: number;
  /** Stock on hand for this medicine; null when the API did not send it. */
  stock: number | null;
}

export interface DeskQueueItem {
  id: string;
  patientName: string;
  /** Short reference shown to the pharmacist (derived from the prescription id). */
  reference: string;
  doctorName: string;
  /** When the doctor sent the prescription (ISO); null when unknown. */
  sentAt: string | null;
  diagnosis: string;
  locationName: string;
  lines: DeskQueueLine[];
  itemsCount: number;
  itemsLeft: number;
  totalAmount: number | null;
  paidAmount: number | null;
  pendingAmount: number | null;
  /** True when a completed cash payment is linked to the prescription. */
  paidInCash: boolean;
  /** Time of the latest failed online payment (ISO); null when there is none. */
  failedOnlinePaymentAt: string | null;
  priority: string;
  state: DeskQueueState;
  invoiceId: string | null;
}

export interface PharmacyDashboardStats {
  toFill: number;
  paymentDue: number;
  dispensedToday: number;
  lowStock: number;
  thisMonth: number;
}

export interface StockAlert {
  id: string;
  name: string;
  stock: number;
  reorderAt: number;
  unit: string;
  outOfStock: boolean;
  /** Value for the `item` query string of the restock link: the medicine id, else its name. */
  restockKey: string;
}

export interface InventorySummary {
  /** Every medicine that is out of stock or at / below its reorder level, worst first. */
  alerts: StockAlert[];
  lowCount: number;
  outCount: number;
  totalMedicines: number;
  inStock: number;
  /** Medicines that expire within 90 days; null when no medicine has an expiry date. */
  expiringSoon: number | null;
}

export interface CashRecordedNotice {
  prescriptionId: string;
  patientName: string;
  reference: string;
  /** Cash taken in this payment; null when the server did not report an amount. */
  amount: number | null;
  /** Amount still unpaid after this payment. */
  stillDue: number;
  alreadyPaid: boolean;
  recordedAt: string;
  recordedBy: string;
}

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function amount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const raw = text(value);
  if (!raw) return null;
  return Number.isNaN(new Date(raw).getTime()) ? null : raw;
}

/** Lists come back either as an array or wrapped in an object (`{ prescriptions: [] }`). */
export function unwrapList(value: unknown, key: string): unknown[] {
  if (Array.isArray(value)) return value;
  return asList(asRecord(value)[key]);
}

const rupeeFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** "₹1,240" — amounts on this screen are whole rupees or rupees with paise. */
export function formatRupees(value: number): string {
  return `₹${rupeeFormat.format(value)}`;
}

export function prescriptionReference(raw: unknown, id: string): string {
  const record = asRecord(raw);
  const given = text(record.prescriptionNumber) || text(record.referenceNumber);
  if (given) return given;
  const compact = id.replace(/[^a-zA-Z0-9]/g, "");
  return compact ? `RX-${compact.slice(0, 8).toUpperCase()}` : "";
}

function buildLines(prescription: Raw): DeskQueueLine[] {
  const items = asList(prescription.items);
  if (items.length > 0) {
    return items.map((entry, index) => {
      const item = asRecord(entry);
      const medicine = asRecord(item.medicine);
      const quantity = Math.max(0, amount(item.quantity) ?? 0);
      const dispensed = Math.max(0, amount(item.dispensedQuantity) ?? 0);
      const stock = amount(medicine.stock ?? medicine.stockQuantity ?? medicine.currentStock);
      return {
        id: text(item.id) || `${text(item.medicineId) || "line"}-${index}`,
        name: text(medicine.name) || text(item.medicineName) || text(item.name) || "Medicine",
        quantity,
        remaining: Math.max(0, quantity - dispensed),
        directions: [text(item.dosage), text(item.frequency), text(item.duration)].filter(Boolean).join(" · "),
        unitPrice: amount(medicine.price ?? item.unitPrice) ?? 0,
        stock,
      };
    });
  }

  // Older payloads only carry the medicine names.
  const names = asList(prescription.medicines).length > 0 ? asList(prescription.medicines) : asList(prescription.medicineNames);
  return names.map((entry, index) => ({
    id: `name-${index}`,
    name: typeof entry === "string" ? entry : text(asRecord(entry).name) || "Medicine",
    quantity: 0,
    remaining: 0,
    directions: "",
    unitPrice: 0,
    stock: null,
  }));
}

/** Normalises the medicine-desk queue payload into the rows the dashboard shows, in queue order. */
export function buildDeskQueue(queueData: unknown): DeskQueueItem[] {
  return unwrapList(queueData, "queue").reduce<DeskQueueItem[]>((items, entryRaw) => {
    const prescription = asRecord(entryRaw);
    if (!prescription.id) return items;

    const entry = normalizeQueueEntry(prescription);
    const paymentStatus = upper(entry.paymentStatus);
    const lines = buildLines(prescription);
    const itemsLeft = lines.filter((line) => line.remaining > 0).length;
    const partlyGiven =
      upper(prescription.status) === "PARTIAL" || lines.some((line) => line.quantity > 0 && line.remaining < line.quantity && line.remaining > 0);

    const state: DeskQueueState = ["EXPIRED", "CANCELLED"].includes(paymentStatus)
      ? "payment_expired"
      : Boolean(entry.readyForHandover) || paymentStatus === "PAID" || prescription.canDispense === true
        ? partlyGiven
          ? "partially_dispensed"
          : "ready_to_dispense"
        : "awaiting_payment";

    const payments = asList(prescription.payments).map(asRecord);
    const paymentMethod = (payment: Raw) => upper(payment.method) || upper(asRecord(payment.metadata).paymentMethod);
    const paidInCash = payments.some(
      (payment) => upper(payment.status) === "COMPLETED" && paymentMethod(payment) === "CASH",
    );
    const failedOnline = payments
      .filter((payment) => upper(payment.status) === "FAILED" && paymentMethod(payment) !== "CASH")
      .map((payment) => isoDate(payment.createdAt))
      .filter((value): value is string => Boolean(value))
      .sort()
      .pop();

    const doctorName = text(entry.doctorName);
    const id = String(entry.entryId || prescription.id);

    items.push({
      id,
      patientName: entry.patientName || "Unknown Patient",
      reference: prescriptionReference(prescription, id),
      doctorName: doctorName && doctorName.toLowerCase() !== "unknown doctor" ? formatDoctorDisplayName(doctorName) : "",
      sentAt: isoDate(prescription.prescribedAt) ?? isoDate(prescription.date) ?? isoDate(prescription.createdAt),
      diagnosis: text(prescription.diagnosis),
      locationName: text(prescription.locationName),
      lines,
      itemsCount: lines.length || (amount(prescription.itemsCount) ?? 0),
      itemsLeft,
      totalAmount: amount(prescription.totalAmount),
      paidAmount: amount(prescription.paidAmount),
      pendingAmount: amount(prescription.pendingAmount),
      paidInCash,
      failedOnlinePaymentAt: failedOnline ?? null,
      priority: text(prescription.priority).toLowerCase() || "normal",
      state,
      invoiceId: text(prescription.invoiceId) || null,
    });
    return items;
  }, []);
}

export function isUrgent(item: Pick<DeskQueueItem, "priority">): boolean {
  return item.priority === "urgent" || item.priority === "high";
}

export function canDispense(item: Pick<DeskQueueItem, "state">): boolean {
  return item.state === "ready_to_dispense" || item.state === "partially_dispensed";
}

/** The prescription the pharmacist should pick up next: first one ready to hand over, else first one waiting for payment. */
export function pickNextPrescription(queue: DeskQueueItem[]): DeskQueueItem | null {
  return queue.find(canDispense) ?? queue.find((item) => item.state === "awaiting_payment") ?? null;
}

export function filterDeskQueue(queue: DeskQueueItem[], searchTerm: string): DeskQueueItem[] {
  const needle = searchTerm.trim().toLowerCase();
  if (!needle) return queue;
  return queue.filter((item) => item.patientName.toLowerCase().includes(needle));
}

export const DESK_STATE_LABEL: Record<DeskQueueState, string> = {
  ready_to_dispense: "Ready to dispense",
  partially_dispensed: "Partially dispensed",
  awaiting_payment: "Payment pending",
  payment_expired: "Payment expired",
};

export const DESK_STATE_TONE: Record<DeskQueueState, "green" | "blue" | "amber" | "slate"> = {
  ready_to_dispense: "green",
  partially_dispensed: "blue",
  awaiting_payment: "amber",
  payment_expired: "slate",
};

/** "2 items" */
export function itemsLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

/** Second line of the Medicines cell: amount and what is still open. */
export function moneyLine(item: DeskQueueItem): string {
  const total = item.totalAmount !== null && item.totalAmount > 0 ? formatRupees(item.totalAmount) : "";
  const parts: string[] = [];
  switch (item.state) {
    case "awaiting_payment": {
      const due = item.pendingAmount !== null && item.pendingAmount > 0 ? formatRupees(item.pendingAmount) : total;
      if (due) parts.push(due);
      parts.push("to collect");
      break;
    }
    case "partially_dispensed":
      if (total) parts.push(total);
      parts.push(item.itemsLeft > 0 ? `${itemsLabel(item.itemsLeft)} left` : "partly given");
      break;
    case "payment_expired":
      if (total) parts.push(total);
      parts.push("not paid");
      break;
    default:
      if (total) parts.push(total);
      parts.push(item.totalAmount === 0 ? "nothing to pay" : item.paidInCash ? "paid, cash" : "paid");
  }
  return parts.join(" · ");
}

/** "12:14 pm" today, "Yesterday", otherwise "2 Oct". */
export function sentTimeLabel(sentAt: string | null, now: Date = new Date()): string {
  if (!sentAt) return "";
  const dayKey = formatDateKeyInIST(sentAt);
  if (!dayKey) return "";
  if (dayKey === formatDateKeyInIST(now)) return formatTimeInIST(sentAt).toLowerCase();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey === formatDateKeyInIST(yesterday)) return "Yesterday";
  return formatDateInIST(sentAt, { day: "numeric", month: "short" });
}

/** "3 Oct 2026, 11:18 am" */
export function sentDateTimeLabel(sentAt: string | null): string {
  if (!sentAt) return "";
  const date = formatDateInIST(sentAt, { day: "numeric", month: "short", year: "numeric" });
  const time = formatTimeInIST(sentAt).toLowerCase();
  return [date, time].filter(Boolean).join(", ");
}

/** "Saturday, 3 October" */
export function todayLabel(now: Date = new Date()): string {
  const weekday = formatDateInIST(now, { weekday: "long" });
  const day = formatDateInIST(now, { day: "numeric", month: "long" });
  return [weekday, day].filter(Boolean).join(", ");
}

// ── Stock ──────────────────────────────────────────────────────────────────

export function buildInventorySummary(inventoryData: unknown): InventorySummary {
  const medicines = unwrapList(inventoryData, "inventory").map(asRecord);
  const alerts: StockAlert[] = [];
  let inStock = 0;
  let datedMedicines = 0;
  let expiringSoon = 0;

  medicines.forEach((medicine, index) => {
    const stock = amount(medicine.currentStock ?? medicine.stockQuantity ?? medicine.stock ?? medicine.quantity) ?? 0;
    const reorderAt =
      amount(medicine.minStock ?? medicine.minThreshold ?? medicine.minStockThreshold ?? medicine.minStockLevel) ?? 0;
    const name = text(medicine.name) || text(medicine.medicineName) || "Medicine";

    if (stock > 0) inStock += 1;
    if (stock <= 0 || (reorderAt > 0 && stock <= reorderAt)) {
      alerts.push({
        id: text(medicine.id) || `${name}-${index}`,
        name,
        stock: Math.max(0, stock),
        reorderAt,
        unit: text(medicine.unit) || "units",
        outOfStock: stock <= 0,
        restockKey: text(medicine.id) || name,
      });
    }

    const daysToExpiry = amount(medicine.daysToExpiry);
    if (medicine.expiryDate || daysToExpiry !== null) {
      datedMedicines += 1;
      if (medicine.isExpiringSoon === true || (daysToExpiry !== null && daysToExpiry <= 90)) expiringSoon += 1;
    }
  });

  alerts.sort((left, right) => {
    if (left.outOfStock !== right.outOfStock) return left.outOfStock ? -1 : 1;
    const leftRatio = left.reorderAt > 0 ? left.stock / left.reorderAt : 0;
    const rightRatio = right.reorderAt > 0 ? right.stock / right.reorderAt : 0;
    return leftRatio - rightRatio;
  });

  const outCount = alerts.filter((alert) => alert.outOfStock).length;
  return {
    alerts,
    outCount,
    lowCount: alerts.length - outCount,
    totalMedicines: medicines.length,
    inStock,
    expiringSoon: datedMedicines > 0 ? expiringSoon : null,
  };
}

// ── Numbers in the banner ──────────────────────────────────────────────────

const OPEN_STATUSES = new Set(["PENDING", "PARTIAL", "WAITING_FOR_PAYMENT", "READY_FOR_HANDOVER"]);
const DISPENSED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED"]);
const DEAD_PAYMENT_STATUSES = new Set(["EXPIRED", "CANCELLED"]);

/** Latest hand-over time of a prescription (ISO), from its lines or its own fields. */
function dispensedAt(prescription: Raw): string | null {
  const fromLines = asList(prescription.items)
    .map((item) => isoDate(asRecord(item).dispensedAt))
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
    .pop();
  return fromLines ?? isoDate(prescription.dispensedAt) ?? isoDate(prescription.completedAt);
}

export function buildPharmacyStats(
  prescriptionsData: unknown,
  inventory: InventorySummary,
  pharmacyStats: unknown,
  now: Date = new Date(),
): PharmacyDashboardStats {
  const todayKey = formatDateKeyInIST(now);
  const monthKey = todayKey.slice(0, 7);
  let toFill = 0;
  let paymentDue = 0;
  let dispensedToday = 0;
  let dispensedThisMonth = 0;

  for (const entry of unwrapList(prescriptionsData, "prescriptions")) {
    const prescription = asRecord(entry);
    const status = upper(prescription.status);
    const paymentStatus = upper(prescription.paymentStatus) || "PENDING";
    const open =
      typeof prescription.activeQueueEntry === "boolean" ? prescription.activeQueueEntry : OPEN_STATUSES.has(status);

    if (open && !DISPENSED_STATUSES.has(status) && !DEAD_PAYMENT_STATUSES.has(paymentStatus)) {
      toFill += 1;
      if (paymentStatus !== "PAID") paymentDue += 1;
    }

    if (DISPENSED_STATUSES.has(status)) {
      const handedOverAt = dispensedAt(prescription);
      const dayKey = handedOverAt ? formatDateKeyInIST(handedOverAt) : "";
      if (dayKey && dayKey === todayKey) dispensedToday += 1;
      if (dayKey && dayKey.slice(0, 7) === monthKey) dispensedThisMonth += 1;
    }
  }

  const monthlyFromApi = amount(asRecord(pharmacyStats).monthlyDispensed);
  return {
    toFill,
    paymentDue,
    dispensedToday,
    lowStock: inventory.alerts.length,
    thisMonth: monthlyFromApi ?? dispensedThisMonth,
  };
}

// ── Cash payment ───────────────────────────────────────────────────────────

/** Builds the success notice from what the server returned for the cash payment. */
export function buildCashRecordedNotice(
  item: DeskQueueItem,
  result: unknown,
  recordedBy: string,
  now: Date = new Date(),
): CashRecordedNotice {
  const response = asRecord(result);
  const paidAfter = amount(response.paidAmount);
  const stillDue = Math.max(0, amount(response.pendingAmount) ?? 0);
  const alreadyPaid = response.alreadyPaid === true;
  const collected =
    paidAfter !== null && item.paidAmount !== null
      ? Math.max(0, Number((paidAfter - item.paidAmount).toFixed(2)))
      : item.pendingAmount !== null
        ? Math.max(0, Number((item.pendingAmount - stillDue).toFixed(2)))
        : null;

  return {
    prescriptionId: text(response.prescriptionId) || item.id,
    patientName: item.patientName,
    reference: item.reference,
    amount: alreadyPaid ? null : collected,
    stillDue,
    alreadyPaid,
    recordedAt: now.toISOString(),
    recordedBy,
  };
}
