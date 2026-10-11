/**
 * Readers for loosely typed API values.
 *
 * API rows often arrive as `unknown` (a flat row, a row under `data`, a list wrapped in an
 * object). These helpers read them defensively and never invent a value. Each reader has
 * one meaning; where screens need a different rule there is a separately named variant.
 */

export type LooseRecord = Record<string, unknown>;

// ── Objects and lists ──────────────────────────────────────────────────────

/** The value when it is a plain object (not an array), otherwise `null`. */
export function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as LooseRecord) : null;
}

/** The value when it is a plain object, otherwise `{}` — for reading fields without null checks. */
export function asRecordOrEmpty(value: unknown): LooseRecord {
  return asRecord(value) ?? {};
}

/** The value when it is an array, otherwise `[]`. */
export function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * The list an endpoint answered with: the value itself when it is an array, otherwise the
 * first of `keys` on it that holds an array (`{ prescriptions: [] }`). `[]` when there is none.
 */
export function unwrapList(value: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

/** `unwrapList`, keeping only the entries that are objects. */
export function unwrapRecords(value: unknown, ...keys: string[]): LooseRecord[] {
  return unwrapList(value, ...keys).filter(
    (entry): entry is LooseRecord => !!entry && typeof entry === "object",
  );
}

// ── Text ───────────────────────────────────────────────────────────────────

/** A string exactly as sent (not trimmed); anything else is `""`. For form values. */
export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A trimmed string; anything else (numbers included) is `""`. */
export function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A trimmed string, or a finite number written as text; anything else is `""`. */
export function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** The first value that is a non-empty trimmed string (numbers are skipped). */
export function firstString(...values: unknown[]): string {
  for (const value of values) {
    const found = trimmedString(value);
    if (found) return found;
  }
  return "";
}

/** The first value that reads as non-empty text (`textOf`). */
export function firstText(...values: unknown[]): string {
  for (const value of values) {
    const found = textOf(value);
    if (found) return found;
  }
  return "";
}

const PLACEHOLDER_WORDS = new Set(["undefined", "null", "nan", "n/a", "na", "-"]);

/**
 * `firstText`, also skipping words that stand for "no value" ("N/A", "null", "-"), for rows
 * whose columns were filled with a placeholder instead of being left empty.
 */
export function firstMeaningfulText(...values: unknown[]): string {
  for (const value of values) {
    const found = textOf(value);
    if (found && !PLACEHOLDER_WORDS.has(found.toLowerCase())) return found;
  }
  return "";
}

// ── Numbers ────────────────────────────────────────────────────────────────

/** A finite number, or `null` when the value is missing (`null`, `undefined`, `""`) or not a number. */
export function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A finite number, or `0` when the value is missing or not a number. */
export function numberOrZero(value: unknown): number {
  return numberOrNull(value) ?? 0;
}

// ── Dates ──────────────────────────────────────────────────────────────────

/**
 * A date as an ISO string: a `Date` is converted, a date string is returned as sent.
 * `null` when the value is missing or does not parse as a date.
 */
export function isoDateOrNull(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const raw = textOf(value);
  if (!raw) return null;
  return Number.isNaN(new Date(raw).getTime()) ? null : raw;
}

/** The first value that parses as a date (`isoDateOrNull`), or `null`. */
export function firstIsoDate(...values: unknown[]): string | null {
  for (const value of values) {
    const found = isoDateOrNull(value);
    if (found) return found;
  }
  return null;
}
