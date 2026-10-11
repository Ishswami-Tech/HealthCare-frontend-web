import { normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { formatDateInIST, formatDateKeyInIST, formatTimeLabel } from "@/lib/utils/date-time";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import { asList, asRecordOrEmpty, isoDateOrNull, numberOrNull, textOf, unwrapList } from "@/lib/utils/coerce";
import { formatRupees } from "@/lib/utils/currency";
import { plural, prescriptionReference } from "@/lib/utils/labels";
import type { DeskQueueState } from "@/lib/pharmacy/desk-state";

/**
 * Pure helpers for the pharmacy dashboard: they turn the raw payloads of
 * `useMedicineDeskQueue`, `usePrescriptions`, `useInventory` and `usePharmacyStats`
 * into the small view models the cards render. No React, no fetching.
 */

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

function upper(value: unknown): string {
  return textOf(value).toUpperCase();
}

function buildLines(prescription: Raw): DeskQueueLine[] {
  const items = asList(prescription.items);
  if (items.length > 0) {
    return items.map((entry, index) => {
      const item = asRecordOrEmpty(entry);
      const medicine = asRecordOrEmpty(item.medicine);
      const quantity = Math.max(0, numberOrNull(item.quantity) ?? 0);
      const dispensed = Math.max(0, numberOrNull(item.dispensedQuantity) ?? 0);
      const stock = numberOrNull(medicine.stock ?? medicine.stockQuantity ?? medicine.currentStock);
      return {
        id: textOf(item.id) || `${textOf(item.medicineId) || "line"}-${index}`,
        name: textOf(medicine.name) || textOf(item.medicineName) || textOf(item.name) || "Medicine",
        quantity,
        remaining: Math.max(0, quantity - dispensed),
        directions: [textOf(item.dosage), textOf(item.frequency), textOf(item.duration)].filter(Boolean).join(" · "),
        unitPrice: numberOrNull(medicine.price ?? item.unitPrice) ?? 0,
        stock,
      };
    });
  }

  // Older payloads only carry the medicine names.
  const names = asList(prescription.medicines).length > 0 ? asList(prescription.medicines) : asList(prescription.medicineNames);
  return names.map((entry, index) => ({
    id: `name-${index}`,
    name: typeof entry === "string" ? entry : textOf(asRecordOrEmpty(entry).name) || "Medicine",
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
    const prescription = asRecordOrEmpty(entryRaw);
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

    const payments = asList(prescription.payments).map(asRecordOrEmpty);
    const paymentMethod = (payment: Raw) => upper(payment.method) || upper(asRecordOrEmpty(payment.metadata).paymentMethod);
    const paidInCash = payments.some(
      (payment) => upper(payment.status) === "COMPLETED" && paymentMethod(payment) === "CASH",
    );
    const failedOnline = payments
      .filter((payment) => upper(payment.status) === "FAILED" && paymentMethod(payment) !== "CASH")
      .map((payment) => isoDateOrNull(payment.createdAt))
      .filter((value): value is string => Boolean(value))
      .sort()
      .pop();

    const doctorName = textOf(entry.doctorName);
    const id = String(entry.entryId || prescription.id);

    items.push({
      id,
      patientName: entry.patientName || "Unknown Patient",
      reference: prescriptionReference(id, prescription),
      doctorName: doctorName && doctorName.toLowerCase() !== "unknown doctor" ? formatDoctorDisplayName(doctorName) : "",
      sentAt: isoDateOrNull(prescription.prescribedAt) ?? isoDateOrNull(prescription.date) ?? isoDateOrNull(prescription.createdAt),
      diagnosis: textOf(prescription.diagnosis),
      locationName: textOf(prescription.locationName),
      lines,
      itemsCount: lines.length || (numberOrNull(prescription.itemsCount) ?? 0),
      itemsLeft,
      totalAmount: numberOrNull(prescription.totalAmount),
      paidAmount: numberOrNull(prescription.paidAmount),
      pendingAmount: numberOrNull(prescription.pendingAmount),
      paidInCash,
      failedOnlinePaymentAt: failedOnline ?? null,
      priority: textOf(prescription.priority).toLowerCase() || "normal",
      state,
      invoiceId: textOf(prescription.invoiceId) || null,
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
      parts.push(item.itemsLeft > 0 ? `${plural(item.itemsLeft, "item")} left` : "partly given");
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
  if (dayKey === formatDateKeyInIST(now)) return formatTimeLabel(sentAt);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey === formatDateKeyInIST(yesterday)) return "Yesterday";
  return formatDateInIST(sentAt, { day: "numeric", month: "short" });
}

/** "Saturday, 3 October" */
export function todayLabel(now: Date = new Date()): string {
  const weekday = formatDateInIST(now, { weekday: "long" });
  const day = formatDateInIST(now, { day: "numeric", month: "long" });
  return [weekday, day].filter(Boolean).join(", ");
}

// ── Stock ──────────────────────────────────────────────────────────────────

export function buildInventorySummary(inventoryData: unknown): InventorySummary {
  const medicines = unwrapList(inventoryData, "inventory").map(asRecordOrEmpty);
  const alerts: StockAlert[] = [];
  let inStock = 0;
  let datedMedicines = 0;
  let expiringSoon = 0;

  medicines.forEach((medicine, index) => {
    const stock = numberOrNull(medicine.currentStock ?? medicine.stockQuantity ?? medicine.stock ?? medicine.quantity) ?? 0;
    const reorderAt =
      numberOrNull(medicine.minStock ?? medicine.minThreshold ?? medicine.minStockThreshold ?? medicine.minStockLevel) ?? 0;
    const name = textOf(medicine.name) || textOf(medicine.medicineName) || "Medicine";

    if (stock > 0) inStock += 1;
    if (stock <= 0 || (reorderAt > 0 && stock <= reorderAt)) {
      alerts.push({
        id: textOf(medicine.id) || `${name}-${index}`,
        name,
        stock: Math.max(0, stock),
        reorderAt,
        unit: textOf(medicine.unit) || "units",
        outOfStock: stock <= 0,
        restockKey: textOf(medicine.id) || name,
      });
    }

    const daysToExpiry = numberOrNull(medicine.daysToExpiry);
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
    .map((item) => isoDateOrNull(asRecordOrEmpty(item).dispensedAt))
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
    .pop();
  return fromLines ?? isoDateOrNull(prescription.dispensedAt) ?? isoDateOrNull(prescription.completedAt);
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
    const prescription = asRecordOrEmpty(entry);
    const status = upper(prescription.status);
    const paymentStatus = upper(prescription.paymentStatus) || "PENDING";
    const open =
      typeof prescription.activeQueueEntry === "boolean" ? prescription.activeQueueEntry : OPEN_STATUSES.has(status);

    if (open && !DISPENSED_STATUSES.has(status) && !DEAD_PAYMENT_STATUSES.has(paymentStatus)) {
      toFill += 1;
      // A prescription with nothing to pay is "PENDING" for the API but can be dispensed.
      if (paymentStatus !== "PAID" && prescription.canDispense !== true) paymentDue += 1;
    }

    if (DISPENSED_STATUSES.has(status)) {
      const handedOverAt = dispensedAt(prescription);
      const dayKey = handedOverAt ? formatDateKeyInIST(handedOverAt) : "";
      if (dayKey && dayKey === todayKey) dispensedToday += 1;
      if (dayKey && dayKey.slice(0, 7) === monthKey) dispensedThisMonth += 1;
    }
  }

  const monthlyFromApi = numberOrNull(asRecordOrEmpty(pharmacyStats).monthlyDispensed);
  return {
    toFill,
    paymentDue,
    dispensedToday,
    // Same number as the "Low Stock" card on the inventory screen; medicines that are out of
    // stock are counted apart there and named in the alerts card here.
    lowStock: inventory.lowCount,
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
  const response = asRecordOrEmpty(result);
  const paidAfter = numberOrNull(response.paidAmount);
  const stillDue = Math.max(0, numberOrNull(response.pendingAmount) ?? 0);
  const alreadyPaid = response.alreadyPaid === true;
  const collected =
    paidAfter !== null && item.paidAmount !== null
      ? Math.max(0, Number((paidAfter - item.paidAmount).toFixed(2)))
      : item.pendingAmount !== null
        ? Math.max(0, Number((item.pendingAmount - stillDue).toFixed(2)))
        : null;

  return {
    prescriptionId: textOf(response.prescriptionId) || item.id,
    patientName: item.patientName,
    reference: item.reference,
    amount: alreadyPaid ? null : collected,
    stillDue,
    alreadyPaid,
    recordedAt: now.toISOString(),
    recordedBy,
  };
}
