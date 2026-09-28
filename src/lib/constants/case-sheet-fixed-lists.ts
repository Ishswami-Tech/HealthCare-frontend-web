// Fixed reference vocabularies for the OPD case-sheet History tab.
// These are display/selection lists, not relational lookups, so they live as
// TS data rather than DB enums.

export const PAST_HISTORY_CONDITIONS = [
  "DM-IDDM",
  "DM-NIDDM",
  "Ischemic heart disease (IHD)",
  "Hyperlipidemia",
  "Paralysis",
  "Depression",
  "Psoriasis",
  "Renal Parenchymal Disease",
  "Mixed Connective Tissue Disease",
  "Hemiplegia",
  "Neuropathy",
  "Hyperthyroidism",
  "Hypothyroidism",
  "Retinopathy",
  "Obsessive-compulsive disorder (O.C.D)",
  "Hypertension",
  "Anemia",
  "Liver disease",
  "Jaundice",
  "Tuberculosis (TB)",
  "Asthma",
  "Osteoarthritis",
  "Chicken Pox",
  "Measles",
  "Acid Peptic Disease",
  "Malignancy",
  "Allergy",
  "Chronic cough",
] as const;

export interface HabitDefinition {
  key: string;
  label: string;
  options: readonly string[];
}

const INTENSITY = ["Normal", "Moderate", "Heavy"] as const;

export const HABIT_DEFINITIONS: readonly HabitDefinition[] = [
  { key: "chocolate", label: "Chocolate", options: ["Mild", "Moderate", "Heavy"] },
  { key: "coffee", label: "Coffee", options: INTENSITY },
  { key: "cold_drink", label: "Cold drink", options: INTENSITY },
  { key: "drug_addict", label: "Drug addict", options: INTENSITY },
  { key: "eating_habits", label: "Eating habits", options: ["Normal", "Overeating", "Less"] },
  {
    key: "fast_food",
    label: "Fast food",
    options: ["Sometimes", "Twice in week", "Once in week"],
  },
  {
    key: "late_night_sleep",
    label: "Late night sleep",
    options: ["Sometimes", "Not regular", "Regular"],
  },
  { key: "pan_masala", label: "Pan masala", options: INTENSITY },
  { key: "salty_food", label: "Salty food", options: INTENSITY },
  { key: "smoking", label: "Smoking", options: INTENSITY },
  { key: "tea", label: "Tea", options: INTENSITY },
  { key: "tobacco", label: "Tobacco", options: INTENSITY },
];

export const NIDRA_OPTIONS = [
  "अल्प",
  "विषम",
  "विपर्यय",
  "स्वप्नवत्",
  "अत्यधिक",
  "तन्द्रायुक्त",
  "सम्यक्",
] as const;

export const SPECIAL_CASE_OPTIONS = [
  { value: "MINOR", label: "Minor (age 12 or below)" },
  { value: "PHYSICAL_HANDICAP", label: "Physically handicapped" },
  { value: "PREGNANT_OR_SENIOR_CITIZEN", label: "Pregnant woman / senior citizen" },
] as const;

export const FAMILY_RELATION_SUGGESTIONS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Spouse",
  "Son",
  "Daughter",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
] as const;

export type PrakritiDosha = "V" | "P" | "K";

export interface PrakritiQuestion {
  key: string;
  label: string;
  options: readonly { dosha: PrakritiDosha; label: string }[];
}

// Compact classical questionnaire. Answers are encoded for the backend as
// `v_<key>` / `p_<key>` / `k_<key>` scores (3 for the chosen dosha, 0 for the
// others) because PrakritiAssessmentService buckets keys by their prefix.
export const PRAKRITI_QUESTIONS: readonly PrakritiQuestion[] = [
  { key: "frame", label: "Body frame", options: [{ dosha: "V", label: "Thin, light" }, { dosha: "P", label: "Medium, muscular" }, { dosha: "K", label: "Broad, heavy" }] },
  { key: "skin", label: "Skin", options: [{ dosha: "V", label: "Dry, rough, cool" }, { dosha: "P", label: "Warm, oily, reddish" }, { dosha: "K", label: "Thick, smooth, cool" }] },
  { key: "hair", label: "Hair", options: [{ dosha: "V", label: "Dry, thin" }, { dosha: "P", label: "Fine, early greying" }, { dosha: "K", label: "Thick, oily" }] },
  { key: "appetite", label: "Appetite", options: [{ dosha: "V", label: "Irregular" }, { dosha: "P", label: "Strong, sharp" }, { dosha: "K", label: "Steady, low" }] },
  { key: "digestion", label: "Digestion", options: [{ dosha: "V", label: "Variable, gas" }, { dosha: "P", label: "Quick, acidity" }, { dosha: "K", label: "Slow, heavy" }] },
  { key: "sleep", label: "Sleep", options: [{ dosha: "V", label: "Light, interrupted" }, { dosha: "P", label: "Moderate, sound" }, { dosha: "K", label: "Deep, long" }] },
  { key: "temperament", label: "Temperament", options: [{ dosha: "V", label: "Anxious, quick" }, { dosha: "P", label: "Intense, focused" }, { dosha: "K", label: "Calm, steady" }] },
  { key: "memory", label: "Memory", options: [{ dosha: "V", label: "Learns fast, forgets fast" }, { dosha: "P", label: "Sharp" }, { dosha: "K", label: "Learns slow, never forgets" }] },
  { key: "speech", label: "Speech", options: [{ dosha: "V", label: "Fast, talkative" }, { dosha: "P", label: "Sharp, precise" }, { dosha: "K", label: "Slow, measured" }] },
  { key: "sweat", label: "Sweating", options: [{ dosha: "V", label: "Scanty" }, { dosha: "P", label: "Profuse" }, { dosha: "K", label: "Moderate" }] },
  { key: "bowel", label: "Bowel", options: [{ dosha: "V", label: "Dry, constipated" }, { dosha: "P", label: "Loose, frequent" }, { dosha: "K", label: "Regular, heavy" }] },
  { key: "weather", label: "Weather", options: [{ dosha: "V", label: "Dislikes cold" }, { dosha: "P", label: "Dislikes heat" }, { dosha: "K", label: "Dislikes damp" }] },
];

export const GENERAL_EXAM_TEXT_OPTIONS = {
  sleep: ["Sound", "Disturbed", "Insomnia"],
  bowel: ["Regular", "Irregular", "Constipated"],
  appetite: ["Good", "Normal", "Poor"],
} as const;
