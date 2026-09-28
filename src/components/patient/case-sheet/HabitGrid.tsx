"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { HABIT_DEFINITIONS, NIDRA_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";

const HABIT_NOTES_KEY = "notes";

interface HabitGridProps {
  habits: Record<string, string> | null;
  onSave: (habits: Record<string, string>) => Promise<unknown>;
  isSaving?: boolean;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Habits</CardTitle>
          <p className="text-sm text-muted-foreground">Tap one level per habit; tap again to clear.</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
          <Save className="mr-1 size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {HABIT_DEFINITIONS.map((habit) => (
            <div key={habit.key} className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">{habit.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {habit.options.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    active={values[habit.key] === option}
                    onClick={() => setHabit(habit.key, option)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Textarea
          value={values[HABIT_NOTES_KEY] ?? ""}
          onChange={(event) => {
            setValues((prev) => ({ ...prev, [HABIT_NOTES_KEY]: event.target.value }));
            setDirty(true);
          }}
          placeholder="Notes about habits"
          rows={2}
        />
      </CardContent>
    </Card>
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">निद्रा (Nidra)</CardTitle>
          <p className="text-sm text-muted-foreground">Sleep pattern</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
          <Save className="mr-1 size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3">
        <div className="flex flex-wrap gap-2">
          {NIDRA_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              active={selected === option}
              onClick={() => {
                setSelected((prev) => (prev === option ? null : option));
                setDirty(true);
              }}
            />
          ))}
        </div>
        <Textarea
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setDirty(true);
          }}
          placeholder="Notes about sleep"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
