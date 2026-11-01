/**
 * Which dose units fit a medicine's dosage form, and how a dose is written down.
 *
 * The prescribed dose is shown verbatim downstream (patient web / mobile, pharmacy, print), so it is
 * made right here, at prescribing time: an amount plus a unit valid for the form ("2 g" for a
 * churna, "1 tablet" for a vati). The result is still the single `dosage` string the API stores.
 *
 * Pure and dependency-free so `node --test scripts/dose-units.test.mjs` can run it directly.
 */

export type DoseUnitValue =
  | "tablet"
  | "capsule"
  | "g"
  | "mg"
  | "ml"
  | "teaspoon"
  | "tablespoon"
  | "pinch"
  | "drop"
  | "application"
  | "sachet"
  | "vial"
  | "ampoule";

export interface DoseUnit {
  value: DoseUnitValue;
  /** What the unit picker shows. */
  label: string;
  singular: string;
  plural: string;
  /** Words a doctor may type for this unit (lower case, matched as whole words). */
  aliases: readonly string[];
}

export const DOSE_UNITS: Readonly<Record<DoseUnitValue, DoseUnit>> = {
  tablet: { value: "tablet", label: "tablet", singular: "tablet", plural: "tablets", aliases: ["tablet", "tablets", "tab", "tabs"] },
  capsule: { value: "capsule", label: "capsule", singular: "capsule", plural: "capsules", aliases: ["capsule", "capsules", "cap", "caps"] },
  g: { value: "g", label: "g (gram)", singular: "g", plural: "g", aliases: ["g", "gm", "gms", "gram", "grams", "gramme", "grammes"] },
  mg: { value: "mg", label: "mg", singular: "mg", plural: "mg", aliases: ["mg", "milligram", "milligrams"] },
  ml: { value: "ml", label: "ml", singular: "ml", plural: "ml", aliases: ["ml", "mls", "millilitre", "millilitres", "milliliter", "milliliters"] },
  teaspoon: { value: "teaspoon", label: "teaspoon (tsp)", singular: "teaspoon", plural: "teaspoons", aliases: ["teaspoon", "teaspoons", "tsp", "tsps"] },
  tablespoon: {
    value: "tablespoon",
    label: "tablespoon (tbsp)",
    singular: "tablespoon",
    plural: "tablespoons",
    aliases: ["tablespoon", "tablespoons", "tbsp", "tbsps"],
  },
  pinch: { value: "pinch", label: "pinch", singular: "pinch", plural: "pinches", aliases: ["pinch", "pinches"] },
  drop: { value: "drop", label: "drops", singular: "drop", plural: "drops", aliases: ["drop", "drops"] },
  application: {
    value: "application",
    label: "application",
    singular: "application",
    plural: "applications",
    aliases: ["application", "applications"],
  },
  sachet: { value: "sachet", label: "sachet", singular: "sachet", plural: "sachets", aliases: ["sachet", "sachets"] },
  vial: { value: "vial", label: "vial", singular: "vial", plural: "vials", aliases: ["vial", "vials"] },
  ampoule: { value: "ampoule", label: "ampoule", singular: "ampoule", plural: "ampoules", aliases: ["ampoule", "ampoules", "ampule", "ampules", "amp"] },
};

/** The dose of a medicine applied or used without a measured amount (oils, creams, ...). */
export const AS_DIRECTED_DOSE = "Apply as directed";

export interface DoseRule {
  /** Units valid for the form, the usual one first. */
  units: readonly DoseUnitValue[];
  /** The dose a new line starts with; "" leaves the amount for the doctor to type. */
  defaultDose: string;
  /** True when "Apply as directed" (no measured amount) is a valid dose for the form. */
  asDirected?: boolean;
}

