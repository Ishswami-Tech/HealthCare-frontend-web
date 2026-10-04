"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { HABIT_DEFINITIONS, NIDRA_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { CaseSheetCard, ChoiceChip, SaveButton } from "./case-sheet-parts";

const HABIT_NOTES_KEY = "notes";

interface HabitGridProps {
  habits: Record<string, string> | null;
  onSave: (habits: Record<string, string>) => Promise<unknown>;
  isSaving?: boolean;
}

export function HabitGrid({ habits, onSave, isSaving = false }: HabitGridProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const savedHabits = useStableSnapshot(habits ?? {});
  const [values, setValues] = useState<Record<string, string>>(savedHabits);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValues(savedHabits);
    setDirty(false);
  }, [savedHabits]);

  const setHabit = (key: string, option: string) => {
    setValues((prev) => {
      const next = { ...prev };
      if (next[key] === option) {
        delete next[key];
      } else {
        next[key] = option;
      }
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (await runSave(() => onSave(values))) setDirty(false);
  };

  return (
    <CaseSheetCard
      title="Habits"
      description="Tap one level per habit; tap again to clear."
      action={<SaveButton saving={isSaving} disabled={isSaving || !dirty} onClick={() => void handleSave()} />}
    >
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HABIT_DEFINITIONS.map((habit) => (
          <div
            key={habit.key}
            role="group"
            aria-labelledby={`habit-${habit.key}`}
            className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-[#fbfdfc] px-3.5 py-3 dark:bg-white/[0.03]"
          >
            <span id={`habit-${habit.key}`} className="text-sm font-bold text-ink">
              {habit.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {habit.options.map((option) => (
                <ChoiceChip
                  key={option}
                  size="sm"
                  active={values[habit.key] === option}
                  onClick={() => setHabit(habit.key, option)}
                >
                  {option}
                </ChoiceChip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Textarea
        aria-label="Notes about habits"
        className="min-h-16"
        value={values[HABIT_NOTES_KEY] ?? ""}
        onChange={(event) => {
          setValues((prev) => ({ ...prev, [HABIT_NOTES_KEY]: event.target.value }));
          setDirty(true);
        }}
        placeholder="Notes about habits"
        rows={2}
      />
    </CaseSheetCard>
  );
}

interface NidraPanelProps {
  nidra: string | null;
  nidraNotes: string | null;
  onSave: (value: { nidra: string | null; nidraNotes: string }) => Promise<unknown>;
  isSaving?: boolean;
}

export function NidraPanel({ nidra, nidraNotes, onSave, isSaving = false }: NidraPanelProps) {
  const [selected, setSelected] = useState<string | null>(nidra);
  const [notes, setNotes] = useState(nidraNotes ?? "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSelected(nidra);
    setNotes(nidraNotes ?? "");
    setDirty(false);
  }, [nidra, nidraNotes]);

  const handleSave = async () => {
    if (await runSave(() => onSave({ nidra: selected, nidraNotes: notes }))) setDirty(false);
  };

  return (
    <CaseSheetCard
      title="निद्रा (Nidra)"
      description="Sleep pattern"
      action={<SaveButton saving={isSaving} disabled={isSaving || !dirty} onClick={() => void handleSave()} />}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sleep pattern">
        {NIDRA_OPTIONS.map((option) => (
          <ChoiceChip
            key={option}
            size="lg"
            active={selected === option}
            onClick={() => {
              setSelected((prev) => (prev === option ? null : option));
              setDirty(true);
            }}
          >
            {option}
          </ChoiceChip>
        ))}
      </div>
      <Textarea
        aria-label="Notes about sleep"
        className="min-h-16"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setDirty(true);
        }}
        placeholder="Notes about sleep"
        rows={2}
      />
    </CaseSheetCard>
  );
}
