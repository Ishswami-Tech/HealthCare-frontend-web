/**
 * Pure helpers for the patient Health screens (hub, Reports & Lab, Medicines, Records).
 *
 * The API returns loosely shaped rows (the EHR tables, the pharmacy prescription list, the
 * patient's uploaded files), so everything is read defensively and turned into small view
 * models. Nothing here invents a value: a field the API did not send stays empty.
 */

import type { IconTone, PillTone } from "@/components/tbd";
import { normalizeStatus, statusLabel, statusTone } from "@/components/tbd";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import { formatDateKeyInIST, formatDateLabel, formatTimeLabel } from "@/lib/utils/date-time";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import {
  asRecordOrEmpty,
  firstIsoDate,
  firstMeaningfulText,
  numberOrZero,
  unwrapRecords,
} from "@/lib/utils/coerce";
import { formatBytes, plural, prescriptionReference, sentenceCase } from "@/lib/utils/labels";

export type Raw = Record<string, unknown>;

// ── reading loose rows ─────────────────────────────────────────────────────

function timeOf(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function newestFirst<T extends { date: string | null }>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index, time: timeOf(row.date) }))
    .sort((a, b) => (b.time === a.time ? a.index - b.index : b.time - a.time))
    .map((entry) => entry.row);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isRecent(date: string | null, now: number, days = 7): boolean {
  const time = timeOf(date);
  return Number.isFinite(time) && now - time >= 0 && now - time <= days * DAY_MS;
}

// ── vitals ─────────────────────────────────────────────────────────────────

export type VitalKey = "heartRate" | "bloodPressure" | "bloodSugar" | "weight";

export interface VitalTile {
  key: VitalKey;
  label: string;
  /** null = the patient has no reading of this kind. */
  value: string | null;
  unit: string;
  recordedAt: string | null;
}

const VITAL_ORDER: VitalKey[] = ["heartRate", "bloodPressure", "bloodSugar", "weight"];

const VITAL_DEFAULTS: Record<VitalKey, { label: string; unit: string }> = {
  heartRate: { label: "Heart rate", unit: "bpm" },
  bloodPressure: { label: "Blood pressure", unit: "mmHg" },
  bloodSugar: { label: "Blood sugar", unit: "mg/dL" },
  weight: { label: "Weight", unit: "kg" },
};

type VitalSlot = VitalKey | "systolic" | "diastolic";

function classifyVital(type: string): VitalSlot | null {
  const key = type.toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return null;
  if (key.includes("systolic")) return "systolic";
  if (key.includes("diastolic")) return "diastolic";
  if (key.includes("pressure") || key === "bp") return "bloodPressure";
  if (key.includes("heart") || key.startsWith("pulse") || key === "hr") return "heartRate";
  if (key.includes("sugar") || key.includes("glucose")) return "bloodSugar";
  if (key.includes("weight")) return "weight";
  return null;
}

interface VitalReading {
  value: string;
  unit: string;
  label: string;
  date: string | null;
}

function bloodPressureText(row: Raw): string {
  const direct = row.bp ?? row.bloodPressure;
  if (direct && typeof direct === "object") {
    const pair = asRecordOrEmpty(direct);
    const systolic = firstMeaningfulText(pair.systolic);
    const diastolic = firstMeaningfulText(pair.diastolic);
    return systolic && diastolic ? `${systolic}/${diastolic}` : "";
  }
  const systolic = firstMeaningfulText(row.bloodPressureSystolic, row.systolic);
  const diastolic = firstMeaningfulText(row.bloodPressureDiastolic, row.diastolic);
  return firstMeaningfulText(direct) || (systolic && diastolic ? `${systolic}/${diastolic}` : "");
}

/** Every reading in the list, whichever shape the row has (one vital per row, or one visit per row). */
function readVitalRows(vitals: unknown): Array<{ slot: VitalSlot; reading: VitalReading }> {
  const readings: Array<{ slot: VitalSlot; reading: VitalReading }> = [];
  for (const row of unwrapRecords(vitals, "vitals")) {
    const date = firstIsoDate(row.recordedAt, row.date, row.createdAt);
    const type = firstMeaningfulText(row.type, row.vitalType, row.name);
    if (type) {
      const slot = classifyVital(type);
      const value = firstMeaningfulText(row.value);
      if (!slot || !value) continue;
      const fasting = slot === "bloodSugar" && /fasting/i.test(type);
      const label = slot === "systolic" || slot === "diastolic" ? "" : VITAL_DEFAULTS[slot].label;
      readings.push({
        slot,
        reading: { value, unit: firstMeaningfulText(row.unit), label: fasting ? `${label} (fasting)` : label, date },
      });
      continue;
    }
    const wide: Array<[VitalKey, string]> = [
      ["heartRate", firstMeaningfulText(row.hr, row.heartRate, row.pulse, row.pulseRate)],
      ["bloodPressure", bloodPressureText(row)],
      ["bloodSugar", firstMeaningfulText(row.bloodSugar, row.sugar, row.glucose)],
      ["weight", firstMeaningfulText(row.weight)],
    ];
    for (const [slot, value] of wide) {
      if (value) readings.push({ slot, reading: { value, unit: "", label: VITAL_DEFAULTS[slot].label, date } });
    }
  }
  return readings;
}

