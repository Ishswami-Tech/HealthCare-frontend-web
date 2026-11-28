/**
 * Turns a spoken prescription line ("Paracetamol 650, twice a day after food, five days") into a
 * medicine row the doctor confirms. Pure: the speech itself comes from `useSpeechRecognition`.
 *
 * English is understood best. Common Hindi / Marathi words for how often, when and days are read
 * too (दिन, दिवस, दो बार, खाने के बाद, जेवणानंतर ...); medicine names are matched against the
 * clinic stock list by their English name.
 */
import type { Medicine } from "@/types/pharmacy.types";
import { FREQUENCY_OPTIONS, medicineTitle } from "./rx-form.logic";

export interface ParsedVoiceLine {
  /** The words as heard. */
  text: string;
  medicine: Medicine | null;
  dosage: string;
  frequency: string;
  days: string;
  /** 0 - 1: how sure the medicine match is. */
  confidence: number;
}

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, hundred: 100,
  // Hindi / Marathi in Devanagari
  "एक": 1, "दो": 2, "दोन": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "पाच": 5, "छह": 6, "सहा": 6,
  "सात": 7, "आठ": 8, "नौ": 9, "नऊ": 9, "दस": 10, "दहा": 10, "पंद्रह": 15, "पंधरा": 15,
};

/** Lower case, Devanagari digits as 0-9, number words as digits ("five hundred" -> "500"). */
export function normaliseSpoken(text: string): string {
  let out = text.toLowerCase().replace(/[०-९]/g, (digit) => String(DEVANAGARI_DIGITS.indexOf(digit)));
  out = out.replace(/\b(one|two|three|four|five|six|seven|eight|nine)\s+hundred(?:\s+and)?\s*(fifty)?\b/g, (_m, first: string, fifty?: string) =>
    String((NUMBER_WORDS[first] ?? 0) * 100 + (fifty ? 50 : 0)),
  );
  out = out.replace(/\b(twenty|thirty|forty|fifty|sixty)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g, (_m, tens: string, unit: string) =>
    String((NUMBER_WORDS[tens] ?? 0) + (NUMBER_WORDS[unit] ?? 0)),
  );
  out = out.replace(/[\p{L}\p{M}]+/gu, (word) => (word in NUMBER_WORDS ? String(NUMBER_WORDS[word]) : word));
  return out.replace(/\s+/g, " ").trim();
}

/** Splits a dictation into lines: "next", "अगला", "पुढचे", a full stop or a new line ends a medicine. */
export function splitSpokenLines(transcript: string): string[] {
  return transcript
    .split(/\bnext\b|\bthen\b|अगला|अगली|पुढचे|पुढील|[.;।\n]/i)
    .map((line) => line.trim())
    .filter((line) => line.length > 1);
}

function timingOf(text: string): "after meal" | "before meal" | "" {
  if (/after (food|meal|meals|eating|lunch|dinner|breakfast)|खाने के बाद|जेवणानंतर|जेवणा नंतर|जेवल्यानंतर/.test(text)) return "after meal";
  if (/before (food|meal|meals|eating|lunch|dinner|breakfast)|खाने से पहले|जेवणापूर्वी|जेवणाआधी/.test(text)) return "before meal";
  return "";
}

function baseFrequencyOf(text: string): string {
  if (/\b(sos|when needed|as needed|if needed|if required)\b|ज़रूरत|जरूरत|गरज/.test(text)) return "When needed";
  if (/\b(weekly|once a week|every week)\b|हफ्ते में एक|आठवड्यातून/.test(text)) return "Once a week";
  if (/\b(4 times|four times|qid|1-1-1-1)\b|4 बार|4 वेळा/.test(text)) return "Four times a day";
  if (/\b(3 times|thrice|tds|tid|1-1-1)\b|morning,? afternoon,? (and )?(night|evening)|3 बार|3 वेळा|सुबह दोपहर शाम|सकाळ दुपार/.test(text)) return "Three times a day";
  if (/\b(2 times|twice|bd|bid|1-0-1)\b|morning (and|&) (night|evening)|2 बार|2 वेळा|सुबह शाम|सकाळ संध्याकाळ/.test(text)) return "Twice a day";
  if (/\b(bedtime|at night|hs|0-0-1)\b|रात को|रात्री/.test(text)) return "At bedtime";
  if (/empty stomach|खाली पेट|उपाशी पोटी/.test(text)) return "On an empty stomach";
  if (/\b(once|1 time|od|daily|every day|1-0-0)\b|1 बार|1 वेळा|रोज़|रोज/.test(text)) return "Once a day";
  return "";
}

