"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { EmptyBlock, LoadError, LoadErrorNote, PageHero, StatTile, TBD_SURFACE } from "@/components/tbd";
import type { PrescriptionSummary } from "@/hooks/query/usePrescriptions";
import { cn } from "@/lib/utils";
import type { DoctorPrescriptionRow } from "./doctor-prescriptions.logic";
import { DATE_PRESET_OPTIONS, DEFAULT_FILTERS, type DoctorRxFilters } from "./doctor-prescriptions.filters";
import type { DoctorRxFilterState } from "./useDoctorPrescriptionFilters";
import { DoctorPrescriptionsFilterBar } from "./DoctorPrescriptionsFilterBar";
import { DoctorPrescriptionsPager } from "./DoctorPrescriptionsPager";
import { DoctorPrescriptionsTable } from "./DoctorPrescriptionsTable";

export interface DoctorPrescriptionsViewProps {
  filterState: DoctorRxFilterState;
  filtersActive: boolean;
  /** IST day key of today ("" before hydration). */
  todayKey: string;
  /** Rows of the current page. */
  rows: DoctorPrescriptionRow[];
  /** Matching prescriptions over all pages. */
  total: number;
  /** First load, nothing to show yet. */
  isLoading: boolean;
  /** Another page or filter is loading; the previous rows stay on screen. */
  isRefreshing: boolean;
  /** The first load failed and there is nothing to show. */
  loadFailed: boolean;
  /** A later load failed; the last rows stay on screen. */
  refreshFailed: boolean;
  onRetry: () => void;
  /** Counts for the tiles; null when they are not known. */
  summary: PrescriptionSummary | null;
  summaryLoading: boolean;
  onCreate: () => void;
  onOpen: (prescription: DoctorPrescriptionRow) => void;
  onDownload: (prescription: DoctorPrescriptionRow) => void;
}

const NUMBER = new Intl.NumberFormat("en-IN");
const MAX_SKELETON_ROWS = 12;

/** Height of the filter bar, so the table header can stick right under it. */
function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(Math.round(entry.target.getBoundingClientRect().height));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

function presetLabel(filters: DoctorRxFilters): string {
  return DATE_PRESET_OPTIONS.find((option) => option.value === filters.date)?.label ?? "";
}

function SummaryTiles({
  summary,
  loading,
  filters,
  hrefFor,
}: {
  summary: PrescriptionSummary | null;
  loading: boolean;
  filters: DoctorRxFilters;
  hrefFor: DoctorRxFilterState["hrefFor"];
}) {
  const value = (count: number | undefined) =>
    loading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-well align-middle" /> : count === undefined ? "—" : NUMBER.format(count);
  const period = filters.date === "all" ? "All dates" : presetLabel(filters);
  const selected = "ring-2 ring-brand/50";
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="Prescription counts">
      <StatTile
        value={value(summary?.total)}
        label="Total"
        hint={period}
        href={hrefFor({ status: "all" })}
        className={cn("py-2.5", filters.status === "all" && selected)}
      />
      <StatTile
        value={value(summary?.active)}
        label="Active"
        hint={period}
        tone="brand"
        href={hrefFor({ status: "active" })}
        className={cn("py-2.5", filters.status === "active" && selected)}
      />
      <StatTile
        value={value(summary?.today)}
        label="Today"
        hint="Written today"
        tone="blue"
        href={hrefFor({ date: "today" })}
        className={cn("py-2.5", filters.date === "today" && selected)}
      />
      <StatTile value={value(summary?.uniquePatients)} label="Unique patients" hint={period} className="py-2.5" />
    </div>
  );
}

/** What the empty list says depends on the filter that emptied it. */
function EmptyList({ filterState, filtersActive }: { filterState: DoctorRxFilterState; filtersActive: boolean }) {
  const { filters, update, clear } = filterState;
  const onlyDate =
    filters.q.trim() === "" && filters.status === "all" && filters.stage === "all" && filters.date !== "all";
  if (onlyDate) {
    const title = filters.date === "today" ? "No prescriptions today" : `No prescriptions for ${presetLabel(filters).toLowerCase()}`;
    return (
      <EmptyBlock
        icon={FileText}
        title={title}
        description="Prescriptions you write show up here as soon as they are saved."
        action={
          <Button variant="outline" onClick={() => update({ date: "all" })}>
            Show all dates
          </Button>
        }
      />
    );
  }
  if (filtersActive) {
    return (
      <EmptyBlock
        icon={FileText}
        title="No prescriptions match these filters"
        description="Try another search, status or date range."
        action={
          <Button variant="outline" onClick={clear}>
            Clear filters
          </Button>
        }
      />
    );
  }
  return (
    <EmptyBlock
      icon={FileText}
      title="No prescriptions yet"
      description="Prescriptions you write for your patients show up here."
    />
  );
}

/** The doctor's prescriptions screen. Everything it shows and does comes in through props. */
export function DoctorPrescriptionsView({
  filterState,
  filtersActive,
  todayKey,
  rows,
  total,
  isLoading,
  isRefreshing,
  loadFailed,
  refreshFailed,
  onRetry,
  summary,
  summaryLoading,
  onCreate,
  onOpen,
  onDownload,
}: DoctorPrescriptionsViewProps) {
  const { filters, update, hrefFor } = filterState;
  const [barRef, barHeight] = useElementHeight<HTMLDivElement>();
  const showEmpty = !isLoading && !loadFailed && rows.length === 0;

  return (
    <DashboardPageShell className="gap-3 md:gap-3.5">
      <PageHero
        eyebrow="Doctor Prescriptions"
        title="Prescriptions"
        description="Payment, packing and handover stay with the medicine desk."
        className="px-5 py-4 [&_h1]:text-[22px]"
        actions={
          <Button size="md" onClick={onCreate}>
            <Plus aria-hidden="true" />
            New Prescription
          </Button>
        }
      />

      <SummaryTiles summary={summary} loading={summaryLoading} filters={filters} hrefFor={hrefFor} />

      <DoctorPrescriptionsFilterBar
        ref={barRef}
        filterState={filterState}
        filtersActive={filtersActive}
        showDrafts={(summary?.drafts ?? 0) > 0}
        todayKey={todayKey}
      />

      {refreshFailed ? (
        <LoadErrorNote title="Could not refresh prescriptions." message="Showing the last list loaded." onRetry={onRetry} />
      ) : null}

      <section aria-label="Prescriptions list" className={cn(TBD_SURFACE, "min-w-0 overflow-clip")}>
        {loadFailed ? (
          <LoadError
            title="Could not load prescriptions"
            message="Check your connection and try again."
            onRetry={onRetry}
          />
        ) : showEmpty ? (
          <EmptyList filterState={filterState} filtersActive={filtersActive} />
        ) : (
          <>
            <DoctorPrescriptionsTable
              rows={rows}
              todayKey={todayKey}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              skeletonRows={Math.min(filters.size, MAX_SKELETON_ROWS)}
              stickyTop={barHeight}
              onOpen={onOpen}
              onDownload={onDownload}
            />
            {!isLoading ? (
              <DoctorPrescriptionsPager
                page={filters.page}
                pageSize={filters.size}
                total={total}
                rowCount={rows.length}
                onPageChange={(page) => update({ page })}
                onPageSizeChange={(size) => update({ size: size || DEFAULT_FILTERS.size })}
              />
            ) : null}
          </>
        )}
      </section>
    </DashboardPageShell>
  );
}
