"use client";

import { runSave } from "./run-save";
import { useState } from "react";
import { AlertTriangle, ChevronDown, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyBlock } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import {
  useCreateFamilyHistory,
  useDeleteFamilyHistory,
  useFamilyHistory,
} from "@/hooks/query/usePatientVisits";
import type { FamilyHistoryEntry } from "@/types/patient-visit.types";
import {
  CaseSheetCard,
  RemoveRowButton,
  RowTable,
  RowTableRow,
  RowTableSkeleton,
} from "./case-sheet-parts";

interface FamilyHistoryTableProps {
  clinicId: string;
  userId: string;
}

const EMPTY = { relation: "", condition: "", duration: "" };

export type FamilyHistoryDraft = typeof EMPTY;

export interface FamilyHistoryTableViewProps {
  rows: Pick<FamilyHistoryEntry, "id" | "relation" | "condition" | "duration">[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  /** Adds one row. Resolves true when saved, so the add row can be cleared. */
  onAdd: (draft: FamilyHistoryDraft) => Promise<boolean>;
  isAdding: boolean;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const COLUMNS = "1fr 1.4fr 1fr 36px";

/** Layout of Family History: an add row, relation shortcuts and the table. */
export function FamilyHistoryTableView({
  rows,
  isLoading,
  hasError,
  onRetry,
  onAdd,
  isAdding,
  onRemove,
  isRemoving,
}: FamilyHistoryTableViewProps) {
  const [draft, setDraft] = useState(EMPTY);
  const canAdd = draft.relation.trim().length > 0 && draft.condition.trim().length > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    if (await onAdd(draft)) setDraft(EMPTY);
  };

  return (
    <CaseSheetCard title="Family History" description="Conditions in blood relatives">
      <div className="grid grid-cols-1 items-center gap-2.5 md:grid-cols-[1fr_1.4fr_1fr_auto]">
        <div className="relative min-w-0">
          <Input
            list="family-relation-suggestions"
            aria-label="Relation"
            placeholder="Relation"
            className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
            value={draft.relation}
            onChange={(event) => setDraft((prev) => ({ ...prev, relation: event.target.value }))}
          />
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <datalist id="family-relation-suggestions">
            {FAMILY_RELATION_SUGGESTIONS.map((relation) => (
              <option key={relation} value={relation} />
            ))}
          </datalist>
        </div>
        <Input
          aria-label="Disease"
          placeholder="Disease"
          value={draft.condition}
          onChange={(event) => setDraft((prev) => ({ ...prev, condition: event.target.value }))}
        />
        <Input
          aria-label="Duration"
          placeholder="Duration (e.g. 10 years)"
          value={draft.duration}
          onChange={(event) => setDraft((prev) => ({ ...prev, duration: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleAdd();
          }}
        />
        <Button size="md" onClick={() => void handleAdd()} disabled={!canAdd || isAdding}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="family-relation-shortcuts">
        <span id="family-relation-shortcuts" className="text-xs text-ink-muted">
          Relation suggestions:
        </span>
        {FAMILY_RELATION_SUGGESTIONS.map((relation) => {
          const chosen = draft.relation.trim().toLowerCase() === relation.toLowerCase();
          return (
            <button
              key={relation}
              type="button"
              aria-pressed={chosen}
              onClick={() => setDraft((prev) => ({ ...prev, relation }))}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-[10px] px-2.5 py-[7px] text-xs font-semibold transition-colors",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                chosen ? "bg-mint text-brand-dark" : "bg-well text-ink hover:bg-mint-soft",
              )}
            >
              {relation}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <RowTableSkeleton />
      ) : hasError ? (
        <div className="rounded-[14px] border border-line">
          <EmptyBlock
            icon={AlertTriangle}
            tone="rose"
            title="Could not load family history"
            description="Check the connection and try again."
            action={
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line">
          <EmptyBlock
            icon={Users}
            title="No family history recorded"
            description="Add a relation and a disease above."
            className="py-8"
          />
        </div>
      ) : (
        <RowTable label="Family history" columns={COLUMNS} headings={["Relation", "Disease", "Duration"]}>
          {rows.map((row) => (
            <RowTableRow
              key={row.id}
              primary={row.relation}
              secondary={row.condition}
              tertiary={row.duration || "-"}
              action={
                <RemoveRowButton
                  label={`Remove ${row.relation}, ${row.condition}`}
                  disabled={isRemoving}
                  onClick={() => onRemove(row.id)}
                />
              }
            />
          ))}
        </RowTable>
      )}
    </CaseSheetCard>
  );
}

export function FamilyHistoryTable({ clinicId, userId }: FamilyHistoryTableProps) {
  const query = useFamilyHistory(clinicId, userId);
  const create = useCreateFamilyHistory();
  const remove = useDeleteFamilyHistory();

  const handleAdd = (draft: FamilyHistoryDraft) =>
    runSave(() =>
      create.mutateAsync({
        clinicId,
        input: {
          userId,
          relation: draft.relation.trim(),
          condition: draft.condition.trim(),
          ...(draft.duration.trim() ? { duration: draft.duration.trim() } : {}),
        },
      }),
    );

  return (
    <FamilyHistoryTableView
      rows={query.data ?? []}
      isLoading={query.isPending}
      hasError={Boolean(query.error) && query.data === undefined}
      onRetry={() => void query.refetch()}
      onAdd={handleAdd}
      isAdding={create.isPending}
      onRemove={(id) => void runSave(() => remove.mutateAsync({ clinicId, id }))}
      isRemoving={remove.isPending}
    />
  );
}
