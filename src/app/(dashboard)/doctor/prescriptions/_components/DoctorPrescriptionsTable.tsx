"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { ChevronRight, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pill } from "@/components/tbd";
import { isPrescriptionEditable } from "@/components/doctor/rx/rx-form.logic";
import { cn } from "@/lib/utils";
import {
  ADVICE_ONLY_LABEL,
  isAdviceOnlyPrescription,
  prescriptionStatusPill,
  prescriptionWhenLabel,
  type DoctorPrescriptionRow,
} from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionsTableProps {
  rows: DoctorPrescriptionRow[];
  todayKey: string;
  /** First load: placeholder rows instead of data. */
  isLoading: boolean;
  /** A new page is loading while the previous one stays on screen. */
  isRefreshing: boolean;
  /** Placeholder row count (the page size, capped). */
  skeletonRows: number;
  /** Distance from the top of the scroll area at which the column header sticks (below the filter bar). */
  stickyTop: number;
  onOpen: (prescription: DoctorPrescriptionRow) => void;
  onDownload: (prescription: DoctorPrescriptionRow) => void;
}

const VISIBLE_MEDICINES = 2;

function detailHref(row: DoctorPrescriptionRow): string {
  return `/doctor/prescriptions/${encodeURIComponent(row.id)}`;
}

function stopRowClick(event: MouseEvent) {
  event.stopPropagation();
}

