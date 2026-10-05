"use client";

import { IndianRupee, Package, Pill as PillIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { PrescriptionRow } from "./pharmacist-prescriptions.logic";
import {
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

/**
 * Wide card: one line per prescription. Narrow card: the cells stack (patient, state,
 * medicines, doctor, action). `@4xl` / `@5xl` are container widths, so the layout follows
 * the card, not the window.
 */
const ROW_GRID =
  "grid grid-cols-1 gap-x-3 px-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_165px_168px] @4xl:gap-x-4 @5xl:grid-cols-[200px_minmax(0,1fr)_205px_165px_168px]";

interface PrescriptionsActiveTableProps {
  /** Open prescriptions, already filtered by the search box and the state filter. */
  prescriptions: PrescriptionRow[];
  /** True when the search box or the state filter narrows the list. */
  filtered: boolean;
  /** Changes when the search or filter changes; the table goes back to page 1. */
  resetKey: string;
  /** Prescription to scroll to and mark (deep link from the dashboard). */
  highlightId?: string | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: (() => void) | undefined;
  onReviewDispense: (prescription: PrescriptionRow) => void;
  dispensePending?: boolean;
  /** Opens the cash payment dialog for a prescription that is not paid for. */
  onCollectPayment: (prescription: PrescriptionRow) => void;
  collectPending?: boolean;
}

/** Active tab: every open prescription with its state and the one right action. */
export function PrescriptionsActiveTable({
  prescriptions,
  filtered,
  resetKey,
  highlightId = null,
  loading = false,
  errorMessage = null,
  onRetry,
  onReviewDispense,
  dispensePending = false,
  onCollectPayment,
  collectPending = false,
}: PrescriptionsActiveTableProps) {
  const focusIndex = highlightId ? prescriptions.findIndex((row) => row.id === highlightId) : -1;
  const paging = usePagedRows(prescriptions, resetKey, focusIndex);

  useScrollToRow(highlightId, focusIndex);

  if (loading) return <SkeletonRows />;
  if (errorMessage) {
    return <LoadError title="The prescriptions could not be loaded" message={errorMessage} onRetry={onRetry} />;
  }
  if (prescriptions.length === 0) {
    return (
      <EmptyBlock
        icon={PillIcon}
        title={filtered ? "No active prescription matches" : "No active prescriptions"}
        description={
          filtered
            ? "Check the spelling, or clear the search and the state filter."
            : "Prescriptions waiting for payment or to be dispensed show here."
        }
      />
    );
  }

  return (
    <>
      <div role="table" aria-label="Active prescriptions">
        <div role="row" className={cn(ROW_GRID, HEAD_ROW)}>
          <span role="columnheader">Patient</span>
          <span role="columnheader">Medicines</span>
          <span role="columnheader">Prescribed by</span>
          <span role="columnheader">State</span>
          <span role="columnheader">Action</span>
        </div>

        {paging.pageRows.map((prescription) => (
          <div
            key={prescription.id}
            id={prescriptionRowId(prescription.id)}
            role="row"
            aria-current={prescription.id === highlightId ? "true" : undefined}
            className={cn(
              ROW_GRID,
              "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0 @4xl:min-h-[76px] @4xl:items-center @4xl:py-2",
              prescription.id === highlightId && "bg-mint-soft",
            )}
          >
            <div role="cell" className="min-w-0">
              <PatientCell prescription={prescription} />
            </div>
            <div role="cell" className="order-3 min-w-0 @4xl:order-none">
              <MedicinesCell prescription={prescription} showAttention />
            </div>
            <div role="cell" className="order-4 min-w-0 @4xl:order-none">
              <PrescribedByCell prescription={prescription} />
            </div>
            <div role="cell" className="order-2 min-w-0 @4xl:order-none">
              <StateCell prescription={prescription} />
            </div>
            <div role="cell" className="order-5 min-w-0 @4xl:order-none">
              {prescription.canDispense ? (
                <Button
                  size="lg"
                  className="w-full px-3.5 has-[>svg]:px-3.5 @4xl:w-auto"
                  onClick={() => onReviewDispense(prescription)}
                  disabled={dispensePending}
                >
                  <Package aria-hidden="true" />
                  Review dispense
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="action"
                  className="w-full px-3.5 has-[>svg]:px-3.5 @4xl:w-auto"
                  onClick={() => onCollectPayment(prescription)}
                  disabled={collectPending}
                  title="The prescription can be dispensed once it is paid for"
                >
                  <IndianRupee aria-hidden="true" />
                  Collect payment
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <PrescriptionsPager
        paging={paging}
        noun={paging.total === 1 ? "active prescription" : "active prescriptions"}
      />
    </>
  );
}
