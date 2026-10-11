"use client";

import { runSave } from "./run-save";
import { useLocalizedOption } from "./use-localized-option";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Divider, Pill, type PillTone } from "@/components/tbd";
import { GENERAL_EXAM_TEXT_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { ExamEyebrow, ExamOptionChip, ExamPanel, ExamPanelHead, ExamSaveButton } from "./ExamParts";
import type {
  UpsertVisitVitalsExaminationInput,
  VisitVitalsExamination,
} from "@/types/patient-visit.types";

type NumericField = keyof Omit<
  UpsertVisitVitalsExaminationInput,
  "sleep" | "bowel" | "appetite"
>;
type TextField = "sleep" | "bowel" | "appetite";

interface FieldDef {
  key: NumericField;
  label: string;
  unit: string;
  step?: number;
}

const GENERAL_FIELDS: readonly FieldDef[] = [
  { key: "heightCm", label: "Height", unit: "cm", step: 0.1 },
  { key: "weightKg", label: "Weight", unit: "kg", step: 0.1 },
  { key: "temperatureC", label: "Temperature", unit: "°C", step: 0.1 },
  { key: "pulse", label: "Pulse", unit: "/min" },
  { key: "bpSystolic", label: "BP systolic", unit: "mmHg" },
  { key: "bpDiastolic", label: "BP diastolic", unit: "mmHg" },
  { key: "rr", label: "RR", unit: "/min" },
  { key: "painScore", label: "Pain score", unit: "0–10" },
  { key: "fbs", label: "FBS", unit: "mg/dL" },
  { key: "ppbs", label: "PPBS", unit: "mg/dL" },
  { key: "pbs", label: "PBS", unit: "mg/dL" },
  { key: "spo2", label: "SpO₂", unit: "%" },
];

const MEASUREMENT_FIELDS: readonly FieldDef[] = [
  { key: "neck", label: "Neck", unit: "cm", step: 0.1 },
  { key: "chest", label: "Chest", unit: "cm", step: 0.1 },
  { key: "upperAbs", label: "Upper abs", unit: "cm", step: 0.1 },
  { key: "waist", label: "Waist", unit: "cm", step: 0.1 },
  { key: "lowerAbs", label: "Lower abs", unit: "cm", step: 0.1 },
  { key: "hips", label: "Hips", unit: "cm", step: 0.1 },
  { key: "thighLeft", label: "Thigh left", unit: "cm", step: 0.1 },
  { key: "thighRight", label: "Thigh right", unit: "cm", step: 0.1 },
  { key: "calfLeft", label: "Calf left", unit: "cm", step: 0.1 },
  { key: "calfRight", label: "Calf right", unit: "cm", step: 0.1 },
  { key: "upperArmLeft", label: "Upper arm left", unit: "cm", step: 0.1 },
  { key: "upperArmRight", label: "Upper arm right", unit: "cm", step: 0.1 },
];

type Draft = Record<string, string>;

function toDraft(vitals: VisitVitalsExamination | null, fields: readonly FieldDef[]): Draft {
  return Object.fromEntries(
    fields.map((field) => {
      const value = vitals?.[field.key];
      return [field.key, value === null || value === undefined ? "" : String(value)];
    }),
  );
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/** Normal is green; anything else is a plain amber notice (red is kept for errors). */
function bmiTone(bmi: number): PillTone {
  return bmi >= 18.5 && bmi < 25 ? "green" : "amber";
}

function NumericGrid({
  fields,
  draft,
  onChange,
}: {
  fields: readonly FieldDef[];
  draft: Draft;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-start gap-3.5 @xl:grid-cols-3 @3xl:grid-cols-4">
      {fields.map((field) => (
        <div key={field.key} className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`exam-${field.key}`} className="text-xs font-bold leading-tight text-ink-soft">
            {field.label}
          </Label>
          <div className="relative">
            <Input
              id={`exam-${field.key}`}
              type="number"
              inputMode="decimal"
              step={field.step ?? 1}
              min={0}
              value={draft[field.key] ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
              aria-describedby={`exam-${field.key}-unit`}
              className="pr-[58px] font-semibold text-ink"
            />
            <span
              id={`exam-${field.key}-unit`}
              className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-ink-muted"
            >
              {field.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildInput(draft: Draft, fields: readonly FieldDef[]): UpsertVisitVitalsExaminationInput {
  const input: Record<string, number> = {};
  for (const field of fields) {
    const raw = draft[field.key];
    if (raw === undefined || raw.trim() === "") continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) input[field.key] = parsed;
  }
  return input as UpsertVisitVitalsExaminationInput;
}

interface ExamFormProps {
  vitals: VisitVitalsExamination | null;
  onSave: (input: UpsertVisitVitalsExaminationInput) => Promise<unknown>;
  isSaving?: boolean;
}

export function GeneralExaminationForm({ vitals: vitalsProp, onSave, isSaving = false }: ExamFormProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const vitals = useStableSnapshot(vitalsProp);
  const headingId = useId();
  const localize = useLocalizedOption();
  const initial = useMemo(() => toDraft(vitals, GENERAL_FIELDS), [vitals]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [text, setText] = useState<Record<TextField, string>>({
    sleep: vitals?.sleep ?? "",
    bowel: vitals?.bowel ?? "",
    appetite: vitals?.appetite ?? "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(initial);
    setText({ sleep: vitals?.sleep ?? "", bowel: vitals?.bowel ?? "", appetite: vitals?.appetite ?? "" });
    setDirty(false);
  }, [initial, vitals]);

  const liveBmi = useMemo(() => {
    const h = Number(draft["heightCm"]);
    const w = Number(draft["weightKg"]);
    if (!h || !w) return null;
    const m = h / 100;
    return Number((w / (m * m)).toFixed(2));
  }, [draft]);

  const handleSave = async () => {
    if (await runSave(() => onSave({ ...buildInput(draft, GENERAL_FIELDS), ...text }))) setDirty(false);
  };

  return (
    <ExamPanel labelledBy={headingId}>
      <ExamPanelHead
        id={headingId}
        title="General Examination"
        description={
          liveBmi ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              BMI {liveBmi}
              <Pill tone={bmiTone(liveBmi)}>{bmiLabel(liveBmi)}</Pill>
            </span>
          ) : (
            "Enter height and weight for BMI"
          )
        }
        aside={<ExamSaveButton onClick={() => void handleSave()} disabled={isSaving || !dirty} saving={isSaving} />}
      />
      <NumericGrid
        fields={GENERAL_FIELDS}
        draft={draft}
        onChange={(key, value) => {
          setDraft((prev) => ({ ...prev, [key]: value }));
          setDirty(true);
        }}
      />
      <Divider />
      <div className="grid grid-cols-1 items-start gap-4 @xl:grid-cols-3">
        {(Object.keys(GENERAL_EXAM_TEXT_OPTIONS) as TextField[]).map((field) => (
          <div
            key={field}
            role="group"
            aria-labelledby={`${headingId}-${field}`}
            className="flex min-w-0 flex-col gap-2"
          >
            <ExamEyebrow id={`${headingId}-${field}`}>{field}</ExamEyebrow>
            <div className="flex flex-wrap gap-2">
              {GENERAL_EXAM_TEXT_OPTIONS[field].map((option) => {
                const active = text[field] === option;
                return (
                  <ExamOptionChip
                    key={option}
                    size="md"
                    label={localize(option)}
                    active={active}
                    onClick={() => {
                      setText((prev) => ({ ...prev, [field]: active ? "" : option }));
                      setDirty(true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ExamPanel>
  );
}

export function PhysicalMeasurementForm({ vitals: vitalsProp, onSave, isSaving = false }: ExamFormProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const vitals = useStableSnapshot(vitalsProp);
  const headingId = useId();
  const initial = useMemo(() => toDraft(vitals, MEASUREMENT_FIELDS), [vitals]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(initial);
    setDirty(false);
  }, [initial]);

  const handleSave = async () => {
    if (await runSave(() => onSave(buildInput(draft, MEASUREMENT_FIELDS)))) setDirty(false);
  };

  return (
    <ExamPanel labelledBy={headingId}>
      <ExamPanelHead
        id={headingId}
        title="Physical Measurement"
        description="Circumferences in centimetres"
        aside={<ExamSaveButton onClick={() => void handleSave()} disabled={isSaving || !dirty} saving={isSaving} />}
      />
      <NumericGrid
        fields={MEASUREMENT_FIELDS}
        draft={draft}
        onChange={(key, value) => {
          setDraft((prev) => ({ ...prev, [key]: value }));
          setDirty(true);
        }}
      />
    </ExamPanel>
  );
}
