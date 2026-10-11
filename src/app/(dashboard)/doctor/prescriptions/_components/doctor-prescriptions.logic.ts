import type { PillTone } from "@/components/tbd";
import { statusLabel, statusTone } from "@/components/tbd";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { asList, asRecordOrEmpty, textOf } from "@/lib/utils/coerce";
import { prescriptionReference } from "@/lib/utils/labels";
import { personFullName } from "@/lib/utils/display-name";
import { DESK_STATE_LABEL, DESK_STATE_TONE } from "@/lib/pharmacy/desk-state";

/**
 * Pure helpers for the doctor's prescriptions screen: they turn the payload of
 * `usePrescriptions` into the rows the list renders. No React, no fetching.
 * The doctor sees no money amounts, so none are carried on a row.
 */

type Raw = Record<string, unknown>;

function upper(value: unknown): string {
  return textOf(value).toUpperCase();
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
}

export interface DoctorPrescriptionStats {
  total: number;
  active: number;
  patients: number;
  today: number;
}

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
      const item = asRecordOrEmpty(entry);
      return textOf(asRecordOrEmpty(item.medicine).name) || textOf(item.medicineName) || textOf(item.name);
    })
    .filter(Boolean);
  return names.filter((name, index) => names.indexOf(name) === index);
}

function patientName(prescription: Raw): string {
  const patient = asRecordOrEmpty(prescription.patient);
  const user = asRecordOrEmpty(patient.user);
  const fromParts = personFullName(patient);
  return textOf(prescription.patientName) || textOf(user.name) || textOf(patient.name) || fromParts || "Unknown patient";
}

export function normalizeDoctorPrescription(input: unknown): DoctorPrescriptionRow {
  const raw = asRecordOrEmpty(input);
  const id = textOf(raw.id);
  return {
    id,
    reference: prescriptionReference(id, raw),
    patientName: patientName(raw),
    patientId: textOf(raw.patientId) || textOf(asRecordOrEmpty(raw.patient).id),
    date: textOf(raw.date) || textOf(raw.prescribedAt) || textOf(raw.createdAt),
    diagnosis: textOf(raw.diagnosis),
    notes: textOf(raw.doctorNotes) || textOf(raw.notes),
    medicines: medicineNames(raw),
    status: normalizeStatus(raw.status),
    pharmacy: pharmacyState(raw),
  };
}

/**
 * True when the prescription was written by this doctor. `ownIds` holds the doctor's record id
 * and user id: the prescription carries the record id, its `doctor` block the user id.
 */
export function isPrescriptionByDoctor(input: unknown, ownIds: string[]): boolean {
  const raw = asRecordOrEmpty(input);
  const doctor = asRecordOrEmpty(raw.doctor);
  return [textOf(raw.doctorId), textOf(doctor.id), textOf(doctor.userId), textOf(asRecordOrEmpty(doctor.user).id)].some(
    (id) => id !== "" && ownIds.includes(id),
  );
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

/** Short patient id for the row; the full id stays in the tooltip. */
export function shortPatientId(patientId: string): string {
  if (!patientId) return "";
  return patientId.length > 12 ? patientId.slice(0, 8).toUpperCase() : patientId;
}

/** "6 prescriptions" */
export function prescriptionsCountLabel(count: number): string {
  return `${count} ${count === 1 ? "prescription" : "prescriptions"}`;
}
