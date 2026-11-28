"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kv, Surface } from "@/components/tbd";
import { formatDateInIST } from "@/lib/utils/date-time";

/** The clinical facts of the previous OPD visit, as the visit list reports them. */
export interface PreviousVisitInfo {
  id: string;
  opdNumber: string;
  registrationDate: string;
  presentComplaints: string | null;
  presentIllness: string | null;
  knownCaseOf: string | null;
}

export interface LastVisitStripProps {
  /** The visit before this one. */
  visit: PreviousVisitInfo;
  /** The patient's active medicines on record (the count, not the list). */
  activeMedicationsCount: number;
  /** Opens that visit's case sheet. Without it the strip is read-only. */
  onOpenVisit?: ((visitId: string) => void) | undefined;
}

/** "29 Oct 2026" */
function visitDate(value: string): string {
  return formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" });
}

const text = (value: string | null): string => value?.trim() ?? "";

/**
 * A read-only strip at the top of the Complaints section: what the doctor wrote
 * in the previous OPD visit, so the current consultation starts from the last one.
 */
export function LastVisitStrip({ visit, activeMedicationsCount, onOpenVisit }: LastVisitStripProps) {
  return (
    <Surface
      as="section"
      aria-label="From the last visit"
      className="gap-3 border-l-[3px] border-l-brand/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
            From the last visit
          </span>
          <span className="text-sm font-bold text-ink">
            OPD {visit.opdNumber} · {visitDate(visit.registrationDate)}
          </span>
        </div>
        {onOpenVisit ? (
          <Button variant="outline" size="sm" onClick={() => onOpenVisit(visit.id)}>
            Open that case sheet
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Kv label="Symptoms" value={text(visit.presentComplaints) || "Not recorded"} strong={false} />
        <Kv label="Present illness" value={text(visit.presentIllness) || "Not recorded"} strong={false} />
        <Kv label="Known case of" value={text(visit.knownCaseOf) || "Not recorded"} strong={false} />
        <Kv label="Active medicines on record" value={String(activeMedicationsCount)} strong={false} />
      </div>
    </Surface>
  );
}
