"use client";

import { runSave } from "./run-save";
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PAST_HISTORY_CONDITIONS } from "@/lib/constants/case-sheet-fixed-lists";
import {
  useCreateMedicalHistory,
  useDeleteMedicalHistory,
  useMedicalHistory,
} from "@/hooks/query/useMedicalRecords";

type HistoryRow = { id?: string; condition?: string };

function toRows(value: unknown): HistoryRow[] {
  if (Array.isArray(value)) return value as HistoryRow[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "history"]) {
      if (Array.isArray(record[key])) return record[key] as HistoryRow[];
    }
  }
  return [];
}

interface PastHistoryChecklistProps {
  userId: string;
  notes: string | null;
  onSaveNotes: (notes: string) => Promise<unknown>;
  isSavingNotes?: boolean;
}

/**
 * Each checked condition is a real MedicalHistory row for the patient, so it
 * accumulates across visits and shows up everywhere else the EHR is read.
 */
export function PastHistoryChecklist({
  userId,
  notes,
  onSaveNotes,
  isSavingNotes = false,
}: PastHistoryChecklistProps) {
  const historyQuery = useMedicalHistory(userId);
  const createHistory = useCreateMedicalHistory();
  const deleteHistory = useDeleteMedicalHistory();
  const [pending, setPending] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    setNotesValue(notes ?? "");
    setNotesDirty(false);
  }, [notes]);

  const rowByCondition = useMemo(() => {
    const map = new Map<string, HistoryRow>();
    for (const row of toRows(historyQuery.data)) {
      if (row.condition) map.set(row.condition.trim().toLowerCase(), row);
    }
    return map;
  }, [historyQuery.data]);

  const toggle = async (condition: string) => {
    const existing = rowByCondition.get(condition.toLowerCase());
    setPending(condition);
    try {
      if (existing?.id) {
        await deleteHistory.mutateAsync(existing.id);
      } else {
        await createHistory.mutateAsync({
          userId,
          condition,
          startDate: new Date().toISOString(),
          status: "active",
        });
      }
    } catch {
      // Error toast is shown by the mutation hook.
    } finally {
      setPending(null);
    }
  };

  const selectedCount = PAST_HISTORY_CONDITIONS.filter((c) => rowByCondition.has(c.toLowerCase())).length;

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Past History</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} condition${selectedCount === 1 ? "" : "s"} recorded` : "Tap a condition to record it"}
          </p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            if (await runSave(() => onSaveNotes(notesValue))) setNotesDirty(false);
          }}
          disabled={isSavingNotes || !notesDirty}
        >
          <Save className="mr-1 size-4" />
          {isSavingNotes ? "Saving..." : "Save notes"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <div className="flex flex-wrap gap-2">
          {PAST_HISTORY_CONDITIONS.map((condition) => {
            const active = rowByCondition.has(condition.toLowerCase());
            const busy = pending === condition;
            return (
              <button
                key={condition}
                type="button"
                aria-pressed={active}
                disabled={busy || historyQuery.isPending}
                onClick={() => void toggle(condition)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background text-foreground hover:bg-muted",
                )}
              >
                {busy ? "…" : condition}
              </button>
            );
          })}
        </div>
        <Textarea
          value={notesValue}
          onChange={(event) => {
            setNotesValue(event.target.value);
            setNotesDirty(true);
          }}
          placeholder="Other past history"
          rows={3}
        />
      </CardContent>
    </Card>
  );
}
