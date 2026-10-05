"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { PLAN_HEAD_BUTTON, PlanCardHeader, PlanField, PlanToggle } from "./PlanShared";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Command as CommandPrimitive } from "cmdk";
import { Plus, Printer, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Note, Pill, Surface, type PillTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  DIET_CATEGORIES,
  DIET_CATEGORY_LABEL_KEY,
  DIET_CHART_LABELS,
  DIET_LANGUAGES,
  DIET_LANGUAGE_NAMES,
  DIET_LANGUAGE_SHORT,
  dietLabel,
  dietSecondaryLabels,
} from "@/lib/constants/diet-chart-labels";
import {
  useCreateDietChartFood,
  useDietChartFoods,
  useUpsertVisitDietChart,
  useVisitDietChart,
} from "@/hooks/query/useVisitDietChart";
import type {
  DietAdviceCategory,
  DietChartFood,
  DietChartItemInput,
  DietChartLanguage,
  DietFoodLabels,
  UpsertVisitDietChartInput,
  VisitDietChart,
} from "@/types/visit-diet-chart.types";

interface DietChartPanelProps {
  clinicId: string;
  patientId: string;
  visitId: string;
}

interface DraftItem extends DietFoodLabels {
  localId: string;
  category: DietAdviceCategory;
  foodId: string | null;
  note: string;
}

interface Draft {
  printLanguage: DietChartLanguage;
  notes: string;
  items: DraftItem[];
}

const MAX_ITEMS = 200;
const SEARCH_DEBOUNCE_MS = 250;

const CATEGORY_STYLE: Record<DietAdviceCategory, { dot: string; tone: PillTone; hint: string }> = {
  TAKE: { dot: "bg-[#10b981]", tone: "green", hint: "Pathya: foods to include" },
  AVOID: { dot: "bg-[#e11d48]", tone: "rose", hint: "Apathya: foods to stop" },
  OCCASIONAL: { dot: "bg-[#f59e0b]", tone: "amber", hint: "Small amounts, not daily" },
};

const LANGUAGE_OPTIONS = DIET_LANGUAGES.map((lang) => ({
  value: lang,
  label: DIET_LANGUAGE_SHORT[lang],
  title: DIET_LANGUAGE_NAMES[lang],
  lang,
}));

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `diet-item-${localIdCounter}`;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

function buildDraft(chart: VisitDietChart | undefined): Draft {
  return {
    printLanguage: chart?.printLanguage ?? "en",
    notes: chart?.notes ?? "",
    items: (chart?.items ?? []).map((item) => ({
      localId: nextLocalId(),
      category: item.category,
      foodId: item.foodId,
      nameEn: item.nameEn,
      nameGu: item.nameGu,
      nameHi: item.nameHi,
      nameMr: item.nameMr,
      note: item.note ?? "",
    })),
  };
}

/** Only whitelisted fields go over the wire (the backend forbids unknown keys). */
function toPayload(draft: Draft): UpsertVisitDietChartInput {
  const positions: Partial<Record<DietAdviceCategory, number>> = {};
  const items: DietChartItemInput[] = draft.items.map((item) => {
    const sortOrder = positions[item.category] ?? 0;
    positions[item.category] = sortOrder + 1;
    return {
      category: item.category,
      nameEn: item.nameEn.trim(),
      sortOrder,
      ...(item.foodId ? { foodId: item.foodId } : {}),
      ...(item.nameGu ? { nameGu: item.nameGu } : {}),
      ...(item.nameHi ? { nameHi: item.nameHi } : {}),
      ...(item.nameMr ? { nameMr: item.nameMr } : {}),
      ...(item.note.trim() ? { note: item.note.trim() } : {}),
    };
  });
  return {
    printLanguage: draft.printLanguage,
    notes: draft.notes.trim(),
    items,
  };
}

function fromFood(food: DietChartFood, category: DietAdviceCategory): DraftItem {
  return {
    localId: nextLocalId(),
    category,
    foodId: food.id,
    nameEn: food.nameEn,
    nameGu: food.nameGu,
    nameHi: food.nameHi,
    nameMr: food.nameMr,
    note: "",
  };
}

function fromFreeText(text: string, category: DietAdviceCategory): DraftItem {
  return {
    localId: nextLocalId(),
    category,
    foodId: null,
    nameEn: text,
    nameGu: null,
    nameHi: null,
    nameMr: null,
    note: "",
  };
}