/** The four tiles of the hub, each with the patient's latest reading (or none). */
export function buildVitalTiles(vitals: unknown): VitalTile[] {
  const latest = new Map<VitalSlot, VitalReading>();
  for (const { slot, reading } of readVitalRows(vitals)) {
    const current = latest.get(slot);
    if (!current || timeOf(reading.date) > timeOf(current.date)) latest.set(slot, reading);
  }

  // Pressure stored as two rows (systolic and diastolic) reads as one value.
  const systolic = latest.get("systolic");
  const diastolic = latest.get("diastolic");
  const pressure = latest.get("bloodPressure");
  if (systolic && diastolic && (!pressure || timeOf(systolic.date) > timeOf(pressure.date))) {
    latest.set("bloodPressure", {
      value: `${systolic.value}/${diastolic.value}`,
      unit: systolic.unit || diastolic.unit,
      label: VITAL_DEFAULTS.bloodPressure.label,
      date: systolic.date,
    });
  }

  return VITAL_ORDER.map((key) => {
    const reading = latest.get(key);
    return {
      key,
      label: reading?.label || VITAL_DEFAULTS[key].label,
      value: reading?.value ?? null,
      unit: reading ? reading.unit || VITAL_DEFAULTS[key].unit : VITAL_DEFAULTS[key].unit,
      recordedAt: reading?.date ?? null,
    };
  });
}

/** "Vitals updated today, 8:30 am" or "Vitals updated 28 Sept 2026". Empty when there is no reading. */
export function vitalsUpdatedLabel(tiles: VitalTile[], now: Date = new Date()): string {
  const latest = tiles.reduce<string | null>(
    (best, tile) => (timeOf(tile.recordedAt) > timeOf(best) ? tile.recordedAt : best),
    null,
  );
  if (!latest) return "";
  if (formatDateKeyInIST(latest) === formatDateKeyInIST(now)) {
    return `Vitals updated today, ${formatTimeLabel(latest)}`;
  }
  return `Vitals updated ${formatDateLabel(latest)}`;
}

export interface VitalHistoryRow {
  id: string;
  date: string | null;
  name: string;
  value: string;
  notes: string;
}

/** Every reading, newest first, for the Vitals tab of Records. */
export function buildVitalHistory(vitals: unknown): VitalHistoryRow[] {
  const rows: VitalHistoryRow[] = [];
  unwrapRecords(vitals, "vitals").forEach((row, index) => {
    const date = firstIsoDate(row.recordedAt, row.date, row.createdAt);
    const type = firstMeaningfulText(row.type, row.vitalType, row.name);
    if (type) {
      const value = firstMeaningfulText(row.value);
      rows.push({
        id: firstMeaningfulText(row.id) || `vital-${index}`,
        date,
        name: sentenceCase(type).replace(/^bp\b/i, "BP"),
        value: value ? [value, firstMeaningfulText(row.unit)].filter(Boolean).join(" ") : "",
        notes: firstMeaningfulText(row.notes),
      });
      return;
    }
    const wide: Array<[string, string, string]> = [
      ["Blood pressure", bloodPressureText(row), "mmHg"],
      ["Heart rate", firstMeaningfulText(row.hr, row.heartRate, row.pulse, row.pulseRate), "bpm"],
      ["Weight", firstMeaningfulText(row.weight), "kg"],
      ["BMI", firstMeaningfulText(row.bmi), ""],
    ];
    wide.forEach(([name, value, unit]) => {
      if (value) rows.push({ id: `vital-${index}-${name}`, date, name, value: [value, unit].filter(Boolean).join(" "), notes: firstMeaningfulText(row.notes) });
    });
  });
  return newestFirst(rows);
}

// ── prescriptions (pharmacy list) ──────────────────────────────────────────

export type PharmacyState = "awaiting_payment" | "ready_to_dispense" | "partially_dispensed" | "dispensed" | "cancelled";

/** Same wording and colours as the pharmacy screens. */
export const PHARMACY_STATE: Record<PharmacyState, { label: string; tone: PillTone }> = {
  awaiting_payment: { label: "Payment pending", tone: "amber" },
  ready_to_dispense: { label: "Ready to dispense", tone: "green" },
  partially_dispensed: { label: "Partially dispensed", tone: "blue" },
  dispensed: { label: "Dispensed", tone: "slate" },
  cancelled: { label: "Cancelled", tone: "rose" },
};

