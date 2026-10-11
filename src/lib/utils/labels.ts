/**
 * Small labels shown to people, shared by the patient, doctor and pharmacy screens.
 * Pure functions: no React, no fetching. Names of people live in `display-name.ts`,
 * money in `currency.ts`, dates and ages in `date-time.ts`.
 */

import { asRecordOrEmpty, textOf } from "./coerce";

/**
 * The number people read for a prescription: the one the server gave (`prescriptionNumber` /
 * `referenceNumber` on `record`) or "RX-" and the first 8 characters of the id, upper case
 * ("RX-1A2B3C4D"). "" when there is no id either.
 */
export function prescriptionReference(id: string | null | undefined, record?: unknown): string {
  const source = asRecordOrEmpty(record);
  const given = textOf(source.prescriptionNumber) || textOf(source.referenceNumber);
  if (given) return given;
  const compact = String(id ?? "").replace(/[^a-zA-Z0-9]/g, "");
  return compact ? `RX-${compact.slice(0, 8).toUpperCase()}` : "";
}

/**
 * A code as a sentence: "BLOOD_PRESSURE" -> "Blood pressure", "cough_and_cold" -> "Cough and cold".
 * Text that is already written for people (mixed case, "Cough & Cold") is left as it is.
 */
export function sentenceCase(value: string | null | undefined): string {
  const clean = String(value ?? "").replace(/[_-]+/g, " ").trim();
  if (!clean) return "";
  return clean === clean.toUpperCase() || clean === clean.toLowerCase()
    ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
    : clean;
}

/** "MALE" -> "Male", "PREFER_NOT_TO_SAY" -> "Prefer not to say". "" when not set. */
export function genderLabel(gender: string | null | undefined): string {
  const clean = String(gender ?? "").replace(/_+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : "";
}

/** "1 item", "3 items". `many` defaults to `one` + "s". */
export function plural(count: number, one: string, many: string = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "512 B", "340 KB", "2.4 MB" (a whole number of MB is written without ".0"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}
