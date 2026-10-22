/**
 * Pure rules of the prescription form (quick Rx dialog, new / edit prescription pages, assistant
 * drafts). No React here: the reducer, the defaults, medicine names and search, stock lines and the
 * request shapes, so every screen that writes a prescription uses one set of rules.
 */
import type { Medicine } from "@/types/pharmacy.types";
import { prescriptionReference } from "@/lib/utils/labels";
import { asList, asRecord, asRecordOrEmpty, textOf, trimmedString } from "@/lib/utils/coerce";

export interface PrescriptionMedicationRow {
  id: string;
  /** Empty for a medicine that is not in pharmacy stock. */
  medicineId: string;
  name: string;
  dosage: string;
  /** One "How often" value: how many times a day and when ("Twice a day, after meal"). */
  frequency: string;
  days: string;
  quantity: string;
  /** True once the quantity was typed by hand: it then stops following how often x days. */
  quantityEdited: boolean;
}

export interface PrescriptionFormValues {
  diagnosis: string;
  advice: string;
  followUpDate: string;
  followUpNotes: string;
  medicineSearch: string;
  inStockOnly: boolean;
  medications: PrescriptionMedicationRow[];
}

export type PrescriptionFormAction =
  | { type: "setField"; field: "diagnosis" | "advice" | "followUpDate" | "followUpNotes" | "medicineSearch"; value: string }
  | { type: "setInStockOnly"; value: boolean }
  | { type: "addMedication"; value: PrescriptionMedicationRow }
  | { type: "addMedications"; value: PrescriptionMedicationRow[] }
  | { type: "removeMedication"; id: string }
  | { type: "updateMedication"; id: string; field: "name" | "dosage" | "frequency" | "days" | "quantity"; value: string }
  | { type: "reset" };

/** What a new medicine starts with; the doctor changes it only when it differs. */
export const DEFAULT_FREQUENCY = "Twice a day, after meal";
export const DEFAULT_DAYS = "10";

/** The single "How often" list: the pharmacy line has one frequency field. */
export const FREQUENCY_OPTIONS = [
  "Once a day, after meal",
  "Once a day, before meal",
  "Once a day, in the morning",
  "Once a day, at night",
  "Twice a day, after meal",
  "Twice a day, before meal",
  "Twice a day",
  "Three times a day, after meal",
  "Three times a day, before meal",
  "Three times a day",
  "Four times a day",
  "At bedtime",
  "On an empty stomach",
  "Once a week",
  "When needed",
] as const;

/** The options plus the current value when it is not one of them (a saved or older prescription). */
export function frequencyOptionsFor(value: string): string[] {
  const current = value.trim();
  const options: string[] = [...FREQUENCY_OPTIONS];
  return current && !options.includes(current) ? [current, ...options] : options;
}

/** How many doses a day a "How often" value means; 0 when it cannot be counted (when needed). */
export function dosesPerDay(frequency: string): number {
  const text = frequency.toLowerCase();
  if (/when needed|sos|as needed/.test(text)) return 0;
  if (/once a week|weekly/.test(text)) return 1 / 7;
  if (/four times/.test(text)) return 4;
  if (/three times|thrice/.test(text)) return 3;
  if (/twice|two times/.test(text)) return 2;
  if (/once|bedtime|empty stomach|at night|in the morning/.test(text)) return 1;
  return 0;
}

/** Tablets needed for how often x days, as text; "" when it cannot be worked out. */
export function suggestedQuantity(frequency: string, days: string): string {
  const perDay = dosesPerDay(frequency);
  const dayCount = Number.parseInt(days, 10);
  if (perDay <= 0 || !Number.isFinite(dayCount) || dayCount <= 0) return "";
  return String(Math.max(1, Math.ceil(perDay * dayCount)));
}

export const emptyPrescriptionForm = (): PrescriptionFormValues => ({
  diagnosis: "",
  advice: "",
  followUpDate: "",
  followUpNotes: "",
  medicineSearch: "",
  // Off by default: a medicine that is out of stock is still prescribed (the pharmacy gives it once
  // stock arrives), so the whole catalogue shows, each row with its stock.
  inStockOnly: false,
  medications: [],
});