export interface PrescriptionLine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  category: string;
  description: string;
  /** "Pending dispense", "6/10 dispensed", "10 units" */
  supplyLabel: string;
  /** "B-2291 × 6, B-2310 × 4" */
  batches: string;
  dispensed: boolean;
}

export interface PatientPrescription {
  /** The real id: used to pay and to deep link. */
  id: string;
  /** What people see: RX- and the first 8 characters of the id. */
  number: string;
  date: string | null;
  dateLabel: string;
  doctorName: string;
  diagnosis: string;
  notes: string;
  locationName: string;
  state: PharmacyState;
  lines: PrescriptionLine[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: string;
  validUntil: string | null;
  /** "Queue #3" while the prescription waits at the medicine desk. */
  queueLabel: string | null;
  atDesk: boolean;
  invoiceId: string | null;
  pdfUrl: string | null;
}

function toLine(item: Raw, index: number): PrescriptionLine {
  const medicine = asRecordOrEmpty(item.medicine);
  const quantity = numberOrZero(item.quantity);
  const given = numberOrZero(item.dispensedQuantity);
  const history = unwrapRecords(item.dispenseBatchHistory).filter((entry) => numberOrZero(entry.quantity) > 0);
  const supplyLabel =
    item.isDispensed === false
      ? "Pending dispense"
      : given > 0
        ? `${given}/${quantity || given} dispensed`
        : quantity > 0
          ? plural(quantity, "unit", "units")
          : "As prescribed";
  return {
    id: firstMeaningfulText(item.id) || `${firstMeaningfulText(item.medicineId) || "line"}-${index}`,
    name: firstMeaningfulText(medicine.name, item.medicineName, item.name) || "Medicine",
    dosage: firstMeaningfulText(item.dosage),
    frequency: firstMeaningfulText(item.frequency),
    duration: firstMeaningfulText(item.duration),
    instructions: firstMeaningfulText(item.instructions),
    category: sentenceCase(firstMeaningfulText(medicine.category, medicine.type)),
    description: firstMeaningfulText(medicine.description, medicine.properties),
    supplyLabel,
    batches: history.map((entry) => `${firstMeaningfulText(entry.batchNumber) || "Batch"} × ${numberOrZero(entry.quantity)}`).join(", "),
    dispensed: item.isDispensed === true || (quantity > 0 && given >= quantity),
  };
}

function pharmacyState(raw: Raw, lines: PrescriptionLine[], pendingAmount: number): PharmacyState {
  const status = normalizeStatus(firstMeaningfulText(raw.status));
  if (status === "CANCELLED") return "cancelled";
  if (["DISPENSED", "FILLED", "COMPLETED"].includes(status)) return "dispensed";
  if (status === "PARTIAL" || status === "PARTIALLY_DISPENSED") return "partially_dispensed";
  if (lines.length > 1 && lines.some((line) => line.dispensed) && lines.some((line) => !line.dispensed)) {
    return "partially_dispensed";
  }
  if (pendingAmount > 0 || raw.waitingForPayment === true) return "awaiting_payment";
  return "ready_to_dispense";
}

/** The patient's prescriptions from `GET pharmacy/prescriptions/patient/:userId`, newest first. */
export function buildPrescriptions(data: unknown): PatientPrescription[] {
  const prescriptions = unwrapRecords(data, "prescriptions").reduce<PatientPrescription[]>((list, raw) => {
    const id = firstMeaningfulText(raw.id);
    if (!id) return list;
    const items = unwrapRecords(raw.items).length > 0 ? unwrapRecords(raw.items) : unwrapRecords(raw.medications);
    const lines = items.map(toLine);
    const doctor = asRecordOrEmpty(raw.doctor);
    const doctorName = firstMeaningfulText(
      raw.doctorName,
      asRecordOrEmpty(doctor.user).name,
      doctor.name,
      `${firstMeaningfulText(doctor.firstName)} ${firstMeaningfulText(doctor.lastName)}`,
    );
    const pendingAmount = numberOrZero(raw.pendingAmount);
    const queue = normalizeQueueEntry(raw);
    const state = pharmacyState(raw, lines, pendingAmount);
    const open = state !== "dispensed" && state !== "cancelled";
    const date = firstIsoDate(raw.prescribedAt, raw.date, raw.createdAt, raw.updatedAt);
    list.push({
      id,
      number: prescriptionReference(id, raw) || "Prescription",
      date,
      dateLabel: formatDateLabel(date),
      doctorName: doctorName && !/^unknown/i.test(doctorName) ? formatDoctorDisplayName(doctorName) : "",
      diagnosis: firstMeaningfulText(raw.diagnosis),
      notes: firstMeaningfulText(raw.notes),
      locationName: firstMeaningfulText(raw.locationName, asRecordOrEmpty(raw.location).name),
      state,
      lines,
      totalAmount: numberOrZero(raw.totalAmount),
      paidAmount: numberOrZero(raw.paidAmount),
      pendingAmount,
      paymentStatus: normalizeStatus(firstMeaningfulText(raw.paymentStatus)) || "PENDING",
      validUntil: firstIsoDate(raw.validUntil),
      queueLabel: open && queue.position > 0 ? getQueuePositionLabel({ position: queue.position }) : null,
      atDesk: open && Boolean(raw.activeQueueEntry ?? queue.position > 0),
      invoiceId: firstMeaningfulText(raw.invoiceId) || null,
      // Linked through the web route that forwards the request with the sign-in cookie.
      pdfUrl: firstMeaningfulText(raw.pdfUrl) ? `/api/pharmacy/prescriptions/${encodeURIComponent(id)}/pdf` : null,
    });
    return list;
  }, []);
  return newestFirst(prescriptions);
}

/** A patient pays only what is still due on a prescription that was not cancelled. */
export function canPay(prescription: Pick<PatientPrescription, "pendingAmount" | "state">): boolean {
  return prescription.pendingAmount > 0 && prescription.state !== "cancelled";
}

export function medicinesLabel(count: number): string {
  return plural(count, "medicine", "medicines");
}

/** Same search as before: number, doctor, or a medicine name. */
export function filterPrescriptions(prescriptions: PatientPrescription[], searchTerm: string): PatientPrescription[] {
  const needle = searchTerm.trim().toLowerCase();
  if (!needle) return prescriptions;
  return prescriptions.filter(
    (prescription) =>
      prescription.number.toLowerCase().includes(needle) ||
      prescription.id.toLowerCase().includes(needle) ||
      prescription.doctorName.toLowerCase().includes(needle) ||
      prescription.diagnosis.toLowerCase().includes(needle) ||
      prescription.lines.some((line) => line.name.toLowerCase().includes(needle)),
  );
}

// ── current medicines ──────────────────────────────────────────────────────

/** "5 days" -> 5, "2 weeks" -> 14, "1 month" -> 30. null when the text is not a length of time. */
export function parseDurationDays(duration: string): number | null {
  const clean = duration.trim();
  const match = /(\d+(?:\.\d+)?)\s*(days?|d|weeks?|wks?|w|months?|mo)\b/i.exec(clean);
  const count = match?.[1] ? Number(match[1]) : /^\d+$/.test(clean) ? Number(clean) : Number.NaN;
  if (!Number.isFinite(count) || count <= 0) return null;
  const unit = (match?.[2] ?? "day").toLowerCase();
  if (unit.startsWith("w")) return count * 7;
  if (unit.startsWith("m")) return count * 30;
  return count;
}

/** When a line has no readable duration, a prescription counts as current for this many days. */
const CURRENT_WINDOW_DAYS = 30;

function isLineCurrent(prescription: PatientPrescription, line: PrescriptionLine, now: number): boolean {
  if (prescription.state === "cancelled") return false;
  const start = timeOf(prescription.date);
  if (!Number.isFinite(start)) return false;
  const days = parseDurationDays(line.duration) ?? CURRENT_WINDOW_DAYS;
  return now <= start + (days + 1) * DAY_MS;
}

export interface CurrentMedicine {
  id: string;
  name: string;
  /** "1 tablet · after breakfast · 5 days" */
  schedule: string;
  instructions: string;
  /** The prescription it came from. null for a medicine that is only in the health record. */
  prescriptionId: string | null;
  prescriptionNumber: string;
  state: PharmacyState | null;
}

const medicineKey = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Medicines the patient is on now: the lines of prescriptions whose course is still running,
 * plus active medicines from the health record (`GET ehr/analytics/medication-adherence`)
 * that no prescription already lists.
 */
export function buildCurrentMedicines(
  prescriptions: PatientPrescription[],
  activeMedications: unknown,
  now: Date = new Date(),
): CurrentMedicine[] {
  const seen = new Set<string>();
  const medicines: CurrentMedicine[] = [];

  for (const prescription of prescriptions) {
    for (const line of prescription.lines) {
      const key = medicineKey(line.name);
      if (seen.has(key) || !isLineCurrent(prescription, line, now.getTime())) continue;
      seen.add(key);
      medicines.push({
        id: `${prescription.id}-${line.id}`,
        name: line.name,
        schedule: [line.dosage, line.frequency, line.duration].filter(Boolean).join(" · "),
        instructions: line.instructions,
        prescriptionId: prescription.id,
        prescriptionNumber: prescription.number,
        state: prescription.state,
      });
    }
  }

  unwrapRecords(activeMedications, "medications").forEach((row, index) => {
    const name = firstMeaningfulText(row.name, row.medicineName, row.medication);
    if (!name || row.isActive === false) return;
    const end = firstIsoDate(row.endDate);
    if (end && timeOf(end) + DAY_MS < now.getTime()) return;
    const key = medicineKey(name);
    if (seen.has(key)) return;
    seen.add(key);
    medicines.push({
      id: firstMeaningfulText(row.id) || `record-${index}`,
      name,
      schedule: [firstMeaningfulText(row.dosage), firstMeaningfulText(row.frequency)].filter(Boolean).join(" · "),
      instructions: firstMeaningfulText(row.purpose, row.notes),
      prescriptionId: null,
      prescriptionNumber: "",
      state: null,
    });
  });

  return medicines;
}

/** "From Dr. Deshmukh's prescriptions" */
export function medicinesSourceLabel(prescriptions: PatientPrescription[]): string {
  const doctors = Array.from(new Set(prescriptions.map((prescription) => prescription.doctorName).filter(Boolean)));
  if (prescriptions.length === 0) return "Medicines from your prescriptions show here.";
  if (doctors.length === 1 && doctors[0]) {
    const name = doctors[0];
    return `From ${name}${name.endsWith("s") ? "'" : "'s"} prescriptions`;
  }
  return "From your doctors' prescriptions";
}

// ── reports ────────────────────────────────────────────────────────────────

export type ReportKind = "lab" | "imaging" | "rx" | "other";

export interface ReportStatus {
  label: string;
  tone: PillTone;
}

export interface ReportDetail {
  label: string;
  value: string;
}

export interface ReportRow {
  id: string;
  kind: ReportKind;
  title: string;
  source: string;
  date: string | null;
  dateLabel: string;
  status: ReportStatus | null;
  /** A result outside its normal range, or flagged by the lab. */
  needsAttention: boolean;
  iconTone: IconTone;
  /** The stored file, when the report has one. */
  fileUrl: string | null;
  /** Prescriptions open in Medicines instead of a details dialog. */
  href: string | null;
  details: ReportDetail[];
}

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  lab: "Lab",
  imaging: "Imaging",
  rx: "Rx",
  other: "Other",
};

