"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, InitialsAvatar, Pill } from "@/components/tbd";
import { getQueuePositionLabel } from "@/lib/queue/queue-adapter";
import { cn } from "@/lib/utils";
import {
  attentionLine,
  dateTimeLabel,
  getPrescriptionState,
  moneyLabel,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";

/** Rows per page, the same as the old table. */
export const PAGE_SIZE = 10;

/** Column header row of a grid table. Hidden while the rows are stacked (narrow card). */
export const HEAD_ROW =
  "hidden border-b border-hair px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @4xl:grid @4xl:items-center @4xl:gap-x-4";

/** A cell that takes the full width while the row is stacked. */
export const CELL_FULL = "col-[1/-1] @4xl:col-auto @4xl:row-auto";

/** Small label above a cell, shown only while the row is stacked. */
export function CellLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-0.5 block text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @4xl:hidden">
      {children}
    </span>
  );
}

/**
 * Paging for a list held in memory. Goes back to page 1 when `resetKey` changes and jumps
 * to the page of `focusIndex` (a deep-linked row) when one is given.
 */
export function usePagedRows<T>(rows: T[], resetKey: string, focusIndex = -1) {
  const [pageIndex, setPageIndex] = useState(0);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPageIndex(0);
  }

  useEffect(() => {
    if (focusIndex >= 0) setPageIndex(Math.floor(focusIndex / PAGE_SIZE));
  }, [focusIndex]);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  return {
    pageRows,
    total,
    pageCount,
    currentPage,
    rangeStart: total === 0 ? 0 : currentPage * PAGE_SIZE + 1,
    rangeEnd: total === 0 ? 0 : currentPage * PAGE_SIZE + pageRows.length,
    goTo: (page: number) => setPageIndex(Math.max(0, Math.min(pageCount - 1, page))),
  };
}

export type PagedRows<T> = ReturnType<typeof usePagedRows<T>>;

export const prescriptionRowId = (prescriptionId: string) => `prescription-row-${prescriptionId}`;

/** Scrolls the deep-linked row into view once it is on the page. */
export function useScrollToRow(highlightId: string | null, focusIndex: number) {
  useEffect(() => {
    if (!highlightId || focusIndex < 0) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(prescriptionRowId(highlightId))?.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusIndex, highlightId]);
}

/** "Showing 1–3 of 3 active prescriptions" with Previous / Next. */
export function PrescriptionsPager({
  paging,
  noun,
}: {
  paging: Pick<PagedRows<unknown>, "total" | "pageCount" | "currentPage" | "rangeStart" | "rangeEnd" | "goTo">;
  /** What is counted, after the number ("active prescriptions", "entries"). */
  noun?: string;
}) {
  const { total, pageCount, currentPage, rangeStart, rangeEnd, goTo } = paging;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
      <span>
        Showing {rangeStart}–{rangeEnd} of {total}
        {noun ? ` ${noun}` : ""}
      </span>
      <nav aria-label="Pages" className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-[34px]"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <span className="whitespace-nowrap" aria-live="polite">
          Page {currentPage + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          className="h-[34px]"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

/** Placeholder rows while a list loads. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[72px] items-center gap-4 border-b border-hair px-5 py-3 last:border-b-0"
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-36 max-w-full rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <div className="hidden flex-1 flex-col gap-1.5 sm:flex">
            <Skeleton className="h-3.5 w-44 max-w-full rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="h-[22px] w-24 shrink-0 rounded-lg" />
          <Skeleton className="hidden h-10 w-36 shrink-0 rounded-xl md:block" />
        </div>
      ))}
    </div>
  );
}

/** "Could not be loaded" block with a retry button. */
export function LoadError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <EmptyBlock
      icon={CircleAlert}
      title={title}
      description={message}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

// ── Cells shared by the Active and History tables ──────────────────────────

/** Avatar, patient name, prescription number and queue position. */
export function PatientCell({ prescription }: { prescription: PrescriptionRow }) {
  const queue = prescription.queuePosition
    ? getQueuePositionLabel({ position: prescription.queuePosition })
    : "";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <InitialsAvatar name={prescription.patientName} size={36} />
      <span className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-sm font-bold text-ink">{prescription.patientName}</span>
        <span className="truncate text-xs text-ink-muted">
          {[prescription.reference, queue].filter(Boolean).join(" · ")}
        </span>
      </span>
    </div>
  );
}

const MAX_MEDICINE_LINES = 3;

/** One line per medicine ("Name × 5"); an amber line for what is short or partly given. */
export function MedicinesCell({
  prescription,
  showAttention = false,
}: {
  prescription: PrescriptionRow;
  showAttention?: boolean;
}) {
  const { medicines } = prescription;
  const visible = medicines.length > MAX_MEDICINE_LINES ? medicines.slice(0, MAX_MEDICINE_LINES - 1) : medicines;
  const hidden = medicines.length - visible.length;
  const attention = showAttention ? attentionLine(prescription) : "";
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {medicines.length === 0 ? <span className="text-[13px] text-ink-muted">No medicines listed</span> : null}
      {visible.map((medicine) => (
        <span key={medicine.prescriptionItemId} className="truncate text-[13px] font-semibold text-ink">
          {medicine.name} <span className="font-medium text-ink-muted">× {medicine.prescribedQuantity}</span>
        </span>
      ))}
      {hidden > 0 ? <span className="text-xs font-medium text-ink-muted">+ {hidden} more</span> : null}
      {attention ? (
        <span className="mt-0.5 flex items-start gap-[5px] text-xs font-semibold leading-[1.35] text-[#b45309] dark:text-amber-300">
          <CircleAlert className="mt-px size-[13px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span>{attention}</span>
        </span>
      ) : null}
    </div>
  );
}

/** Doctor and the time the prescription was written. */
export function PrescribedByCell({ prescription }: { prescription: PrescriptionRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-px">
      <span className="truncate text-[13px] font-semibold text-ink">{prescription.doctorName}</span>
      <span className="truncate text-xs text-ink-muted">{dateTimeLabel(prescription.prescribedAt)}</span>
    </div>
  );
}

/** State tag with the amount under it. */
export function StateCell({ prescription, className }: { prescription: PrescriptionRow; className?: string }) {
  const state = getPrescriptionState(prescription);
  const money = moneyLabel(prescription);
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 @4xl:flex-col @4xl:items-start @4xl:justify-start @4xl:gap-[5px]",
        className,
      )}
    >
      <Pill tone={state.tone}>{state.label}</Pill>
      <span className="whitespace-nowrap text-[13px] text-ink">
        {money.amount ? <span className="font-extrabold">{money.amount}</span> : null}
        <span className="text-ink-muted">
          {money.amount ? " · " : ""}
          {money.note}
        </span>
      </span>
    </div>
  );
}
