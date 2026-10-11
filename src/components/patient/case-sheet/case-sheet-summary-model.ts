import { CLASSICAL_EXAM_SECTIONS } from "@/lib/constants/ayurveda-classical-exam-categories";
import { HABIT_DEFINITIONS } from "@/lib/constants/case-sheet-fixed-lists";
import type { ClassicalExamFinding, PatientVisit } from "@/types/patient-visit.types";

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
