"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Stethoscope,
  Zap,
} from "lucide-react";
import { EmptyBlock, Kpi, LiveTag, Note, Pill, SegTabs, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { VIDEO_JOIN_EARLY_WINDOW_MINUTES } from "@/lib/utils/appointmentUtils";
import { ManagerFilters } from "./ManagerFilters";
import { ManagerVisitCard } from "./ManagerVisitCard";
import { ManagerClosedTable, ManagerPastTable } from "./ManagerVisitTable";
import {
  PAST_PREVIEW_SIZE,
  STATUS_OPTIONS_BY_TAB,
  TABLE_PAGE_SIZE,
  UPCOMING_PAGE_SIZE,
  countStats,
  filterByStatus,
  filterVisits,
  sortVisits,
} from "./managerData";
import type {
  ManagerDateRange,
  ManagerPayRenderer,
  ManagerStatusFilter,
  ManagerTab,
  ManagerVisit,
  ManagerVisitActions,
} from "./types";

export interface AppointmentManagerViewProps {
  /** Every visit, unfiltered. The view sorts them into the tabs. */
  visits: ManagerVisit[];
  /** Client clock, refreshed by the container so "Starts in …" and the join window stay true. */
  now: number | null;
  isLoading: boolean;
  /** Set when the list could not be loaded. */
  errorMessage?: string | null | undefined;
  isRefreshing: boolean;
  onRefresh: () => void;
  /** Live updates: connected, connecting, or not used on this screen. */
  live?: "on" | "connecting" | null | undefined;
  /** Staff lists show numbers, keep the filters open and lead with the patient's name. */
  staffView: boolean;
  dateRange: ManagerDateRange;
  onDateRangeChange: (range: ManagerDateRange) => void;
  actions: ManagerVisitActions;
  renderPay: ManagerPayRenderer;
  checkInHref: string;
  cancelling: boolean;
  rescheduling: boolean;
  /** Title row for pages that have no title of their own (staff). */
  heading?: { title: string; action?: ReactNode } | undefined;
  /** The amber "Book appointment" button shown in the empty states. */
  bookAction?: ReactNode | undefined;
  initialTab?: ManagerTab | undefined;
}

function Pager({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-3 text-[13px] text-ink-muted sm:justify-end">
      <Button variant="outline" className="h-[34px]" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span className="whitespace-nowrap" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button variant="outline" className="h-[34px]" onClick={() => onChange(page + 1)} disabled={page >= pageCount}>
        Next
      </Button>
    </nav>
  );
}

function pageOf<T>(list: T[], page: number, size: number): { rows: T[]; page: number; pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(list.length / size));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return { rows: list.slice((safePage - 1) * size, safePage * size), page: safePage, pageCount };
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading appointments">
      <Skeleton className="h-[46px] w-[260px] rounded-[13px]" />
      <div className="grid gap-5 @3xl:grid-cols-2">
        {[0, 1].map((index) => (
          <Surface key={index}>
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-14 rounded-[14px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4 rounded-[10px]" />
            <Skeleton className="ml-auto h-11 w-40 rounded-xl" />
          </Surface>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[20px]" />
    </div>
  );
}

/**
 * The appointments list as designed: Upcoming / Past / Cancelled tabs, upcoming visits as
 * cards, a past list under them. Props only — the container owns data and mutations.
 */
export function AppointmentManagerView({
  visits,
  now,
  isLoading,
  errorMessage,
  isRefreshing,
  onRefresh,
  live,
  staffView,
  dateRange,
  onDateRangeChange,
  actions,
  renderPay,
  checkInHref,
  cancelling,
  rescheduling,
  heading,
  bookAction,
  initialTab = "upcoming",
}: AppointmentManagerViewProps) {
  const filtersId = useId();
  const [tab, setTab] = useState<ManagerTab>(initialTab);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ManagerStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(staffView);

  const hasRange = Boolean(dateRange.start || dateRange.end);
  const hasActiveFilters = Boolean(search.trim()) || hasRange || status !== "ALL";

  const matching = useMemo(() => filterVisits(visits, search, dateRange), [visits, search, dateRange]);
  const upcoming = useMemo(() => sortVisits(matching, "upcoming"), [matching]);
  const past = useMemo(() => sortVisits(matching, "past"), [matching]);
  const cancelled = useMemo(() => sortVisits(matching, "cancelled"), [matching]);
  const stats = useMemo(() => countStats(visits), [visits]);

  const changeTab = (next: ManagerTab) => {
    setTab(next);
    setStatus("ALL");
    setPage(1);
  };
  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPage(1);
    onDateRangeChange({ start: "", end: "" });
  };

  if (isLoading) return <LoadingState />;

  if (errorMessage && visits.length === 0) {
    return (
      <Surface>
        <EmptyBlock
          icon={AlertTriangle}
          tone="rose"
          title="Could not load appointments"
          description={errorMessage}
          action={
            <Button variant="outline" size="md" onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
              Try again
            </Button>
          }
        />
      </Surface>
    );
  }

  const inTab = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;
  const shown = filterByStatus(inTab, status);
  const paged = pageOf(shown, page, tab === "upcoming" ? UPCOMING_PAGE_SIZE : TABLE_PAGE_SIZE);
  const pager = <Pager page={paged.page} pageCount={paged.pageCount} onChange={setPage} />;
  const hasUpcomingVideo = upcoming.some((visit) => visit.kind === "video");
  const noVisitsAtAll = visits.length === 0;

  const emptyState = noVisitsAtAll ? (
    <EmptyBlock
      icon={Calendar}
      title="No appointments yet"
      description={staffView ? "Booked visits show here." : "Book your first visit to get started."}
      action={bookAction}
    />
  ) : hasActiveFilters ? (
    <EmptyBlock
      icon={SlidersHorizontal}
      tone="slate"
      title="No appointments match your filters"
      description="Try another search, date range or status."
      action={
        <Button variant="outline" size="md" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : tab === "upcoming" ? (
    <EmptyBlock
      icon={CalendarCheck}
      title="No upcoming visits"
      description={staffView ? "New bookings show here." : "Book a visit when you need one."}
      action={bookAction}
    />
  ) : tab === "past" ? (
    <EmptyBlock icon={CheckCircle} tone="slate" title="No past visits yet" description="Completed visits show here." />
  ) : (
    <EmptyBlock
      icon={CalendarX}
      tone="slate"
      title="Nothing cancelled"
      description="Cancelled, missed and expired visits show here."
    />
  );

  return (
    <div className="@container flex flex-col gap-5">
      {heading ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-extrabold tracking-[-0.2px] text-ink">{heading.title}</h2>
          {heading.action}
        </div>
      ) : null}

      {staffView ? (
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          <Kpi label="Total" value={stats.total} icon={Stethoscope} tone="blue" />
          <Kpi label="Upcoming" value={stats.upcoming} icon={Calendar} tone="mint" />
          <Kpi label="In progress" value={stats.inProgress} icon={Zap} tone="amber" />
          <Kpi label="Completed" value={stats.completed} icon={CheckCircle} tone="violet" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegTabs<ManagerTab>
          ariaLabel="Appointments"
          value={tab}
          onChange={changeTab}
          options={[
            { value: "upcoming", label: `Upcoming (${upcoming.length})` },
            { value: "past", label: "Past" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <div className="flex items-center gap-2">
          {live ? (
            live === "on" ? (
              <LiveTag>Live</LiveTag>
            ) : (
              <Pill tone="amber" dot>
                Connecting
              </Pill>
            )
          ) : null}
          <Button
            variant="outline"
            size="icon"
            className={cn("size-[38px]", (filtersOpen || hasActiveFilters) && "border-brand text-brand")}
            aria-label={filtersOpen ? "Hide search and filters" : "Search and filter"}
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-[38px]"
            aria-label="Refresh appointments"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {filtersOpen ? (
        <ManagerFilters
          id={filtersId}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder={staffView ? "Search by patient, doctor or place" : "Search by doctor or place"}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            onDateRangeChange(range);
            setPage(1);
          }}
          statusOptions={STATUS_OPTIONS_BY_TAB[tab]}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      ) : null}

      {errorMessage ? (
        <Note tone="rose" icon={AlertTriangle}>
          {errorMessage} Showing the last list we loaded.
        </Note>
      ) : null}

      {shown.length === 0 ? (
        <Surface>{emptyState}</Surface>
      ) : tab === "upcoming" ? (
        <>
          <div className="grid items-start gap-5 @3xl:grid-cols-2">
            {paged.rows.map((visit) => (
              <ManagerVisitCard
                key={visit.id}
                visit={visit}
                now={now}
                actions={actions}
                renderPay={renderPay}
                checkInHref={checkInHref}
                cancelling={cancelling}
                rescheduling={rescheduling}
              />
            ))}
          </div>
          {pager}
        </>
      ) : tab === "past" ? (
        <ManagerPastTable visits={paged.rows} footer={pager} onRate={actions.onRate} />
      ) : (
        <ManagerClosedTable visits={paged.rows} actions={actions} renderPay={renderPay} footer={pager} />
      )}

      {tab === "upcoming" && hasUpcomingVideo && !staffView ? (
        <Note tone="blue">
          You can join a video visit {VIDEO_JOIN_EARLY_WINDOW_MINUTES} minutes before it starts. Use that time to test
          your camera and microphone.
        </Note>
      ) : null}

      {tab === "upcoming" && past.length > 0 ? (
        <section className="mt-1 flex min-w-0 flex-col gap-3" aria-label="Past visits">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-bold text-ink">Past</h2>
            {past.length > PAST_PREVIEW_SIZE ? (
              <Button variant="link" className="h-auto p-0 text-[13px] font-bold" onClick={() => changeTab("past")}>
                View all {past.length}
              </Button>
            ) : null}
          </div>
          <ManagerPastTable visits={past.slice(0, PAST_PREVIEW_SIZE)} onRate={actions.onRate} />
        </section>
      ) : null}
    </div>
  );
}
