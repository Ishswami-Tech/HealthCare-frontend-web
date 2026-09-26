"use client";

import { runSave } from "./run-save";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateMedication,
  useDeleteMedication,
  useMedications,
} from "@/hooks/query/useMedicalRecords";

type MedicationRow = {
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

/**
 * Medicines the patient is already taking (from anywhere) — distinct from
 * prescriptions this clinic writes, which live in the Prescriptions tab.
 */
export function MedicineHistoryTable({ userId }: MedicineHistoryTableProps) {
  const query = useMedications(userId, true);
  const create = useCreateMedication();
  const remove = useDeleteMedication();
  const [draft, setDraft] = useState(EMPTY);
  const rows = toRows(query.data);
  const canAdd = draft.name.trim().length > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    const saved = await runSave(() =>
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
    if (saved) setDraft(EMPTY);
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Medicine History</CardTitle>
        <p className="text-sm text-muted-foreground">Medicines the patient is currently taking</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1fr_1.2fr_auto]">
          <Input
            placeholder="Medicine"
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            placeholder="Dose (e.g. 1 tab M-A-E-N)"
            value={draft.dose}
            onChange={(event) => setDraft((prev) => ({ ...prev, dose: event.target.value }))}
          />
          <Input
            placeholder="Instruction"
            value={draft.instruction}
            onChange={(event) => setDraft((prev) => ({ ...prev, instruction: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleAdd();
            }}
          />
          <Button onClick={() => void handleAdd()} disabled={!canAdd || create.isPending}>
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            {query.isPending ? "Loading…" : "No current medicines recorded."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Instruction</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableCell className="font-medium">{row.name || row.medicationName || "-"}</TableCell>
                  <TableCell>{row.dosage || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.instructions || row.notes || row.frequency || "-"}
                  </TableCell>
                  <TableCell>
                    {row.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        disabled={remove.isPending}
                        onClick={() => void runSave(() => remove.mutateAsync(row.id as string))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
