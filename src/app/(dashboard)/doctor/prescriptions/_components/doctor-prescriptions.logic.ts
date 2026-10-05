import type { PillTone } from "@/components/tbd";
import { statusLabel, statusTone } from "@/components/tbd";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import {
  DESK_STATE_LABEL,
  DESK_STATE_TONE,
  prescriptionReference,
} from "@/app/(dashboard)/pharmacist/dashboard/_components/pharmacist-dashboard.logic";

/**
 * Pure helpers for the doctor's prescriptions screen: they turn the payload of
 * `usePrescriptions` into the rows the list renders. No React, no fetching.
 * The doctor sees no money amounts, so none are carried on a row.
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

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

/** What the doctor filters on. */
export type DoctorPrescriptionStatus = "active" | "completed" | "cancelled";
export type DoctorPrescriptionFilter = "all" | "active" | "completed";

export interface PharmacyState {
  /** Same wording as the pharmacy screens: "Ready to dispense", "Payment pending", … */
  label: string;
  tone: PillTone;
}

export interface DoctorPrescriptionRow {
  id: string;
  /** Number shown to people ("RX-1A2B3C4D"). */
  reference: string;
  patientName: string;
  patientId: string;
  /** When it was written (ISO); "" when unknown. */
  date: string;
  diagnosis: string;
  notes: string;
  medicines: string[];
  status: DoctorPrescriptionStatus;
  /** Where the prescription is at the medicine desk; null when the API did not say. */
  pharmacy: PharmacyState | null;
  pdfUrl: string;
}

export interface DoctorPrescriptionStats {
  total: number;
  active: number;
  patients: number;
  today: number;
}

export interface DoctorPrescriptionEditForm {
  diagnosis: string;
  notes: string;
  status: string;
  medicines: string;
}

export const EMPTY_PRESCRIPTION_FORM: DoctorPrescriptionEditForm = {
  diagnosis: "",
  notes: "",
  status: "active",
  medicines: "",
};

const DISPENSED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED"]);

/**
 * The API answers with the medicine-desk lifecycle (`WAITING_FOR_PAYMENT`,
 * `READY_FOR_HANDOVER`, `DISPENSED`, `CANCELLED`, `PARTIAL`) or with the plain
 * `active` / `completed` / `cancelled`; both fold into the three states the doctor filters on.
 */
function normalizeStatus(value: unknown): DoctorPrescriptionStatus {
  const status = upper(value);
  if (status === "CANCELLED") return "cancelled";
  if (DISPENSED_STATUSES.has(status)) return "completed";
  return "active";
}

function pharmacyState(prescription: Raw): PharmacyState | null {
  const status = upper(prescription.status);
  const queueStatus = upper(prescription.queueStatus);
  const paymentStatus = upper(prescription.paymentStatus);

  if (status === "CANCELLED" || queueStatus === "CANCELLED") {
    return { label: statusLabel("CANCELLED"), tone: statusTone("CANCELLED") };
  }
  if (DISPENSED_STATUSES.has(status) || queueStatus === "DISPENSED") {
    return { label: statusLabel("DISPENSED"), tone: statusTone("DISPENSED") };
  }
  if (status === "PARTIAL" || status === "PARTIALLY_DISPENSED") {
    return { label: DESK_STATE_LABEL.partially_dispensed, tone: DESK_STATE_TONE.partially_dispensed };
  }
  if (
    prescription.readyForHandover === true ||
    status === "READY_FOR_HANDOVER" ||
    paymentStatus === "PAID" ||
    prescription.canDispense === true
  ) {
    return { label: DESK_STATE_LABEL.ready_to_dispense, tone: DESK_STATE_TONE.ready_to_dispense };
  }
  if (
    paymentStatus ||
    prescription.waitingForPayment === true ||
    status === "WAITING_FOR_PAYMENT" ||
    status === "PENDING"
  ) {
    return { label: DESK_STATE_LABEL.awaiting_payment, tone: DESK_STATE_TONE.awaiting_payment };
  }
  return null;
}