const RESULT_STATUS: Record<string, ReportStatus & { attention: boolean }> = {
  NORMAL: { label: "Normal", tone: "green", attention: false },
  HIGH: { label: "High", tone: "amber", attention: true },
  LOW: { label: "Low", tone: "amber", attention: true },
  ABNORMAL: { label: "Abnormal", tone: "amber", attention: true },
  BORDERLINE: { label: "Borderline", tone: "amber", attention: true },
  REVIEW: { label: "Review", tone: "amber", attention: true },
  ATTENTION_REQUIRED: { label: "Needs attention", tone: "amber", attention: true },
  CRITICAL: { label: "Critical", tone: "rose", attention: true },
};

/** Compares a numeric result with a range such as "70 - 100", "< 200" or "> 40". */
export function resultFlag(result: string, range: string): "NORMAL" | "HIGH" | "LOW" | null {
  const valueMatch = /^-?\d+(?:\.\d+)?/.exec(result.trim());
  if (!valueMatch || !range.trim()) return null;
  const value = Number(valueMatch[0]);
  const between = /(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i.exec(range);
  if (between?.[1] && between[2]) {
    if (value < Number(between[1])) return "LOW";
    if (value > Number(between[2])) return "HIGH";
    return "NORMAL";
  }
  const upper = /(?:<=?|≤|up\s*to|below|less\s*than)\s*(-?\d+(?:\.\d+)?)/i.exec(range);
  if (upper?.[1]) return value > Number(upper[1]) ? "HIGH" : "NORMAL";
  const lower = /(?:>=?|≥|above|more\s*than|over)\s*(-?\d+(?:\.\d+)?)/i.exec(range);
  if (lower?.[1]) return value < Number(lower[1]) ? "LOW" : "NORMAL";
  return null;
}

function statusOf(code: string): (ReportStatus & { attention: boolean }) | null {
  const key = normalizeStatus(code);
  if (!key) return null;
  return RESULT_STATUS[key] ?? { label: statusLabel(key), tone: statusTone(key), attention: false };
}

function fallbackStatus(date: string | null, now: number): ReportStatus | null {
  return isRecent(date, now) ? { label: "New", tone: "blue" } : null;
}

function labRow(raw: Raw, index: number, now: number): ReportRow {
  const date = firstIsoDate(raw.date, raw.testDate, raw.reportedDate, raw.createdAt);
  const result = firstMeaningfulText(raw.result);
  const unit = firstMeaningfulText(raw.unit);
  const range = firstMeaningfulText(raw.normalRange);
  // Older payloads carry a list of parameters with their own status.
  const parameters = unwrapRecords(raw.results);
  const flagged = parameters.filter((entry) => statusOf(firstMeaningfulText(entry.status))?.attention);

  let status = statusOf(firstMeaningfulText(raw.status));
  if (flagged.length > 0) {
    const allHigh = flagged.every((entry) => normalizeStatus(firstMeaningfulText(entry.status)) === "HIGH");
    status = { label: `${flagged.length} ${allHigh ? "high" : "to review"}`, tone: "amber", attention: true };
  } else if (!status) {
    status = statusOf(resultFlag(result, range) ?? "");
  }

  const details: ReportDetail[] = [];
  if (result) details.push({ label: "Result", value: [result, unit].filter(Boolean).join(" ") });
  if (range) details.push({ label: "Normal range", value: [range, unit].filter(Boolean).join(" ") });
  parameters.forEach((entry) => {
    const name = firstMeaningfulText(entry.parameter, entry.name);
    const value = firstMeaningfulText(entry.value, entry.result);
    if (!name || !value) return;
    const normal = firstMeaningfulText(entry.normalRange);
    details.push({ label: name, value: normal ? `${value} (normal: ${normal})` : value });
  });
  if (firstMeaningfulText(raw.notes)) details.push({ label: "Notes", value: firstMeaningfulText(raw.notes) });

  return {
    id: `lab-${firstMeaningfulText(raw.id) || index}`,
    kind: "lab",
    title: firstMeaningfulText(raw.testName, raw.title, raw.reportType) || "Lab report",
    source: firstMeaningfulText(raw.labName, raw.doctor, raw.doctorName) || "Lab report",
    date,
    dateLabel: formatDateLabel(date),
    status: status ? { label: status.label, tone: status.tone } : fallbackStatus(date, now),
    needsAttention: Boolean(status?.attention),
    iconTone: status?.attention ? "amber" : "rose",
    fileUrl: firstMeaningfulText(raw.fileUrl) || null,
    href: null,
    details,
  };
}

function imagingRow(raw: Raw, index: number, now: number): ReportRow {
  const date = firstIsoDate(raw.date, raw.performedAt, raw.reportedAt, raw.createdAt);
  const status = statusOf(firstMeaningfulText(raw.status));
  const details: ReportDetail[] = [
    { label: "Findings", value: firstMeaningfulText(raw.findings) },
    { label: "Conclusion", value: firstMeaningfulText(raw.conclusion, raw.impression) },
    { label: "Notes", value: firstMeaningfulText(raw.notes) },
  ].filter((entry) => entry.value);
  return {
    id: `imaging-${firstMeaningfulText(raw.id) || index}`,
    kind: "imaging",
    title: firstMeaningfulText(raw.imageType, raw.studyType, raw.title) || "Imaging report",
    source: firstMeaningfulText(raw.facility, raw.radiologist) || "Imaging",
    date,
    dateLabel: formatDateLabel(date),
    status: status ? { label: status.label, tone: status.tone } : fallbackStatus(date, now),
    needsAttention: Boolean(status?.attention),
    iconTone: "blue",
    fileUrl: firstMeaningfulText(raw.fileUrl) || null,
    href: null,
    details,
  };
}

const UPLOAD_KIND: Record<string, ReportKind> = {
  LAB_TEST: "lab",
  LAB: "lab",
  XRAY: "imaging",
  MRI: "imaging",
  SCAN: "imaging",
  IMAGING: "imaging",
  PRESCRIPTION: "rx",
};

export const UPLOAD_CATEGORY_LABEL: Record<string, string> = {
  LAB_TEST: "Lab report",
  XRAY: "X-ray or scan",
  MRI: "MRI",
  PRESCRIPTION: "Prescription",
  DIAGNOSIS_REPORT: "Other document",
  PULSE_DIAGNOSIS: "Pulse diagnosis",
  OTHER: "Other document",
};

/** A file from `GET patients/:id/documents` (or the `documents` list of the health record). */
function uploadRow(raw: Raw, index: number, userId: string, now: number): ReportRow {
  const date = firstIsoDate(raw.uploadedAt, raw.date, raw.createdAt);
  const category = normalizeStatus(firstMeaningfulText(raw.category)) || "OTHER";
  const kind = UPLOAD_KIND[category] ?? "other";
  const size = numberOrZero(raw.fileSize);
  const details: ReportDetail[] = [
    { label: "Type", value: UPLOAD_CATEGORY_LABEL[category] ?? sentenceCase(category) },
    { label: "File size", value: size > 0 ? formatBytes(size) : "" },
    { label: "Notes", value: firstMeaningfulText(raw.description, raw.notes) },
  ].filter((entry) => entry.value);
  const uploader = firstMeaningfulText(raw.uploadedBy);
  return {
    id: `upload-${firstMeaningfulText(raw.id) || index}`,
    kind,
    title: firstMeaningfulText(raw.fileName, raw.title) || "Document",
    source: uploader && uploader === userId ? "Uploaded by you" : "Added by your clinic",
    date,
    dateLabel: formatDateLabel(date),
    status: fallbackStatus(date, now) ?? { label: "Uploaded", tone: "slate" },
    needsAttention: false,
    iconTone: kind === "imaging" ? "blue" : kind === "rx" ? "video" : kind === "lab" ? "rose" : "mint",
    fileUrl: firstMeaningfulText(raw.url, raw.fileUrl) || null,
    href: null,
    details,
  };
}

function prescriptionRow(prescription: PatientPrescription): ReportRow {
  const state = PHARMACY_STATE[prescription.state];
  return {
    id: `rx-${prescription.id}`,
    kind: "rx",
    title: prescription.doctorName ? `Prescription · ${prescription.doctorName}` : `Prescription ${prescription.number}`,
    source: prescription.diagnosis || prescription.locationName || prescription.number,
    date: prescription.date,
    dateLabel: prescription.dateLabel,
    status: { label: state.label, tone: state.tone },
    needsAttention: false,
    iconTone: "video",
    fileUrl: prescription.pdfUrl,
    href: `/patient/health/medicines?prescriptionId=${encodeURIComponent(prescription.id)}`,
    details: [],
  };
}

export interface ReportSources {
  labReports?: unknown;
  radiologyReports?: unknown;
  uploads?: unknown;
  prescriptions?: PatientPrescription[];
  userId?: string;
}

/** One list for Reports & Lab, newest first. */
export function buildReportRows(sources: ReportSources, now: Date = new Date()): ReportRow[] {
  const time = now.getTime();
  const seen = new Set<string>();
  const rows = [
    ...unwrapRecords(sources.labReports, "labReports").map((raw, index) => labRow(raw, index, time)),
    ...unwrapRecords(sources.radiologyReports, "radiologyReports").map((raw, index) => imagingRow(raw, index, time)),
    ...unwrapRecords(sources.uploads, "documents").map((raw, index) => uploadRow(raw, index, sources.userId ?? "", time)),
    ...(sources.prescriptions ?? []).map(prescriptionRow),
  ].filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
  return newestFirst(rows);
}

export type ReportFilter = "all" | ReportKind;

export function filterReports(rows: ReportRow[], filter: ReportFilter): ReportRow[] {
  return filter === "all" ? rows : rows.filter((row) => row.kind === filter);
}

/** "5 reports · 1 needs attention" */
export function reportsSummaryLabel(rows: ReportRow[]): string {
  if (rows.length === 0) return "No reports yet";
  const attention = rows.filter((row) => row.needsAttention).length;
  const total = plural(rows.length, "report", "reports");
  return attention > 0 ? `${total} · ${attention} ${attention === 1 ? "needs" : "need"} attention` : total;
}

// ── records (history, prescriptions and allergies of the health record) ─────

export interface HistoryEntry {
  id: string;
  title: string;
  date: string | null;
  dateLabel: string;
  doctor: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  status: string;
}

export function buildHistory(medicalHistory: unknown): HistoryEntry[] {
  const rows = unwrapRecords(medicalHistory, "medicalHistory").map((raw, index) => {
    const date = firstIsoDate(raw.date, raw.createdAt, raw.updatedAt);
    const title = firstMeaningfulText(raw.condition, raw.type, raw.title, raw.diagnosis) || "Health record";
    const diagnosis = firstMeaningfulText(raw.diagnosis);
    return {
      id: firstMeaningfulText(raw.id) || `history-${index}`,
      title: sentenceCase(title),
      date,
      dateLabel: formatDateLabel(date),
      doctor: firstMeaningfulText(raw.doctor, raw.doctorName),
      diagnosis: diagnosis === title ? "" : diagnosis,
      treatment: firstMeaningfulText(raw.treatment),
      notes: firstMeaningfulText(raw.notes),
      status: firstMeaningfulText(raw.status),
    };
  });
  return newestFirst(rows);
}

export function filterHistory(entries: HistoryEntry[], searchTerm: string): HistoryEntry[] {
  const needle = searchTerm.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) =>
    [entry.title, entry.diagnosis, entry.treatment, entry.doctor, entry.notes].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}

