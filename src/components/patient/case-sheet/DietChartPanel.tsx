"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Printer, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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

const CATEGORY_STYLE: Record<DietAdviceCategory, { dot: string; badge: string; hint: string }> = {
  TAKE: {
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    hint: "Pathya — foods to include",
  },
  AVOID: {
    dot: "bg-rose-500",
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    hint: "Apathya — foods to stop",
  },
  OCCASIONAL: {
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    hint: "Small amounts, not daily",
  },
};

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

function LanguageToggle({
  value,
  onChange,
}: {
  value: DietChartLanguage;
  onChange: (next: DietChartLanguage) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Show labels in"
      className="inline-flex items-center rounded-md border border-border/70 bg-background p-0.5"
    >
      {DIET_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          role="radio"
          aria-checked={value === lang}
          title={DIET_LANGUAGE_NAMES[lang]}
          lang={lang}
          onClick={() => onChange(lang)}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
            value === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {DIET_LANGUAGE_SHORT[lang]}
        </button>
      ))}
    </div>
  );
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
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: foods = [], isFetching } = useDietChartFoods(clinicId, debouncedQuery);
  const { mutateAsync: createFood, isPending: isCreating } = useCreateDietChartFood();
  const trimmed = query.trim();
  const exactMatch = foods.some((food) => food.nameEn.toLowerCase() === trimmed.toLowerCase());

  const close = () => {
    setOpen(false);
    setQuery("");
  };

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
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="mr-1 size-4" />
          Add food
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search in English, ગુજરાતી, हिन्दी or मराठी"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? "Searching..." : "No matching foods"}</CommandEmpty>
            {trimmed && !exactMatch ? (
              <CommandGroup heading="Not in the list?">
                <CommandItem value={`free-text:${trimmed}`} onSelect={pickFreeText}>
                  <Plus className="size-4" />
                  <span>
                    Use &ldquo;{trimmed}&rdquo; as free text
                  </span>
                </CommandItem>
                <CommandItem
                  value={`clinic-food:${trimmed}`}
                  disabled={isCreating}
                  onSelect={() => void addToClinicList()}
                >
                  <Plus className="size-4" />
                  <span>{isCreating ? "Adding..." : `Add "${trimmed}" to the clinic food list`}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {foods.length > 0 ? (
              <CommandGroup heading="Foods">
                {foods.map((food) => {
                  const secondary = dietSecondaryLabels(food, language);
                  return (
                    <CommandItem key={food.id} value={food.id} onSelect={() => pickFood(food)}>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium" lang={language}>
                          {dietLabel(food, language)}
                        </span>
                        {secondary.length > 0 ? (
                          <span className="truncate text-xs text-muted-foreground">{secondary.join(" · ")}</span>
                        ) : null}
                      </div>
                      {food.clinicId ? (
                        <Badge variant="outline" className="ml-2 shrink-0 rounded-md text-[10px]">
                          clinic
                        </Badge>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
    <section className="flex min-h-[16rem] flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
            <h3 className="truncate text-sm font-semibold text-foreground" lang={language}>
              {title}
              {language !== "en" ? (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground" lang="en">
                  {englishTitle}
                </span>
              ) : null}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{style.hint}</p>
        </div>
        <Badge variant="outline" className={cn("shrink-0 rounded-md", style.badge)}>
          {items.length}
        </Badge>
      </header>

      <FoodPicker
        clinicId={clinicId}
        category={category}
        language={language}
        disabled={disabled}
        onPick={onAdd}
      />

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
          Nothing added yet
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const secondary = dietSecondaryLabels(item, language);
            return (
              <li key={item.localId} className="rounded-md border border-border/60 bg-background px-2.5 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground" lang={language}>
                      {dietLabel(item, language)}
                    </p>
                    {secondary.length > 0 ? (
                      <p className="truncate text-xs text-muted-foreground">{secondary.join(" · ")}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.nameEn}`}
                    onClick={() => onRemove(item.localId)}
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <Input
                  value={item.note}
                  onChange={(event) => onNoteChange(item.localId, event.target.value)}
                  placeholder="Note (e.g. only at lunch)"
                  maxLength={300}
                  aria-label={`Note for ${item.nameEn}`}
                  className="mt-1.5 h-7 text-xs"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Diet chart for this visit: Take / Avoid / Occasional with labels in
 * English, Gujarati, Hindi and Marathi, plus a printable view.
 */
export function DietChartPanel({ clinicId, patientId, visitId }: DietChartPanelProps) {
  const { data: chart, isPending, error } = useVisitDietChart(clinicId, visitId);
  const { mutateAsync: saveChart, isPending: isSaving } = useUpsertVisitDietChart();

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
    const ok = await runSave(() => saveChart({ clinicId, visitId, input: toPayload(draft) }));
    if (ok) setDirty(false);
  };

  const printHref = `/doctor/patients/${patientId}/visits/${visitId}/diet-chart/print`;
  const hasSavedChart = Boolean(chart?.updatedAt);
  const canPrint = hasSavedChart && !dirty;
  const controlsDisabled = isPending || isSaving;

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Diet Chart</CardTitle>
          <p className="text-sm text-muted-foreground">
            Take / Avoid / Occasional — printed in the patient&apos;s language
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Labels in</span>
            <LanguageToggle value={displayLanguage} onChange={setDisplayLanguage} />
          </div>
          {canPrint ? (
            <Button asChild variant="outline" size="sm">
              <Link href={printHref} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-1 size-4" />
                Print / share
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={hasSavedChart ? "Save the chart before printing" : "Save the chart first"}
            >
              <Printer className="mr-1 size-4" />
              Print / share
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={controlsDisabled || !dirty}>
            <Save className="mr-1 size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Could not load the diet chart: {error.message}
          </p>
        ) : null}

        {isPending ? (
          <div className="grid gap-4 md:grid-cols-3">
            {DIET_CATEGORIES.map((category) => (
              <Skeleton key={category} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
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

        <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`diet-print-language-${visitId}`}>Print language</Label>
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
            <p className="text-xs text-muted-foreground">Default language of the printed sheet.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`diet-notes-${visitId}`}>Notes for the patient</Label>
            <Textarea
              id={`diet-notes-${visitId}`}
              value={draft.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Meal timing, water intake, cooking method..."
              rows={3}
              maxLength={2000}
              disabled={controlsDisabled}
              className="text-sm"
            />
          </div>
        </div>

        {chart?.updatedAt ? (
          <p className="text-xs text-muted-foreground">
            Last saved{" "}
            {formatDateInIST(chart.updatedAt, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {dirty ? " · unsaved changes" : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
