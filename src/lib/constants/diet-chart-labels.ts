/**
 * Static labels for the visit diet chart in the four supported print
 * languages. Deliberately separate from the global i18n bundle: these strings
 * are printed on a sheet handed to the patient and must not follow the UI
 * language of the logged-in clinician.
 */

import type { DietAdviceCategory, DietChartLanguage, DietFoodLabels } from "@/types/visit-diet-chart.types";

export const DIET_LANGUAGES: readonly DietChartLanguage[] = ["en", "gu", "hi", "mr"];

export const DEFAULT_DIET_LANGUAGE: DietChartLanguage = "en";

/** Display name of each language, written in that language. */
export const DIET_LANGUAGE_NAMES: Record<DietChartLanguage, string> = {
  en: "English",
  gu: "ગુજરાતી",
  hi: "हिन्दी",
  mr: "मराठी",
};

/** Short form for compact toggles. */
export const DIET_LANGUAGE_SHORT: Record<DietChartLanguage, string> = {
  en: "EN",
  gu: "ગુ",
  hi: "हि",
  mr: "म",
};

export interface DietChartLabelSet {
  title: string;
  take: string;
  avoid: string;
  occasional: string;
  patient: string;
  opdNumber: string;
  date: string;
  doctor: string;
  notes: string;
  clinic: string;
}

export const DIET_CHART_LABELS: Record<DietChartLanguage, DietChartLabelSet> = {
  en: {
    title: "Diet Chart",
    take: "Take",
    avoid: "Avoid",
    occasional: "Occasionally",
    patient: "Patient",
    opdNumber: "OPD No.",
    date: "Date",
    doctor: "Doctor",
    notes: "Notes",
    clinic: "Clinic",
  },
  gu: {
    title: "આહાર ચાર્ટ",
    take: "લેવું",
    avoid: "ટાળવું",
    occasional: "ક્યારેક",
    patient: "દર્દી",
    opdNumber: "OPD નંબર",
    date: "તારીખ",
    doctor: "ડૉક્ટર",
    notes: "નોંધ",
    clinic: "ક્લિનિક",
  },
  hi: {
    title: "आहार चार्ट",
    take: "लें",
    avoid: "न लें",
    occasional: "कभी-कभी",
    patient: "रोगी",
    opdNumber: "OPD नंबर",
    date: "दिनांक",
    doctor: "डॉक्टर",
    notes: "टिप्पणी",
    clinic: "क्लिनिक",
  },
  mr: {
    title: "आहार तक्ता",
    take: "घ्यावे",
    avoid: "टाळावे",
    occasional: "कधीतरी",
    patient: "रुग्ण",
    opdNumber: "OPD क्रमांक",
    date: "दिनांक",
    doctor: "डॉक्टर",
    notes: "टीप",
    clinic: "क्लिनिक",
  },
};

export const DIET_CATEGORIES: readonly DietAdviceCategory[] = ["TAKE", "AVOID", "OCCASIONAL"];

export const DIET_CATEGORY_LABEL_KEY: Record<DietAdviceCategory, keyof DietChartLabelSet> = {
  TAKE: "take",
  AVOID: "avoid",
  OCCASIONAL: "occasional",
};

export function isDietChartLanguage(value: unknown): value is DietChartLanguage {
  return typeof value === "string" && (DIET_LANGUAGES as readonly string[]).includes(value);
}

/** Label of a food/item in `language`, falling back to English when that script is missing. */
export function dietLabel(labels: DietFoodLabels, language: DietChartLanguage): string {
  switch (language) {
    case "gu":
      return labels.nameGu || labels.nameEn;
    case "hi":
      return labels.nameHi || labels.nameEn;
    case "mr":
      return labels.nameMr || labels.nameEn;
    default:
      return labels.nameEn;
  }
}

/** The other scripts of a food, for the secondary line in pickers and chips. */
export function dietSecondaryLabels(labels: DietFoodLabels, language: DietChartLanguage): string[] {
  const all: Array<[DietChartLanguage, string | null]> = [
    ["en", labels.nameEn],
    ["gu", labels.nameGu],
    ["hi", labels.nameHi],
    ["mr", labels.nameMr],
  ];
  const primary = dietLabel(labels, language);
  return all
    .filter(([lang, value]) => lang !== language && !!value && value !== primary)
    .map(([, value]) => value as string);
}