/** "Paracetamol 500, Amoxicillin" plus a "+3 more" pill whose tooltip lists every medicine. */
function MedicinesCell({ medicines, adviceOnly }: { medicines: string[]; adviceOnly: boolean }) {
  if (medicines.length === 0) return <span className="text-ink-muted">{adviceOnly ? ADVICE_ONLY_LABEL : "—"}</span>;
  const shown = medicines.slice(0, VISIBLE_MEDICINES).join(", ");
  const hidden = medicines.length - VISIBLE_MEDICINES;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate" title={shown}>
        {shown}
      </span>
      {hidden > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={stopRowClick}
              aria-label={`${hidden} more medicines: ${medicines.slice(VISIBLE_MEDICINES).join(", ")}`}
              className="shrink-0 rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-bold text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-emerald-300"
            >
              +{hidden} more
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-left">
            <ul className="m-0 list-disc py-0.5 pl-4">
              {medicines.map((medicine) => (
                <li key={medicine}>{medicine}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

function StatusCell({ row }: { row: DoctorPrescriptionRow }) {
  const status = prescriptionStatusPill(row);
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Pill tone={status.tone} className="px-[7px] py-[3px] text-[10px]">
        {status.label}
      </Pill>
      {/* An advice-only prescription never goes to the pharmacy, so it has no pharmacy stage. */}
      {row.pharmacy && !isAdviceOnlyPrescription(row) ? (
        <span title={`Pharmacy: ${row.pharmacy.label}`}>
          <Pill tone={row.pharmacy.tone} className="px-[7px] py-[3px] text-[10px]">
            <span className="sr-only">Pharmacy: </span>
            {row.pharmacy.label}
          </Pill>
        </span>
      ) : null}
    </span>
  );
}

function RowActions({ row, onDownload }: { row: DoctorPrescriptionRow; onDownload: (row: DoctorPrescriptionRow) => void }) {
  const editable = row.id && isPrescriptionEditable(row.statusCode || row.status);
  return (
    <span className="flex items-center justify-end gap-1" onClick={stopRowClick}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDownload(row)}
        aria-label={`Download PDF of ${row.reference || "prescription"} for ${row.patientName}`}
        title="Download PDF"
      >
        <Download aria-hidden="true" />
      </Button>
      {editable ? (
        <Button asChild variant="ghost" size="icon-sm" title="Edit prescription">
          <Link href={`${detailHref(row)}/edit`} aria-label={`Edit ${row.reference || "prescription"} for ${row.patientName}`}>
            <Pencil aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <span className="size-8" aria-hidden="true" />
      )}
    </span>
  );
}

const TH = "bg-card px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted";
const TD = "px-3 py-1.5 align-middle";

function SkeletonBar({ className }: { className: string }) {
  return <span className={cn("block h-3 animate-pulse rounded bg-well", className)} />;
}

/** md and up: one dense row per prescription. */
function DesktopTable({
  rows,
  todayKey,
  isLoading,
  isRefreshing,
  skeletonRows,
  stickyTop,
  onOpen,
  onDownload,
}: DoctorPrescriptionsTableProps) {
  const headStyle = { top: stickyTop };
  return (
    <table className="hidden w-full table-fixed border-separate border-spacing-0 text-[13px] md:table" aria-busy={isLoading || isRefreshing}>
      <caption className="sr-only">Prescriptions, one row each. Select a row to open the prescription.</caption>
      <colgroup>
        <col className="w-[92px]" />
        <col className="w-[22%]" />
        <col className="hidden w-[118px] lg:table-column" />
        <col />
        <col className="hidden w-[18%] lg:table-column" />
        <col className="w-[168px]" />
        <col className="w-[80px]" />
      </colgroup>
      <thead>
        <tr>
          {[
            ["When", ""],
            ["Patient", ""],
            ["Rx no", "hidden lg:table-cell"],
            ["Medicines", ""],
            ["Diagnosis", "hidden lg:table-cell"],
            ["Status", ""],
          ].map(([label, extra]) => (
            <th key={label} scope="col" style={headStyle} className={cn(TH, "sticky z-10 border-b border-hair", extra)}>
              {label}
            </th>
          ))}
          <th scope="col" style={headStyle} className={cn(TH, "sticky z-10 border-b border-hair text-right")}>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className={cn("transition-opacity", isRefreshing && "opacity-60")}>
        {isLoading
          ? Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index} aria-hidden="true" className="h-12">
                <td className={cn(TD, "border-b border-hair")}><SkeletonBar className="w-12" /></td>
                <td className={cn(TD, "border-b border-hair")}><SkeletonBar className="w-32" /></td>
                <td className={cn(TD, "hidden border-b border-hair lg:table-cell")}><SkeletonBar className="w-20" /></td>
                <td className={cn(TD, "border-b border-hair")}><SkeletonBar className="w-40" /></td>
                <td className={cn(TD, "hidden border-b border-hair lg:table-cell")}><SkeletonBar className="w-24" /></td>
                <td className={cn(TD, "border-b border-hair")}><SkeletonBar className="w-20" /></td>
                <td className={cn(TD, "border-b border-hair")}><SkeletonBar className="ml-auto w-12" /></td>
              </tr>
            ))
          : rows.map((row) => (
              <tr
                key={row.id || row.reference}
                onClick={() => onOpen(row)}
                className="h-12 cursor-pointer transition-colors hover:bg-mint-soft/60 focus-within:bg-mint-soft/60 dark:hover:bg-white/5 dark:focus-within:bg-white/5 [&:last-child>td]:border-b-0"
              >
                <td className={cn(TD, "border-b border-hair whitespace-nowrap font-semibold text-ink-soft")} suppressHydrationWarning>
                  {prescriptionWhenLabel(row.date, todayKey)}
                </td>
                <td className={cn(TD, "border-b border-hair")}>
                  <span className="flex min-w-0 flex-col leading-tight">
                    {row.id ? (
                      <Link
                        href={detailHref(row)}
                        onClick={stopRowClick}
                        className="truncate font-bold text-ink hover:text-brand-dark hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 rounded-sm"
                        title={row.patientName}
                      >
                        {row.patientName}
                      </Link>
                    ) : (
                      <span className="truncate font-bold text-ink">{row.patientName}</span>
                    )}
                    <span className="truncate text-[11px] text-ink-muted">
                      {row.patientUhid ? `UHID ${row.patientUhid}` : ""}
                      <span className="lg:hidden">{row.patientUhid && row.reference ? " · " : ""}{row.reference}</span>
                    </span>
                  </span>
                </td>
                <td className={cn(TD, "hidden border-b border-hair font-mono text-[12px] text-ink-soft lg:table-cell")}>
                  <span className="block truncate" title={row.reference}>
                    {row.reference || "—"}
                  </span>
                </td>
                <td className={cn(TD, "border-b border-hair text-ink")}>
                  <MedicinesCell medicines={row.medicines} adviceOnly={isAdviceOnlyPrescription(row)} />
                </td>
                <td className={cn(TD, "hidden border-b border-hair text-ink-soft lg:table-cell")}>
                  <span className="block truncate" title={row.diagnosis || undefined}>
                    {row.diagnosis || "—"}
                  </span>
                </td>
                <td className={cn(TD, "border-b border-hair")}>
                  <StatusCell row={row} />
                </td>
                <td className={cn(TD, "border-b border-hair")}>
                  <RowActions row={row} onDownload={onDownload} />
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  );
}

/** Phones: two compact lines per prescription; the whole item opens it. */
function MobileList({ rows, todayKey, isLoading, isRefreshing, skeletonRows }: DoctorPrescriptionsTableProps) {
  if (isLoading) {
    return (
      <ul className="m-0 list-none p-0 md:hidden" aria-hidden="true">
        {Array.from({ length: Math.min(skeletonRows, 8) }).map((_, index) => (
          <li key={index} className="flex flex-col gap-2 border-b border-hair px-4 py-3 last:border-b-0">
            <SkeletonBar className="w-40" />
            <SkeletonBar className="w-56" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("m-0 list-none p-0 transition-opacity md:hidden", isRefreshing && "opacity-60")}>
      {rows.map((row) => {
        const status = prescriptionStatusPill(row);
        const medicines =
          row.medicines.length > VISIBLE_MEDICINES
            ? `${row.medicines.slice(0, VISIBLE_MEDICINES).join(", ")} +${row.medicines.length - VISIBLE_MEDICINES}`
            : row.medicines.join(", ") || (isAdviceOnlyPrescription(row) ? ADVICE_ONLY_LABEL : "");
        const body = (
          <>
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{row.patientName}</span>
              <span className="shrink-0 text-xs font-semibold text-ink-muted" suppressHydrationWarning>
                {prescriptionWhenLabel(row.date, todayKey)}
              </span>
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="min-w-0 flex-1 truncate">
                {row.reference ? <span className="font-mono">{row.reference}</span> : null}
                {row.reference && medicines ? " · " : ""}
                {medicines}
              </span>
              <Pill tone={status.tone} className="shrink-0 px-[7px] py-[3px] text-[10px]">
                {status.label}
              </Pill>
              <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            </span>
          </>
        );
        return (
          <li key={row.id || row.reference} className="border-b border-hair last:border-b-0">
            {row.id ? (
              <Link
                href={detailHref(row)}
                className="flex flex-col gap-1 px-4 py-2.5 hover:bg-mint-soft/60 focus-visible:bg-mint-soft/60 focus-visible:outline-hidden dark:hover:bg-white/5"
              >
                {body}
              </Link>
            ) : (
              <div className="flex flex-col gap-1 px-4 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The prescriptions list: a dense table from md up, a two-line list on phones. */
export function DoctorPrescriptionsTable(props: DoctorPrescriptionsTableProps) {
  return (
    <>
      {props.isLoading ? (
        <span className="sr-only" role="status">
          Loading prescriptions…
        </span>
      ) : null}
      <DesktopTable {...props} />
      <MobileList {...props} />
    </>
  );
}