export interface RecordPrescription {
  id: string;
  number: string;
  date: string | null;
  dateLabel: string;
  doctor: string;
  diagnosis: string;
  notes: string;
  status: string;
  medicines: Array<{ id: string; name: string; detail: string }>;
}

/** Prescriptions as the health record lists them (`prescriptions` of `GET ehr/comprehensive`). */
export function buildRecordPrescriptions(prescriptions: unknown): RecordPrescription[] {
  const rows = unwrapRecords(prescriptions, "prescriptions").map((raw, index) => {
    const id = firstMeaningfulText(raw.id) || `prescription-${index}`;
    const date = firstIsoDate(raw.date, raw.prescribedAt, raw.createdAt, raw.updatedAt);
    const items = unwrapRecords(raw.items).length > 0 ? unwrapRecords(raw.items) : unwrapRecords(raw.medications);
    const doctor = firstMeaningfulText(raw.doctorName, raw.doctor);
    return {
      id,
      number: (firstMeaningfulText(raw.id) && prescriptionReference(id, raw)) || "Prescription",
      date,
      dateLabel: formatDateLabel(date),
      doctor: doctor && !/^unknown/i.test(doctor) ? formatDoctorDisplayName(doctor) : "",
      diagnosis: firstMeaningfulText(raw.diagnosis),
      notes: firstMeaningfulText(raw.notes, raw.instructions),
      status: firstMeaningfulText(raw.status),
      medicines: items.map((item, itemIndex) => ({
        id: firstMeaningfulText(item.id) || `${id}-${itemIndex}`,
        name: firstMeaningfulText(item.medicineName, asRecordOrEmpty(item.medicine).name, item.name) || "Medicine",
        detail: [firstMeaningfulText(item.dosage), firstMeaningfulText(item.frequency), firstMeaningfulText(item.duration)].filter(Boolean).join(" · "),
      })),
    };
  });
  return newestFirst(rows);
}

