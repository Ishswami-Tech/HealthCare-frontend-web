"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GENERAL_EXAM_TEXT_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-y-1">
          <Label htmlFor={`exam-${field.key}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              className="pr-14"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">General Examination</CardTitle>
          <p className="text-sm text-muted-foreground">
            {liveBmi ? `BMI ${liveBmi} · ${bmiLabel(liveBmi)}` : "Enter height and weight for BMI"}
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
          <Save className="mr-1 size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <NumericGrid
          fields={GENERAL_FIELDS}
          draft={draft}
          onChange={(key, value) => {
            setDraft((prev) => ({ ...prev, [key]: value }));
            setDirty(true);
          }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(GENERAL_EXAM_TEXT_OPTIONS) as TextField[]).map((field) => (
            <div key={field} className="flex flex-col gap-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {field}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {GENERAL_EXAM_TEXT_OPTIONS[field].map((option) => {
                  const active = text[field] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setText((prev) => ({ ...prev, [field]: active ? "" : option }));
                        setDirty(true);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PhysicalMeasurementForm({ vitals: vitalsProp, onSave, isSaving = false }: ExamFormProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const vitals = useStableSnapshot(vitalsProp);
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Physical Measurement</CardTitle>
          <p className="text-sm text-muted-foreground">Circumferences in centimetres</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
          <Save className="mr-1 size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent>
        <NumericGrid
          fields={MEASUREMENT_FIELDS}
          draft={draft}
          onChange={(key, value) => {
            setDraft((prev) => ({ ...prev, [key]: value }));
            setDirty(true);
          }}
        />
      </CardContent>
    </Card>
  );
}
