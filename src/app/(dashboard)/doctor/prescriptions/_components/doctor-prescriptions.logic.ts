import type { PillTone } from "@/components/tbd";
import { statusLabel, statusTone } from "@/components/tbd";
import { ageInYears, formatDateInIST, formatDateKeyInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { genderLabel } from "@/lib/utils/labels";
import {
  DESK_STATE_LABEL,
  DESK_STATE_TONE,
  prescriptionReference,
} from "@/app/(dashboard)/pharmacist/dashboard/_components/pharmacist-dashboard.logic";
import { resolvePrescriptionDeskStage } from "@/lib/utils/prescription-desk-stage";

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

/** Medicine-desk stage, in the words of the list filter (`NOT_SENT` is a row without one). */
export type PharmacyStageKey = "PAYMENT_PENDING" | "READY_TO_DISPENSE" | "DISPENSED" | "PARTIAL" | "CANCELLED";

export interface PharmacyState {
  stage: PharmacyStageKey;
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
  /** Clinic-issued health ID; "" when none has been issued. */
  patientUhid: string;
  patientPhone: string;
  /** Raw status code from the API ("PENDING", "DRAFT", "FILLED", ...). */
  statusCode: string;
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

/** The shared desk-stage mapper (same as the patient portal), with the pharmacy screens' wording. */
function pharmacyState(prescription: Raw): PharmacyState | null {
  const stage = resolvePrescriptionDeskStage(prescription);
  switch (stage) {
    case "CANCELLED":
      return { stage, label: statusLabel("CANCELLED"), tone: statusTone("CANCELLED") };
    case "DISPENSED":
      return { stage, label: statusLabel("DISPENSED"), tone: statusTone("DISPENSED") };
    case "PARTIAL":
      return { stage, label: DESK_STATE_LABEL.partially_dispensed, tone: DESK_STATE_TONE.partially_dispensed };
    case "READY_TO_DISPENSE":
      return { stage, label: DESK_STATE_LABEL.ready_to_dispense, tone: DESK_STATE_TONE.ready_to_dispense };
    case "PAYMENT_PENDING":
      return { stage, label: DESK_STATE_LABEL.awaiting_payment, tone: DESK_STATE_TONE.awaiting_payment };
    default:
      return null;
  }
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
    patientUhid: text(raw.patientUhid) || text(asRecord(raw.patient).uhid),
    patientPhone: text(raw.patientPhone) || text(asRecord(asRecord(raw.patient).user).phone),
    statusCode: upper(raw.status),
    date: text(raw.date) || text(raw.prescribedAt) || text(raw.createdAt),
    diagnosis: text(raw.diagnosis),
    notes: text(raw.doctorNotes) || text(raw.notes),
    medicines: medicineNames(raw),
    status: normalizeStatus(raw.status),
    pharmacy: pharmacyState(raw),
    // The backend sends its own relative path; the page links to the web route that forwards the
    // request with the sign-in cookie.
    pdfUrl: id && text(raw.pdfUrl) ? `/api/pharmacy/prescriptions/${encodeURIComponent(id)}/pdf` : "",
  };
}

export function normalizeDoctorPrescriptions(list: unknown): DoctorPrescriptionRow[] {
  return asList(list).map(normalizeDoctorPrescription);
}

/** "3 October 2026" */
export function prescriptionDateLabel(date: string): string {
  if (!date) return "";
  return formatDateInIST(date, { year: "numeric", month: "long", day: "numeric" });
}

/** List cell: the time for a prescription written today ("10:42 am"), the day otherwise ("3 Oct 2026"). */
export function prescriptionWhenLabel(date: string, todayKey: string): string {
  if (!date) return "—";
  if (todayKey && formatDateKeyInIST(date) === todayKey) return formatTimeInIST(date).toLowerCase();
  return formatDateInIST(date, { day: "numeric", month: "short", year: "numeric" });
}

/** True for a prescription that is still the assistant's draft (or a draft sent back for changes). */
export function isDraftPrescription(row: Pick<DoctorPrescriptionRow, "statusCode">): boolean {
  return row.statusCode === "DRAFT" || row.statusCode === "RETURNED";
}

/** Status pill of a row: drafts read "Draft" / "Returned", everything else the folded status. */
/** Label of the medicines column for a note-only prescription (diagnosis / advice, no medicines). */
export const ADVICE_ONLY_LABEL = "Advice only";

/**
 * A note-only prescription: no medicines, written for the diagnosis / advice. The API stores it
 * FILLED from the start (nothing to dispense; the list answers it as DISPENSED), so it must not
 * read as "dispensed".
 */
export function isAdviceOnlyPrescription(row: Pick<DoctorPrescriptionRow, "statusCode"> & { medicines?: string[] }): boolean {
  return Array.isArray(row.medicines) && row.medicines.length === 0 && DISPENSED_STATUSES.has(upper(row.statusCode));
}

export function prescriptionStatusPill(
  row: Pick<DoctorPrescriptionRow, "status" | "statusCode"> & { medicines?: string[] },
): {
  label: string;
  tone: PillTone;
} {
  if (row.statusCode === "DRAFT") return { label: "Draft", tone: "slate" };
  if (isAdviceOnlyPrescription(row)) return { label: ADVICE_ONLY_LABEL, tone: "slate" };
  if (row.statusCode === "RETURNED") return { label: "Returned", tone: "amber" };
  return { label: statusLabel(row.status), tone: statusTone(row.status) };
}

// ── One prescription (detail, print, sent) ─────────────────────────────────

/** One medicine line as the detail, print and sent screens show it. No prices. */
export interface DoctorRxLine {
  id: string;
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  dispensedQuantity: number;
}

export interface DoctorPrescriptionDetail extends DoctorPrescriptionRow {
  lines: DoctorRxLine[];
  /** Raw status code from the API ("PENDING", "DRAFT", "FILLED", ...). */
  statusCode: string;
  doctorName: string;
  /** Degrees and registration number when the doctor record carries them (letterhead). */
  doctorQualification: string;
  doctorRegistration: string;
  /** "34 years · Male" when the record has them. */
  patientMeta: string;
  patientPhone: string;
  patientUserId: string;
  locationId: string;
  locationName: string;
  appointmentId: string;
  visitId: string;
  validUntil: string;
  approvedAt: string;
  /** Who prepared it, when an assistant drafted it. */
  draftedByName: string;
}

function rxLines(raw: Raw): DoctorRxLine[] {
  return asList(raw.items).map((entry, index) => {
    const item = asRecord(entry);
    const medicine = asRecord(item.medicine);
    const quantity = Number(item.quantity);
    const dispensed = Number(item.dispensedQuantity);
    return {
      id: text(item.id) || `line-${index}`,
      medicineId: text(item.medicineId) || text(medicine.id),
      name: text(medicine.name) || text(item.medicineName) || text(item.name) || "Medicine",
      dosage: text(item.dosage),
      frequency: text(item.frequency),
      duration: text(item.duration),
      quantity: Number.isFinite(quantity) ? quantity : 0,
      instructions: text(item.instructions),
      dispensedQuantity: Number.isFinite(dispensed) ? dispensed : 0,
    };
  });
}

function personName(source: unknown): string {
  const record = asRecord(source);
  const user = asRecord(record.user);
  return (
    text(user.name) ||
    `${text(user.firstName)} ${text(user.lastName)}`.trim() ||
    text(record.name) ||
    `${text(record.firstName)} ${text(record.lastName)}`.trim()
  );
}

function patientMetaOf(patient: Raw): string {
  const user = asRecord(patient.user);
  const age = ageInYears(text(patient.dateOfBirth) || text(user.dateOfBirth));
  const gender = text(patient.gender) || text(user.gender);
  return [age !== null ? `${age} years` : "", gender ? genderLabel(gender) : ""].filter(Boolean).join(" · ");
}

/** GET /pharmacy/prescriptions/:id (or a list row) -> what the detail / print / sent screens render. */
export function normalizeDoctorPrescriptionDetail(input: unknown): DoctorPrescriptionDetail {
  const raw = asRecord(input);
  const base = normalizeDoctorPrescription(raw);
  const patient = asRecord(raw.patient);
  const user = asRecord(patient.user);
  const lines = rxLines(raw);
  return {
    ...base,
    medicines: base.medicines.length > 0 ? base.medicines : lines.map((line) => line.name),
    lines,
    statusCode: upper(raw.status),
    doctorName: personName(raw.doctor),
    doctorQualification: text(asRecord(raw.doctor).qualification) || text(asRecord(raw.doctor).qualifications),
    doctorRegistration:
      text(asRecord(raw.doctor).registrationNumber) || text(asRecord(raw.doctor).licenseNumber),
    patientMeta: patientMetaOf(patient),
    patientPhone: text(user.phone) || text(patient.phone),
    patientUserId: text(user.id) || text(patient.userId),
    locationId: text(raw.locationId) || text(asRecord(raw.location).id),
    locationName: text(asRecord(raw.location).name),
    appointmentId: text(raw.appointmentId),
    visitId: text(raw.visitId),
    validUntil: text(raw.validUntil),
    approvedAt: text(raw.approvedAt),
    draftedByName: text(raw.draftedByName),
  };
}

/** "1 tablet · 1-0-1 · 3 days · after food" for one line. */
export function rxLineSummary(line: Pick<DoctorRxLine, "dosage" | "frequency" | "duration" | "instructions">): string {
  return [line.dosage, line.frequency, line.duration, line.instructions].filter(Boolean).join(" · ");
}

/** True once the medicine desk has handed over every line. */
export function isFullyDispensed(detail: Pick<DoctorPrescriptionDetail, "lines" | "status">): boolean {
  if (detail.status === "completed") return true;
  return detail.lines.length > 0 && detail.lines.every((line) => line.quantity > 0 && line.dispensedQuantity >= line.quantity);
}

/** Masked phone for screens that say where the PDF goes: "+91 98•••• 4321". */
export function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "";
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91 ${local.slice(0, 2)}•••• ${local.slice(-4)}`;
}
