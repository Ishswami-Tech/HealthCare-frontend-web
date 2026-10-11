"use client";

import { localizeLabel, localizeOption } from "@/lib/constants/case-sheet-i18n";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Returns a function that turns a stored case-sheet option into its label in
 * the app's current language. Display only: callers must keep using the stored
 * string for selection state and saves.
 */
export function useLocalizedOption(): (stored: string) => string {
  const { language } = useLanguage();
  return (stored) => localizeOption(stored, language);
}

/** Like `useLocalizedOption`, for headings, fixed-list names and buttons. */
export function useLocalizedLabel(): (text: string) => string {
  const { language } = useLanguage();
  return (text) => localizeLabel(text, language);
}
