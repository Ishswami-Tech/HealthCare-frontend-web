"use client";

import { useEffect, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { InitialsAvatar, Pill } from "@/components/tbd";
import { getQueuePositionLabel } from "@/lib/queue/queue-adapter";
import { cn } from "@/lib/utils";
import {
  attentionLine,
  getPrescriptionState,
  moneyLabel,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";
import { formatDateTimeLabel } from "@/lib/utils/date-time";

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
          {[prescription.patientUhid, prescription.patientPhone, prescription.reference, queue]
            .filter(Boolean)
            .join(" · ")}
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
      <span className="truncate text-xs text-ink-muted">{formatDateTimeLabel(prescription.prescribedAt)}</span>
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
