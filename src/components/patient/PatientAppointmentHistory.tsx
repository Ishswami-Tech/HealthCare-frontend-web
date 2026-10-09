"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CalendarX, ChevronDown, FileText, FlaskConical, Heart, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import { VisitCaseSheetSummary } from "@/components/patient/case-sheet/VisitCaseSheetSummary";
import {
  usePatientAppointmentHistory,
  type PatientAppointmentHistoryRow,
} from "@/hooks/query/usePatientAppointmentHistory";
import { useCreatePatientVisit } from "@/hooks/query/usePatientVisits";
import { cn } from "@/lib/utils";
import { formatDateTimeInIST, parseIstDateTime } from "@/lib/utils/date-time";

export type AppointmentHistoryTab = "history" | "vitals" | "reports" | "prescriptions";

interface PatientAppointmentHistoryProps {
  clinicId: string;
  /** Patient.id: the key of GET /ehr/clinic/patients/:patientId/appointments. */
  patientId: string;
  /** Only these roles may see case sheet content (see `canViewCaseSheet`). */
  caseSheetAllowed: boolean;
  /** Switch the record to another tab (vitals, reports, prescriptions, case sheet). */
  onOpenTab: (tab: AppointmentHistoryTab) => void;
  /** The case sheet tab should show this visit. */
  onOpenVisit: (visitId: string) => void;
}

const DATE_TIME_FORMAT = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
} as const;

function whenLabel(row: PatientAppointmentHistoryRow): string {
  const parsed = parseIstDateTime(row.date, row.time);
  return (parsed && formatDateTimeInIST(parsed, DATE_TIME_FORMAT)) || row.date || "Date not recorded";
}

function TypePill({ type }: { type: string }) {
  const code = type.toUpperCase();
  if (!code) return null;
  if (code.includes("VIDEO")) return <Pill tone="video">Video call</Pill>;
  if (code.includes("PERSON") || code.includes("CLINIC")) return <Pill tone="clinic">In-clinic</Pill>;
  return <Pill tone="slate">{statusLabel(type)}</Pill>;
}

/** A case sheet can be started for a visit that has begun or finished and has no OPD visit yet. */
function canStartCaseSheet(row: PatientAppointmentHistoryRow): boolean {
  const status = row.status.toUpperCase();
  // `visit === null` only: `undefined` means an older server that does not report visits.
  return (status === "COMPLETED" || status === "IN_PROGRESS") && row.visit === null;
}

function doctorLabel(name: string): string {
  return name ? `Dr. ${name.replace(/^Dr\.?\s*/i, "")}` : "Doctor not recorded";
}

function HistoryRow({
  row,
  clinicId,
  patientId,
  caseSheetAllowed,
  onOpenTab,
  onOpenVisit,
}: { row: PatientAppointmentHistoryRow } & PatientAppointmentHistoryProps) {
  const [open, setOpen] = useState(false);
  const createVisit = useCreatePatientVisit();
  const panelId = `history-${row.id}`;
  const detail = row.notes || row.cancellationReason;
  const visit = row.visit;

  const startCaseSheet = async () => {
    try {
      const created = await createVisit.mutateAsync({
        clinicId,
        input: { patientId, appointmentId: row.id, skipConsultationInvoice: true },
      });
      onOpenVisit(created.id);
    } catch {
      // The mutation hook shows the error toast.
    }
  };

  return (
    <li className="border-b border-hair last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-mint-soft focus-visible:bg-mint-soft focus-visible:outline-hidden"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-sm font-bold text-ink">{whenLabel(row)}</span>
            <TypePill type={row.type} />
            <Pill tone={statusTone(row.status)}>{statusLabel(row.status)}</Pill>
            {visit ? <Pill tone="white">{visit.opdNumber || "OPD visit"}</Pill> : null}
          </span>
          <span className="text-xs text-ink-muted">{doctorLabel(row.doctorName)}</span>
          {detail ? <span className="line-clamp-2 text-[13px] text-ink-soft">{detail}</span> : null}
        </span>
        <ChevronDown
          className={cn("mt-1 size-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div id={panelId} className="flex flex-col gap-3.5 border-t border-hair bg-background/60 px-5 py-4">
          {caseSheetAllowed ? (
            visit ? (
              <>
                <VisitCaseSheetSummary clinicId={clinicId} visitId={visit.id} />
                <div>
                  <Button variant="outline" onClick={() => onOpenVisit(visit.id)}>
                    <FileText />
                    Open full case sheet
                  </Button>
                </div>
              </>
            ) : canStartCaseSheet(row) ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="m-0 text-sm text-ink-muted">No case sheet has been started for this appointment.</p>
                <Button onClick={() => void startCaseSheet()} disabled={createVisit.isPending}>
                  {createVisit.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                  Start case sheet
                </Button>
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-muted">There is no case sheet for this appointment.</p>
            )
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-muted">Related records</span>
            <Button variant="outline" size="sm" onClick={() => onOpenTab("vitals")}>
              <Heart />
              Vitals
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenTab("prescriptions")}>
              <FileText />
              Prescriptions
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenTab("reports")}>
              <FlaskConical />
              Reports
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** Timeline of every appointment of one patient (video and in-person), newest first. */
export function PatientAppointmentHistory(props: PatientAppointmentHistoryProps) {
  const { patientId } = props;
  const query = usePatientAppointmentHistory(patientId);
  const rows = useMemo(() => query.data?.pages.flatMap((page) => page.rows) ?? [], [query.data]);

  if (query.isPending) {
    return (
      <Surface flush aria-busy="true" aria-label="Loading appointment history">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2 border-b border-hair px-5 py-3.5 last:border-b-0">
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </Surface>
    );
  }

  if (query.isError && rows.length === 0) {
    return (
      <Surface flush role="alert">
        <EmptyBlock
          icon={AlertCircle}
          tone="rose"
          title="The appointment history could not be loaded"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw />
              Try again
            </Button>
          }
        />
      </Surface>
    );
  }

  if (rows.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={CalendarX}
          title="No appointments yet"
          description="Video and in-person appointments of this patient show here, newest first."
        />
      </Surface>
    );
  }

  return (
    <Surface flush as="section" aria-label="Appointment history">
      <ul className="m-0 list-none p-0">
        {rows.map((row) => (
          <HistoryRow key={row.id} row={row} {...props} />
        ))}
      </ul>
      {query.hasNextPage ? (
        <div className="flex justify-center border-t border-hair px-5 py-3">
          <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </Surface>
  );
}
