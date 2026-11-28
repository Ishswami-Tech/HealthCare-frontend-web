"use client";

import { useMemo, useState } from "react";
import { useUpdateRxDraft } from "@/hooks/query/useRxDrafts";
import type { RxDraft, RxDraftItem, RxDraftLine } from "@/types/rx-drafts.types";
import { diffDraftLines, toDraftLines, toUpdateDraftInput, validateDraftLines } from "./rx-drafts.logic";

/**
 * Edit state of one draft (lines, diagnosis, advice) and its save. Shared by the assistant
 * (edit / revise a returned draft) and the doctor ("approve with my changes").
 * `baseline` is what the changes are counted against (default: the draft as loaded).
 * Mount it with `key={draft.id}` so a new draft starts from its own lines.
 */
export function useDraftEditor(clinicId: string, draft: RxDraft, baseline: readonly RxDraftItem[] = draft.items) {
  const [lines, setLines] = useState<RxDraftLine[]>(() => toDraftLines(draft.items));
  const [diagnosis, setDiagnosis] = useState(draft.diagnosis ?? "");
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateRxDraft();

  const diff = useMemo(() => diffDraftLines(baseline, lines), [baseline, lines]);
  const changes = useMemo(() => new Map(diff.lines.map((line) => [line.key, line])), [diff]);
  const textChanged = diagnosis.trim() !== (draft.diagnosis ?? "").trim() || notes.trim() !== (draft.notes ?? "").trim();
  const dirty = diffDraftLines(draft.items, lines).changeCount > 0 || textChanged;

  /** Saves the edits (only when something changed). Resolves false when nothing could be saved. */
  const save = async (): Promise<boolean> => {
    const problem = validateDraftLines(lines);
    if (problem) {
      setError(problem);
      return false;
    }
    setError(null);
    if (!dirty) return true;
    try {
      await update.mutateAsync({ clinicId, draftId: draft.id, input: toUpdateDraftInput(lines, { diagnosis, notes }) });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The draft could not be saved.");
      return false;
    }
  };

  return {
    lines,
    setLines,
    diagnosis,
    setDiagnosis,
    notes,
    setNotes,
    error,
    diff,
    changes,
    dirty,
    saving: update.isPending,
    save,
  };
}

export type DraftEditor = ReturnType<typeof useDraftEditor>;
