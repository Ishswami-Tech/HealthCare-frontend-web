/**
 * Sections of `clinic.settings` (JSON, saved with PATCH /clinics/:id, one-level deep merge on the
 * server) that the clinic admin edits and other screens read:
 *
 * - `billingSettings.feeSchedule`: the service / procedure fee list (CaBilling, CaNewInvoice). Not a
 *   consultation fee: in-clinic consultations are covered by the monthly in-person plan.
 * - `printSettings`: letterhead and defaults of printed prescriptions (CaPrintSettings; the doctor's
 *   print screen reads it with `readPrintSettings`). Prescriptions never print billing amounts.
 *
 * Pure functions only, so the readers are safe on any role's `clinic.settings`.
 */

export interface FeeScheduleItem {
  /** Stable key: "IN_CLINIC", "FOLLOW_UP", "VIDEO", or a slug of a custom label. */
  code: string;
  label: string;
  detail?: string;
  /** Rupees. */
  amount: number;
}

export interface PrintLocationLetterhead {
  address: string;
  phone: string;
  hoursLine: string;
}

export interface PrintSettings {
  clinicName: string;
  tagline: string;
  doctorName: string;
  registrationNumber: string;
  qualification: string;
  paperSize: "A4" | "A5";
  language: "en" | "mr";
  showVerificationQr: boolean;
  showRegistration: boolean;
  showFollowUp: boolean;
  footerText: string;
  /** Letterhead lines per clinic location id; a prescription uses the visit's location. */
  locations: Record<string, PrintLocationLetterhead>;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  clinicName: "",
  tagline: "",
  doctorName: "",
  registrationNumber: "",
  qualification: "",
  paperSize: "A4",
  language: "en",
  showVerificationQr: true,
  showRegistration: true,
  showFollowUp: true,
  footerText: "Take medicines as prescribed. In an emergency, call 108 or visit the nearest hospital.",
  locations: {},
};

type Loose = Record<string, unknown>;

function record(value: unknown): Loose {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Loose) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function slugCode(label: string): string {
  return label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "ITEM";
}

/** Valid fee rows only (label and a non-negative amount), in stored order. */
export function readFeeSchedule(settings: unknown): FeeScheduleItem[] {
  const list = record(record(settings).billingSettings).feeSchedule;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    const row = record(entry);
    const label = text(row.label).trim();
    const amount = Number(row.amount);
    if (!label || !Number.isFinite(amount) || amount < 0) return [];
    const detail = text(row.detail).trim();
    return [{ code: text(row.code) || slugCode(label), label, amount, ...(detail ? { detail } : {}) }];
  });
}

/** The PATCH body that replaces the fee list. */
export function feeSchedulePatch(items: FeeScheduleItem[]): Loose {
  return { billingSettings: { feeSchedule: items } };
}

export function readPrintSettings(settings: unknown): PrintSettings {
  const raw = record(record(settings).printSettings);
  const locations: Record<string, PrintLocationLetterhead> = {};
  for (const [id, value] of Object.entries(record(raw.locations))) {
    const row = record(value);
    locations[id] = { address: text(row.address), phone: text(row.phone), hoursLine: text(row.hoursLine) };
  }
  const d = DEFAULT_PRINT_SETTINGS;
  return {
    clinicName: text(raw.clinicName, d.clinicName),
    tagline: text(raw.tagline, d.tagline),
    doctorName: text(raw.doctorName, d.doctorName),
    registrationNumber: text(raw.registrationNumber, d.registrationNumber),
    qualification: text(raw.qualification, d.qualification),
    paperSize: raw.paperSize === "A5" ? "A5" : "A4",
    language: raw.language === "mr" ? "mr" : "en",
    showVerificationQr: flag(raw.showVerificationQr, d.showVerificationQr),
    showRegistration: flag(raw.showRegistration, d.showRegistration),
    showFollowUp: flag(raw.showFollowUp, d.showFollowUp),
    footerText: text(raw.footerText, d.footerText),
    locations,
  };
}

export function printSettingsPatch(value: PrintSettings): Loose {
  return { printSettings: value };
}
