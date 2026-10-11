// Verifies that everything the case-sheet shows from fixed lists has a label in
// the right dictionary: stored option values and display-only labels.
//
//   node scripts/check-case-sheet-option-coverage.ts
//
// Runs on plain Node (type stripping), so it imports the data files directly
// with explicit extensions instead of through the "@/" alias.

import * as exam from "../src/lib/constants/ayurveda-classical-exam-categories.ts";
import * as fixed from "../src/lib/constants/case-sheet-fixed-lists.ts";
import { CLASSICAL_TERM_EN } from "../src/lib/constants/case-sheet-i18n/classical-terms.ts";
import { ENGLISH_TERM_TRANSLATIONS } from "../src/lib/constants/case-sheet-i18n/english-terms.ts";
import { CHROME_LABELS, FIXED_LIST_LABELS } from "../src/lib/constants/case-sheet-i18n/ui-labels.ts";

const hasDevanagari = (text: string): boolean => /[ऀ-ॿ]/.test(text);

// Stored option values: looked up with localizeOption.
const options = new Set<string>();
for (const section of exam.CLASSICAL_EXAM_SECTIONS) {
  for (const category of section.categories) {
    for (const option of category.options) options.add(option);
  }
}
for (const condition of fixed.PAST_HISTORY_CONDITIONS) options.add(condition);
for (const habit of fixed.HABIT_DEFINITIONS) {
  for (const option of habit.options) options.add(option);
}
for (const option of fixed.NIDRA_OPTIONS) options.add(option);
for (const list of Object.values(fixed.GENERAL_EXAM_TEXT_OPTIONS)) {
  for (const option of list) options.add(option);
}

// Display-only labels: looked up with localizeLabel (never Devanagari headings).
const labels = new Set<string>();
for (const habit of fixed.HABIT_DEFINITIONS) labels.add(habit.label);
for (const relation of fixed.FAMILY_RELATION_SUGGESTIONS) labels.add(relation);
for (const flag of fixed.SPECIAL_CASE_OPTIONS) labels.add(flag.label);
for (const question of fixed.PRAKRITI_QUESTIONS) {
  labels.add(question.label);
  for (const answer of question.options) labels.add(answer.label);
}
for (const section of exam.CLASSICAL_EXAM_SECTIONS) {
  labels.add(section.title);
  labels.add(section.subtitle);
  for (const category of section.categories) {
    if (!hasDevanagari(category.label)) labels.add(category.label);
    if (category.hint) labels.add(category.hint);
  }
}

const optionDictionaries = [CLASSICAL_TERM_EN, ENGLISH_TERM_TRANSLATIONS];
const labelDictionaries = [FIXED_LIST_LABELS, CHROME_LABELS, ENGLISH_TERM_TRANSLATIONS];

const missingOptions = [...options].filter((o) => !optionDictionaries.some((d) => o in d));
const missingLabels = [...labels].filter((l) => !labelDictionaries.some((d) => l in d));

// Keys that would be ambiguous between dictionaries.
const dictionaries: ReadonlyArray<readonly [string, Readonly<Record<string, unknown>>]> = [
  ["CLASSICAL_TERM_EN", CLASSICAL_TERM_EN],
  ["ENGLISH_TERM_TRANSLATIONS", ENGLISH_TERM_TRANSLATIONS],
  ["FIXED_LIST_LABELS", FIXED_LIST_LABELS],
  ["CHROME_LABELS", CHROME_LABELS],
];
const overlaps = dictionaries.flatMap(([nameA, a], i) =>
  dictionaries.slice(i + 1).flatMap(([nameB, b]) =>
    Object.keys(a)
      .filter((key) => key in b)
      .map((key) => `${key} (${nameA} and ${nameB})`),
  ),
);

// Stale or misspelled keys in the dictionaries the script can fully check.
const used = new Set([...options, ...labels]);
const unused = [
  ...Object.keys(CLASSICAL_TERM_EN),
  ...Object.keys(ENGLISH_TERM_TRANSLATIONS),
  ...Object.keys(FIXED_LIST_LABELS),
].filter((key) => !used.has(key));

console.log(`options: ${options.size}, labels: ${labels.size}`);
if (missingOptions.length > 0) console.log(`OPTIONS MISSING a label (${missingOptions.length}):\n  ${missingOptions.join("\n  ")}`);
if (missingLabels.length > 0) console.log(`LABELS MISSING a translation (${missingLabels.length}):\n  ${missingLabels.join("\n  ")}`);
if (overlaps.length > 0) console.log(`AMBIGUOUS keys (${overlaps.length}):\n  ${overlaps.join("\n  ")}`);
if (unused.length > 0) console.log(`UNUSED keys (${unused.length}, typo or stale):\n  ${unused.join("\n  ")}`);

const failed = missingOptions.length + missingLabels.length + overlaps.length + unused.length > 0;
process.exit(failed ? 1 : 0);