/** "Latest: 28 Sept 2026" for the hub card. */
export function latestPrescriptionLabel(prescriptions: unknown): string {
  const latest = buildRecordPrescriptions(prescriptions)[0];
  if (!latest) return "No prescriptions yet";
  return latest.dateLabel ? `Latest: ${latest.dateLabel}` : "See your medicines";
}

export interface AllergyEntry {
  id: string;
  allergen: string;
  severity: string;
  reaction: string;
  onsetLabel: string;
  status: string;
}

export function buildAllergies(allergies: unknown): AllergyEntry[] {
  return unwrapRecords(allergies, "allergies").reduce<AllergyEntry[]>((list, raw, index) => {
    const allergen = firstMeaningfulText(raw.allergen, raw.name);
    if (!allergen) return list;
    list.push({
      id: firstMeaningfulText(raw.id) || `allergy-${index}`,
      allergen,
      severity: firstMeaningfulText(raw.severity),
      reaction: firstMeaningfulText(raw.reaction),
      onsetLabel: formatDateLabel(firstIsoDate(raw.onsetDate, raw.diagnosedDate)),
      status: firstMeaningfulText(raw.status),
    });
    return list;
  }, []);
}

export function severityTone(severity: string): PillTone {
  const key = normalizeStatus(severity);
  if (key === "SEVERE" || key === "CRITICAL" || key === "HIGH") return "rose";
  if (key === "MODERATE" || key === "MILD") return "amber";
  return "slate";
}

