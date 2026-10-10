"use client";

import { runSave } from "./run-save";
import { useLocalizedOption } from "./use-localized-option";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyBlock,
  GridHead,
  GridRow,
  Note,
  Pill,
  SectionTitle,
  Surface,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { formatDateInIST } from "@/lib/utils/date-time";
import { PAST_HISTORY_CONDITIONS } from "@/lib/constants/case-sheet-fixed-lists";
import {
  useCreateMedicalHistory,
  useDeleteMedicalHistory,
  useMedicalHistory,
} from "@/hooks/query/useMedicalRecords";
import { CaseSheetCard, ChoiceChip, FieldLabel, SaveButton } from "./case-sheet-parts";

/** One MedicalHistory row as the API returns it (only the fields this screen reads). */
export type PastHistoryRow = {
  id?: string;
  condition?: string;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  status?: string | null;
  date?: string | null;
  startDate?: string | null;
  createdAt?: string | null;
};

function toRows(value: unknown): PastHistoryRow[] {
  if (Array.isArray(value)) return value as PastHistoryRow[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "history"]) {
      if (Array.isArray(record[key])) return record[key] as PastHistoryRow[];
    }
  }
  return [];
}

function indexByCondition(rows: PastHistoryRow[]): Map<string, PastHistoryRow> {
  const map = new Map<string, PastHistoryRow>();
  for (const row of rows) {
    if (row.condition) map.set(row.condition.trim().toLowerCase(), row);
  }
  return map;
}

const rowDate = (row: PastHistoryRow) => row.date || row.startDate || row.createdAt || "";

const rowDetails = (row: PastHistoryRow) =>
  [row.notes, row.diagnosis, row.treatment]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" · ");

interface PastHistoryChecklistProps {
  userId: string;
  notes: string | null;
  onSaveNotes: (notes: string) => Promise<unknown>;
  isSavingNotes?: boolean;
}

export interface PastHistoryChecklistViewProps {
  /** Every medical-history record of the patient. */
  rows: PastHistoryRow[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  /** The condition being saved right now, if any. */
  pendingCondition: string | null;
  onToggle: (condition: string) => void;
  notes: string | null;
  onSaveNotes: (notes: string) => Promise<unknown>;
  isSavingNotes?: boolean;
}

const HISTORY_COLUMNS = "0.8fr 1.1fr 2.6fr";
const HISTORY_COLUMNS_WITH_STATUS = "0.8fr 1.1fr 2.6fr 120px";

/** Layout of Past History: condition chips, free notes and the treatment history list. */
export function PastHistoryChecklistView({
  rows,
  isLoading,
  hasError,
  onRetry,
  pendingCondition,
  onToggle,
  notes,
  onSaveNotes,
  isSavingNotes = false,
}: PastHistoryChecklistViewProps) {
  const localize = useLocalizedOption();
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    setNotesValue(notes ?? "");
    setNotesDirty(false);
  }, [notes]);

  const rowByCondition = useMemo(() => indexByCondition(rows), [rows]);
  const selectedCount = PAST_HISTORY_CONDITIONS.filter((c) => rowByCondition.has(c.toLowerCase())).length;

  const history = useMemo(
    () =>
      rows
        .filter((row) => Boolean(row.condition))
        .slice()
        .sort((a, b) => rowDate(b).localeCompare(rowDate(a))),
    [rows],
  );
  // The status column only shows when the records carry a status.
  const showStatus = history.some((row) => Boolean(row.status));
  const columns = showStatus ? HISTORY_COLUMNS_WITH_STATUS : HISTORY_COLUMNS;

  return (
    <>
      <CaseSheetCard
        title="Past History"
        description={
          selectedCount > 0
            ? `${selectedCount} condition${selectedCount === 1 ? "" : "s"} recorded`
            : "Tap a condition to record it"
        }
        action={
          <SaveButton
            label="Save notes"
            saving={isSavingNotes}
            disabled={isSavingNotes || !notesDirty}
            onClick={async () => {
              if (await runSave(() => onSaveNotes(notesValue))) setNotesDirty(false);
            }}
          />
        }
      >
        {hasError ? (
          <Note tone="rose" icon={AlertTriangle}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span>Could not load the recorded conditions. Check the connection and try again.</span>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </div>
          </Note>
        ) : null}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Past conditions" aria-busy={isLoading}>
          {PAST_HISTORY_CONDITIONS.map((condition) => {
            const busy = pendingCondition === condition;
            return (
              <ChoiceChip
                key={condition}
                size="lg"
                active={rowByCondition.has(condition.toLowerCase())}
                // Locked while loading or after a failed load, so a condition is never recorded twice.
                disabled={busy || isLoading || hasError}
                onClick={() => onToggle(condition)}
              >
                {busy ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : null}
                {localize(condition)}
              </ChoiceChip>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="past-history-notes">Other past history</FieldLabel>
          <Textarea
            id="past-history-notes"
            className="min-h-[84px]"
            value={notesValue}
            onChange={(event) => {
              setNotesValue(event.target.value);
              setNotesDirty(true);
            }}
            placeholder="Other past history"
            rows={3}
          />
        </div>
      </CaseSheetCard>

      <Note tone="green">
        Each condition you tap is saved to the patient&apos;s medical history straight away and stays on the
        record for future visits.
      </Note>

      <Surface as="section" flush>
        <SectionTitle
          className="px-5 pb-1.5 pt-5"
          title="Treatment History"
          description="Past records from every visit, newest first. These stay on the record whichever OPD visit is open."
        />
        {isLoading ? (
          <div className="flex flex-col gap-3 px-5 pb-5 pt-3" aria-busy="true">
            <span className="sr-only">Loading</span>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : hasError ? (
          <EmptyBlock
            icon={AlertTriangle}
            tone="rose"
            title="Could not load the history"
            description="Check the connection and try again."
            action={
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        ) : history.length === 0 ? (
          <EmptyBlock
            icon={ClipboardList}
            title="No past records yet"
            description="Conditions you tap above show up here."
          />
        ) : (
          <div role="table" aria-label="Treatment history">
            <GridHead
              columns={columns}
              labels={showStatus ? ["Date", "Condition", "Details", "Status"] : ["Date", "Condition", "Details"]}
            />
            {history.map((row, index) => (
              <GridRow key={row.id ?? `${row.condition}-${index}`} columns={columns}>
                <span role="cell" className="text-ink-muted">
                  {rowDate(row) ? formatDateInIST(rowDate(row)) || "-" : "-"}
                </span>
                <span role="cell" className="font-bold text-ink">
                  {row.condition}
                </span>
                <span role="cell" className="text-ink-muted">
                  {rowDetails(row) || "-"}
                </span>
                {showStatus ? (
                  <span role="cell">
                    {row.status ? <Pill tone={statusTone(row.status)}>{statusLabel(row.status)}</Pill> : "-"}
                  </span>
                ) : null}
              </GridRow>
            ))}
          </div>
        )}
      </Surface>
    </>
  );
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

  const rows = useMemo(() => toRows(historyQuery.data), [historyQuery.data]);
  const rowByCondition = useMemo(() => indexByCondition(rows), [rows]);

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

  return (
    <PastHistoryChecklistView
      rows={rows}
      isLoading={historyQuery.isPending}
      hasError={Boolean(historyQuery.error) && historyQuery.data === undefined}
      onRetry={() => void historyQuery.refetch()}
      pendingCondition={pending}
      onToggle={(condition) => void toggle(condition)}
      notes={notes}
      onSaveNotes={onSaveNotes}
      isSavingNotes={isSavingNotes}
    />
  );
}
