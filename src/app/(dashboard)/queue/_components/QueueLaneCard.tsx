"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Pill as PillIcon,
  Play,
  ShieldAlert,
  UserX,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CellTitle,
  Chip,
  EmptyBlock,
  FilterChips,
  InitialsAvatar,
  Pill,
  SectionTitle,
  Surface,
  statusTone,
  Pager,
  usePagedRows,
  type TbdIcon,
} from "@/components/tbd";
import { ASSISTANT_ROUTES } from "@/components/assistant/assistant-routes";
import { routeFor } from "@/lib/config/tbdRoutes";
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
import {
  queuePriorityLabel,
  queuePriorityOf,
  queuePriorityTone,
  queueTokenLabel,
  type QueueRoleVariant,
} from "./queue-roles.logic";

/**
 * One line per patient on a wide card (patient, doctor, category, status, wait time, actions).
 * On a narrow card the cells stack: name and status first, then the rest, actions last.
 * `@5xl` is a container width, so the layout follows the card, not the window.
 */
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @5xl:items-center @5xl:gap-x-4";
/** Last column width per role: two main buttons (doctor, assistant), desk buttons plus the menu, or the basic pair. */
const COLUMNS = {
  main: "@5xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_108px_78px_280px]",
  desk: "@5xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_108px_78px_320px]",
  basic: "@5xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_120px_96px_264px]",
} as const;
const CELL_AUTO = "@5xl:col-auto @5xl:row-auto";

/** What a row can do. The same for both tabs; the container decides who sees which button. */
export interface QueueRowActions {
  /** Whose queue this is: decides the main buttons (doctor: call / start / complete; assistant: draft Rx / dispense). */
  variant: QueueRoleVariant;
  /** Only roles the backend lets move a patient to another queue get the "Move to" button. */
  canMoveTo: boolean;
  /** Front desk and clinic admin: Set priority and Mark no-show in the row menu. */
  canSetPriority: boolean;
  canMarkNoShow: boolean;
  /** Entry being moved to another queue right now. */
  transferringId: string | null;
  /** Entry whose visit is being started right now. */
  startingId: string | null;
  /** Entry being called in right now. */
  callingId: string | null;
  onStart: (item: QueueDisplayItem) => void;
  onCall: (item: QueueDisplayItem) => void;
  onMoveTo: (item: QueueDisplayItem) => void;
  onSetPriority: (item: QueueDisplayItem) => void;
  onMarkNoShow: (item: QueueDisplayItem) => void;
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

/** Assistant links carry the patient and the visit so the draft / dispense screen opens on them. */
function DoctorButtons({
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
  if (primary === "case-sheet") {
    return (
      <>
        <Button asChild>
          <Link href={`/doctor/patients/${encodeURIComponent(item.patientId)}`} aria-label={`Case sheet for ${name}`}>
            <FileText />
            Case sheet
          </Link>
        </Button>
        {item.appointmentId ? (
          <Button asChild variant="outline">
            <Link
              href={routeFor("/doctor/visit/[appointmentId]/complete", { appointmentId: item.appointmentId })}
              aria-label={`Complete visit for ${name}`}
            >
              <CheckCircle2 />
              Complete
            </Link>
          </Button>
        ) : null}
      </>
    );
  }
  if (primary === "start") {
    const busy = actions.startingId !== null || actions.callingId !== null;
    return (
      <>
        <Button variant="outline" onClick={() => actions.onCall(item)} disabled={busy} aria-label={`Call ${name} in`}>
          {actions.callingId === item.id ? <Loader2 className="animate-spin" /> : <Megaphone />}
          Call in
        </Button>
        <Button onClick={() => actions.onStart(item)} disabled={busy} aria-label={`Start visit for ${name}`}>
          {actions.startingId === item.id ? <Loader2 className="animate-spin" /> : <Play />}
          Start
        </Button>
      </>
    );
  }
  return null;
}

function AssistantButtons({ item, name }: { item: QueueDisplayItem; name: string }) {
  if (!item.patientId) return null;
  return (
    <>
      <Button asChild>
        <Link href={ASSISTANT_ROUTES.prescribe({ patientId: item.patientId, appointmentId: item.appointmentId })} aria-label={`Prepare a prescription draft for ${name}`}>
          <FileText />
          Draft Rx
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={ASSISTANT_ROUTES.dispenseTo({ patientId: item.patientId })} aria-label={`Dispense medicines to ${name}`}>
          <PillIcon />
          Dispense
        </Link>
      </Button>
    </>
  );
}

function DeskMenu({ item, name, actions }: { item: QueueDisplayItem; name: string; actions: QueueRowActions }) {
  if (!actions.canSetPriority && !actions.canMarkNoShow) return null;
  const hasAppointment = Boolean(item.appointmentId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`More actions for ${name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.canSetPriority ? (
          <DropdownMenuItem disabled={!hasAppointment} onSelect={() => actions.onSetPriority(item)}>
            <ShieldAlert />
            Set priority
          </DropdownMenuItem>
        ) : null}
        {actions.canMarkNoShow ? (
          <DropdownMenuItem disabled={!hasAppointment} onSelect={() => actions.onMarkNoShow(item)}>
            <UserX />
            Mark no-show
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const isMoving = actions.transferringId === item.id;

  return (
    <div className="flex flex-wrap items-center gap-2 @5xl:flex-nowrap @5xl:justify-end">
      {actions.variant === "doctor" ? <DoctorButtons item={item} name={name} primary={primary} actions={actions} /> : null}
      {actions.variant === "assistant" ? <AssistantButtons item={item} name={name} /> : null}

      {actions.canMoveTo ? (
        <Button
          variant="outline"
          onClick={() => actions.onMoveTo(item)}
          disabled={isMoving}
          aria-label={`Move to another queue: ${name}`}
        >
          Move to
          {isMoving ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        </Button>
      ) : null}

      <DeskMenu item={item} name={name} actions={actions} />
    </div>
  );
}

function rowColumns(actions: QueueRowActions): string {
  if (actions.variant === "doctor" || actions.variant === "assistant") return COLUMNS.main;
  if (actions.canSetPriority || actions.canMarkNoShow) return COLUMNS.desk;
  return COLUMNS.basic;
}

/** Token, position and (when raised) the priority under the patient's name. */
function PatientLine({ item }: { item: QueueDisplayItem }) {
  const token = queueTokenLabel(item);
  const priority = queuePriorityOf(item);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {token ? (
        <Chip tone="clinic" className="px-1.5 py-0.5 text-[11px] font-bold">
          {token}
        </Chip>
      ) : null}
      <span>{getQueuePositionLabel({ position: item.position || 0 })}</span>
      {priority !== "NORMAL" ? <Pill tone={queuePriorityTone(priority)}>{queuePriorityLabel(priority)}</Pill> : null}
    </span>
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
  const paging = usePagedRows(items, QUEUE_PAGE_SIZE, { resetKey });
  const { pageRows, total } = paging;
  const rowGrid = cn(ROW_GRID, rowColumns(actions));
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
                description={`No checked-in patients in the ${activeLaneTitle} queue right now.`}
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
                    title={
                      actions.variant === "assistant" && item.appointmentId ? (
                        <Link
                          href={routeFor("/assistant-doctor/visit/[appointmentId]", { appointmentId: item.appointmentId })}
                          className="hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )
                    }
                    description={<PatientLine item={item} />}
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

      {total === 0 ? null : <Pager paging={paging} label={`${tableLabel} pages`} />}
    </Surface>
  );
}
