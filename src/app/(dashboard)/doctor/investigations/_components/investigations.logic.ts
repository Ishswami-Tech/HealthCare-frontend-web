/**
 * Reference list of common OPD tests and panels for the order screen. Reference data only (test
 * names); the doctor's own favourite tests are kept on their account (`kind=INVESTIGATION`).
 */
import type { InvestigationKind, InvestigationTest } from "@/hooks/query/useInvestigations";

export interface CatalogTest extends InvestigationTest {
  /** Sample or study, shown under the name. */
  detail: string;
}

export const TEST_CATALOG: readonly CatalogTest[] = [
  { name: "Complete blood count (CBC)", kind: "LAB", detail: "Blood · EDTA" },
  { name: "C-reactive protein (CRP)", kind: "LAB", detail: "Blood · serum" },
  { name: "ESR", kind: "LAB", detail: "Blood · EDTA" },
  { name: "Dengue NS1 antigen", kind: "LAB", detail: "Blood · serum · best within 5 days of fever" },
  { name: "Dengue IgM / IgG", kind: "LAB", detail: "Blood · serum" },
  { name: "Malaria antigen", kind: "LAB", detail: "Blood · EDTA" },
  { name: "Widal test", kind: "LAB", detail: "Blood · serum" },
  { name: "Urine routine & microscopy", kind: "LAB", detail: "Urine · mid-stream" },
  { name: "Urine culture", kind: "LAB", detail: "Urine · sterile container" },
  { name: "Fasting blood sugar (FBS)", kind: "LAB", detail: "Blood · fasting 8–10 h" },
  { name: "Post-prandial blood sugar (PPBS)", kind: "LAB", detail: "Blood · 2 h after a meal" },
  { name: "HbA1c", kind: "LAB", detail: "Blood · EDTA · no fasting" },
  { name: "Lipid profile", kind: "LAB", detail: "Blood · fasting 10–12 h" },
  { name: "Liver function test (LFT)", kind: "LAB", detail: "Blood · serum" },
  { name: "Kidney function test (KFT)", kind: "LAB", detail: "Blood · serum" },
  { name: "Serum creatinine", kind: "LAB", detail: "Blood · serum" },
  { name: "Thyroid profile (T3, T4, TSH)", kind: "LAB", detail: "Blood · serum" },
  { name: "TSH", kind: "LAB", detail: "Blood · serum" },
  { name: "Vitamin D (25-OH)", kind: "LAB", detail: "Blood · serum" },
  { name: "Vitamin B12", kind: "LAB", detail: "Blood · serum" },
  { name: "Serum electrolytes", kind: "LAB", detail: "Blood · serum" },
  { name: "Uric acid", kind: "LAB", detail: "Blood · serum" },
  { name: "Stool routine", kind: "LAB", detail: "Stool" },
  { name: "Chest X-ray (PA view)", kind: "IMAGING", detail: "X-ray" },
  { name: "X-ray knee (AP / lateral)", kind: "IMAGING", detail: "X-ray" },
  { name: "X-ray lumbar spine", kind: "IMAGING", detail: "X-ray" },
  { name: "USG abdomen & pelvis", kind: "IMAGING", detail: "Ultrasound · full bladder" },
  { name: "ECG", kind: "IMAGING", detail: "12-lead" },
  { name: "2D Echo", kind: "IMAGING", detail: "Echocardiography" },
  { name: "MRI lumbar spine", kind: "IMAGING", detail: "MRI" },
  { name: "CT scan brain", kind: "IMAGING", detail: "CT" },
];

export interface TestPanel {
  name: string;
  tests: readonly string[];
}

export const TEST_PANELS: readonly TestPanel[] = [
  { name: "Fever panel", tests: ["Complete blood count (CBC)", "C-reactive protein (CRP)", "Dengue NS1 antigen", "Malaria antigen"] },
  { name: "Diabetes check", tests: ["HbA1c", "Fasting blood sugar (FBS)", "Post-prandial blood sugar (PPBS)", "Lipid profile"] },
  { name: "Thyroid & vitamins", tests: ["TSH", "Vitamin D (25-OH)", "Vitamin B12"] },
  { name: "Routine health check", tests: ["Complete blood count (CBC)", "Liver function test (LFT)", "Kidney function test (KFT)", "Lipid profile", "Urine routine & microscopy"] },
];

export const LAB_DESTINATIONS = ["Clinic lab", "Partner lab · home pickup", "Patient's own lab"] as const;

const catalogByName = new Map(TEST_CATALOG.map((test) => [test.name.toLowerCase(), test]));

export function testFor(name: string, kind?: InvestigationKind): CatalogTest {
  return catalogByName.get(name.trim().toLowerCase()) ?? { name: name.trim(), kind: kind ?? "LAB", detail: "" };
}

export function searchTests(term: string, limit = 8): CatalogTest[] {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return TEST_CATALOG.filter((test) => {
    const text = `${test.name} ${test.detail}`.toLowerCase();
    return words.every((word) => text.includes(word));
  }).slice(0, limit);
}

/** Adds tests by name, each once. */
export function addTests(current: readonly InvestigationTest[], additions: readonly InvestigationTest[]): InvestigationTest[] {
  const seen = new Set(current.map((test) => test.name.toLowerCase()));
  const next = [...current];
  for (const test of additions) {
    const key = test.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push({ name: test.name.trim().slice(0, 120), kind: test.kind });
  }
  return next.slice(0, 30);
}
