"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { ArrowUp, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceChip, Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { useDoctorFavourites, useRemoveFavourite, useSaveFavourite } from "@/hooks/query/useDoctorFavourites";
import {
  addDiagnosis,
  diagnosisKey,
  formatDiagnoses,
  parseDiagnoses,
  searchDiagnoses,
  COMMON_DIAGNOSES,
  type DiagnosisEntry,
  type DiagnosisOption,
} from "./diagnosis.logic";
import { DictationButton } from "./VoiceInput";

/**
 * OPD diagnosis entry: search by name or ICD-10 code (or dictate), "Frequent for you" chips from
 * the doctor's own favourites, provisional / final per diagnosis, the first one is primary.
 * `value` / `onChange` carry the one-line text the prescription and the visit store.
 */
export function DiagnosisPicker({
  value,
  onChange,
  disabled = false,
  label = "Diagnosis",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const fieldId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => parseDiagnoses(value), [value]);

  const favouritesQuery = useDoctorFavourites("DIAGNOSIS");
  const saveFavourite = useSaveFavourite();
  const removeFavourite = useRemoveFavourite();
  const favourites = useMemo(() => favouritesQuery.data ?? [], [favouritesQuery.data]);
  const favouriteByKey = useMemo(() => new Map(favourites.map((favourite) => [favourite.itemKey, favourite])), [favourites]);
  const frequent: DiagnosisOption[] = useMemo(
    () => favourites.map((favourite) => ({ label: favourite.label, code: String(favourite.payload.code ?? "") })),
    [favourites],
  );

  const suggestions = useMemo(() => {
    const options = [...frequent, ...COMMON_DIAGNOSES.filter((option) => !favouriteByKey.has(diagnosisKey(option)))];
    return searchDiagnoses(query, options);
  }, [favouriteByKey, frequent, query]);

  const commit = (next: DiagnosisEntry[]) => onChange(formatDiagnoses(next));
  const add = (option: DiagnosisOption) => {
    commit(addDiagnosis(entries, option));
    setQuery("");
    setOpen(false);
  };
  const addTyped = () => {
    const best = suggestions[0];
    const typed = query.trim();
    if (!typed) return;
    add(best && (best.code.toLowerCase() === typed.toLowerCase() || best.label.toLowerCase() === typed.toLowerCase()) ? best : { label: typed, code: "" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const best = suggestions[0];
      if (best && open) add(best);
      else addTyped();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };
  const update = (index: number, patch: Partial<DiagnosisEntry>) =>
    commit(entries.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)));
  const remove = (index: number) => commit(entries.filter((_entry, at) => at !== index));
  const makePrimary = (index: number) => {
    const chosen = entries[index];
    if (!chosen) return;
    commit([chosen, ...entries.filter((_entry, at) => at !== index)]);
  };
  const toggleFavourite = (entry: DiagnosisEntry) => {
    const key = diagnosisKey(entry);
    const existing = favouriteByKey.get(key);
    if (existing) removeFavourite.mutate(existing.id);
    else saveFavourite.mutate({ kind: "DIAGNOSIS", itemKey: key, label: entry.label, payload: { code: entry.code } });
  };

  const listId = `${fieldId}-suggestions`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${fieldId}-search`} className="text-xs font-bold text-ink-soft">
          {label}
        </label>
        {entries.length > 0 ? <span className="text-[11px] font-bold text-ink-muted">{entries.length} added · first is primary</span> : null}
      </div>

      {entries.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {entries.map((entry, index) => {
            const favourite = favouriteByKey.has(diagnosisKey(entry));
            return (
              <li
                key={`${entry.code}-${entry.label}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-[12px] border border-line bg-card px-3 py-2"
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-ink">
                  {entry.label}
                  {entry.code ? <span className="ml-1.5 rounded-md bg-well px-1.5 py-0.5 text-[11px] font-extrabold text-ink-soft">{entry.code}</span> : null}
                </span>
                {index === 0 ? <Pill tone="teal">Primary</Pill> : (
                  <button
                    type="button"
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark disabled:opacity-50"
                    onClick={() => makePrimary(index)}
                  >
                    <ArrowUp className="size-3" aria-hidden="true" />
                    Make primary
                  </button>
                )}
                <span className="inline-flex gap-1" role="group" aria-label={`${entry.label}: provisional or final`}>
                  <ChoiceChip size="sm" shape="box" check={false} disabled={disabled} active={entry.certainty === "PROVISIONAL"} onClick={() => update(index, { certainty: "PROVISIONAL" })}>
                    Provisional
                  </ChoiceChip>
                  <ChoiceChip size="sm" shape="box" check={false} disabled={disabled} active={entry.certainty === "FINAL"} onClick={() => update(index, { certainty: "FINAL" })}>
                    Final
                  </ChoiceChip>
                </span>
                <button
                  type="button"
                  aria-pressed={favourite}
                  aria-label={favourite ? `Remove ${entry.label} from frequent diagnoses` : `Keep ${entry.label} in frequent diagnoses`}
                  className="inline-flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink"
                  onClick={() => toggleFavourite(entry)}
                >
                  <Star className={cn("size-4", favourite && "fill-amber-400 text-amber-500")} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${entry.label}`}
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-well disabled:opacity-50"
                  onClick={() => remove(index)}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="relative flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={`${fieldId}-search`}
            value={query}
            disabled={disabled}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Name or ICD code, e.g. viral fever or B34.9"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Typed text left in the box (not yet added) would otherwise be dropped on save:
              // leaving the field (e.g. clicking Save) adds it as a diagnosis.
              addTyped();
              window.setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
          />
          {open && suggestions.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 m-0 flex max-h-64 list-none flex-col overflow-y-auto rounded-[12px] border border-line bg-card p-1 shadow-lg"
            >
              {suggestions.map((option) => (
                <li key={diagnosisKey(option)} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-sm hover:bg-mint-soft"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add(option)}
                  >
                    {option.code ? <span className="w-16 shrink-0 text-xs font-extrabold text-brand">{option.code}</span> : null}
                    <span className="min-w-0 flex-1 font-semibold text-ink">{option.label}</span>
                    {favouriteByKey.has(diagnosisKey(option)) ? <Star className="size-3.5 fill-amber-400 text-amber-500" aria-label="Frequent" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || !query.trim()} onClick={addTyped} className="h-9 rounded-xl">
          <Plus aria-hidden="true" />
          Add
        </Button>
        <DictationButton
          label="Dictate"
          onText={(text) => {
            setQuery(text);
            setOpen(true);
          }}
        />
      </div>

      {frequent.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-ink-muted">Frequent for you</span>
          {frequent.slice(0, 10).map((option) => (
            <ChoiceChip
              key={diagnosisKey(option)}
              size="sm"
              disabled={disabled}
              active={entries.some((entry) => diagnosisKey(entry) === diagnosisKey(option))}
              onClick={() => add(option)}
            >
              {option.label}
              {option.code ? <span className="ml-1 text-[10px] font-extrabold opacity-70">{option.code}</span> : null}
            </ChoiceChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