const SOLID_UNIT: DoseRule = { units: ["tablet"], defaultDose: "1 tablet" };
const POWDER: DoseRule = { units: ["g", "teaspoon", "pinch"], defaultDose: "1 teaspoon" };
const MINERAL: DoseRule = { units: ["mg", "g", "pinch"], defaultDose: "1 pinch" };
const LIQUID: DoseRule = { units: ["ml", "teaspoon", "tablespoon"], defaultDose: "10 ml" };
const EXTERNAL: DoseRule = { units: ["application"], defaultDose: AS_DIRECTED_DOSE, asDirected: true };

/**
 * Dosage form (backend `MedicineType`, stored in `Medicine.category`) to the units its dose may be
 * written in. A form that is not here (OTHER, blank, unknown) keeps a free-text dose.
 */
export const DOSE_RULES: Readonly<Record<string, DoseRule>> = {
  TABLET: SOLID_UNIT,
  VATI: SOLID_UNIT,
  GUTIKA: SOLID_UNIT,
  CAPSULE: { units: ["capsule"], defaultDose: "1 capsule" },
  CHURNA: POWDER,
  GRANULE: { units: ["g", "teaspoon", "sachet"], defaultDose: "1 teaspoon" },
  BHASMA: MINERAL,
  PISHTEE: MINERAL,
  PARPATI: MINERAL,
  ARISHTA: LIQUID,
  ASAVA: LIQUID,
  SYRUP: LIQUID,
  KASHAYAM: LIQUID,
  SWARASA: LIQUID,
  DRINK: LIQUID,
  YAVKUT_KWATH: { units: ["ml", "g", "teaspoon", "tablespoon"], defaultDose: "10 ml" },
  GHRITA: { units: ["teaspoon", "g"], defaultDose: "1 teaspoon" },
  AVALEHA: { units: ["teaspoon", "g", "tablespoon"], defaultDose: "1 teaspoon" },
  DROPS: { units: ["drop", "ml"], defaultDose: "1 drop" },
  OIL: { units: ["drop", "ml", "application"], defaultDose: AS_DIRECTED_DOSE, asDirected: true },
  CREAM: EXTERNAL,
  OINTMENT: EXTERNAL,
  GEL: EXTERNAL,
  LEPA: EXTERNAL,
  LOTION: EXTERNAL,
  SHAMPOO: EXTERNAL,
  SOAP: EXTERNAL,
  TOOTHPASTE: EXTERNAL,
  INJECTION: { units: ["ml", "vial", "ampoule"], defaultDose: "" },
};

/** Spellings older rows and imports use for a form. */
const FORM_ALIASES: Readonly<Record<string, string>> = {
  TABLETS: "TABLET",
  CAPSULES: "CAPSULE",
  KWATH: "YAVKUT_KWATH",
  KWATHA: "YAVKUT_KWATH",
  TAILA: "OIL",
  TAILAM: "OIL",
  POWDER: "CHURNA",
  DROP: "DROPS",
};

/** "Yavkut Kwath", "yavkut-kwath" and "YAVKUT_KWATH" are the same form; null when it has no dose rule. */
export function doseFormOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const form = FORM_ALIASES[key] ?? key;
  return Object.prototype.hasOwnProperty.call(DOSE_RULES, form) ? form : null;
}

export function doseRuleFor(form: unknown): DoseRule | null {
  const key = doseFormOf(form);
  return key ? (DOSE_RULES[key] ?? null) : null;
}

