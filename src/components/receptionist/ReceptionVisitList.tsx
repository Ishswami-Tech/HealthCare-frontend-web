"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pill,
  SkeletonRows,
  VisitTypeChip,
  type TbdIcon,
} from "@/components/tbd";
import type { ReceptionVisit } from "./reception.logic";
import { RECEPTION_ROUTES } from "./useReceptionDesk";

export interface ReceptionVisitActions {
  /** One click check-in; the row shows the button only when the visit can be checked in. */
  onCheckIn?: (visit: ReceptionVisit) => void;
  /** Id of the visit whose check-in is running. */
  checkingInId?: string | null;
  /** Extra buttons at the end of a row (Reschedule, No-show). */
  renderMore?: (visit: ReceptionVisit) => ReactNode;
}

/** Status tag of a desk row, with the token, the walk-in tag and the urgent tag. */
export function ReceptionStatus({ visit }: { visit: ReceptionVisit }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Pill tone={visit.statusTone}>{visit.statusLabel}</Pill>
      {visit.tokenLabel ? <Pill tone="white">{visit.tokenLabel}</Pill> : null}
      {visit.isUrgent ? <Pill tone="rose">Urgent</Pill> : null}
      {visit.isWalkIn ? <Pill tone="slate">Walk-in</Pill> : null}
    </span>
  );
}

/** The one-click "Check in" button, or the arrival time once the patient is checked in. */
export function CheckInCell({
  visit,
  onCheckIn,
  pending,
}: {
  visit: ReceptionVisit;
  onCheckIn?: ((visit: ReceptionVisit) => void) | undefined;
  pending: boolean;
}) {
  if (visit.canCheckIn && onCheckIn) {
    return (
      <Button size="md" onClick={() => onCheckIn(visit)} disabled={pending} aria-label={`Check in ${visit.patientName}`}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
        {pending ? "Checking in…" : "Check in"}
      </Button>
    );
  }
  if (visit.checkedInLabel) {
    return <span className="text-[13px] font-semibold text-brand">Checked in {visit.checkedInLabel}</span>;
  }
  return null;
}

/**
 * The desk's appointment table (dashboard, check-in, appointments, patient page): time, patient,
 * doctor, visit type, status, and the one-click check-in. Only names, times and statuses: reception
 * sees no clinical record.
 */
export function ReceptionVisitList({
  visits,
  isLoading = false,
  error = null,
  onRetry,
  showType = true,
  showDate = false,
  emptyTitle = "No appointments",
  emptyDescription,
  emptyIcon = CalendarClock,
  emptyAction,
  onCheckIn,
  checkingInId = null,
  renderMore,
}: {
  visits: ReceptionVisit[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  showType?: boolean;
  /** Shows the day with the time (lists that span more than today). */
  showDate?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: TbdIcon;
  emptyAction?: ReactNode;
} & ReceptionVisitActions) {
  const columns = showType
    ? "110px minmax(0,1.4fr) minmax(0,1fr) 110px minmax(0,1fr) auto"
    : "110px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) auto";
  const labels = ["Time", "Patient", "Doctor", ...(showType ? ["Type"] : []), "Status", ""];

  if (isLoading) return <SkeletonRows rows={5} />;
  if (error && visits.length === 0) {
    return <LoadError title="Appointments could not be loaded" message={error.message} onRetry={onRetry} />;
  }
  if (visits.length === 0) {
    return <EmptyBlock icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div role="table" aria-label="Appointments">
      <GridHead columns={columns} labels={labels} />
      {visits.map((visit) => (
        <GridRow key={visit.id} columns={columns}>
          <span className="flex flex-col text-[13px] font-bold text-ink">
            {visit.timeLabel || "No time"}
            {showDate ? <span className="text-xs font-medium text-ink-muted">{visit.whenLabel.split(" · ")[0]}</span> : null}
          </span>
          <CellTitle
            left={<InitialsAvatar name={visit.patientName} size={36} />}
            title={
              <Link href={RECEPTION_ROUTES.appointment(visit.id)} className="hover:text-brand-dark hover:underline">
                {visit.patientName}
              </Link>
            }
            description={visit.patientPhone || "No phone"}
          />
          <span className="truncate text-[13px] text-ink-soft">{visit.doctorName}</span>
          {showType ? <VisitTypeChip type={visit.kind === "video" ? "VIDEO_CALL" : "IN_PERSON"} /> : null}
          <ReceptionStatus visit={visit} />
          <span className="flex flex-wrap items-center justify-end gap-2">
            <CheckInCell visit={visit} onCheckIn={onCheckIn} pending={checkingInId === visit.id} />
            {renderMore?.(visit)}
            <Link
              href={RECEPTION_ROUTES.appointment(visit.id)}
              className="inline-flex size-10 items-center justify-center rounded-xl text-ink-muted hover:bg-mint-soft hover:text-brand"
              aria-label={`Open appointment of ${visit.patientName}`}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </span>
        </GridRow>
      ))}
    </div>
  );
}