/** The "How often" option for the words: the base frequency, with when to take it when that option exists. */
export function frequencyFromSpeech(text: string): string {
  const normal = normaliseSpoken(text);
  const base = baseFrequencyOf(normal);
  if (!base) return "";
  const timing = timingOf(normal);
  const options: readonly string[] = FREQUENCY_OPTIONS;
  const combined = timing ? `${base}, ${timing}` : "";
  return combined && options.includes(combined) ? combined : base;
}

export function daysFromSpeech(text: string): string {
  const normal = normaliseSpoken(text);
  const days = normal.match(/(\d+)\s*(days?|din|दिन|दिवस)/);
  if (days?.[1]) return days[1];
  const weeks = normal.match(/(\d+)\s*(weeks?|हफ्ते|हफ़्ते|आठवडे)/);
  if (weeks?.[1]) return String(Number(weeks[1]) * 7);
  if (/\b(a|one) week\b/.test(normal)) return "7";
  const months = normal.match(/(\d+)\s*(months?|महीने|महिने)/);
  if (months?.[1]) return String(Number(months[1]) * 30);
  return "";
}

export function dosageFromSpeech(text: string): string {
  const normal = normaliseSpoken(text);
  const match = normal.match(/\b(half|\d+(?:\.\d+)?)\s*(tablets?|tabs?|capsules?|caps?|ml|teaspoons?|spoons?|drops?|puffs?|sachets?)\b/);
  if (!match) return "";
  const amount = match[1] === "half" ? "½" : match[1];
  const unit = (match[2] ?? "").replace(/^tabs?$/, "tablet").replace(/^caps?$/, "capsule");
  const singular = unit.replace(/s$/, "");
  const plural = Number(amount) > 1 && unit !== "ml" ? `${singular}s` : singular;
  return `${amount} ${plural}`;
}

/** Name words of a medicine worth matching (no strengths, no "mg", no forms). */
function nameWords(medicine: Medicine): string[] {
  return String(medicine.name || "")
    .toLowerCase()
    .split(/[\s+/(),-]+/)
    .filter((word) => word.length >= 3 && !/^\d/.test(word) && !/^(mg|mcg|ml|tab|tablet|cap|capsule|syrup|syr|inj|sr|er|xr)$/.test(word));
}

function strengthNumber(medicine: Medicine): string {
  const source = `${medicine.strength ?? ""} ${medicine.name ?? ""}`;
  return source.match(/\d+(?:\.\d+)?/)?.[0] ?? "";
}

/**
 * The stock medicine the words name, with how sure the match is. A medicine is a candidate when
 * the first word of its name is heard; more name words and the spoken strength raise the score.
 */
export function matchSpokenMedicine(text: string, medicines: readonly Medicine[]): { medicine: Medicine | null; confidence: number } {
  const normal = normaliseSpoken(text);
  const heardNumbers = new Set(normal.match(/\d+(?:\.\d+)?/g) ?? []);
  let best: { medicine: Medicine; score: number } | null = null;
  for (const medicine of medicines) {
    const words = nameWords(medicine);
    const first = words[0];
    if (!first || !normal.includes(first)) continue;
    const found = words.filter((word) => normal.includes(word)).length;
    const strength = strengthNumber(medicine);
    const strengthHeard = strength !== "" && heardNumbers.has(strength);
    const strengthMissed = strength !== "" && heardNumbers.size > 0 && !strengthHeard;
    const score = found / words.length + (strengthHeard ? 0.5 : 0) - (strengthMissed ? 0.3 : 0);
    if (!best || score > best.score) best = { medicine, score };
  }
  if (!best) return { medicine: null, confidence: 0 };
  return { medicine: best.medicine, confidence: Math.max(0.3, Math.min(0.99, best.score / 1.5)) };
}

export function parseSpokenMedicine(text: string, medicines: readonly Medicine[]): ParsedVoiceLine {
  const { medicine, confidence } = matchSpokenMedicine(text, medicines);
  return {
    text: text.trim(),
    medicine,
    dosage: dosageFromSpeech(text),
    frequency: frequencyFromSpeech(text),
    days: daysFromSpeech(text),
    confidence,
  };
}

/** Every medicine line of a dictation, parsed. */
export function parseSpokenPrescription(transcript: string, medicines: readonly Medicine[]): ParsedVoiceLine[] {
  return splitSpokenLines(transcript).map((line) => parseSpokenMedicine(line, medicines));
}

/** "Paracetamol 650 mg · Twice a day, after meal · 5 days" for the confirmation list. */
export function describeParsedLine(line: ParsedVoiceLine): string {
  return [
    line.medicine ? medicineTitle(line.medicine) : "",
    line.dosage,
    line.frequency,
    line.days ? `${line.days} days` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