function updateRow(
  row: PrescriptionMedicationRow,
  field: "name" | "dosage" | "frequency" | "days" | "quantity",
  value: string,
): PrescriptionMedicationRow {
  if (field === "quantity") return { ...row, quantity: value, quantityEdited: true };
  const next = { ...row, [field]: value };
  if ((field === "frequency" || field === "days") && !row.quantityEdited) {
    const suggested = suggestedQuantity(next.frequency, next.days);
    if (suggested) next.quantity = suggested;
  }
  return next;
}

export function prescriptionFormReducer(state: PrescriptionFormValues, action: PrescriptionFormAction): PrescriptionFormValues {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setInStockOnly":
      return { ...state, inStockOnly: action.value };
    case "addMedication":
      return { ...state, medications: [...state.medications, action.value] };
    case "addMedications": {
      // A kit or a voice line never adds a stock medicine that is already on the prescription.
      const present = new Set(state.medications.map((row) => row.medicineId).filter(Boolean));
      const fresh = action.value.filter((row) => !row.medicineId || !present.has(row.medicineId));
      return { ...state, medications: [...state.medications, ...fresh] };
    }
    case "removeMedication":
      return { ...state, medications: state.medications.filter((medication) => medication.id !== action.id) };
    case "updateMedication":
      return {
        ...state,
        medications: state.medications.map((medication) =>
          medication.id === action.id ? updateRow(medication, action.field, action.value) : medication,
        ),
      };
    case "reset":
      return emptyPrescriptionForm();
    default:
      return state;
  }
}

/** Dose, how often and days to start a line with (a favourite's preset, a kit line, a voice line). */
export interface MedicationPreset {
  dosage?: string;
  frequency?: string;
  days?: string;
  quantity?: string;
}

