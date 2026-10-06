"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CalendarX,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  Phone,
  Pill as PillIcon,
  Play,
  UserX,
  Video,
} from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTitle, EmptyBlock, InitialsAvatar, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import { VIDEO_JOIN_EARLY_WINDOW_MINUTES } from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentViewFilter, TransformedAppointment } from "../page";
import { getPatientContact, getPatientLine, getVisitTypeLabel } from "./appointmentLabels";
import type { DoctorAppointmentDetailsTab } from "./DoctorAppointmentsDetailsDialog";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * One line per visit on a wide card (patient, type, status, details, actions).
 * On a narrow card the same cells stack: name and status first, then the rest.
 * `@5xl` is a container width, so the layout follows the card, not the window.
 */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @5xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)_100px_minmax(0,1.1fr)_388px] @5xl:items-center @5xl:gap-x-4";
const CELL_BELOW = "col-[2/-1] @5xl:col-auto @5xl:row-auto";

interface DoctorAppointmentsTableProps {
  appointments: TransformedAppointment[];
  appointmentViewFilter: DoctorAppointmentViewFilter;
  /** Changes when the filter or the search text changes; the table goes back to page 1. */
  resetKey: string;
  clinicId?: string | undefined;
  loading: boolean;
  selectedIds: Set<string>;
  selectedCount: number;
  onToggleSelected: (id: string, checked: boolean) => void;
  onClearSelection: () => void;
  onBulkComplete: () => void;
  bulkCompletePending: boolean;
  startAppointmentPending: boolean;
  completeAppointmentPending: boolean;
  onOpenDetails: (appointment: TransformedAppointment, tab?: DoctorAppointmentDetailsTab) => void;
  onStart: (appointment: TransformedAppointment) => void;
  onComplete: (appointment: TransformedAppointment) => void;
}

/**
 * A confirmed video visit the doctor completes directly: there is no in-progress hop to take.
 * The backend allows CONFIRMED -> COMPLETED for a video visit once its join window has opened,
 * which is exactly when `joinOpensLater` turns false.
 */
export function canCompleteConfirmedVideoVisit(appointment: TransformedAppointment): boolean {
  return appointment.status === "CONFIRMED" && appointment.isVideo && !appointment.joinOpensLater;
}