/** "Yavkut kwath" for YAVKUT_KWATH. */
export function doseFormLabel(form: string): string {
  const words = form.toLowerCase().split("_").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const UNICODE_FRACTIONS: Readonly<Record<string, string>> = { "½": "1/2", "¼": "1/4", "¾": "3/4", "⅓": "1/3", "⅔": "2/3" };

/** "1", "2.5", "1/2", "1 1/2" or "½" as a number; null when it is not a positive amount. */
export function parseAmount(text: string): number | null {
  const plain = text
    .trim()
    .replace(/(\d)([½¼¾⅓⅔])/g, "$1 $2")
    .replace(/[½¼¾⅓⅔]/g, (glyph) => UNICODE_FRACTIONS[glyph] ?? glyph);
  const mixed = plain.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const fraction = plain.match(/^(\d+)\/(\d+)$/);
  let value: number;
  if (mixed) value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  else if (fraction) value = Number(fraction[1]) / Number(fraction[2]);
  else if (/^\d+(\.\d+)?$|^\.\d+$/.test(plain)) value = Number(plain);
  else return null;
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** "2 g", "1 tablet", "1/2 tablet", "2 teaspoons"; "" when the amount is not a positive number. */
export function formatDose(amount: string, unit: DoseUnitValue): string {
  const value = parseAmount(amount);
  if (value === null) return "";
  const spec = DOSE_UNITS[unit];
  const shown = amount.trim().replace(/\s+/g, " ");
  return `${shown} ${value > 1 ? spec.plural : spec.singular}`;
}

/** The unit a typed word means ("tabs" -> tablet), or null. */
export function unitFromWord(word: string): DoseUnitValue | null {
  const lower = word.trim().toLowerCase().replace(/\.$/, "");
  for (const unit of Object.values(DOSE_UNITS)) {
    if (unit.aliases.includes(lower)) return unit.value;
  }
  return null;
}

export type ParsedDose =
  | { mode: "units"; amount: string; unit: DoseUnitValue }
  | { mode: "asDirected" }
  | { mode: "other"; text: string };

const AS_DIRECTED_PATTERN = /^(apply|use|take)?\s*as directed\.?$/i;

/**
 * A saved or typed dose read back as amount + unit when it is exactly that and the unit fits the
 * form; anything else (a conflicting unit, extra words) is kept as typed in the "other" mode.
 */
export function parseDose(dosage: string, form: unknown): ParsedDose {
  const text = dosage.trim();
  const rule = doseRuleFor(form);
  if (!rule) return { mode: "other", text };
  if (rule.asDirected && AS_DIRECTED_PATTERN.test(text)) return { mode: "asDirected" };
  const match = text.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|\.\d+|\d*[½¼¾⅓⅔])\s*([a-z.]+)$/i);
  if (match) {
    const unit = unitFromWord(match[2] ?? "");
    const amount = (match[1] ?? "").trim();
    if (unit && rule.units.includes(unit) && parseAmount(amount) !== null) return { mode: "units", amount, unit };
  }
  return { mode: "other", text };
}

/** Every unit a free-text dose names ("2 tabs with honey" -> tablet). */
export function unitsNamedIn(text: string): DoseUnitValue[] {
  const found = new Set<DoseUnitValue>();
  // Splitting on everything but letters also separates a unit glued to its number ("2tabs", "5ml").
  for (const word of text.toLowerCase().split(/[^a-z.]+/)) {
    const unit = word ? unitFromWord(word) : null;
    if (unit) found.add(unit);
  }
  return [...found];
}

/**
 * The warning for a dose whose unit does not fit the medicine's form ("2 tablets" for a churna),
 * or null. Advisory only: the doctor may keep it for a real edge case.
 */
export function doseConflictWarning(dosage: string, form: unknown): string | null {
  const key = doseFormOf(form);
  const rule = key ? DOSE_RULES[key] : undefined;
  if (!key || !rule) return null;
  const named = unitsNamedIn(dosage);
  const wrong = named.filter((unit) => !rule.units.includes(unit));
  if (wrong.length === 0) return null;
  const typed = wrong.map((unit) => `"${DOSE_UNITS[unit].singular}"`).join(", ");
  const allowed = rule.units.map((unit) => DOSE_UNITS[unit].plural);
  const usual = rule.asDirected ? [...allowed, "as directed"] : allowed;
  return `${typed} does not fit ${doseFormLabel(key)}. Usual units: ${usual.join(", ")}. Check the dose before saving.`;
}

/** The dose a new line starts with for the form; null when the form has no rule. */
export function defaultDoseForForm(form: unknown): string | null {
  return doseRuleFor(form)?.defaultDose ?? null;
}
