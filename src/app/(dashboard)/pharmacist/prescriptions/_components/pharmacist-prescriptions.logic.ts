import type { PillTone } from "@/components/tbd";
import { statusLabel, statusTone } from "@/components/tbd";
import { normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import { formatDateInIST, formatDateKeyInIST, formatTimeInIST, nowIso } from "@/lib/utils/date-time";
import type { DispensePrescriptionMedication, PharmacyBatchAuditEntry } from "@/types/pharmacy.types";
import {
  DESK_STATE_LABEL,
  DESK_STATE_TONE,
  formatRupees,
  prescriptionReference,
} from "../../dashboard/_components/pharmacist-dashboard.logic";

/**
 * Pure helpers for the pharmacy prescriptions screen: they turn the payloads of
 * `usePrescriptions`, `useMedicines` and `usePharmacyBatchAudit` into the rows the tables
 * and dialogs render, and hold the dispense rules (quantities, stock, batches,
 * substitution). No React, no fetching.
 */

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

function fullName(person: Raw): string {
  const user = asRecord(person.user);
  const first = text(person.firstName) || text(user.firstName);
  const last = text(person.lastName) || text(user.lastName);
  return `${first} ${last}`.trim();
}

// ── Rows ───────────────────────────────────────────────────────────────────

export type PrescriptionsTab = "active" | "history" | "audit";
export const PRESCRIPTION_TABS = ["active", "history", "audit"] as const;

export type PrescriptionStatus = "PENDING" | "PARTIAL" | "FILLED" | "CANCELLED";

export type DispenseHistoryEntry = {
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  dispensedAt: string;
  eventType?: string;
};

export type PrescriptionMedicine = {
  prescriptionItemId: string;
  medicineId: string;
  name: string;
  dosage: string;
  /** "1 tablet · twice a day · 5 days" — whatever the doctor filled in. */
  directions: string;
  prescribedQuantity: number;
  /** Quantity already handed over. */
  dispensedQuantity: number;
  availableStock: number;
  available: boolean;
  batchNumber?: string;
  expiryDate?: string;
  /** When this medicine was last handed over (ISO); null when it was not. */
  dispensedAt: string | null;
  /** Hand-overs that still count (reversed ones are left out). */
  dispenseBatchHistory?: DispenseHistoryEntry[];
};

export type PrescriptionRow = {
  id: string;
  /** Number shown to people ("RX-1A2B3C4D"). */
  reference: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  prescribedAt: string;
  locationName: string;
  status: PrescriptionStatus;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  canDispense: boolean;
  /** How the completed payment was taken; "" when unknown or not paid. */
  paidVia: "" | "cash" | "online";
  queueCategory?: string;
  queueStatus?: "PENDING" | "DISPENSED" | "CANCELLED";
  queuePosition?: number | null;
  /** Latest hand-over time over all medicines (ISO); null when nothing was given. */
  handedOverAt: string | null;
  medicines: PrescriptionMedicine[];
  /** The untouched API record, for the cash payment dialog shared with the dashboard. */
  raw: unknown;
};

const DISPENSED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED"]);

/**
 * The list endpoint answers with the medicine-desk lifecycle (`WAITING_FOR_PAYMENT`,
 * `READY_FOR_HANDOVER`, `DISPENSED`) or the stored status (`PENDING`, `FILLED`); both are
 * folded into the four states this screen works with.
 */
function normalizeStatus(value: unknown): PrescriptionStatus {
  const status = text(value || "PENDING").toUpperCase();
  if (status === "PARTIAL" || status === "CANCELLED") return status;
  if (DISPENSED_STATUSES.has(status)) return "FILLED";
  return "PENDING";
}

function normalizePaymentStatus(value: unknown): PrescriptionRow["paymentStatus"] {
  const status = text(value || "PENDING").toUpperCase();
  return status === "PAID" || status === "PARTIAL" ? status : "PENDING";
}

function normalizeHistory(value: unknown): DispenseHistoryEntry[] {
  return asList(value).reduce<DispenseHistoryEntry[]>((entries, entryRaw) => {
    const entry = asRecord(entryRaw);
    const quantity = Number(entry.quantity || 0);
    if (quantity <= 0) return entries;
    // A reversal, or a hand-over that was reversed later, is no longer "given".
    if (text(entry.eventType).toUpperCase() === "REVERSAL" || entry.reversedAt) return entries;
    entries.push({
      quantity,
      ...(entry.batchNumber ? { batchNumber: String(entry.batchNumber) } : {}),
      ...(entry.expiryDate ? { expiryDate: String(entry.expiryDate) } : {}),
      dispensedAt: String(entry.dispensedAt || nowIso()),
      ...(entry.eventType ? { eventType: String(entry.eventType) } : {}),
    });
    return entries;
  }, []);
}

function paidVia(prescription: Raw): PrescriptionRow["paidVia"] {
  const completed = asList(prescription.payments)
    .map(asRecord)
    .filter((payment) => text(payment.status).toUpperCase() === "COMPLETED");
  if (completed.length === 0) return "";
  const method = (payment: Raw) =>
    (text(payment.method) || text(asRecord(payment.metadata).paymentMethod)).toUpperCase();
  return completed.some((payment) => method(payment) === "CASH") ? "cash" : "online";
}

export function normalizePrescription(input: unknown): PrescriptionRow {
  const raw = asRecord(input);
  const patient = asRecord(raw.patient);
  const patientUser = asRecord(patient.user);
  const doctor = asRecord(raw.doctor);
  const doctorUser = asRecord(doctor.user);
  const items = Array.isArray(raw.items) ? raw.items : asList(raw.medicines);
  const queueEntry = normalizeQueueEntry(raw);
  const id = String(raw.id ?? "");

  const doctorName =
    text(doctorUser.name) || text(doctor.name) || text(raw.doctorName) || fullName(doctor);

  const medicines = items.map((itemRaw): PrescriptionMedicine => {
    const item = asRecord(itemRaw);
    const medicine = asRecord(item.medicine);
    const prescribedQuantity = Number(item.quantity || 0);
    const availableStock = Number(
      medicine.stockQuantity || medicine.stock || item.currentStock || item.stock || 0,
    );
    const history = Array.isArray(item.dispenseEventHistory)
      ? item.dispenseEventHistory
      : item.dispenseBatchHistory;
    const dispensedAt = text(item.dispensedAt);
    return {
      ...(Array.isArray(history) ? { dispenseBatchHistory: normalizeHistory(history) } : {}),
      prescriptionItemId: String(
        item.id || item.prescriptionItemId || item.medicineId || item.name || "item",
      ),
      medicineId: String(medicine.id || item.medicineId || item.id || item.name || "medicine"),
      name: text(medicine.name) || text(item.name) || "Medicine",
      dosage: text(item.dosage) || "As prescribed",
      directions: [text(item.dosage), text(item.frequency), text(item.duration)]
        .filter(Boolean)
        .join(" · "),
      prescribedQuantity,
      dispensedQuantity: Math.max(0, Number(item.dispensedQuantity || 0)),
      availableStock,
      available: availableStock >= prescribedQuantity,
      dispensedAt: dispensedAt || null,
      ...(item.batchNumber ? { batchNumber: String(item.batchNumber) } : {}),
      ...(item.expiryDate ? { expiryDate: String(item.expiryDate) } : {}),
    };
  });

  const handedOverAt =
    medicines
      .map((medicine) => medicine.dispensedAt)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
      .pop() ?? null;

  return {
    id,
    reference: prescriptionReference(raw, id),
    patientName:
      text(patientUser.name) ||
      text(patient.name) ||
      text(raw.patientName) ||
      fullName(patient) ||
      "Unknown Patient",
    patientPhone: text(raw.patientPhone) || text(patientUser.phone),
    doctorName: doctorName ? formatDoctorDisplayName(doctorName) : "Unknown Doctor",
    prescribedAt: text(raw.date) || text(raw.prescribedAt) || text(raw.createdAt) || nowIso(),
    locationName: text(raw.locationName) || text(asRecord(raw.location).name),
    status: normalizeStatus(raw.status),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    totalAmount: Number(raw.totalAmount || 0),
    paidAmount: Number(raw.paidAmount || 0),
    pendingAmount: Number(raw.pendingAmount || 0),
    canDispense: Boolean(raw.canDispense),
    paidVia: paidVia(raw),
    queueCategory: queueEntry.queueCategory,
    queueStatus: raw.queueStatus as PrescriptionRow["queueStatus"],
    queuePosition: queueEntry.position > 0 ? queueEntry.position : null,
    handedOverAt,
    medicines,
    raw: input,
  };
}

// ── State of a prescription ────────────────────────────────────────────────

export type PrescriptionStateKey =
  | "awaiting_payment"
  | "ready_to_dispense"
  | "partial"
  | "dispensed"
  | "cancelled";

export interface PrescriptionState {
  key: PrescriptionStateKey;
  label: string;
  tone: PillTone;
}

/** Same labels and colours as the pharmacy dashboard queue. */
export function getPrescriptionState(prescription: PrescriptionRow): PrescriptionState {
  if (prescription.status === "PARTIAL") {
    return {
      key: "partial",
      label: DESK_STATE_LABEL.partially_dispensed,
      tone: DESK_STATE_TONE.partially_dispensed,
    };
  }
  if (prescription.status === "FILLED") {
    return { key: "dispensed", label: statusLabel("DISPENSED"), tone: statusTone("DISPENSED") };
  }
  if (prescription.status === "CANCELLED") {
    return { key: "cancelled", label: statusLabel("CANCELLED"), tone: statusTone("CANCELLED") };
  }
  if (!prescription.canDispense) {
    return {
      key: "awaiting_payment",
      label: DESK_STATE_LABEL.awaiting_payment,
      tone: DESK_STATE_TONE.awaiting_payment,
    };
  }
  return {
    key: "ready_to_dispense",
    label: DESK_STATE_LABEL.ready_to_dispense,
    tone: DESK_STATE_TONE.ready_to_dispense,
  };
}

export const STATE_FILTERS: Record<
  "active" | "history",
  Array<{ value: "all" | PrescriptionStateKey; label: string }>
> = {
  active: [
    { value: "all", label: "All states" },
    { value: "awaiting_payment", label: DESK_STATE_LABEL.awaiting_payment },
    { value: "ready_to_dispense", label: DESK_STATE_LABEL.ready_to_dispense },
    { value: "partial", label: DESK_STATE_LABEL.partially_dispensed },
  ],
  history: [
    { value: "all", label: "All states" },
    { value: "dispensed", label: statusLabel("DISPENSED") },
    { value: "cancelled", label: statusLabel("CANCELLED") },
  ],
};

export function isHistoryPrescription(prescription: PrescriptionRow): boolean {
  return prescription.status === "FILLED" || prescription.status === "CANCELLED";
}

/** A dispense can be reversed once something was handed over. */
export function canReverseDispense(prescription: PrescriptionRow): boolean {
  return prescription.status === "PARTIAL" || prescription.status === "FILLED";
}

export function filterPrescriptions(
  prescriptions: PrescriptionRow[],
  searchTerm: string,
  statusFilter: string,
): PrescriptionRow[] {
  const needle = searchTerm.trim().toLowerCase();
  return prescriptions.filter((prescription) => {
    const matchesSearch =
      !needle ||
      prescription.id.toLowerCase().includes(needle) ||
      prescription.reference.toLowerCase().includes(needle) ||
      prescription.patientName.toLowerCase().includes(needle) ||
      prescription.doctorName.toLowerCase().includes(needle) ||
      prescription.medicines.some((medicine) => medicine.name.toLowerCase().includes(needle));
    const matchesStatus =
      statusFilter === "all" || getPrescriptionState(prescription).key === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

/** Newest prescription first. */
export function sortNewestFirst(prescriptions: PrescriptionRow[]): PrescriptionRow[] {
  return [...prescriptions].sort(
    (left, right) => new Date(right.prescribedAt).getTime() - new Date(left.prescribedAt).getTime(),
  );
}

// ── Labels ─────────────────────────────────────────────────────────────────

/** "3 Oct 2026, 12:14 pm" */
export function dateTimeLabel(value: string | null | undefined): string {
  if (!value) return "";
  const date = formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" });
  const time = formatTimeInIST(value).toLowerCase();
  return [date, time].filter(Boolean).join(", ");
}

/** "3 Oct 2026" */
export function dateLabel(value: string | null | undefined): string {
  return value ? formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** "12:14 pm" */
export function timeLabel(value: string | null | undefined): string {
  return value ? formatTimeInIST(value).toLowerCase() : "";
}

/** "May 2027" — expiry of a batch. */
export function expiryLabel(value: string | null | undefined): string {
  return value ? formatDateInIST(value, { month: "short", year: "numeric" }) : "";
}

/** "today, 10:05 am" or "2 Oct 2026, 05:40 pm" */
export function relativeDateTimeLabel(value: string, now: Date = new Date()): string {
  if (formatDateKeyInIST(value) === formatDateKeyInIST(now)) return `today, ${timeLabel(value)}`;
  return dateTimeLabel(value);
}

/** Amount and what is still open, shown under the state tag: "₹105 · Paid". */
export function moneyLabel(prescription: PrescriptionRow): { amount: string; note: string } {
  if (prescription.totalAmount <= 0) return { amount: "", note: "Nothing to pay" };
  if (prescription.paymentStatus === "PAID") {
    return { amount: formatRupees(prescription.totalAmount), note: "Paid" };
  }
  if (prescription.status === "CANCELLED") {
    return {
      amount: formatRupees(prescription.totalAmount),
      note: prescription.paidAmount > 0 ? "Part paid" : "Not paid",
    };
  }
  const due = prescription.pendingAmount > 0 ? prescription.pendingAmount : prescription.totalAmount;
  return { amount: formatRupees(due), note: "To pay" };
}

/** "₹105 paid" + where it was paid, for the dialogs. */
export function paymentSummary(prescription: PrescriptionRow): { title: string; note: string } {
  if (prescription.totalAmount <= 0) return { title: "Nothing to pay", note: "" };
  const via =
    prescription.paidVia === "cash" ? "At the counter" : prescription.paidVia === "online" ? "Online" : "";
  if (prescription.paymentStatus === "PAID") {
    return { title: `${formatRupees(prescription.paidAmount || prescription.totalAmount)} paid`, note: via };
  }
  if (prescription.paidAmount > 0) {
    return {
      title: `${formatRupees(prescription.paidAmount)} paid`,
      note: `${formatRupees(prescription.pendingAmount)} to pay`,
    };
  }
  return { title: `${formatRupees(prescription.pendingAmount || prescription.totalAmount)} to pay`, note: "" };
}

/** Units already handed over, over all medicines. */
export function givenQuantity(prescription: PrescriptionRow): number {
  return prescription.medicines.reduce((total, medicine) => total + medicine.dispensedQuantity, 0);
}

/**
 * Amber line under the medicines of an open prescription: what was already given and
 * which medicines are short. "" when there is nothing to warn about.
 */
export function attentionLine(prescription: PrescriptionRow): string {
  const parts: string[] = [];
  const given = givenQuantity(prescription);
  if (given > 0) parts.push(`${given} given`);
  for (const medicine of prescription.medicines) {
    const left = Math.max(0, medicine.prescribedQuantity - medicine.dispensedQuantity);
    if (left > 0 && medicine.availableStock < left) {
      parts.push(
        medicine.availableStock > 0
          ? `${medicine.name}: ${medicine.availableStock} in stock`
          : `${medicine.name}: out of stock`,
      );
    }
  }
  return parts.join(" · ");
}

// ── Dispense form ──────────────────────────────────────────────────────────

export type DispenseBatchRow = {
  id: string;
  quantity: string;
  batchNumber: string;
  expiryDate: string;
};

export type DispenseLineState = {
  prescriptionItemId: string;
  medicineId: string;
  name: string;
  directions: string;
  prescribedQuantity: number;
  /** Quantity handed over before this dispense. */
  dispensedQuantity: number;
  availableStock: number;
  substituteMedicineId: string;
  substitutionReason: string;
  batches: DispenseBatchRow[];
  dispenseBatchHistory?: DispenseHistoryEntry[];
};

/** A medicine of the clinic inventory, as far as the dispense dialog needs it. */
export type CatalogMedicine = {
  id: string;
  name: string;
  manufacturer: string;
  /** Stock on hand; null when the inventory did not send one. */
  stock: number | null;
};

export function buildMedicineCatalog(medicinesData: unknown): CatalogMedicine[] {
  return asList(medicinesData).map((entry) => {
    const medicine = asRecord(entry);
    const stock = medicine.stockQuantity ?? medicine.stock ?? medicine.currentStock;
    return {
      id: String(medicine.id || ""),
      name: text(medicine.name) || "Medicine",
      manufacturer: text(medicine.manufacturer),
      stock: stock === undefined || stock === null ? null : Number(stock),
    };
  });
}

export function createBatchRow(quantity = "", batchNumber = "", expiryDate = ""): DispenseBatchRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    quantity,
    batchNumber,
    expiryDate,
  };
}

/** One form line per medicine, pre-filled with what is still left to give. */
export function createDispenseLine(medicine: PrescriptionMedicine): DispenseLineState {
  const remaining = Math.max(0, medicine.prescribedQuantity - medicine.dispensedQuantity);
  return {
    prescriptionItemId: medicine.prescriptionItemId,
    medicineId: medicine.medicineId,
    name: medicine.name,
    directions: medicine.directions,
    prescribedQuantity: medicine.prescribedQuantity,
    dispensedQuantity: medicine.dispensedQuantity,
    availableStock: medicine.availableStock,
    substituteMedicineId: "",
    substitutionReason: "",
    batches: [createBatchRow(String(remaining))],
    ...(medicine.dispenseBatchHistory ? { dispenseBatchHistory: medicine.dispenseBatchHistory } : {}),
  };
}

export function getTotalBatchQuantity(line: DispenseLineState): number {
  return line.batches.reduce((total, batch) => total + (Number(batch.quantity) || 0), 0);
}

/** Quantity of a line that is still to be handed over. */
export function getRemainingQuantity(line: DispenseLineState): number {
  return Math.max(0, line.prescribedQuantity - line.dispensedQuantity);
}

/** Stock of the medicine that will really be given (the substitute when one is chosen). */
export function getEffectiveStock(
  line: DispenseLineState,
  catalogById: Map<string, CatalogMedicine>,
): number {
  const medicine = catalogById.get(line.substituteMedicineId || line.medicineId);
  return Number(medicine?.stock ?? line.availableStock);
}

export type DispensePayloadResult =
  | { error: string; medications?: undefined }
  | { error?: undefined; medications: DispensePrescriptionMedication[] };

/**
 * Checks every line (quantity, prescribed amount, stock, substitution reason, batch
 * details) and builds the request. The first problem found is returned as `error`.
 */
export function buildDispensePayload(
  lines: DispenseLineState[],
  catalogById: Map<string, CatalogMedicine>,
): DispensePayloadResult {
  const medications: DispensePrescriptionMedication[] = [];

  for (const line of lines) {
    const totalQuantity = getTotalBatchQuantity(line);

    if (!Number.isFinite(totalQuantity) || totalQuantity < 0) {
      return { error: `Enter a valid quantity for ${line.name}.` };
    }

    if (totalQuantity > line.prescribedQuantity) {
      return { error: `${line.name} exceeds the prescribed quantity of ${line.prescribedQuantity}.` };
    }

    const remaining = getRemainingQuantity(line);
    if (totalQuantity > remaining) {
      return { error: `${line.name} has only ${remaining} left to give.` };
    }

    const effectiveStock = getEffectiveStock(line, catalogById);
    if (totalQuantity > effectiveStock) {
      return { error: `${line.name} exceeds the available stock of ${effectiveStock}.` };
    }

    if (line.substituteMedicineId && !line.substitutionReason.trim()) {
      return { error: `Add a substitution reason for ${line.name}.` };
    }

    for (const batch of line.batches) {
      const batchQuantity = Number(batch.quantity);
      const hasBatchDetails =
        batch.batchNumber.trim().length > 0 || batch.expiryDate.trim().length > 0 || batchQuantity > 0;

      if (!hasBatchDetails) continue;

      if (!Number.isInteger(batchQuantity) || batchQuantity <= 0) {
        return { error: `Enter a valid batch quantity for ${line.name}.` };
      }

      if (!batch.batchNumber.trim()) {
        return { error: `Enter a batch number for ${line.name}.` };
      }

      if (!batch.expiryDate.trim()) {
        return { error: `Enter an expiry date for ${line.name}.` };
      }

      medications.push({
        medicineId: line.medicineId,
        prescriptionItemId: line.prescriptionItemId,
        quantityDispensed: batchQuantity,
        batchNumber: batch.batchNumber.trim(),
        expiryDate: batch.expiryDate,
        ...(line.substituteMedicineId ? { substituteMedicineId: line.substituteMedicineId } : {}),
        ...(line.substitutionReason.trim() ? { substitutionReason: line.substitutionReason.trim() } : {}),
      });
    }
  }

  if (medications.length === 0) {
    return { error: "Add at least one medication quantity to dispense." };
  }

  return { medications };
}

export type LineCheck = {
  tone: "ok" | "warn" | "error" | "muted";
  message: string;
};

/** The one-line summary under the batches of a medicine. */
export function describeLine(
  line: DispenseLineState,
  catalogById: Map<string, CatalogMedicine>,
): LineCheck {
  const entered = getTotalBatchQuantity(line);
  const remaining = getRemainingQuantity(line);
  const stock = getEffectiveStock(line, catalogById);
  const batches = line.batches.filter((batch) => Number(batch.quantity) > 0).length;
  const substituted = Boolean(line.substituteMedicineId);

  if (remaining === 0) return { tone: "muted", message: "Already given in full." };
  if (entered > remaining) {
    return { tone: "error", message: `More than the ${remaining} left to give.` };
  }
  if (entered > stock) {
    return { tone: "error", message: `More than the ${stock} in stock.` };
  }
  if (entered <= 0) return { tone: "muted", message: "Nothing is given for this medicine now." };

  const stockLeft = substituted
    ? `${stock - entered} of it left in stock after this`
    : `${stock - entered} left in stock after this`;

  if (entered < remaining) {
    return {
      tone: "warn",
      message: `${entered} of ${remaining} now · ${remaining - entered} stay to give later · ${stockLeft}`,
    };
  }

  const amount =
    line.dispensedQuantity > 0
      ? `${entered} of the ${remaining} left to give`
      : substituted
        ? "Full quantity from the substitute"
        : "Full quantity";
  const from = batches > 1 ? `, from ${batches} batches` : "";
  return { tone: "ok", message: `${amount}${from} · ${stockLeft}` };
}

// ── Batch audit ────────────────────────────────────────────────────────────

export function filterBatchAudit(
  entries: PharmacyBatchAuditEntry[],
  searchTerm: string,
): PharmacyBatchAuditEntry[] {
  const search = searchTerm.trim().toLowerCase();
  if (!search) return entries;
  return entries.filter((entry) =>
    [
      entry.prescriptionId,
      prescriptionReference(null, entry.prescriptionId),
      entry.prescriptionItemId,
      entry.patientName,
      entry.doctorName,
      entry.medicineName,
      entry.originalMedicineName,
      entry.substituteMedicineName,
      entry.batchNumber,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search)),
  );
}

export type AuditEventKind = "DISPENSE" | "SUBSTITUTION" | "REVERSAL";

export function auditEventKind(entry: PharmacyBatchAuditEntry): AuditEventKind {
  const kind = String(entry.eventType || "DISPENSE").toUpperCase();
  return kind === "REVERSAL" || kind === "SUBSTITUTION" ? kind : "DISPENSE";
}

export const AUDIT_EVENT_TONE: Record<AuditEventKind, PillTone> = {
  DISPENSE: "green",
  SUBSTITUTION: "blue",
  REVERSAL: "rose",
};

/** Text of the Reason cell; "" when there is nothing to say. */
export function auditReason(entry: PharmacyBatchAuditEntry): string {
  if (auditEventKind(entry) === "REVERSAL") return entry.reason || entry.reversalReason || "";
  const parts: string[] = [];
  if (entry.reason) parts.push(entry.reason);
  if (entry.reversedAt) {
    const sameDay = formatDateKeyInIST(entry.reversedAt) === formatDateKeyInIST(entry.eventAt);
    // The reason of the reversal is on the REVERSAL row.
    parts.push(`Reversed ${sameDay ? `at ${timeLabel(entry.reversedAt)}` : `on ${dateTimeLabel(entry.reversedAt)}`}`);
  } else if (!entry.reason && entry.reversalReason) {
    parts.push(entry.reversalReason);
  }
  return parts.join(" · ");
}

export { formatRupees, prescriptionReference };
