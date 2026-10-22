"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogError, Field, Pill } from "@/components/tbd";
import { DraftLinesEditor } from "./DraftLinesEditor";
import type { DraftEditor } from "./useDraftEditor";

/** Diagnosis, medicine lines and advice of a draft being edited (state from `useDraftEditor`). */
export function DraftEditForm({ clinicId, editor, showChanges = false }: { clinicId: string; editor: DraftEditor; showChanges?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <Field label="Diagnosis" htmlFor={`${id}-diagnosis`}>
        <Input id={`${id}-diagnosis`} value={editor.diagnosis} onChange={(event) => editor.setDiagnosis(event.target.value)} maxLength={500} />
      </Field>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-ink">Medicines</span>
          {showChanges && editor.diff.changeCount > 0 ? (
            <Pill tone="amber">
              {editor.diff.changeCount} {editor.diff.changeCount === 1 ? "change" : "changes"} made
            </Pill>
          ) : null}
        </div>
        <DraftLinesEditor clinicId={clinicId} lines={editor.lines} onChange={editor.setLines} {...(showChanges ? { changes: editor.changes } : {})} />
        {showChanges && editor.diff.removed.length > 0 ? (
          <p className="m-0 text-xs text-ink-muted">Removed: {editor.diff.removed.join(", ")}</p>
        ) : null}
      </div>
      <Field label="Advice for the patient" htmlFor={`${id}-notes`}>
        <Textarea id={`${id}-notes`} rows={3} value={editor.notes} onChange={(event) => editor.setNotes(event.target.value)} maxLength={2000} />
      </Field>
      {editor.error ? <DialogError message={editor.error} /> : null}
    </div>
  );
}