const newRowId = () => globalThis.crypto?.randomUUID?.() || `med-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DOSE_BY_FORM: ReadonlyArray<readonly [RegExp, string]> = [
  [/CAPSULE/, "1 capsule"],
  [/TABLET|VATI|GUTIKA|PILL/, "1 tablet"],
  [/SYRUP|KASHAYAM|KWATH|ASAVA|ARISHTA|SWARASA|SUSPENSION|LIQUID|DROP/, "10 ml"],
  [/CHURNA|POWDER|BHASMA|PISHTEE|PARPATI|GRANULE/, "1 teaspoon"],
  [/OIL|OINTMENT|LEPA|LOTION|CREAM|GEL|SHAMPOO|SOAP|TOOTHPASTE/, "Apply as directed"],
];

/**
 * A ready dose for a new line, from the medicine's form ("1 tablet", "10 ml", ...), so the line is
 * complete and Save is enabled at once; the doctor edits it when it differs. A blank (outside)
 * line starts empty.
 */
export function defaultDoseFor(medicine?: { dosageForm?: string | null; name?: string | null }): string {
  if (!medicine) return "";
  const form = `${medicine.dosageForm ?? ""} ${medicine.name ?? ""}`.toUpperCase();
  return DOSE_BY_FORM.find(([pattern]) => pattern.test(form))?.[1] ?? "1 dose";
}

export function createMedicationRow(
  medicine?: Pick<Medicine, "id" | "name" | "strength"> & { dosageForm?: string | null },
  preset: MedicationPreset = {},
): PrescriptionMedicationRow {
  const frequency = preset.frequency?.trim() || DEFAULT_FREQUENCY;
  const days = preset.days?.trim() || DEFAULT_DAYS;
  const quantity = preset.quantity?.trim() || suggestedQuantity(frequency, days) || "1";
  return {
    id: newRowId(),
    medicineId: medicine?.id ?? "",
    name: medicine ? medicineTitle(medicine) : "",
    dosage: preset.dosage?.trim() || defaultDoseFor(medicine),
    frequency,
    days,
    quantity,
    quantityEdited: Boolean(preset.quantity?.trim()),
  };
}

/** "Paracetamol 500 mg": the name, plus the strength when the name does not already say it. */
export function medicineTitle(medicine: Pick<Medicine, "name" | "strength">): string {
  const name = String(medicine.name || "").trim();
  const strength = String(medicine.strength || "").trim();
  if (!strength || name.toLowerCase().includes(strength.toLowerCase())) {
    return readableName(name);
  }
  return readableName(`${name} ${strength}`);
}

/** Combination formulations are stored as "a+b+c": show them as "a + b + c" so each ingredient reads on its own. */
export function readableName(name: string): string {
  return name.replace(/\s*\+\s*/g, " + ").replace(/\s{2,}/g, " ").trim();
}

/** The words a doctor typed, split on spaces and "+" so they can come in any order. */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/[\s+]+/).filter(Boolean);
}

/**
 * How well a medicine's NAME (and strength) matches every typed word, or -1 when one word is
 * missing. Search is by name only: brand, generic and ingredient fields are not searched.
 * A match at the start of the name ranks highest, then the start of a word, then anywhere.
 */
export function matchScore(medicine: Pick<Medicine, "name" | "strength">, terms: string[]): number {
  const name = String(medicine.name || "").toLowerCase();
  const text = medicine.strength ? `${name} ${String(medicine.strength).toLowerCase()}` : name;
  let score = 0;
  for (const term of terms) {
    const at = text.indexOf(term);
    if (at < 0) return -1;
    score += at === 0 ? 3 : /[\s+(]/.test(text.charAt(at - 1)) ? 2 : 1;
  }
  return score;
}

export function stockOf(medicine: Pick<Medicine, "stockQuantity">): number {
  const stock = Number(medicine.stockQuantity);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

export function isLowStock(medicine: Pick<Medicine, "stockQuantity" | "minStockLevel" | "reorderPoint">): boolean {
  const stock = stockOf(medicine);
  const threshold = Math.max(Number(medicine.minStockLevel) || 0, Number(medicine.reorderPoint) || 0);
  return stock > 0 && threshold > 0 && stock <= threshold;
}

export type StockTone = "ok" | "low" | "out" | "none";

/** The stock words shown on the same line as the medicine name. Never a price. */
export function stockLine(
  medicine: Pick<Medicine, "stockQuantity" | "minStockLevel" | "reorderPoint"> | undefined,
  stockTracked: boolean,
): { label: string; tone: StockTone } {
  if (!medicine) return { label: "Outside medicine", tone: "none" };
  if (!stockTracked) return { label: "", tone: "none" };
  const stock = stockOf(medicine);
  if (stock <= 0) return { label: "Out of stock", tone: "out" };
  if (isLowStock(medicine)) return { label: `${stock} left · low`, tone: "low" };
  return { label: `${stock} in stock`, tone: "ok" };
}

export function quantityOf(medication: Pick<PrescriptionMedicationRow, "quantity">): number {
  return Math.max(1, Number.parseInt(medication.quantity, 10) || 1);
}

export function durationOf(medication: Pick<PrescriptionMedicationRow, "days">): string {
  const days = Number.parseInt(medication.days, 10);
  if (!Number.isFinite(days) || days <= 0) return "";
  return days === 1 ? "1 day" : `${days} days`;
}

/** A stock medicine needs its dose, how often and days before it can go to the pharmacy. */
export function isMedicationComplete(medication: PrescriptionMedicationRow): boolean {
  if (!medication.medicineId) {
    return medication.name.trim() !== "";
  }
  return medication.dosage.trim() !== "" && medication.frequency.trim() !== "" && durationOf(medication) !== "";
}

export function formatMedicationSummary(medication: PrescriptionMedicationRow): string {
  return [
    medication.name.trim(),
    medication.dosage.trim() ? `Dose: ${medication.dosage.trim()}` : "",
    medication.frequency.trim() ? `Freq: ${medication.frequency.trim()}` : "",
    durationOf(medication) ? `Duration: ${durationOf(medication)}` : "",
    medication.quantity.trim() ? `Qty: ${quantityOf(medication)}` : "",
    medication.medicineId ? "" : "Outside medicine",
  ]
    .filter(Boolean)
    .join(" | ");
}

/** A pharmacy line as POST / PATCH /pharmacy/prescriptions take it. */
export interface PrescriptionItemPayload {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

/** The stock lines of the form as request items (outside medicines are not sent to the pharmacy). */
export function toPrescriptionItems(rows: PrescriptionMedicationRow[]): PrescriptionItemPayload[] {
  return rows
    .filter((row) => row.medicineId.trim())
    .map((row) => ({
      medicineId: row.medicineId.trim(),
      dosage: row.dosage.trim() || row.name.trim(),
      frequency: row.frequency.trim(),
      duration: durationOf(row),
      quantity: quantityOf(row),
    }));
}

/** The medicines of either list shape: a bare array, or `{ data }` / `{ medicines }` / `{ items }`. */
export function toMedicineList(data: unknown): Medicine[] {
  if (Array.isArray(data)) return data as Medicine[];
  const record = asRecord(data);
  if (record) {
    for (const key of ["medicines", "data", "items"] as const) {
      if (Array.isArray(record[key])) return record[key] as Medicine[];
    }
  }
  return [];
}

/** The record the server answered with (plain body, or wrapped in `data` / `prescription`). */
function unwrapPrescription(result: unknown): Record<string, unknown> | null {
  const outer = asRecord(result);
  if (!outer) return null;
  return asRecord(outer.prescription) ?? asRecord(outer.data) ?? outer;
}

/** The id of the prescription the server created. */
export function readPrescriptionId(result: unknown): string | null {
  const record = unwrapPrescription(result);
  return record ? trimmedString(record.id) || null : null;
}

/**
 * The reference the pharmacy desk shows for a prescription: the number the server gives, or
 * "RX-" plus the first eight characters of its id (the same rule as the pharmacy screens).
 */
export function readPrescriptionReference(result: unknown): string | null {
  const record = unwrapPrescription(result);
  return record ? prescriptionReference(trimmedString(record.id), record) || null : null;
}

/** "10 days" -> "10", "1 week" -> "7", "" when there is no number. */
export function daysFromDuration(duration: unknown): string {
  const text = textOf(duration).toLowerCase();
  const match = text.match(/(\d+)\s*(day|days|d|week|weeks|w|month|months)?/);
  if (!match) return "";
  const count = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(count) || count <= 0) return "";
  const unit = match[2] ?? "day";
  if (unit.startsWith("w")) return String(count * 7);
  if (unit.startsWith("m")) return String(count * 30);
  return String(count);
}

/** Statuses after which a prescription can no longer be edited by the doctor. */
const LOCKED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED", "CANCELLED", "CANCELED", "PARTIALLY_DISPENSED", "EXPIRED"]);

export function isPrescriptionEditable(status: unknown): boolean {
  return !LOCKED_STATUSES.has(textOf(status).toUpperCase());
}

/** A saved prescription (GET /pharmacy/prescriptions/:id) as form values, for editing it. */
export function prescriptionToFormValues(raw: unknown): PrescriptionFormValues {
  const record = unwrapPrescription(raw) ?? {};
  const items = asList(record.items).length > 0 ? asList(record.items) : asList(record.medications);
  const medications = items.flatMap((entry): PrescriptionMedicationRow[] => {
    const item = asRecordOrEmpty(entry);
    const medicine = asRecordOrEmpty(item.medicine);
    const medicineId = trimmedString(item.medicineId) || trimmedString(medicine.id);
    const name =
      medicineTitle({
        name: textOf(medicine.name) || textOf(item.medicineName) || textOf(item.name),
        strength: textOf(medicine.strength),
      }) || "Medicine";
    const quantity = Number(item.quantity);
    return [
      {
        id: trimmedString(item.id) || newRowId(),
        medicineId,
        name,
        dosage: textOf(item.dosage),
        frequency: textOf(item.frequency) || DEFAULT_FREQUENCY,
        days: daysFromDuration(item.duration) || DEFAULT_DAYS,
        quantity: Number.isFinite(quantity) && quantity > 0 ? String(Math.round(quantity)) : "1",
        quantityEdited: true,
      },
    ];
  });
  return {
    ...emptyPrescriptionForm(),
    diagnosis: textOf(record.diagnosis),
    advice: textOf(record.notes),
    followUpDate: textOf(record.validUntil).slice(0, 10),
    medications,
  };
}