// ── uploads ────────────────────────────────────────────────────────────────

export type UploadType = "LAB_TEST" | "XRAY" | "PRESCRIPTION" | "DIAGNOSIS_REPORT";

export const UPLOAD_OPTIONS: Array<{ type: UploadType; label: string; accept: string }> = [
  { type: "LAB_TEST", label: "Lab report", accept: ".pdf,.png,.jpg,.jpeg,.webp" },
  { type: "XRAY", label: "X-ray or scan", accept: ".pdf,.png,.jpg,.jpeg,.webp,.dcm" },
  { type: "PRESCRIPTION", label: "Prescription", accept: ".pdf,.png,.jpg,.jpeg,.webp" },
  { type: "DIAGNOSIS_REPORT", label: "Other document", accept: ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" },
];

/** Anything larger is rejected before we spend a round trip on it. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Checks a chosen file. The picker's `accept` list is a hint, not a guarantee (a patient can
 * still choose "All files"), so the extension is checked again here.
 * Returns the reason the file cannot be used, or null when it is fine.
 */
export function uploadProblem(file: File, type: UploadType): string | null {
  const option = UPLOAD_OPTIONS.find((entry) => entry.type === type);
  if (file.size === 0) return "That file is empty. Pick another one.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  }
  if (option) {
    const allowed = option.accept.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
    const name = file.name.toLowerCase();
    if (!allowed.some((extension) => name.endsWith(extension))) {
      return `${option.label} accepts ${allowed.map((extension) => extension.replace(".", "")).join(", ")} files.`;
    }
  }
  return null;
}