function FoodPicker({
  clinicId,
  category,
  language,
  disabled,
  onPick,
}: {
  clinicId: string;
  category: DietAdviceCategory;
  language: DietChartLanguage;
  disabled: boolean;
  onPick: (item: DraftItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: foods = [], isFetching } = useDietChartFoods(clinicId, debouncedQuery);
  const { mutateAsync: createFood, isPending: isCreating } = useCreateDietChartFood();
  const trimmed = query.trim();
  const exactMatch = foods.some((food) => food.nameEn.toLowerCase() === trimmed.toLowerCase());
  const columnName = DIET_CHART_LABELS.en[DIET_CATEGORY_LABEL_KEY[category]];

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  // The search opens in the column itself (not over it); a click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pickFood = (food: DietChartFood) => {
    onPick(fromFood(food, category));
    close();
  };

  const pickFreeText = () => {
    onPick(fromFreeText(trimmed, category));
    close();
  };

  const addToClinicList = async () => {
    // useMutationOperation already shows the error toast; only act on success.
    const created = await createFood({ clinicId, input: { nameEn: trimmed } }).catch(() => null);
    if (created) {
      onPick(fromFood(created, category));
      close();
    }
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-label={`Add food to ${columnName}`}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          "flex min-h-[38px] w-full items-center gap-2 rounded-[10px] border bg-card px-3 text-[13px] font-semibold text-brand transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
          open ? "border-brand" : "border-dashed border-[#cbd5e1] hover:border-brand dark:border-slate-600",
        )}
      >
        <Plus className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
        Add food
      </button>

      {open ? (
        <Command
          shouldFilter={false}
          label={`Search foods for ${columnName}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          className="h-auto rounded-xl border border-line bg-card p-1.5 text-ink shadow-[0_12px_28px_rgba(15,27,45,0.14)]"
        >
          <div className="flex items-center gap-2 border-b border-hair px-2.5 py-2">
            <Search className="size-[15px] shrink-0 text-ink-muted" aria-hidden="true" />
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search in English, ગુજરાતી, हिन्दी or मराठी"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-ink ring-0 ring-offset-0 placeholder:font-normal placeholder:text-[#94a3b8] focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="px-2.5 py-5 text-center text-[13px] text-ink-muted">
              {isFetching ? "Searching..." : "No matching foods"}
            </CommandEmpty>
            {trimmed && !exactMatch ? (
              <CommandGroup heading="Not in the list?" className={PICKER_GROUP}>
                <CommandItem value={`free-text:${trimmed}`} onSelect={pickFreeText} className={PICKER_ITEM}>
                  <Plus className="size-[15px] text-brand" strokeWidth={2.4} aria-hidden="true" />
                  <span className="min-w-0 flex-1 font-semibold">Use &quot;{trimmed}&quot; as free text</span>
                </CommandItem>
                <CommandItem
                  value={`clinic-food:${trimmed}`}
                  disabled={isCreating}
                  onSelect={() => void addToClinicList()}
                  className={PICKER_ITEM}
                >
                  <Plus className="size-[15px] text-brand" strokeWidth={2.4} aria-hidden="true" />
                  <span className="min-w-0 flex-1 font-semibold">
                    {isCreating ? "Adding..." : `Add "${trimmed}" to the clinic food list`}
                  </span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {foods.length > 0 ? (
              <CommandGroup heading="Foods" className={PICKER_GROUP}>
                {foods.map((food) => {
                  const secondary = dietSecondaryLabels(food, language);
                  return (
                    <CommandItem key={food.id} value={food.id} onSelect={() => pickFood(food)} className={PICKER_ITEM}>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold" lang={language}>
                          {dietLabel(food, language)}
                        </span>
                        {secondary.length > 0 ? (
                          <span className="truncate text-xs text-ink-muted">{secondary.join(" · ")}</span>
                        ) : null}
                      </div>
                      {food.clinicId ? <Pill tone="slate">Clinic</Pill> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      ) : null}
    </div>
  );
}

const PICKER_GROUP =
  "p-0 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-0 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-0.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.6px] [&_[cmdk-group-heading]]:text-ink-muted";

const PICKER_ITEM =
  "gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink data-[selected=true]:bg-mint-soft data-[selected=true]:text-ink";

function CategoryColumn({
  clinicId,
  category,
  language,
  items,
  disabled,
  onAdd,
  onNoteChange,
  onRemove,
}: {
  clinicId: string;
  category: DietAdviceCategory;
  language: DietChartLanguage;
  items: DraftItem[];
  disabled: boolean;
  onAdd: (item: DraftItem) => void;
  onNoteChange: (localId: string, note: string) => void;
  onRemove: (localId: string) => void;
}) {
  const style = CATEGORY_STYLE[category];
  const title = DIET_CHART_LABELS[language][DIET_CATEGORY_LABEL_KEY[category]];
  const englishTitle = DIET_CHART_LABELS.en[DIET_CATEGORY_LABEL_KEY[category]];

  return (
    <section className="flex min-h-[250px] min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-[#f8fafc] p-3.5 dark:bg-white/[0.03]">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 flex items-center gap-2 text-[15px] font-bold text-ink">
            <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
            <span className="truncate" lang={language}>
              {title}
            </span>
            {language !== "en" ? (
              <span className="text-xs font-medium text-ink-muted" lang="en">
                {englishTitle}
              </span>
            ) : null}
          </h3>
          <p className="m-0 text-xs text-ink-muted">{style.hint}</p>
        </div>
        <Pill tone={style.tone}>{items.length}</Pill>
      </header>

      <FoodPicker
        clinicId={clinicId}
        category={category}
        language={language}
        disabled={disabled}
        onPick={onAdd}
      />

      {items.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
          Nothing added yet
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {items.map((item) => {
            const secondary = dietSecondaryLabels(item, language);
            return (
              <li key={item.localId} className="flex flex-col gap-2 rounded-xl border border-line bg-card px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-px">
                    <p className="m-0 truncate text-sm font-bold text-ink" lang={language}>
                      {dietLabel(item, language)}
                    </p>
                    {secondary.length > 0 ? (
                      <p className="m-0 truncate text-xs text-ink-muted">{secondary.join(" · ")}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.nameEn}`}
                    onClick={() => onRemove(item.localId)}
                    className="flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-well text-ink-soft transition-colors hover:bg-line hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <X className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
                <Input
                  value={item.note}
                  onChange={(event) => onNoteChange(item.localId, event.target.value)}
                  placeholder="Note (e.g. only at lunch)"
                  maxLength={300}
                  aria-label={`Note for ${item.nameEn}`}
                  className="h-[34px] rounded-[10px] px-3.5 text-[13px] md:text-[13px]"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export interface DietChartViewProps {
  /** Clinic whose food list the "Add food" search uses. */
  clinicId: string;
  /** Used for the ids of the form controls. */
  visitId: string;
  chart: VisitDietChart | undefined;
  isLoading: boolean;
  /** Message when the chart could not be loaded. */
  error?: string | null;
  isSaving: boolean;
  /** Saves the whole chart. Resolves to true when it was saved. */
  onSave: (input: UpsertVisitDietChartInput) => Promise<boolean>;
  /** The printable sheet of this chart. */
  printHref: string;
}

/** Layout and draft of the Diet section. The saved chart and saving come in through props. */
export function DietChartView({
  clinicId,
  visitId,
  chart,
  isLoading,
  error = null,
  isSaving,
  onSave,
  printHref,
}: DietChartViewProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const snapshot = useStableSnapshot(chart);
  const initial = useMemo(() => buildDraft(snapshot), [snapshot]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState<DietChartLanguage>(initial.printLanguage);

  useEffect(() => {
    setDraft(initial);
    setDirty(false);
    setDisplayLanguage(initial.printLanguage);
  }, [initial]);

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const addItem = (item: DraftItem) => {
    setDraft((prev) => {
      if (prev.items.length >= MAX_ITEMS) return prev;
      const duplicate = prev.items.some(
        (existing) =>
          existing.category === item.category &&
          (item.foodId ? existing.foodId === item.foodId : existing.nameEn.toLowerCase() === item.nameEn.toLowerCase()),
      );
      return duplicate ? prev : { ...prev, items: [...prev.items, item] };
    });
    setDirty(true);
  };

  const changeNote = (localId: string, note: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.localId === localId ? { ...item, note } : item)),
    }));
    setDirty(true);
  };

  const removeItem = (localId: string) => {
    setDraft((prev) => ({ ...prev, items: prev.items.filter((item) => item.localId !== localId) }));
    setDirty(true);
  };

  const handleSave = async () => {
    const ok = await onSave(toPayload(draft));
    if (ok) setDirty(false);
  };

  const hasSavedChart = Boolean(chart?.updatedAt);
  const canPrint = hasSavedChart && !dirty;
  const controlsDisabled = isLoading || isSaving;

  return (
    <Surface as="section" className="gap-4">
      <PlanCardHeader
        title="Diet Chart"
        description="Take / Avoid / Occasional, printed in the patient's language"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Labels in</span>
          <PlanToggle
            ariaLabel="Show labels in"
            options={LANGUAGE_OPTIONS}
            value={displayLanguage}
            onChange={setDisplayLanguage}
          />
        </div>
        {canPrint ? (
          <Button asChild variant="outline" className={PLAN_HEAD_BUTTON}>
            <Link href={printHref} target="_blank" rel="noopener noreferrer">
              <Printer aria-hidden="true" />
              Print / share
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className={PLAN_HEAD_BUTTON}
            disabled
            title={hasSavedChart ? "Save the chart before printing" : "Save the chart first"}
          >
            <Printer aria-hidden="true" />
            Print / share
          </Button>
        )}
        <Button className={PLAN_HEAD_BUTTON} onClick={() => void handleSave()} disabled={controlsDisabled || !dirty}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </PlanCardHeader>

      {error ? <Note tone="rose">Could not load the diet chart: {error}</Note> : null}

      {isLoading ? (
        <div className="grid gap-3.5 md:grid-cols-3">
          {DIET_CATEGORIES.map((category) => (
            <Skeleton key={category} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid items-stretch gap-3.5 md:grid-cols-3">
          {DIET_CATEGORIES.map((category) => (
            <CategoryColumn
              key={category}
              clinicId={clinicId}
              category={category}
              language={displayLanguage}
              items={draft.items.filter((item) => item.category === category)}
              disabled={controlsDisabled}
              onAdd={addItem}
              onNoteChange={changeNote}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}

      <div className="grid items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <PlanField
          label="Print language"
          htmlFor={`diet-print-language-${visitId}`}
          hint="Default language of the printed sheet."
        >
          <Select
            value={draft.printLanguage}
            onValueChange={(value) => update({ printLanguage: value as DietChartLanguage })}
            disabled={controlsDisabled}
          >
            <SelectTrigger id={`diet-print-language-${visitId}`} className="w-full">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {DIET_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang} lang={lang}>
                  {DIET_LANGUAGE_NAMES[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PlanField>
        <PlanField label="Notes for the patient" htmlFor={`diet-notes-${visitId}`}>
          <Textarea
            id={`diet-notes-${visitId}`}
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
            placeholder="Meal timing, water intake, cooking method..."
            rows={3}
            maxLength={2000}
            disabled={controlsDisabled}
            className="min-h-[84px]"
          />
        </PlanField>
      </div>

      {isLoading ? null : (
        <p className="m-0 text-xs text-ink-muted">
          {chart?.updatedAt
            ? `Last saved ${formatDateInIST(chart.updatedAt, {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}${dirty ? " · unsaved changes" : ""}. `
            : dirty
              ? "Not saved yet. "
              : ""}
          Save turns on when you change something; print after saving.
        </p>
      )}
    </Surface>
  );
}

/**
 * Diet chart for this visit: Take / Avoid / Occasional with labels in
 * English, Gujarati, Hindi and Marathi, plus a printable view.
 */
export function DietChartPanel({ clinicId, patientId, visitId }: DietChartPanelProps) {
  const { data: chart, isPending, error } = useVisitDietChart(clinicId, visitId);
  const { mutateAsync: saveChart, isPending: isSaving } = useUpsertVisitDietChart();

  return (
    <DietChartView
      clinicId={clinicId}
      visitId={visitId}
      chart={chart}
      isLoading={isPending}
      error={error ? error.message : null}
      isSaving={isSaving}
      onSave={(input) => runSave(() => saveChart({ clinicId, visitId, input }))}
      printHref={`/doctor/patients/${patientId}/visits/${visitId}/diet-chart/print`}
    />
  );
}