function RowActions({
  appointment: app,
  clinicId,
  startAppointmentPending,
  completeAppointmentPending,
  onOpenDetails,
  onStart,
  onComplete,
}: Pick<
  DoctorAppointmentsTableProps,
  "clinicId" | "startAppointmentPending" | "completeAppointmentPending" | "onOpenDetails" | "onStart" | "onComplete"
> & { appointment: TransformedAppointment }) {
  const openVideo = () => {
    window.location.assign(buildVideoSessionRoute(app.id));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenDetails(app)}
        aria-label={`View details for ${app.patientName}`}
        title="View details"
      >
        <Eye />
      </Button>

      {app.patientId ? (
        <Button asChild variant="outline" size="icon">
          <Link
            href={`/doctor/patients/${encodeURIComponent(app.patientId)}`}
            aria-label={`Open EHR for ${app.patientName}`}
            title="Open EHR"
          >
            <FileText />
          </Link>
        </Button>
      ) : null}

      {app.canJoinVideo ? (
        <Button variant="action" onClick={openVideo}>
          <Play />
          Join Session
        </Button>
      ) : null}

      {app.joinOpensLater ? (
        <span className="text-xs font-medium text-ink-muted">
          Join opens {VIDEO_JOIN_EARLY_WINDOW_MINUTES} min before
        </span>
      ) : null}

      {app.status === "CONFIRMED" && !app.isVideo ? (
        <Button onClick={() => onStart(app)} disabled={startAppointmentPending}>
          {startAppointmentPending ? <Loader2 className="animate-spin" /> : <Play />}
          Start
        </Button>
      ) : null}

      {canCompleteConfirmedVideoVisit(app) ? (
        <>
          <Button variant="soft" onClick={() => onOpenDetails(app, "prescription")}>
            <PillIcon />
            Prescribe
          </Button>
          <Button onClick={() => onComplete(app)} disabled={completeAppointmentPending}>
            {completeAppointmentPending ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            Complete
          </Button>
        </>
      ) : null}

      {app.status === "IN_PROGRESS" ? (
        <>
          {app.isVideo ? (
            <Button
              variant="outline"
              size="icon"
              onClick={openVideo}
              aria-label={`Open video call with ${app.patientName}`}
              title="Open video"
            >
              <Video />
            </Button>
          ) : null}
          <Button variant="soft" onClick={() => onOpenDetails(app, "prescription")}>
            <PillIcon />
            Prescribe
          </Button>
          <Button onClick={() => onComplete(app)} disabled={completeAppointmentPending}>
            {completeAppointmentPending ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            Complete
          </Button>
        </>
      ) : null}

      {app.status === "NO_SHOW" || app.status === "CANCELLED" ? (
        <>
          {app.patientPhone ? (
            <Button asChild variant="outline">
              <a href={`tel:${app.patientPhone}`} aria-label={`Call ${app.patientName}`}>
                <Phone />
                Call
              </a>
            </Button>
          ) : null}
          <BookAppointmentDialog
            {...(clinicId ? { clinicId } : {})}
            {...(app.patientId ? { initialPatientId: app.patientId } : {})}
            initialDoctorId={app.doctorId}
            initialConsultationMode={app.isVideo ? "VIDEO" : "IN_PERSON"}
            trigger={
              <Button aria-label={`Book again for ${app.patientName}`}>
                <CalendarPlus />
                Book again
              </Button>
            }
          />
        </>
      ) : null}
    </div>
  );
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={cn(ROW_GRID, "items-center gap-y-2.5 border-b border-hair py-3.5 last:border-b-0 @5xl:min-h-16 @5xl:py-2")}>
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-[38px] shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <div className={cn(CELL_BELOW, "row-[2] flex flex-col gap-1.5")}>
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3 w-40 max-w-full rounded" />
          </div>
          <div className="col-[2] row-[1] @5xl:col-auto @5xl:row-auto">
            <Skeleton className="h-[22px] w-20 rounded-lg" />
          </div>
          <div className={cn(CELL_BELOW, "row-[3] flex flex-col gap-1.5")}>
            <Skeleton className="h-3.5 w-36 max-w-full rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <div className={cn(CELL_BELOW, "row-[4] flex gap-2")}>
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DoctorAppointmentsTable({
  appointments,
  appointmentViewFilter,
  resetKey,
  clinicId,
  loading,
  selectedIds,
  selectedCount,
  onToggleSelected,
  onClearSelection,
  onBulkComplete,
  bulkCompletePending,
  startAppointmentPending,
  completeAppointmentPending,
  onOpenDetails,
  onStart,
  onComplete,
}: DoctorAppointmentsTableProps) {
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPageIndex(0);
  }

  const total = appointments.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = appointments.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const rangeStart = total === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : currentPage * pageSize + pageRows.length;
  const isMissedView = appointmentViewFilter === "NO_SHOW";

  return (
    <Surface flush as="section" className="@container" aria-label={isMissedView ? "Missed appointments" : "Appointments"}>
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair bg-mint-soft px-5 py-2.5">
          <span className="text-sm font-bold text-brand-dark" role="status">
            {selectedCount} appointment{selectedCount === 1 ? "" : "s"} selected
          </span>
          <span className="flex items-center gap-2">
            <Button variant="ghost" className="font-bold text-brand hover:bg-mint hover:text-brand-dark" onClick={onClearSelection}>
              Clear
            </Button>
            <Button onClick={onBulkComplete} disabled={bulkCompletePending}>
              {bulkCompletePending ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              Complete selected
            </Button>
          </span>
        </div>
      ) : null}

      {isMissedView ? (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-hair px-5 py-3.5">
          <UserX className="size-[18px] shrink-0 text-[#be123c] dark:text-rose-300" strokeWidth={2.2} aria-hidden="true" />
          <h2 className="m-0 text-sm font-bold text-ink">Missed appointments</h2>
          <p className="m-0 text-[13px] font-medium text-ink-muted">
            Patients who do not turn up show here with Call and Book again.
          </p>
        </div>
      ) : null}

      <div role="table" aria-label={isMissedView ? "Missed appointments" : "Appointments"} aria-busy={loading}>
        <div
          role="row"
          className={cn(
            ROW_GRID,
            "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @5xl:grid",
          )}
        >
          <span role="columnheader">Patient</span>
          <span role="columnheader">Type</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Details</span>
          <span role="columnheader">Actions</span>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : pageRows.length === 0 ? (
          <div role="row">
            <div role="cell">
              {isMissedView ? (
                <EmptyBlock
                  icon={UserX}
                  title="No missed appointments"
                  description="Patients who do not turn up show here with Call and Book again."
                />
              ) : (
                <EmptyBlock
                  icon={CalendarX}
                  title="No appointments match this view"
                  description="Adjust your filters or try again once data is available."
                />
              )}
            </div>
          </div>
        ) : (
          pageRows.map((app) => {
            const isSelectable = app.status === "IN_PROGRESS" || canCompleteConfirmedVideoVisit(app);
            const isSelected = selectedIds.has(app.id);
            const patientAvatar = <InitialsAvatar name={app.patientName} size={38} />;
            return (
              <div
                key={app.id}
                role="row"
                className={cn(
                  ROW_GRID,
                  "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0 @5xl:min-h-16 @5xl:py-2",
                )}
              >
                <div role="cell" className="min-w-0">
                  <CellTitle
                    left={
                      isSelectable ? (
                        <button
                          type="button"
                          className={cn(
                            "shrink-0 rounded-full transition-shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                            isSelected && "ring-2 ring-brand ring-offset-2",
                          )}
                          aria-label={`Select ${app.patientName} for bulk completion`}
                          aria-pressed={isSelected}
                          onClick={() => onToggleSelected(app.id, !isSelected)}
                        >
                          {patientAvatar}
                        </button>
                      ) : (
                        patientAvatar
                      )
                    }
                    title={
                      app.patientId ? (
                        <Link
                          href={`/doctor/patients/${encodeURIComponent(app.patientId)}`}
                          className="text-ink transition-colors hover:text-brand hover:underline focus-visible:text-brand focus-visible:underline focus-visible:outline-hidden"
                          aria-label={`Open profile for ${app.patientName}`}
                          title="Open patient profile"
                        >
                          {app.patientName}
                        </Link>
                      ) : (
                        app.patientName
                      )
                    }
                    description={getPatientLine(app)}
                  />
                </div>
                <div role="cell" className={cn(CELL_BELOW, "row-[2] min-w-0")}>
                  <CellTitle
                    title={getVisitTypeLabel(app.type)}
                    description={`${app.appointmentDate} · ${app.time} · ${app.duration}`}
                  />
                </div>
                <div role="cell" className="col-[2] row-[1] min-w-0 @5xl:col-auto @5xl:row-auto">
                  <Pill tone={statusTone(app.status)}>{statusLabel(app.status)}</Pill>
                </div>
                <div role="cell" className={cn(CELL_BELOW, "row-[3] min-w-0")}>
                  <CellTitle
                    title={<span className="font-medium">{app.chiefComplaint}</span>}
                    description={getPatientContact(app)}
                  />
                </div>
                <div role="cell" className={cn(CELL_BELOW, "row-[4] min-w-0")}>
                  <RowActions
                    appointment={app}
                    clinicId={clinicId}
                    startAppointmentPending={startAppointmentPending}
                    completeAppointmentPending={completeAppointmentPending}
                    onOpenDetails={onOpenDetails}
                    onStart={onStart}
                    onComplete={onComplete}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {loading ? null : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
          <span>
            Showing {rangeStart}–{rangeEnd} of {total} row(s)
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span id="doctor-appointments-page-size">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-labelledby="doctor-appointments-page-size"
                className="h-[34px] rounded-[10px] px-2.5 text-[13px] font-semibold text-ink data-[size=sm]:h-[34px]"
              >
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
          <nav aria-label="Pages" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => setPageIndex(Math.max(0, currentPage - 1))}
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
              onClick={() => setPageIndex(Math.min(pageCount - 1, currentPage + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </Surface>
  );
}
