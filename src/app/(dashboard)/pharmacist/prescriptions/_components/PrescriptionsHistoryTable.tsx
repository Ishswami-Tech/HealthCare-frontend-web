"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { canReverseDispense, dateTimeLabel, type PrescriptionRow } from "./pharmacist-prescriptions.logic";
import {
  CellLabel,
  HEAD_ROW,
  LoadError,
  MedicinesCell,
  PatientCell,
  PrescribedByCell,
  PrescriptionsPager,
  SkeletonRows,
  StateCell,
  prescriptionRowId,
  usePagedRows,
  useScrollToRow,
} from "./PrescriptionTableParts";

const ROW_GRID =
  "grid grid-cols-1 gap-x-3 px-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)_104px_146px] @4xl:gap-x-4 @5xl:grid-cols-[172px_minmax(0,1fr)_195px_150px_104px_146px]";

interface PrescriptionsHistoryTableProps {
  /** Dispensed and cancelled prescriptions, already filtered. */
  prescriptions: PrescriptionRow[];
  filtered: boolean;
  resetKey: string;
  highlightId?: string | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: (() => void) | undefined;
  /** Opens the "Reverse dispense" dialog. */
  onReverse: (prescription: PrescriptionRow) => void;
  reversePending?: boolean;
}

/** History tab: what was handed over (or cancelled), with "Reverse dispense". */
export function PrescriptionsHistoryTable({
  prescriptions,
  filtered,
  resetKey,
  highlightId = null,
  loading = false,
  errorMessage = null,
  onRetry,
  onReverse,
  reversePending = false,
}: PrescriptionsHistoryTableProps) {
  const focusIndex = highlightId ? prescriptions.findIndex((row) => row.id === highlightId) : -1;
  const paging = usePagedRows(prescriptions, resetKey, focusIndex);
  useScrollToRow(highlightId, focusIndex);

  if (loading) return <SkeletonRows />;
  if (errorMessage) {
    return <LoadError title="The history could not be loaded" message={errorMessage} onRetry={onRetry} />;
  }
  if (prescriptions.length === 0) {
    return (
      <EmptyBlock
        icon={CheckCircle}
        title={filtered ? "No prescription matches" : "No dispense history"}
        description={
          filtered
            ? "Check the spelling, or clear the search and the state filter."
            : "Dispensed and cancelled prescriptions show here."
        }
      />
    );
  }

  return (
    <>
      <div role="table" aria-label="Dispense history">
        <div role="row" className={cn(ROW_GRID, HEAD_ROW)}>
          <span role="columnheader">Patient</span>
          <span role="columnheader">Medicines</span>
          <span role="columnheader">Prescribed by</span>
          <span role="columnheader">Handed over</span>
          <span role="columnheader">State</span>
          <span role="columnheader">Action</span>
        </div>

        {paging.pageRows.map((prescription) => {
          const reversible = canReverseDispense(prescription);
          return (
            <div
              key={prescription.id}
              id={prescriptionRowId(prescription.id)}
              role="row"
              aria-current={prescription.id === highlightId ? "true" : undefined}
              className={cn(
                ROW_GRID,
                "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0 @4xl:min-h-[72px] @4xl:items-center @4xl:py-2",
                prescription.id === highlightId && "bg-mint-soft",
              )}
            >
              <div role="cell" className="min-w-0">
                <PatientCell prescription={prescription} />
              </div>
              <div role="cell" className="order-3 min-w-0 @4xl:order-none">
                <MedicinesCell prescription={prescription} />
              </div>
              <div role="cell" className="order-4 min-w-0 @4xl:order-none">
                <CellLabel>Prescribed by</CellLabel>
                <PrescribedByCell prescription={prescription} />
              </div>
              <div role="cell" className="order-5 min-w-0 @4xl:order-none">
                <CellLabel>Handed over</CellLabel>
                {prescription.handedOverAt ? (
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {dateTimeLabel(prescription.handedOverAt)}
                  </span>
                ) : (
                  <span className="text-[13px] font-medium text-ink-muted">
                    {prescription.status === "CANCELLED" ? "Not handed over" : "Time not recorded"}
                  </span>
                )}
              </div>
              <div role="cell" className="order-2 min-w-0 @4xl:order-none">
                <StateCell prescription={prescription} />
              </div>
              <div role="cell" className={cn("order-6 min-w-0 @4xl:order-none", !reversible && "hidden @4xl:block")}>
                {reversible ? (
                  <Button
                    variant="outline"
                    className="h-[38px] w-full @4xl:w-auto"
                    onClick={() => onReverse(prescription)}
                    disabled={reversePending}
                  >
                    Reverse dispense
                  </Button>
                ) : (
                  <span className="text-sm font-medium text-ink-muted" aria-label="No action">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PrescriptionsPager paging={paging} />
    </>
  );
}
