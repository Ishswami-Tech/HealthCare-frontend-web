"use client";

import { ClipboardList } from "lucide-react";
import { EmptyBlock, Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { PharmacyBatchAuditEntry } from "@/types/pharmacy.types";
import {
  AUDIT_EVENT_TONE,
  auditEventKind,
  auditReason,
  dateLabel,
  expiryLabel,
  prescriptionReference,
  timeLabel,
} from "./pharmacist-prescriptions.logic";
import {
  CELL_FULL,
  CellLabel,
  HEAD_ROW,
  LoadError,
  PrescriptionsPager,
  SkeletonRows,
  usePagedRows,
} from "./PrescriptionTableParts";

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @4xl:grid-cols-[104px_112px_minmax(0,1fr)_minmax(0,1.2fr)_90px_36px_minmax(0,1.2fr)] @4xl:gap-x-4 @5xl:grid-cols-[118px_116px_145px_minmax(0,1fr)_96px_40px_215px]";

interface PrescriptionsAuditTableProps {
  /** Batch audit entries, newest first, already filtered by the search box. */
  entries: PharmacyBatchAuditEntry[];
  /** True when the search box or a date narrows the list. */
  filtered: boolean;
  resetKey: string;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: (() => void) | undefined;
}

/** Batch audit tab: every dispense, substitution and reversal with its batch. */
export function PrescriptionsAuditTable({
  entries,
  filtered,
  resetKey,
  loading = false,
  errorMessage = null,
  onRetry,
}: PrescriptionsAuditTableProps) {
  const paging = usePagedRows(entries, resetKey);

  if (loading) return <SkeletonRows />;
  if (errorMessage) {
    return <LoadError title="The batch audit could not be loaded" message={errorMessage} onRetry={onRetry} />;
  }
  if (entries.length === 0) {
    return (
      <EmptyBlock
        icon={ClipboardList}
        title="No batch audit entries found"
        description={
          filtered
            ? "Check the spelling, or widen the dates."
            : "Every dispense, substitution and reversal is listed here with its batch."
        }
      />
    );
  }

  return (
    <>
      <div role="table" aria-label="Batch audit">
        <div role="row" className={cn(ROW_GRID, HEAD_ROW)}>
          <span role="columnheader">When</span>
          <span role="columnheader">Event</span>
          <span role="columnheader">Patient</span>
          <span role="columnheader">Medicine</span>
          <span role="columnheader">Batch</span>
          <span role="columnheader">Qty</span>
          <span role="columnheader">Reason</span>
        </div>

        {paging.pageRows.map((entry, index) => {
          const kind = auditEventKind(entry);
          const reason = auditReason(entry);
          const replaced =
            entry.substituteMedicineName && entry.originalMedicineName !== entry.medicineName
              ? entry.originalMedicineName
              : "";
          return (
            <div
              key={`${entry.prescriptionItemId}-${entry.eventAt}-${kind}-${entry.batchNumber ?? ""}-${index}`}
              role="row"
              className={cn(
                ROW_GRID,
                "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0 @4xl:min-h-16 @4xl:items-center @4xl:py-2",
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-sm font-bold text-ink">{timeLabel(entry.eventAt)}</span>
                <span className="truncate text-xs text-ink-muted">{dateLabel(entry.eventAt)}</span>
              </div>
              <div role="cell" className="col-[2] row-[1] min-w-0 @4xl:col-auto @4xl:row-auto">
                <Pill tone={AUDIT_EVENT_TONE[kind]}>{kind}</Pill>
              </div>
              <div role="cell" className={cn(CELL_FULL, "row-[2] flex min-w-0 flex-col gap-px")}>
                <CellLabel>Patient</CellLabel>
                <span className="truncate text-sm font-bold text-ink">{entry.patientName}</span>
                <span className="truncate text-xs text-ink-muted">
                  {prescriptionReference(null, entry.prescriptionId)}
                </span>
              </div>
              <div role="cell" className={cn(CELL_FULL, "row-[3] flex min-w-0 flex-col gap-px")}>
                <CellLabel>Medicine</CellLabel>
                <span className="text-sm font-bold text-ink">{entry.medicineName}</span>
                {replaced ? <span className="truncate text-xs text-ink-muted">In place of {replaced}</span> : null}
              </div>
              <div role="cell" className="row-[4] flex min-w-0 flex-col gap-px @4xl:row-auto">
                <CellLabel>Batch</CellLabel>
                <span className="truncate text-[13px] font-bold text-ink">{entry.batchNumber || "—"}</span>
                <span className="truncate text-xs text-ink-muted">
                  {entry.expiryDate ? `Exp ${expiryLabel(entry.expiryDate)}` : "No expiry"}
                </span>
              </div>
              <div role="cell" className="row-[4] min-w-0 text-right @4xl:row-auto @4xl:text-left">
                <CellLabel>Qty</CellLabel>
                <span className="font-extrabold text-ink">{entry.quantity}</span>
              </div>
              <div role="cell" className={cn(CELL_FULL, "row-[5] min-w-0", !reason && "hidden @4xl:block")}>
                <CellLabel>Reason</CellLabel>
                {reason ? (
                  <span className="block text-[13px] leading-[1.4] text-ink-soft">{reason}</span>
                ) : (
                  <span className="text-sm font-medium text-ink-muted" aria-label="No reason">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PrescriptionsPager paging={paging} noun={paging.total === 1 ? "entry" : "entries"} />
    </>
  );
}
