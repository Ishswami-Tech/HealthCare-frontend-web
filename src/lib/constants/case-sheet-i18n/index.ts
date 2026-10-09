import type { SupportedLanguage } from "@/lib/i18n/config";
import { CLASSICAL_TERM_EN } from "./classical-terms";
import { ENGLISH_TERM_TRANSLATIONS } from "./english-terms";
import { CHROME_LABELS, FIXED_LIST_LABELS } from "./ui-labels";

/**
 * Display label for a stored case-sheet option in the requested language.
 *
 * Stored values are never changed: the option string saved today is the lookup
 * key. Unknown strings (older data, free text) fall back to themselves, so a
 * missing entry can never hide a clinical value.
 *
 * - Classical Devanagari terms: English shows the transliteration and gloss;
 *   Hindi and Marathi show the classical term itself.
 * - English-source options: English is the stored string; Hindi and Marathi
 *   come from the translation table.
 */
export function localizeOption(stored: string, language: SupportedLanguage): string {
  const classicalEnglish = CLASSICAL_TERM_EN[stored];
  if (classicalEnglish !== undefined) {
    return language === "en" ? classicalEnglish : stored;
  }

  const translated = ENGLISH_TERM_TRANSLATIONS[stored];
  if (translated !== undefined && language !== "en") {
    return translated[language];
  }

  return stored;
}

/**
 * Display text for case-sheet headings, fixed-list names and buttons (text that
 * is not stored clinical data). Looks in the label tables, then in the
 * English-source option table; anything else is returned unchanged, so a
 * Devanagari heading is never rewritten.
 */
export function localizeLabel(text: string, language: SupportedLanguage): string {
  if (language === "en") return text;
  const label = FIXED_LIST_LABELS[text] ?? CHROME_LABELS[text] ?? ENGLISH_TERM_TRANSLATIONS[text];
  return label === undefined ? text : label[language];
}
