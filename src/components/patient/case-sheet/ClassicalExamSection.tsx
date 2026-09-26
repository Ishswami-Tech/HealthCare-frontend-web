"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type {
  ClassicalExamCategoryConfig,
  ClassicalExamSectionConfig,
} from "@/lib/constants/ayurveda-classical-exam-categories";
import type {
  ClassicalExamFinding,
  UpsertClassicalExamFindingInput,
} from "@/types/patient-visit.types";

type CategoryState = { selected: string[]; remark: string };
type SectionState = Record<string, CategoryState>;

interface ClassicalExamSectionProps {
  section: ClassicalExamSectionConfig;
  findings: ClassicalExamFinding[];
  onSave: (findings: UpsertClassicalExamFindingInput[]) => Promise<unknown>;
  isSaving?: boolean;
}

function buildState(section: ClassicalExamSectionConfig, findings: ClassicalExamFinding[]): SectionState {
  const byKey = new Map(
    findings.filter((f) => f.examType === section.examType).map((f) => [f.categoryKey, f]),
  );
  return Object.fromEntries(
    section.categories.map((category) => {
      const existing = byKey.get(category.key);
      return [
        category.key,
        { selected: existing?.selectedOptions ?? [], remark: existing?.remark ?? "" },
      ];
    }),
  );
}

function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function CategoryBlock({
  category,
  state,
  onChange,
}: {
  category: ClassicalExamCategoryConfig;
  state: CategoryState;
  onChange: (next: CategoryState) => void;
}) {
  const toggle = (option: string) => {
    const isActive = state.selected.includes(option);
    if (category.selection === "single") {
      onChange({ ...state, selected: isActive ? [] : [option] });
      return;
    }
    onChange({
      ...state,
      selected: isActive ? state.selected.filter((o) => o !== option) : [...state.selected, option],
    });
  };

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-wrap gap-2">
        {category.options.map((option) => (
          <OptionChip
            key={option}
            label={option}
            active={state.selected.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
      <Textarea
        value={state.remark}
        onChange={(event) => onChange({ ...state, remark: event.target.value })}
        placeholder="Add remark"
        rows={2}
        className="text-sm"
      />
    </div>
  );
}

export function ClassicalExamSection({
  section,
  findings,
  onSave,
  isSaving = false,
}: ClassicalExamSectionProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const sectionFindings = useStableSnapshot(
    findings.filter((f) => f.examType === section.examType),
  );
  const initial = useMemo(() => buildState(section, sectionFindings), [section, sectionFindings]);
  const [state, setState] = useState<SectionState>(initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setState(initial);
    setDirty(false);
  }, [initial]);

  const filledCount = Object.values(state).filter(
    (c) => c.selected.length > 0 || c.remark.trim().length > 0,
  ).length;

  const handleSave = async () => {
    const payload: UpsertClassicalExamFindingInput[] = section.categories.map((category) => {
      const value = state[category.key] ?? { selected: [], remark: "" };
      return {
        examType: section.examType,
        categoryKey: category.key,
        selectedOptions: value.selected,
        ...(value.remark.trim() ? { remark: value.remark.trim() } : {}),
      };
    });
    if (await runSave(() => onSave(payload))) setDirty(false);
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">{section.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-md">
            {filledCount}/{section.categories.length} recorded
          </Badge>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
            <Save className="mr-1 size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[section.categories[0]?.key ?? ""]} className="w-full">
          {section.categories.map((category) => {
            const value = state[category.key] ?? { selected: [], remark: "" };
            const hasValue = value.selected.length > 0 || value.remark.trim().length > 0;
            return (
              <AccordionItem key={category.key} value={category.key}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex flex-1 items-center justify-between pr-2 text-left">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-foreground">{category.label}</span>
                      {category.hint ? (
                        <span className="text-xs text-muted-foreground">{category.hint}</span>
                      ) : null}
                    </div>
                    {hasValue ? (
                      <span className="max-w-[45%] truncate text-xs text-muted-foreground">
                        {value.selected.join(", ") || "Remark added"}
                      </span>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <CategoryBlock
                    category={category}
                    state={value}
                    onChange={(next) => {
                      setState((prev) => ({ ...prev, [category.key]: next }));
                      setDirty(true);
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
