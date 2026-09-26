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
import { FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import {
  useCreateFamilyHistory,
  useDeleteFamilyHistory,
  useFamilyHistory,
} from "@/hooks/query/usePatientVisits";

interface FamilyHistoryTableProps {
  clinicId: string;
  userId: string;
}

const EMPTY = { relation: "", condition: "", duration: "" };

export function FamilyHistoryTable({ clinicId, userId }: FamilyHistoryTableProps) {
  const query = useFamilyHistory(clinicId, userId);
  const create = useCreateFamilyHistory();
  const remove = useDeleteFamilyHistory();
  const [draft, setDraft] = useState(EMPTY);
  const rows = query.data ?? [];
  const canAdd = draft.relation.trim().length > 0 && draft.condition.trim().length > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    const saved = await runSave(() =>
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
    if (saved) setDraft(EMPTY);
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Family History</CardTitle>
        <p className="text-sm text-muted-foreground">Conditions in blood relatives</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.4fr_1fr_auto]">
          <Input
            list="family-relation-suggestions"
            placeholder="Relation"
            value={draft.relation}
            onChange={(event) => setDraft((prev) => ({ ...prev, relation: event.target.value }))}
          />
          <datalist id="family-relation-suggestions">
            {FAMILY_RELATION_SUGGESTIONS.map((relation) => (
              <option key={relation} value={relation} />
            ))}
          </datalist>
          <Input
            placeholder="Disease"
            value={draft.condition}
            onChange={(event) => setDraft((prev) => ({ ...prev, condition: event.target.value }))}
          />
          <Input
            placeholder="Duration (e.g. 10 years)"
            value={draft.duration}
            onChange={(event) => setDraft((prev) => ({ ...prev, duration: event.target.value }))}
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
            {query.isPending ? "Loading…" : "No family history recorded."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Relation</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.relation}</TableCell>
                  <TableCell>{row.condition}</TableCell>
                  <TableCell className="text-muted-foreground">{row.duration || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove"
                      disabled={remove.isPending}
                      onClick={() => void runSave(() => remove.mutateAsync({ clinicId, id: row.id }))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
