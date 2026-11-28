/**
 * OPD diagnosis entries: a short reference list of common ICD-10 codes seen in a general OPD,
 * search by name or code, and the one-line text the prescription / visit stores
 * ("Acute viral fever (B34.9) [provisional]; Acute pharyngitis (J02.9)").
 *
 * The backend keeps diagnosis as free text, so the entries are written into that text and read
 * back from it. The list below is reference data (ICD-10 codes), not patient data; the doctor's
 * own frequent diagnoses come from their favourites (`/doctor-favourites?kind=DIAGNOSIS`).
 */

export type DiagnosisCertainty = "PROVISIONAL" | "FINAL";

export interface DiagnosisEntry {
  label: string;
  /** ICD-10 code; empty for a diagnosis typed in words only. */
  code: string;
  certainty: DiagnosisCertainty;
}

export interface DiagnosisOption {
  label: string;
  code: string;
}

export const COMMON_DIAGNOSES: readonly DiagnosisOption[] = [
  { label: "Acute viral fever", code: "B34.9" },
  { label: "Acute pharyngitis", code: "J02.9" },
  { label: "Acute tonsillitis", code: "J03.90" },
  { label: "Upper respiratory tract infection (URTI)", code: "J06.9" },
  { label: "Acute bronchitis", code: "J20.9" },
  { label: "Common cold (acute nasopharyngitis)", code: "J00" },
  { label: "Acute sinusitis", code: "J01.90" },
  { label: "Allergic rhinitis", code: "J30.4" },
  { label: "Bronchial asthma", code: "J45.909" },
  { label: "Cough", code: "R05" },
  { label: "Fever, unspecified", code: "R50.9" },
  { label: "Dengue fever", code: "A90" },
  { label: "Typhoid fever", code: "A01.00" },
  { label: "Malaria, unspecified", code: "B54" },
  { label: "Acute gastroenteritis", code: "A09" },
  { label: "Gastritis", code: "K29.70" },
  { label: "Gastro-oesophageal reflux disease (GERD)", code: "K21.9" },
  { label: "Dyspepsia", code: "K30" },
  { label: "Constipation", code: "K59.00" },
  { label: "Irritable bowel syndrome", code: "K58.9" },
  { label: "Urinary tract infection", code: "N39.0" },
  { label: "Type 2 diabetes mellitus", code: "E11.9" },
  { label: "Essential hypertension", code: "I10" },
  { label: "Hypothyroidism", code: "E03.9" },
  { label: "Dyslipidaemia", code: "E78.5" },
  { label: "Iron deficiency anaemia", code: "D50.9" },
  { label: "Vitamin D deficiency", code: "E55.9" },
  { label: "Vitamin B12 deficiency", code: "E53.8" },
  { label: "Obesity", code: "E66.9" },
  { label: "Migraine", code: "G43.909" },
  { label: "Tension-type headache", code: "G44.209" },
  { label: "Low back pain", code: "M54.5" },
  { label: "Cervical spondylosis", code: "M47.812" },
  { label: "Osteoarthritis of knee", code: "M17.9" },
  { label: "Rheumatoid arthritis", code: "M06.9" },
  { label: "Myalgia", code: "M79.1" },
  { label: "Acne vulgaris", code: "L70.0" },
  { label: "Eczema (dermatitis)", code: "L30.9" },
  { label: "Fungal skin infection (tinea)", code: "B35.9" },
  { label: "Urticaria", code: "L50.9" },
  { label: "Conjunctivitis", code: "H10.9" },
  { label: "Anxiety", code: "F41.9" },
  { label: "Insomnia", code: "G47.00" },
  { label: "Polycystic ovary syndrome (PCOS)", code: "E28.2" },
  { label: "Dysmenorrhoea", code: "N94.6" },
];

/** Matches by any word of the name, or by the start of the ICD code. */
export function searchDiagnoses(term: string, options: readonly DiagnosisOption[] = COMMON_DIAGNOSES, limit = 8): DiagnosisOption[] {
  const query = term.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/).filter(Boolean);
  const scored: { option: DiagnosisOption; score: number }[] = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    const code = option.code.toLowerCase();
    let score = 0;
    if (code && code.startsWith(query)) score = 5;
    else if (label.startsWith(query)) score = 4;
    else if (words.every((word) => label.includes(word))) score = words.every((word) => new RegExp(`(^|[\\s(])${escapeRegex(word)}`).test(label)) ? 3 : 1;
    if (score > 0) scored.push({ option, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.option.label.localeCompare(b.option.label))
    .slice(0, limit)
    .map((entry) => entry.option);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PROVISIONAL_MARK = "[provisional]";

/** The text saved on the prescription and the visit. Order is kept: the first entry is the primary one. */
export function formatDiagnoses(entries: readonly DiagnosisEntry[]): string {
  return entries
    .map((entry) => {
      const label = entry.label.trim();
      if (!label) return "";
      const code = entry.code.trim() ? ` (${entry.code.trim()})` : "";
      const mark = entry.certainty === "PROVISIONAL" ? ` ${PROVISIONAL_MARK}` : "";
      return `${label}${code}${mark}`;
    })
    .filter(Boolean)
    .join("; ");
}

const ENTRY_PATTERN = /^(.*?)\s*(?:\(([A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?)\))?\s*(\[provisional\])?$/i;

/** Reads the saved text back into entries; free text without a code is kept as one entry. */
export function parseDiagnoses(text: string): DiagnosisEntry[] {
  return text
    .split(/;|\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(ENTRY_PATTERN);
      return {
        label: (match?.[1] ?? part).trim() || part,
        code: (match?.[2] ?? "").toUpperCase(),
        certainty: match?.[3] ? "PROVISIONAL" : "FINAL",
      } satisfies DiagnosisEntry;
    });
}

/** Adds an entry unless the same code (or the same words) is already there. */
export function addDiagnosis(entries: readonly DiagnosisEntry[], option: DiagnosisOption, certainty: DiagnosisCertainty = "FINAL"): DiagnosisEntry[] {
  const label = option.label.trim();
  if (!label) return [...entries];
  const exists = entries.some((entry) =>
    option.code ? entry.code.toUpperCase() === option.code.toUpperCase() : entry.label.toLowerCase() === label.toLowerCase(),
  );
  return exists ? [...entries] : [...entries, { label, code: option.code.trim().toUpperCase(), certainty }];
}

/** The favourite key of a diagnosis: its code, else its words. */
export function diagnosisKey(option: DiagnosisOption): string {
  return (option.code.trim().toUpperCase() || option.label.trim().toLowerCase()).slice(0, 120);
}
