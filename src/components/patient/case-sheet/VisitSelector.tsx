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
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useCreatePatientVisit, usePatientVisits } from "@/hooks/query/usePatientVisits";
import type { PatientVisit } from "@/types/patient-visit.types";

interface VisitSelectorProps {
  clinicId: string;
  patientId: string;
  selectedVisitId: string | null;
  onSelect: (visitId: string) => void;
}

/** Newest visits shown as chips; anything older goes into the dropdown. */
const VISIBLE_CHIPS = 4;
/** Upper bound on visits loaded for the dropdown (a returning patient can have hundreds). */
const MAX_VISITS = 200;

/**
 * A patient's OPD visits (newest first) with a "New OPD visit" action.
 * Auto-selects the newest visit when none is chosen. Only the most recent
 * visits are rendered as chips so a long-standing patient's history doesn't
 * push the case-sheet below the fold.
 */
export function VisitSelector({ clinicId, patientId, selectedVisitId, onSelect }: VisitSelectorProps) {
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

  const chipVisits = visits.slice(0, VISIBLE_CHIPS);
  const olderVisits = visits.slice(VISIBLE_CHIPS);
  const selectedOlder = olderVisits.find((visit) => visit.id === selectedVisitId) ?? null;

  const chip = (visit: PatientVisit) => {
    const active = visit.id === selectedVisitId;
    return (
      <button
        key={visit.id}
        type="button"
        onClick={() => onSelect(visit.id)}
        aria-pressed={active}
        className={cn(
          "rounded-full border px-3 py-1 text-xs transition-colors",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 bg-background text-foreground hover:bg-muted",
        )}
      >
        <span className="font-semibold">{visit.opdNumber}</span>
        <span className={cn("ml-1.5", active ? "opacity-90" : "text-muted-foreground")}>
          {formatDateInIST(visit.registrationDate)}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OPD visits</span>
      {visitsQuery.isPending ? (
        <span className="text-sm text-muted-foreground">Loading…</span>
      ) : visits.length === 0 ? (
        <span className="text-sm text-muted-foreground">No OPD visit yet</span>
      ) : (
        <>
          {chipVisits.map(chip)}
          {selectedOlder ? chip(selectedOlder) : null}
          {olderVisits.length > 0 ? (
            <Select value={selectedOlder?.id ?? ""} onValueChange={onSelect}>
              <SelectTrigger size="sm" className="h-7 rounded-full text-xs" aria-label="Older OPD visits">
                <SelectValue placeholder={`${olderVisits.length} older`} />
              </SelectTrigger>
              <SelectContent>
                {olderVisits.map((visit) => (
                  <SelectItem key={visit.id} value={visit.id} className="text-xs">
                    {visit.opdNumber} · {formatDateInIST(visit.registrationDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </>
      )}
      <Button size="sm" variant="outline" onClick={() => void handleCreate()} disabled={createVisit.isPending}>
        <Plus className="mr-1 size-4" />
        New OPD visit
      </Button>
    </div>
  );
}