function medicineNames(prescription: Raw): string[] {
  const direct = asList(prescription.medicines);
  const source =
    direct.length > 0
      ? direct
      : asList(prescription.items).length > 0
        ? asList(prescription.items)
        : asList(prescription.medicineNames).length > 0
          ? asList(prescription.medicineNames)
          : asList(prescription.medications);
  const names = source
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      const item = asRecord(entry);
      return text(asRecord(item.medicine).name) || text(item.medicineName) || text(item.name);
    })
    .filter(Boolean);
  return names.filter((name, index) => names.indexOf(name) === index);
}

function patientName(prescription: Raw): string {
  const patient = asRecord(prescription.patient);
  const user = asRecord(patient.user);
  const fromParts = `${text(user.firstName) || text(patient.firstName)} ${text(user.lastName) || text(patient.lastName)}`.trim();
  return text(prescription.patientName) || text(user.name) || text(patient.name) || fromParts || "Unknown patient";
}

export function normalizeDoctorPrescription(input: unknown): DoctorPrescriptionRow {
  const raw = asRecord(input);
  const id = text(raw.id);
  return {
    id,
    reference: prescriptionReference(raw, id),
    patientName: patientName(raw),
    patientId: text(raw.patientId) || text(asRecord(raw.patient).id),
    date: text(raw.date) || text(raw.prescribedAt) || text(raw.createdAt),
    diagnosis: text(raw.diagnosis),
    notes: text(raw.doctorNotes) || text(raw.notes),
    medicines: medicineNames(raw),
    status: normalizeStatus(raw.status),
    pharmacy: pharmacyState(raw),
    pdfUrl: text(raw.pdfUrl),
  };
}

export function normalizeDoctorPrescriptions(list: unknown): DoctorPrescriptionRow[] {
  return asList(list).map(normalizeDoctorPrescription);
}

export function filterDoctorPrescriptions(
  rows: DoctorPrescriptionRow[],
  searchQuery: string,
  filterStatus: DoctorPrescriptionFilter,
): DoctorPrescriptionRow[] {
  const needle = searchQuery.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesSearch =
      !needle ||
      row.patientName.toLowerCase().includes(needle) ||
      row.diagnosis.toLowerCase().includes(needle) ||
      row.reference.toLowerCase().includes(needle) ||
      row.medicines.some((medicine) => medicine.toLowerCase().includes(needle));
    const matchesStatus = filterStatus === "all" || row.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
}

/** `todayKey` is the IST date key of today ("" until the page has hydrated). */
export function buildDoctorPrescriptionStats(rows: DoctorPrescriptionRow[], todayKey: string): DoctorPrescriptionStats {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    patients: new Set(rows.map((row) => row.patientId || row.patientName)).size,
    today: todayKey ? rows.filter((row) => row.date && formatDateKeyInIST(row.date) === todayKey).length : 0,
  };
}

/** "3 October 2026" */
export function prescriptionDateLabel(date: string): string {
  if (!date) return "";
  return formatDateInIST(date, { year: "numeric", month: "long", day: "numeric" });
}

/** Short patient id for the row; the full id stays in the tooltip. */
export function shortPatientId(patientId: string): string {
  if (!patientId) return "";
  return patientId.length > 12 ? patientId.slice(0, 8).toUpperCase() : patientId;
}

/** "6 prescriptions" */
export function prescriptionsCountLabel(count: number): string {
  return `${count} ${count === 1 ? "prescription" : "prescriptions"}`;
}

/** Comma-separated medicine names typed in the dialog -> clean list. */
export function parseMedicineList(value: string): string[] {
  return value.split(",").flatMap((entry) => {
    const trimmed = entry.trim();
    return trimmed ? [trimmed] : [];
  });
}
