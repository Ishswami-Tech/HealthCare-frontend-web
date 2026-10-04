"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, FileText, Loader2, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  InitialsAvatar,
  Pill,
  SectionTitle,
  Surface,
  statusTone,
  type TbdIcon,
} from "@/components/tbd";
import { getQueuePatientDisplayName, getQueuePositionLabel } from "@/lib/queue/queue-adapter";
import { cn } from "@/lib/utils";
import { QUEUE_AVATAR_CLASS } from "./QueuePatientSummary";
import {
  QUEUE_PAGE_SIZE,
  getQueueDisplayLabel,
  getQueueStatusText,
  getQueueWaitText,
  type QueueDisplayItem,
  type QueuePrimaryAction,
} from "./queue.logic";

/**
 * One line per patient on a wide card (patient, doctor, category, status, wait time, actions).
 * On a narrow card the cells stack: name and status first, then the rest, actions last.
 * `@5xl` is a container width, so the layout follows the card, not the window.
 */
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @5xl:items-center @5xl:gap-x-4";
/** Doctors get one more button on a row (Start / Case sheet), so the last column is wider. */
const COLUMNS_WITH_MAIN_ACTION =
  "@5xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_108px_78px_366px]";
const COLUMNS =
  "@5xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px_264px]";
const CELL_AUTO = "@5xl:col-auto @5xl:row-auto";

/** What a row can do. The same for both tabs; the container decides who sees which button. */
export interface QueueRowActions {
  /** Doctors: reserve room for the Start / Case sheet button. */
  hasMainAction: boolean;
  canAssignDoctor: boolean;
  isAssignPending: boolean;
  /** Entry being moved to another queue right now. */
  transferringId: string | null;
  /** Entry whose visit is being started right now. */
  startingId: string | null;
  onStart: (item: QueueDisplayItem) => void;
  onAssignDoctor: (item: QueueDisplayItem) => void;
  onMoveTo: (item: QueueDisplayItem) => void;
}

export interface QueueLaneCardProps {
  icon: TbdIcon;
  title: string;
  description: string;
  /** Lanes of this tab with the number of patients in each. */
  lanes: Array<{ key: string; title: string; count: number }>;
  activeLane: string;
  activeLaneTitle: string;
  onLaneChange: (lane: string) => void;
  items: QueueDisplayItem[];
  /** Entry id -> the doctor's own next step on that row. */
  primaryActions: Record<string, QueuePrimaryAction>;
  actions: QueueRowActions;
  /** Changes when a filter changes; the table goes back to page 1. */
  resetKey: string;
}

function RowButtons({
  item,
  name,
  primary,
  actions,
}: {
  item: QueueDisplayItem;
  name: string;
  primary: QueuePrimaryAction | undefined;
  actions: QueueRowActions;
}) {
  const isStarting = actions.startingId === item.id;
  const isMoving = actions.transferringId === item.id;

  return (
    <div className="flex flex-wrap items-center gap-2 @5xl:flex-nowrap @5xl:justify-end">
      {primary === "case-sheet" ? (
        <Button asChild>
          <Link href={`/doctor/patients/${encodeURIComponent(item.patientId)}`} aria-label={`Case sheet for ${name}`}>
            <FileText />
            Case sheet
          </Link>
        </Button>
      ) : null}

      {primary === "start" ? (
        <Button
          onClick={() => actions.onStart(item)}
          disabled={actions.startingId !== null}
          aria-label={`Start visit for ${name}`}
        >
          {isStarting ? <Loader2 className="animate-spin" /> : <Play />}
          Start
        </Button>
      ) : null}

      {actions.canAssignDoctor ? (
        <Button
          variant="soft"
          onClick={() => actions.onAssignDoctor(item)}
          disabled={!item.appointmentId || actions.isAssignPending}
          aria-label={`Assign doctor for ${name}`}
        >
          <Users />
          Assign doctor
        </Button>
      ) : null}

      <Button
        variant="outline"
        onClick={() => actions.onMoveTo(item)}
        disabled={isMoving}
        aria-label={`Move to another queue: ${name}`}
      >
        Move to
        {isMoving ? <Loader2 className="animate-spin" /> : <ArrowRight />}
      </Button>
    </div>
  );
}

