"use client";

import { runSave } from "./run-save";
import { useState } from "react";
import { AlertTriangle, Pill as PillIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyBlock, Note } from "@/components/tbd";
import {
  useCreateMedication,
  useDeleteMedication,
  useMedications,
} from "@/hooks/query/useMedicalRecords";
import {
  CaseSheetCard,
  RemoveRowButton,
  RowTable,
  RowTableRow,
  RowTableSkeleton,
} from "./case-sheet-parts";

export type MedicationRow = {
  id?: string;
  name?: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
  instructions?: string;
};

function toRows(value: unknown): MedicationRow[] {
  if (Array.isArray(value)) return value as MedicationRow[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "medications"]) {
      if (Array.isArray(record[key])) return record[key] as MedicationRow[];
    }
  }
  return [];
}

interface MedicineHistoryTableProps {
  userId: string;
}

const EMPTY = { name: "", dose: "", instruction: "" };

export type MedicineHistoryDraft = typeof EMPTY;

export interface MedicineHistoryTableViewProps {
  rows: MedicationRow[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  /** Adds one medicine. Resolves true when saved, so the add row can be cleared. */
  onAdd: (draft: MedicineHistoryDraft) => Promise<boolean>;
  isAdding: boolean;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const COLUMNS = "1.4fr 1fr 1.2fr 36px";

/** Layout of Medicine History: an add row, the table and a short note. */
export function MedicineHistoryTableView({
  rows,
  isLoading,
  hasError,
  onRetry,
  onAdd,
  isAdding,
  onRemove,
  isRemoving,
}: MedicineHistoryTableViewProps) {
  const [draft, setDraft] = useState(EMPTY);
  const canAdd = draft.name.trim().length > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    if (await onAdd(draft)) setDraft(EMPTY);
  };

  return (
    <>
      <CaseSheetCard title="Medicine History" description="Medicines the patient is currently taking">
        <div className="grid grid-cols-1 items-center gap-2.5 md:grid-cols-[1.4fr_1fr_1.2fr_auto]">
          <Input
            aria-label="Medicine"
            placeholder="Medicine"
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            aria-label="Dose"
            placeholder="Dose (e.g. 1 tab M-A-E-N)"
            value={draft.dose}
            onChange={(event) => setDraft((prev) => ({ ...prev, dose: event.target.value }))}
          />
          <Input
            aria-label="Instruction"
            placeholder="Instruction"
            value={draft.instruction}
            onChange={(event) => setDraft((prev) => ({ ...prev, instruction: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleAdd();
            }}
          />
          <Button size="md" onClick={() => void handleAdd()} disabled={!canAdd || isAdding}>
            <Plus aria-hidden="true" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <RowTableSkeleton rows={2} />
        ) : hasError ? (
          <div className="rounded-[14px] border border-line">
            <EmptyBlock
              icon={AlertTriangle}
              tone="rose"
              title="Could not load the medicines"
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
              icon={PillIcon}
              title="No current medicines recorded"
              description="Add a medicine above."
              className="py-8"
            />
          </div>
        ) : (
          <RowTable label="Medicine history" columns={COLUMNS} headings={["Medicine", "Dose", "Instruction"]}>
            {rows.map((row, index) => {
              const name = row.name || row.medicationName || "-";
              const id = row.id;
              return (
                <RowTableRow
                  key={id ?? index}
                  primary={name}
                  secondary={row.dosage || "-"}
                  tertiary={row.instructions || row.notes || row.frequency || "-"}
                  action={
                    id ? (
                      <RemoveRowButton
                        label={`Remove ${name}`}
                        disabled={isRemoving}
                        onClick={() => onRemove(id)}
                      />
                    ) : null
                  }
                />
              );
            })}
          </RowTable>
        )}
      </CaseSheetCard>

      <Note tone="green">
        This is what the patient already takes, from any doctor. Medicines this clinic prescribes are listed
        under Prescriptions.
      </Note>
    </>
  );
}

/**
 * Medicines the patient is already taking (from anywhere) — distinct from
 * prescriptions this clinic writes, which live in the Prescriptions tab.
 */
export function MedicineHistoryTable({ userId }: MedicineHistoryTableProps) {
  const query = useMedications(userId, true);
  const create = useCreateMedication();
  const remove = useDeleteMedication();

  const handleAdd = (draft: MedicineHistoryDraft) =>
    runSave(() =>
      create.mutateAsync({
        userId,
        medicationName: draft.name.trim(),
        dosage: draft.dose.trim() || "-",
        frequency: draft.instruction.trim() || "-",
        startDate: new Date().toISOString(),
        ...(draft.instruction.trim() ? { instructions: draft.instruction.trim() } : {}),
        status: "active",
      }),
    );

  return (
    <MedicineHistoryTableView
      rows={toRows(query.data)}
      isLoading={query.isPending}
      hasError={Boolean(query.error) && query.data === undefined}
      onRetry={() => void query.refetch()}
      onAdd={handleAdd}
      isAdding={create.isPending}
      onRemove={(id) => void runSave(() => remove.mutateAsync(id))}
      isRemoving={remove.isPending}
    />
  );
}
