"use client";

import { useDeferredValue, useId, useMemo, useState, type KeyboardEvent, type ReactNode, type UIEvent } from "react";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, CircleAlert, Clock, Layers, Leaf, Loader2, Plus, Settings2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note, SearchBox } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { dosageFormLabel } from "@/lib/constants/medicine-types";
import type { Medicine } from "@/types/pharmacy.types";
import { matchScore, medicineTitle, searchTerms, stockLine, stockOf, type StockTone } from "./rx-form.logic";
import type { RxKit } from "./rx-shortcuts.logic";

/** The pharmacy list can hold thousands of medicines: render this many at a time and load more on scroll. */
const MEDICINE_PAGE_SIZE = 40;
const ALL_OPTION = "__all";
const SMALL_FIELD = "h-[38px] rounded-[10px] px-2.5 text-[13px] font-semibold md:text-[13px]";

type CatalogueTab = "all" | "favourites" | "recent" | "kits";

export const STOCK_TONE_CLASS: Record<StockTone, string> = {
  ok: "text-brand",
  low: "text-[#b45309] dark:text-amber-300",
  out: "text-[#e11d48] dark:text-rose-300",
  none: "text-ink-muted",
};

/** The medicine name with the typed words highlighted. */
function HighlightedName({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const lower = text.toLowerCase();
  const marked: boolean[] = Array.from({ length: text.length }, () => false);
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0) for (let index = at; index < at + term.length; index += 1) marked[index] = true;
  }
  const parts: { text: string; on: boolean }[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    const on = marked[index] === true;
    const last = parts[parts.length - 1];
    if (last && last.on === on) last.text += char;
    else parts.push({ text: char, on });
  }
  return (
    <>
      {parts.map((part, index) =>
        part.on ? (
          <mark key={index} className="rounded-[3px] bg-[#fff0a8] px-px text-inherit dark:bg-yellow-700/50">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export interface MedicineCatalogueProps {
  medicines: Medicine[];
  isLoading: boolean;
  /** Why the stock list cannot be shown (no clinic, or the request failed). */
  stockMessage?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  /** The server is being asked for matches to the typed text. */
  isSearching?: boolean;
  inStockOnly: boolean;
  onInStockOnlyChange: (value: boolean) => void;
  addedIds: ReadonlySet<string>;
  /** The medicines reached the pharmacy: nothing more can be added here. */
  locked?: boolean;
  onAdd: (medicine: Medicine) => void;
  favouriteIds: ReadonlySet<string>;
  onToggleFavourite: (medicine: Medicine) => void;
  /** Medicine ids prescribed most recently, newest first. */
  recentIds: readonly string[];
  kits: readonly RxKit[];
  onAddKit: (kit: RxKit) => void;
  /** Opens the favourites & kits manager. */
  onManageShortcuts?: () => void;
  /** Adds a free-text medicine that is not in stock (only where outside medicines are allowed). */
  onAddOutside?: () => void;
  /** Voice controls, shown under the search box. */
  voice?: ReactNode;
  /** Mic + language toggle drawn inside the search box (see useVoiceMedicineInput). */
  voiceControls?: ReactNode;
}

/**
 * Pharmacy stock list to pick medicines from: search by medicine NAME only, stock on the same line
 * as the name (never a price), tabs for All / Favourites / Recent / Kits, keyboard ↑ ↓ Enter.
 */
export function MedicineCatalogue({
  medicines,
  isLoading,
  stockMessage,
  search,
  onSearchChange,
  isSearching = false,
  inStockOnly,
  onInStockOnlyChange,
  addedIds,
  locked = false,
  onAdd,
  favouriteIds,
  onToggleFavourite,
  recentIds,
  kits,
  onAddKit,
  onManageShortcuts,
  onAddOutside,
  voice,
  voiceControls,
}: MedicineCatalogueProps) {
  const fieldId = useId();
  const [tab, setTab] = useState<CatalogueTab>("all");
  const [formFilter, setFormFilter] = useState(ALL_OPTION);
  const [brandFilter, setBrandFilter] = useState(ALL_OPTION);
  const [shown, setShown] = useState(MEDICINE_PAGE_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const terms = useMemo(() => searchTerms(deferredSearch), [deferredSearch]);

  const inStockCount = useMemo(() => medicines.filter((medicine) => stockOf(medicine) > 0).length, [medicines]);
  // With no stock recorded at all, "in stock only" would hide the whole catalogue, so it does not apply.
  const stockTracked = inStockCount > 0;
  const stockOnly = inStockOnly && stockTracked;

  const formOptions = useMemo(
    () => [...new Set(medicines.map((medicine) => String(medicine.dosageForm || "").trim()).filter(Boolean))].sort(),
    [medicines],
  );
  const brandOptions = useMemo(
    () => [...new Set(medicines.map((medicine) => String(medicine.manufacturer || "").trim()).filter(Boolean))].sort(),
    [medicines],
  );
  const recentRank = useMemo(() => new Map(recentIds.map((id, index) => [id, index])), [recentIds]);

  const matchingMedicines = useMemo(() => {
    if (tab === "kits") return [];
    const ranked: { medicine: Medicine; score: number }[] = [];
    for (const medicine of medicines) {
      // A medicine that was already added stays in the list so it can be seen as "Added".
      if (stockOnly && stockOf(medicine) <= 0 && !addedIds.has(medicine.id)) continue;
      if (tab === "favourites" && !favouriteIds.has(medicine.id)) continue;
      if (tab === "recent" && !recentRank.has(medicine.id)) continue;
      if (formFilter !== ALL_OPTION && String(medicine.dosageForm || "").trim() !== formFilter) continue;
      if (brandFilter !== ALL_OPTION && String(medicine.manufacturer || "").trim() !== brandFilter) continue;
      const score = terms.length > 0 ? matchScore(medicine, terms) : 0;
      if (score < 0) continue;
      ranked.push({ medicine, score });
    }
    ranked.sort((a, b) => {
      if (tab === "recent" && terms.length === 0) return (recentRank.get(a.medicine.id) ?? 0) - (recentRank.get(b.medicine.id) ?? 0);
      if (b.score !== a.score) return b.score - a.score;
      if (stockTracked) {
        const byStock = Number(stockOf(b.medicine) > 0) - Number(stockOf(a.medicine) > 0);
        if (byStock !== 0) return byStock;
      }
      return a.medicine.name.localeCompare(b.medicine.name);
    });
    return ranked.map((entry) => entry.medicine);
  }, [addedIds, brandFilter, favouriteIds, formFilter, medicines, recentRank, stockOnly, stockTracked, tab, terms]);

  const visibleKits = useMemo(() => {
    if (tab !== "kits") return [];
    const query = deferredSearch.trim().toLowerCase();
    return query ? kits.filter((kit) => kit.name.toLowerCase().includes(query)) : [...kits];
  }, [deferredSearch, kits, tab]);

  const visibleMedicines = useMemo(() => matchingMedicines.slice(0, shown), [matchingMedicines, shown]);
  const activeMedicine = visibleMedicines[Math.min(activeIndex, Math.max(0, visibleMedicines.length - 1))];

  /** Back to the top of the list whenever the search or a filter changes. */
  const resetList = () => {
    setShown(MEDICINE_PAGE_SIZE);
    setActiveIndex(0);
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const count = visibleMedicines.length;
      if (count === 0) return;
      const next = (activeIndex + step + count) % count;
      setActiveIndex(next);
      const nextMedicine = visibleMedicines[next];
      if (nextMedicine) document.getElementById(`${fieldId}-med-${nextMedicine.id}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      // Enter adds the highlighted medicine instead of submitting the form.
      event.preventDefault();
      if (activeMedicine && !locked && !addedIds.has(activeMedicine.id)) onAdd(activeMedicine);
    }
  };
  const onListScroll = (event: UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight > list.scrollHeight - 80 && shown < matchingMedicines.length) {
      setShown((count) => count + MEDICINE_PAGE_SIZE);
    }
  };

  const tabs = [
    { value: "all", label: "All", icon: Leaf, count: null },
    { value: "favourites", label: "Favourites", icon: Star, count: favouriteIds.size || null },
    { value: "recent", label: "Recent", icon: Clock, count: null },
    { value: "kits", label: "Kits", icon: Layers, count: kits.length || null },
  ] as const;

  const emptyText =
    medicines.length === 0
      ? "The pharmacy has no medicines in its stock list yet."
      : tab === "favourites"
        ? "No favourites yet. Press the star next to a medicine to keep it here."
        : tab === "recent"
          ? "Medicines you prescribe will show up here."
          : "No medicine has that name. Check the spelling, clear a filter, or turn off In stock only.";

  return (
    <section aria-label="Medicine catalogue" className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-lg font-extrabold text-ink">Pharmacy stock</h3>
        <span className="rounded-full bg-well px-2.5 py-0.5 text-xs font-bold text-ink-soft">
          {medicines.length.toLocaleString("en-IN")} medicines
        </span>
        {onManageShortcuts ? (
          <Button type="button" variant="ghost" size="sm" className="ml-auto text-brand" onClick={onManageShortcuts}>
            <Settings2 aria-hidden="true" />
            Favourites & kits
          </Button>
        ) : null}
      </div>
      <div onKeyDown={onSearchKeyDown} className="flex flex-col gap-1">
        <SearchBox
          value={search}
          onChange={(value) => {
            onSearchChange(value);
            resetList();
          }}
          placeholder={tab === "kits" ? "Search kits by name" : "Search medicine by name"}
          endAdornment={voiceControls}
        />
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted" role="status">
          {isSearching ? (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              Searching the pharmacy list…
            </>
          ) : (
            voiceControls
              ? "Type or tap the mic to speak, then ↑ ↓ and Enter to add · Dictation uses your browser's speech service"
              : "Type the medicine name, then ↑ ↓ and Enter to add"
          )}
        </span>
      </div>
      {voice}

      <div className="grid grid-cols-2 gap-1 rounded-[12px] bg-well p-1 sm:grid-cols-4" role="tablist" aria-label="Medicine list">
        {tabs.map(({ value, label, icon: Icon, count }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-sm font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
              tab === value ? "bg-card text-ink shadow-sm ring-1 ring-brand/40" : "text-ink-soft hover:text-ink",
            )}
            onClick={() => {
              setTab(value);
              resetList();
            }}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {count ? <span className="text-xs font-extrabold text-ink-muted">{count}</span> : null}
          </button>
        ))}
      </div>

      {tab !== "kits" ? (
        <div className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
          <Select
            value={formFilter}
            onValueChange={(value) => {
              setFormFilter(value);
              resetList();
            }}
          >
            <SelectTrigger aria-label="Filter by form" className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_OPTION}>All forms</SelectItem>
              {formOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {dosageFormLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={brandFilter}
            onValueChange={(value) => {
              setBrandFilter(value);
              resetList();
            }}
          >
            <SelectTrigger aria-label="Filter by brand" className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_OPTION}>All brands</SelectItem>
              {brandOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label
            htmlFor={`${fieldId}-in-stock`}
            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-semibold text-ink-soft"
          >
            <Switch id={`${fieldId}-in-stock`} checked={stockOnly} disabled={!stockTracked} onCheckedChange={onInStockOnlyChange} />
            In stock only
          </label>
        </div>
      ) : null}

      {isLoading ? (
        <span className="inline-flex items-center gap-2 py-3 text-xs text-ink-muted" role="status">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Loading the pharmacy stock
        </span>
      ) : stockMessage ? (
        <Note tone="amber" icon={CircleAlert} className="px-3 py-2.5 text-xs">
          {stockMessage}
        </Note>
      ) : tab === "kits" ? (
        visibleKits.length === 0 ? (
          <span className="rounded-[14px] border border-dashed border-line bg-card px-3 py-4 text-center text-xs text-ink-muted">
            {kits.length === 0
              ? "No kits yet. A kit adds several medicines with their doses in one tap. Create one under Favourites & kits."
              : "No kit has that name."}
          </span>
        ) : (
          <ul className="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0">
            {visibleKits.map((kit) => (
              <li key={kit.id || kit.itemKey} className="flex min-w-0 items-start gap-3 rounded-[12px] border border-hair bg-card px-3 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-extrabold text-ink">
                    {kit.name} <span className="text-xs font-bold uppercase text-ink-muted">· {kit.items.length} medicines</span>
                  </span>
                  <span className="text-xs text-ink-muted">{kit.items.map((item) => item.name).join(", ")}</span>
                </span>
                <Button type="button" variant="outline" size="sm" disabled={locked || kit.items.length === 0} onClick={() => onAddKit(kit)}>
                  <Plus aria-hidden="true" />
                  Add all
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="m-0 text-base font-extrabold text-ink">
              {terms.length > 0
                ? `Matches for “${deferredSearch.trim()}”`
                : tab === "all"
                  ? "All medicines"
                  : tab === "favourites"
                    ? "Favourites"
                    : "Recently prescribed"}
            </h4>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              {terms.length > 0 ? "Best match first" : tab === "recent" ? "Newest first" : "A to Z"}
              <ChevronsUpDown className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          {matchingMedicines.length === 0 ? (
            <span className="rounded-[14px] border border-dashed border-line bg-card px-3 py-4 text-center text-xs text-ink-muted">{emptyText}</span>
          ) : (
            <ul
              className="m-0 grid max-h-[420px] list-none grid-cols-1 content-start gap-2 overflow-y-auto overscroll-contain p-0 sm:grid-cols-2"
              onScroll={onListScroll}
            >
              {visibleMedicines.map((medicine, index) => {
                const added = addedIds.has(medicine.id);
                const title = medicineTitle(medicine);
                const favourite = favouriteIds.has(medicine.id);
                const stock = stockLine(medicine, stockTracked);
                return (
                  <li
                    key={medicine.id}
                    id={`${fieldId}-med-${medicine.id}`}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-[12px] border px-3 py-2",
                      added ? "border-[#a7f3d0] bg-[#ecfdf5] dark:border-emerald-800 dark:bg-emerald-950/30" : "border-hair bg-card",
                      index === activeIndex && !added && "ring-2 ring-brand/60",
                      stock.tone === "out" && !added && "opacity-60",
                    )}
                  >
                    <span className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-ink">
                      <HighlightedName text={title} terms={terms} />
                      {stock.label ? (
                        <span className={cn("ml-1.5 whitespace-nowrap text-xs font-bold", STOCK_TONE_CLASS[stock.tone])}>· {stock.label}</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      aria-pressed={favourite}
                      aria-label={favourite ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                      onClick={() => onToggleFavourite(medicine)}
                    >
                      <Star className={cn("size-[18px]", favourite && "fill-amber-400 text-amber-500")} aria-hidden="true" />
                    </button>
                    {added ? (
                      <span className="inline-flex min-h-8 shrink-0 items-center gap-[5px] rounded-[10px] bg-[#d1fae5] px-2.5 text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Check className="size-[13px]" strokeWidth={2.8} aria-hidden="true" />
                        Added
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-xl px-3 text-sm"
                        disabled={locked}
                        aria-label={`Add ${title}`}
                        onClick={() => onAdd(medicine)}
                      >
                        <Plus aria-hidden="true" />
                        Add
                      </Button>
                    )}
                  </li>
                );
              })}
              {matchingMedicines.length > visibleMedicines.length ? (
                <li className="py-2 text-center text-xs text-ink-muted sm:col-span-2">
                  Scroll for more · {matchingMedicines.length - visibleMedicines.length} left
                </li>
              ) : null}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
            {!stockTracked ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#b45309] dark:text-amber-300">
                <CircleAlert className="size-3.5" aria-hidden="true" />
                Stock levels have not been recorded
              </span>
            ) : (
              <span>
                {inStockCount.toLocaleString("en-IN")} of {medicines.length.toLocaleString("en-IN")} in stock now
                {terms.length > 0 || tab !== "all" ? ` · ${matchingMedicines.length.toLocaleString("en-IN")} match` : ""}
              </span>
            )}
            <span className="hidden items-center gap-1.5 sm:inline-flex" aria-hidden="true">
              <ArrowUp className="size-3.5 rounded border border-line p-px" />
              <ArrowDown className="size-3.5 rounded border border-line p-px" />
              Navigate
              <kbd className="rounded border border-line bg-well px-1.5 py-0.5 font-sans text-[11px]">Enter</kbd>
              Add
            </span>
          </div>
        </>
      )}

      {onAddOutside ? (
        <button
          type="button"
          disabled={locked}
          className="self-start rounded-md px-1 py-0.5 text-left text-xs font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
          onClick={onAddOutside}
        >
          Not in stock? Add an outside medicine
        </button>
      ) : null}
    </section>
  );
}
