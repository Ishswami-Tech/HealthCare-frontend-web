import {
  CLASSICAL_EXAM_SECTION_BY_TYPE,
  CLASSICAL_EXAM_SECTIONS,
  type ClassicalExamType,
} from "@/lib/constants/ayurveda-classical-exam-categories";
import { HABIT_DEFINITIONS } from "@/lib/constants/case-sheet-fixed-lists";
import type {
  ClassicalExamFinding,
  PatientVisit,
  UpsertClassicalExamFindingInput,
  VisitCaseSheet,
  VisitVitalsExamination,
} from "@/types/patient-visit.types";

export interface SummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface SummarySection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly SummaryRow[];
}

/** Turns a stored option or a heading into display text in the current language. */
export interface SummaryLocalizers {
  readonly option: (stored: string) => string;
  readonly label: (text: string) => string;
}

type VisitFindings = Pick<
  PatientVisit,
  "habits" | "nidra" | "nidraNotes" | "foodAllergyNotes" | "drugAllergyNotes"
>;

const HABIT_NOTES_KEY = "notes";

const isFilled = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

function habitRows(habits: VisitFindings["habits"], t: SummaryLocalizers): SummaryRow[] {
  if (!habits) return [];
  const rows = HABIT_DEFINITIONS.filter((habit) => isFilled(habits[habit.key])).map((habit) => ({
    label: t.label(habit.label),
    value: t.option(habits[habit.key] as string),
  }));
  const notes = habits[HABIT_NOTES_KEY];
  return isFilled(notes) ? [...rows, { label: t.label("Notes"), value: notes }] : rows;
}

function nidraRows(visit: VisitFindings, t: SummaryLocalizers): SummaryRow[] {
  return [
    ...(isFilled(visit.nidra) ? [{ label: t.label("Sleep"), value: t.option(visit.nidra) }] : []),
    ...(isFilled(visit.nidraNotes) ? [{ label: t.label("Notes"), value: visit.nidraNotes }] : []),
  ];
}

function allergyRows(visit: VisitFindings, t: SummaryLocalizers): SummaryRow[] {
  return [
    ...(isFilled(visit.foodAllergyNotes)
      ? [{ label: t.label("Food allergy"), value: visit.foodAllergyNotes }]
      : []),
    ...(isFilled(visit.drugAllergyNotes)
      ? [{ label: t.label("Drug allergy"), value: visit.drugAllergyNotes }]
      : []),
  ];
}

function findingValue(finding: ClassicalExamFinding, t: SummaryLocalizers): string {
  const options = finding.selectedOptions.map((option) => t.option(option)).join(", ");
  return isFilled(finding.remark) ? (options ? `${options} - ${finding.remark}` : finding.remark) : options;
}

/** One section per classical exam type, rows in the order the case sheet lists the categories. */
function examSections(findings: readonly ClassicalExamFinding[], t: SummaryLocalizers): SummarySection[] {
  return CLASSICAL_EXAM_SECTIONS.map((section) => {
    const byCategory = new Map(
      findings.filter((finding) => finding.examType === section.examType).map((f) => [f.categoryKey, f]),
    );
    const known = new Set(section.categories.map((category) => category.key));
    const configured = section.categories.flatMap((category) => {
      const finding = byCategory.get(category.key);
      const value = finding ? findingValue(finding, t) : "";
      return value ? [{ label: t.label(category.label), value }] : [];
    });
    // A category this build does not know (newer data) is still shown, under its raw key.
    const unrecognised = [...byCategory.values()]
      .filter((finding) => !known.has(finding.categoryKey))
      .flatMap((finding) => {
        const value = findingValue(finding, t);
        return value ? [{ label: finding.categoryKey, value }] : [];
      });
    return { id: section.examType, title: t.label(section.title), rows: [...configured, ...unrecognised] };
  });
}

/** Habits, sleep, allergies and the classical exam findings of a visit; empty sections are dropped. */
export function buildFindingSections(
  visit: VisitFindings,
  findings: readonly ClassicalExamFinding[],
  t: SummaryLocalizers,
): SummarySection[] {
  const sections: SummarySection[] = [
    { id: "habits", title: t.label("Habits"), rows: habitRows(visit.habits, t) },
    { id: "nidra", title: "निद्रा (Nidra)", rows: nidraRows(visit, t) },
    { id: "allergies", title: t.label("Allergies"), rows: allergyRows(visit, t) },
    ...examSections(findings, t),
  ];
  return sections.filter((section) => section.rows.length > 0);
}

// ── Completeness (DocCaseSummary: review before the prescription) ──────────

/** Section keys of the case sheet (same keys as the case-sheet tabs, so links open the right tab). */
export type CaseSheetSectionKey =
  | "basic"
  | "complaints"
  | "past-history"
  | "habits"
  | "family"
  | "medicines"
  | "general-exam"
  | "measurements"
  | "ashtavidha"
  | "dashavidha"
  | "srotas"
  | "samprapti"
  | "pain"
  | "personal"
  | "documents";

interface SectionRule {
  key: CaseSheetSectionKey;
  label: string;
  /** Needed for the diagnosis note; the doctor can still continue without it. */
  required: boolean;
  /** Classical exam the section is stored in; such a section can be marked Normal / N/A in one tap. */
  examType?: ClassicalExamType;
  /** What "nothing to record" is saved as. */
  emptyRemark?: "Normal" | "Not applicable";
  filled: (sheet: VisitCaseSheet, examTypes: ReadonlySet<ClassicalExamType>) => boolean;
}

const hasNumber = (vitals: VisitVitalsExamination | null, keys: readonly (keyof VisitVitalsExamination)[]) =>
  Boolean(vitals) && keys.some((key) => typeof vitals?.[key] === "number");
