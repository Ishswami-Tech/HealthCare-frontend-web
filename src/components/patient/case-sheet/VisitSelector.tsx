"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useCreatePatientVisit, usePatientVisits } from "@/hooks/query/usePatientVisits";
import type { PatientVisit } from "@/types/patient-visit.types";

interface VisitSelectorProps {
  clinicId: string;
  patientId: string;
  selectedVisitId: string | null;
  onSelect: (visitId: string) => void;
  /**
   * The "New OPD visit" button after the visits. Turn it off when the screen has its own
   * button for that (the EHR workspace keeps it in the patient header).
   */
  showCreate?: boolean;
  className?: string;
}

/** Newest visits shown as chips; anything older goes into the dropdown. */
const VISIBLE_CHIPS = 4;
/** Upper bound on visits loaded for the dropdown (a returning patient can have hundreds). */
export const MAX_VISITS = 200;

/** "28 Sept 2026" */
function visitDate(value: string): string {
  return formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" });
}

export type VisitSelectorVisit = Pick<PatientVisit, "id" | "opdNumber" | "registrationDate">;

export interface VisitSelectorViewProps {
  /** Newest first. */
  visits: VisitSelectorVisit[];
  loading?: boolean;
  selectedVisitId: string | null;
  onSelect: (visitId: string) => void;
  /** Leave out to hide the "New OPD visit" button. */
  onCreate?: (() => void) | undefined;
  createPending?: boolean;
  className?: string;
}

/** The row of OPD visit chips. Props only: the data hooks live in `VisitSelector`. */
export function VisitSelectorView({
  visits,
  loading = false,
  selectedVisitId,
  onSelect,
  onCreate,
  createPending = false,
  className,
}: VisitSelectorViewProps) {
  const chipVisits = visits.slice(0, VISIBLE_CHIPS);
  const olderVisits = visits.slice(VISIBLE_CHIPS);
  const selectedOlder = olderVisits.find((visit) => visit.id === selectedVisitId) ?? null;

  const chip = (visit: VisitSelectorVisit) => {
    const active = visit.id === selectedVisitId;
    return (
      <button
        key={visit.id}
        type="button"
        onClick={() => onSelect(visit.id)}
        aria-pressed={active}
        className={cn(
          "inline-flex min-h-[34px] items-center gap-2 whitespace-nowrap rounded-full border px-[13px] text-[13px] transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
          active
            ? "border-[#047857] bg-[#047857] text-white"
            : "border-line bg-card text-ink hover:bg-mint-soft",
        )}
      >
        <span className="font-bold">{visit.opdNumber}</span>
        <span className={active ? "text-[#d1fae5]" : "text-ink-muted"}>{visitDate(visit.registrationDate)}</span>
      </button>
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">OPD visits</span>
      {loading ? (
        <span className="flex items-center gap-2" role="status" aria-label="Loading OPD visits">
          <Skeleton className="h-[34px] w-[168px] rounded-full" />
          <Skeleton className="h-[34px] w-[168px] rounded-full" />
        </span>
      ) : visits.length === 0 ? (
        <span className="text-[13px] text-ink-muted">No OPD visit yet</span>
      ) : (
        <>
          {chipVisits.map(chip)}
          {selectedOlder ? chip(selectedOlder) : null}
          {olderVisits.length > 0 ? (
            <Select value={selectedOlder?.id ?? ""} onValueChange={onSelect}>
              <SelectTrigger
                size="sm"
                className="w-auto gap-1.5 rounded-full border-line bg-card px-3 py-0 text-[13px] text-ink-soft data-[size=sm]:h-[34px]"
                aria-label="Older OPD visits"
              >
                <SelectValue placeholder={`${olderVisits.length} older`} />
              </SelectTrigger>
              <SelectContent>
                {olderVisits.map((visit) => (
                  <SelectItem key={visit.id} value={visit.id} className="text-[13px]">
                    {visit.opdNumber} · {visitDate(visit.registrationDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </>
      )}
      {onCreate ? (
        <Button variant="outline" className="h-[34px] rounded-full" onClick={onCreate} disabled={createPending}>
          <Plus />
          New OPD visit
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A patient's OPD visits (newest first) with a "New OPD visit" action.
 * Auto-selects the newest visit when none is chosen. Only the most recent
 * visits are rendered as chips so a long-standing patient's history doesn't
 * push the case-sheet below the fold.
 */
export function VisitSelector({
  clinicId,
  patientId,
  selectedVisitId,
  onSelect,
  showCreate = true,
  className,
}: VisitSelectorProps) {
  const visitsQuery = usePatientVisits(clinicId, patientId, { limit: MAX_VISITS });
  const createVisit = useCreatePatientVisit();
  const visits = visitsQuery.data?.visits ?? [];
  const newestVisitId = visits[0]?.id ?? null;

  useEffect(() => {
    if (!selectedVisitId && newestVisitId) {
      onSelect(newestVisitId);
    }
  }, [newestVisitId, onSelect, selectedVisitId]);

  const handleCreate = async () => {
    try {
      const visit = await createVisit.mutateAsync({ clinicId, input: { patientId } });
      onSelect(visit.id);
    } catch {
      // Error toast is shown by the mutation hook.
    }
  };

  return (
    <VisitSelectorView
      visits={visits}
      loading={visitsQuery.isPending}
      selectedVisitId={selectedVisitId}
      onSelect={onSelect}
      onCreate={showCreate ? () => void handleCreate() : undefined}
      createPending={createVisit.isPending}
      {...(className ? { className } : {})}
    />
  );
}
