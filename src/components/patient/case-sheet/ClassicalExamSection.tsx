"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useId, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type {
  ClassicalExamCategoryConfig,
  ClassicalExamSectionConfig,
  ClassicalExamType,
} from "@/lib/constants/ayurveda-classical-exam-categories";
import type {
  ClassicalExamFinding,
  UpsertClassicalExamFindingInput,
} from "@/types/patient-visit.types";
import {
  ExamOptionChip,
  ExamPanel,
  ExamPanelHead,
  ExamSaveButton,
  ExamTile,
  type ExamChipSize,
} from "./ExamParts";

type CategoryState = { selected: string[]; remark: string };
type SectionState = Record<string, CategoryState>;

interface ClassicalExamSectionProps {
  section: ClassicalExamSectionConfig;
  findings: ClassicalExamFinding[];
  onSave: (findings: UpsertClassicalExamFindingInput[]) => Promise<unknown>;
  isSaving?: boolean;
}

/**
 * Sections with a few short options per category are laid out as a grid of
 * small tiles (everything visible at once). All other sections have long
 * Devanagari option lists and use the fold-out list.
 */
const TILE_GRID: Partial<Record<ClassicalExamType, string>> = {
  PAIN_ASSESSMENT: "grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4",
  PERSONAL_HISTORY: "grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3",
};

const EMPTY_CATEGORY: CategoryState = { selected: [], remark: "" };

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

function hasValue(state: CategoryState): boolean {
  return state.selected.length > 0 || state.remark.trim().length > 0;
}

function nextSelection(category: ClassicalExamCategoryConfig, state: CategoryState, option: string): CategoryState {
  const isActive = state.selected.includes(option);
  if (category.selection === "single") {
    return { ...state, selected: isActive ? [] : [option] };
  }
  return {
    ...state,
    selected: isActive ? state.selected.filter((o) => o !== option) : [...state.selected, option],
  };
}

function CategoryOptions({
  category,
  state,
  onChange,
  size,
}: {
  category: ClassicalExamCategoryConfig;
  state: CategoryState;
  onChange: (next: CategoryState) => void;
  size: ExamChipSize;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {category.options.map((option) => (
        <ExamOptionChip
          key={option}
          size={size}
          label={option}
          active={state.selected.includes(option)}
          onClick={() => onChange(nextSelection(category, state, option))}
        />
      ))}
    </div>
  );
}

function remarkLabel(category: ClassicalExamCategoryConfig): string {
  return `${category.hint ?? category.label} remark`;
}

/** Fold-out body: the option chips and a two-line remark. */
function CategoryBlock({
  category,
  state,
  onChange,
}: {
  category: ClassicalExamCategoryConfig;
  state: CategoryState;
  onChange: (next: CategoryState) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <CategoryOptions category={category} state={state} onChange={onChange} size="lg" />
      <Textarea
        value={state.remark}
        onChange={(event) => onChange({ ...state, remark: event.target.value })}
        placeholder="Add remark"
        aria-label={remarkLabel(category)}
        rows={2}
        className="min-h-[60px] border-line py-[11px] leading-normal"
      />
    </div>
  );
}

/** Tile: label, the option chips and a one-line remark that grows when needed. */
function CategoryTile({
  id,
  category,
  state,
  onChange,
}: {
  id: string;
  category: ClassicalExamCategoryConfig;
  state: CategoryState;
  onChange: (next: CategoryState) => void;
}) {
  return (
    <ExamTile labelledBy={id}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span id={id} className="text-sm font-bold text-ink">
          {category.label}
        </span>
        {category.hint ? <span className="text-xs text-ink-muted">{category.hint}</span> : null}
      </div>
      <CategoryOptions category={category} state={state} onChange={onChange} size="sm" />
      <Textarea
        value={state.remark}
        onChange={(event) => onChange({ ...state, remark: event.target.value })}
        placeholder="Add remark"
        aria-label={remarkLabel(category)}
        rows={1}
        className="min-h-9 resize-none rounded-[10px] border-line py-[7px] leading-5 md:text-[13px]"
      />
    </ExamTile>
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
  const headingId = useId();
  const initial = useMemo(() => buildState(section, sectionFindings), [section, sectionFindings]);
  const [state, setState] = useState<SectionState>(initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setState(initial);
    setDirty(false);
  }, [initial]);

  const filledCount = Object.values(state).filter(hasValue).length;
  const total = section.categories.length;
  const tileGrid = TILE_GRID[section.examType];

  const update = (key: string, next: CategoryState) => {
    setState((prev) => ({ ...prev, [key]: next }));
    setDirty(true);
  };

  const handleSave = async () => {
    const payload: UpsertClassicalExamFindingInput[] = section.categories.map((category) => {
      const value = state[category.key] ?? EMPTY_CATEGORY;
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
    <ExamPanel labelledBy={headingId}>
      <ExamPanelHead
        id={headingId}
        title={section.title}
        description={section.subtitle}
        aside={
          <>
            <Pill tone={total > 0 && filledCount === total ? "green" : "slate"}>
              {filledCount}/{total} recorded
            </Pill>
            <ExamSaveButton onClick={() => void handleSave()} disabled={isSaving || !dirty} saving={isSaving} />
          </>
        }
      />

      {tileGrid ? (
        <div className={cn("grid items-stretch gap-3", tileGrid)}>
          {section.categories.map((category) => (
            <CategoryTile
              key={category.key}
              id={`${headingId}-${category.key}`}
              category={category}
              state={state[category.key] ?? EMPTY_CATEGORY}
              onChange={(next) => update(category.key, next)}
            />
          ))}
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={[section.categories[0]?.key ?? ""]}
          className="w-full overflow-hidden rounded-2xl border border-line"
        >
          {section.categories.map((category) => {
            const value = state[category.key] ?? EMPTY_CATEGORY;
            return (
              <AccordionItem
                key={category.key}
                value={category.key}
                className="border-hair data-[state=open]:bg-[#fbfdfc] dark:data-[state=open]:bg-white/[0.03]"
              >
                <AccordionTrigger
                  className={cn(
                    "min-h-[54px] min-w-0 items-center gap-3 rounded-none px-[18px] py-2 hover:no-underline focus-visible:ring-inset",
                    "[&>svg]:size-[18px] [&>svg]:translate-y-0 [&>svg]:stroke-[2.2] [&>svg]:text-ink-muted [&[data-state=open]>svg]:text-brand",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="shrink-0 text-base font-bold text-ink">{category.label}</span>
                    {category.hint ? (
                      <span className="min-w-0 truncate text-xs font-normal text-ink-muted">{category.hint}</span>
                    ) : null}
                    <span className="flex min-w-[64px] flex-1 justify-end">
                      {hasValue(value) ? (
                        <span className="max-w-[420px] truncate text-[13px] font-normal text-ink-muted">
                          {value.selected.join(", ") || "Remark added"}
                        </span>
                      ) : (
                        <span className="truncate text-xs font-normal text-[#64748b] dark:text-slate-400">
                          Not recorded
                        </span>
                      )}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-[18px] pt-0.5 pb-[18px]">
                  <CategoryBlock
                    category={category}
                    state={value}
                    onChange={(next) => update(category.key, next)}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </ExamPanel>
  );
}