const hasText = (...values: Array<string | null | undefined>) => values.some((value) => isFilled(value));
const hasHabits = (habits: Record<string, string> | null) =>
  Boolean(habits) && Object.values(habits ?? {}).some((value) => isFilled(value));

const exam = (
  key: CaseSheetSectionKey,
  label: string,
  examType: ClassicalExamType,
  emptyRemark: "Normal" | "Not applicable",
  required = false,
  alsoFilled?: (sheet: VisitCaseSheet) => boolean,
): SectionRule => ({
  key,
  label,
  required,
  examType,
  emptyRemark,
  filled: (sheet, examTypes) => examTypes.has(examType) || Boolean(alsoFilled?.(sheet)),
});

/**
 * The case-sheet sections this summary can check from GET /patient-visits/:id/case-sheet. Prakruti,
 * therapy, diet, investigation and progress live on their own routes and are not checked here.
 */
export const CASE_SHEET_SECTION_RULES: readonly SectionRule[] = [
  { key: "basic", label: "Basic Details", required: false, filled: (sheet) => Boolean(sheet.patient) },
  {
    key: "complaints",
    label: "Complaints",
    required: true,
    filled: (sheet) => hasText(sheet.visit.presentComplaints, sheet.visit.presentIllness),
  },
  {
    key: "past-history",
    label: "Past History",
    required: false,
    filled: (sheet) => hasText(sheet.visit.pastHistoryNotes, sheet.visit.knownCaseOf) || sheet.medicalHistory.length > 0,
  },
  {
    key: "habits",
    label: "Habits and Nidra",
    required: false,
    filled: (sheet) => hasHabits(sheet.visit.habits) || hasText(sheet.visit.nidra, sheet.visit.nidraNotes),
  },
  { key: "family", label: "Family History", required: false, filled: (sheet) => sheet.familyHistory.length > 0 },
  { key: "medicines", label: "Medicine History", required: false, filled: (sheet) => sheet.medications.length > 0 },
  {
    key: "general-exam",
    label: "General Exam",
    required: false,
    filled: (sheet) =>
      hasNumber(sheet.vitalsExamination, ["bpSystolic", "pulse", "temperatureC", "spo2", "rr", "fbs", "ppbs"]),
  },
  {
    key: "measurements",
    label: "Measurements",
    required: false,
    filled: (sheet) => hasNumber(sheet.vitalsExamination, ["heightCm", "weightKg", "waist", "hips", "chest"]),
  },
  exam("ashtavidha", "Ashtavidha", "ASHTAVIDHA_PARIKSHA", "Normal"),
  exam("dashavidha", "Dashavidha", "DASHAVIDHA_PARIKSHA", "Normal"),
  exam("srotas", "Srotas", "SROTAS_PARIKSHA", "Normal"),
  exam("samprapti", "Samprapti", "SAMPRAPTI_GHATAKA", "Not applicable"),
  exam("pain", "Pain", "PAIN_ASSESSMENT", "Not applicable", true, (sheet) =>
    typeof sheet.vitalsExamination?.painScore === "number",
  ),
  exam("personal", "Personal", "PERSONAL_HISTORY", "Not applicable", true, (sheet) =>
    hasText(sheet.vitalsExamination?.sleep, sheet.vitalsExamination?.bowel, sheet.vitalsExamination?.appetite),
  ),
  { key: "documents", label: "Documents", required: false, filled: (sheet) => sheet.labReports.length > 0 },
];

export interface CaseSheetSectionState {
  key: CaseSheetSectionKey;
  label: string;
  required: boolean;
  filled: boolean;
  /** True when one tap can save it as Normal / Not applicable. */
  canMarkEmpty: boolean;
}

export interface CaseSheetCompleteness {
  sections: CaseSheetSectionState[];
  done: CaseSheetSectionState[];
  requiredEmpty: CaseSheetSectionState[];
  optionalEmpty: CaseSheetSectionState[];
  /** Optional empty sections one tap can close. */
  markableOptional: CaseSheetSectionState[];
  total: number;
}

/** Which sections of a case sheet are filled, which required ones are still empty. */
export function buildCaseSheetCompleteness(sheet: VisitCaseSheet): CaseSheetCompleteness {
  const examTypes = new Set(
    (sheet.classicalExams ?? [])
      .filter((finding) => finding.selectedOptions.length > 0 || isFilled(finding.remark))
      .map((finding) => finding.examType),
  );
  const sections = CASE_SHEET_SECTION_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    required: rule.required,
    filled: rule.filled(sheet, examTypes),
    canMarkEmpty: Boolean(rule.examType),
  }));
  const optionalEmpty = sections.filter((section) => !section.filled && !section.required);
  return {
    sections,
    done: sections.filter((section) => section.filled),
    requiredEmpty: sections.filter((section) => !section.filled && section.required),
    optionalEmpty,
    markableOptional: optionalEmpty.filter((section) => section.canMarkEmpty),
    total: sections.length,
  };
}

/**
 * The findings that save the given (empty) exam sections as "Normal" / "Not applicable": one
 * remark on the section's first category, so the section counts as recorded and can be reopened.
 */
export function buildMarkEmptyFindings(keys: readonly CaseSheetSectionKey[]): UpsertClassicalExamFindingInput[] {
  return CASE_SHEET_SECTION_RULES.flatMap((rule) => {
    if (!rule.examType || !rule.emptyRemark || !keys.includes(rule.key)) return [];
    const firstCategory = CLASSICAL_EXAM_SECTION_BY_TYPE[rule.examType].categories[0];
    return firstCategory
      ? [{ examType: rule.examType, categoryKey: firstCategory.key, selectedOptions: [], remark: rule.emptyRemark }]
      : [];
  });
}