/** Lane chips, the patients of the chosen lane, and paging. Used by both tabs. */
export function QueueLaneCard({
  icon,
  title,
  description,
  lanes,
  activeLane,
  activeLaneTitle,
  onLaneChange,
  items,
  primaryActions,
  actions,
  resetKey,
}: QueueLaneCardProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPageIndex(0);
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / QUEUE_PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = items.slice(currentPage * QUEUE_PAGE_SIZE, currentPage * QUEUE_PAGE_SIZE + QUEUE_PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : currentPage * QUEUE_PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : currentPage * QUEUE_PAGE_SIZE + pageRows.length;
  const rowGrid = cn(ROW_GRID, actions.hasMainAction ? COLUMNS_WITH_MAIN_ACTION : COLUMNS);
  const tableLabel = `${activeLaneTitle} queue`;

  return (
    <Surface flush as="section" className="@container" aria-label={title}>
      <div className="flex flex-col gap-3.5 border-b border-hair px-5 pb-4 pt-5">
        <SectionTitle icon={icon} title={title} count={total} description={description} />
        <FilterChips
          ariaLabel={`${title}: choose a lane`}
          options={lanes.map((lane) => ({ value: lane.key, label: lane.title, count: lane.count }))}
          value={activeLane}
          onChange={onLaneChange}
        />
      </div>

      <div role="table" aria-label={tableLabel}>
        <div
          role="row"
          className={cn(
            rowGrid,
            "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @5xl:grid",
          )}
        >
          <span role="columnheader">Patient</span>
          <span role="columnheader">Doctor</span>
          <span role="columnheader">Category</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Wait time</span>
          <span role="columnheader">Actions</span>
        </div>

        {pageRows.length === 0 ? (
          <div role="row">
            <div role="cell">
              <EmptyBlock
                icon={Users}
                title="No one is waiting here"
                description={`There are no patients in the ${activeLaneTitle} queue right now.`}
              />
            </div>
          </div>
        ) : (
          pageRows.map((item) => {
            const name = getQueuePatientDisplayName(item);
            const waitText = getQueueWaitText(item);
            return (
              <div
                key={item.id}
                role="row"
                className={cn(
                  rowGrid,
                  "items-start gap-y-2 border-b border-hair py-3.5 text-sm last:border-b-0 @5xl:min-h-[60px] @5xl:py-2",
                )}
              >
                <div role="cell" className="min-w-0">
                  <CellTitle
                    left={<InitialsAvatar name={name} className={QUEUE_AVATAR_CLASS} />}
                    title={name}
                    description={getQueuePositionLabel({ position: item.position || 0 })}
                  />
                </div>
                <div role="cell" className={cn("col-[1] row-[2] min-w-0 truncate", CELL_AUTO)}>
                  <span className="sr-only @5xl:hidden">Doctor: </span>
                  {item.doctorName ? (
                    <span className="text-ink">{item.doctorName}</span>
                  ) : (
                    <span className="text-ink-muted">Unassigned</span>
                  )}
                </div>
                <div role="cell" className={cn("col-[1/-1] row-[3] min-w-0", CELL_AUTO)}>
                  <span className="sr-only @5xl:hidden">Category: </span>
                  <span className="text-xs font-bold text-brand">{getQueueDisplayLabel(item)}</span>
                </div>
                <div role="cell" className={cn("col-[2] row-[1] min-w-0 self-center justify-self-end @5xl:justify-self-auto", CELL_AUTO)}>
                  <Pill tone={statusTone(item.status)}>{getQueueStatusText(item)}</Pill>
                </div>
                <div role="cell" className={cn("col-[2] row-[2] min-w-0 justify-self-end @5xl:justify-self-auto", CELL_AUTO)}>
                  <span className="sr-only @5xl:hidden">Wait time: </span>
                  {waitText ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-ink-soft">
                      <Clock className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
                      {waitText}
                    </span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </div>
                <div role="cell" className={cn("col-[1/-1] row-[4] min-w-0 pt-1 @5xl:pt-0", CELL_AUTO)}>
                  <RowButtons item={item} name={name} primary={primaryActions[item.id]} actions={actions} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {total === 0 ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
          <span>
            {rangeStart}–{rangeEnd} of {total}
          </span>
          <nav aria-label={`${tableLabel} pages`} className="flex items-center gap-2">
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
