"use client";

import { Activity, CheckCircle, CircleAlert, Loader2, Stethoscope, Timer, TriangleAlert, Users } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyBlock,
  FilterChips,
  Kpi,
  LiveTag,
  Note,
  PageHero,
  Pill,
  SectionTitle,
  Surface,
  type TbdOption,
} from "@/components/tbd";
import { QueueLaneCard, type QueueLaneCardProps, type QueueRowActions } from "./QueueLaneCard";
import type { QueueStatsSummary, QueueTabKey } from "./queue.logic";

type QueueLane = Pick<
  QueueLaneCardProps,
  "lanes" | "activeLane" | "activeLaneTitle" | "onLaneChange" | "items" | "primaryActions"
>;

export interface QueueViewProps {
  /** Whose queue this is ("Clinic Queue", "Reception Queue"). Shown above the title. */
  scopeLabel: string;
  /** People who manage the queue get the fuller description. */
  canManageQueue: boolean;
  /** True while the live connection is up; otherwise the list refreshes on a timer. */
  liveSync: boolean;

  /** Active entries left over from earlier days (front desk and clinic admin only; 0 hides the note). */
  staleCount: number;
  isCleaningUp: boolean;
  onCleanUpStale: () => void;

  treatmentFilters: TbdOption[];
  activeTreatmentFilter: string;
  onTreatmentFilterChange: (value: string) => void;

  /** Queue numbers for people who manage the queue; null hides the row. */
  stats: QueueStatsSummary | null;

  tabs: Array<{ key: QueueTabKey; label: string; count: number }>;
  activeTab: QueueTabKey;
  onTabChange: (value: string) => void;

  consultation: QueueLane;
  procedure: QueueLane;
  rowActions: QueueRowActions;
}

function QueueBanner({
  scopeLabel,
  description,
  liveSync,
}: {
  scopeLabel: string;
  description: string;
  liveSync: boolean;
}) {
  return (
    <PageHero
      eyebrow={scopeLabel}
      title="Queue Management"
      description={description}
      badge={liveSync ? <LiveTag>Live sync</LiveTag> : <Pill tone="slate">Refreshes every 30 seconds</Pill>}
    />
  );
}

/** The page while the queue is loading for the first time. */
export function QueueLoadingView({ scopeLabel }: { scopeLabel: string }) {
  return (
    <DashboardPageShell>
      <PageHero
        eyebrow={scopeLabel}
        title="Queue Management"
        description="Syncing the live queue…"
        badge={<LiveTag>Live sync</LiveTag>}
      />
      <div aria-busy="true" aria-label="Loading the queue" className="flex flex-col gap-5">
        <Surface>
          <Skeleton className="h-4 w-44 rounded" />
          <div className="flex flex-wrap gap-2">
            {[92, 168, 176, 132, 104, 120, 128].map((width, index) => (
              <Skeleton key={index} className="h-[38px] rounded-xl" style={{ width }} />
            ))}
          </div>
        </Surface>
        <Skeleton className="h-[46px] w-[290px] max-w-full rounded-[13px]" />
        <Surface flush>
          <div className="flex flex-col gap-3.5 border-b border-hair px-5 pb-4 pt-5">
            <Skeleton className="h-4 w-56 rounded" />
            <div className="flex flex-wrap gap-2">
              {[176, 108, 124, 112, 132].map((width, index) => (
                <Skeleton key={index} className="h-[38px] rounded-xl" style={{ width }} />
              ))}
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-hair px-5 py-3 last:border-b-0">
              <Skeleton className="size-[38px] shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-36 max-w-full rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="hidden h-[22px] w-20 rounded-lg sm:block" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ))}
        </Surface>
      </div>
    </DashboardPageShell>
  );
}

/** The page when the queue could not be loaded. */
export function QueueErrorView({
  scopeLabel,
  message,
  onRetry,
}: {
  scopeLabel: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <DashboardPageShell>
      <PageHero eyebrow={scopeLabel} title="Queue Management" description="View patient queue status." />
      <Surface flush role="alert">
        <EmptyBlock
          icon={CircleAlert}
          title="We could not load the queue"
          description={message || "Please check your connection and try again."}
          action={
            <Button size="md" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </Surface>
    </DashboardPageShell>
  );
}

/** Queue Management: banner, treatment type filter, Consultations / Procedures, lane table. */
export function QueueView({
  scopeLabel,
  canManageQueue,
  liveSync,
  staleCount,
  isCleaningUp,
  onCleanUpStale,
  treatmentFilters,
  activeTreatmentFilter,
  onTreatmentFilterChange,
  stats,
  tabs,
  activeTab,
  onTabChange,
  consultation,
  procedure,
  rowActions,
}: QueueViewProps) {
  return (
    <DashboardPageShell>
      <QueueBanner
        scopeLabel={scopeLabel}
        description={canManageQueue ? "Monitor and manage patient queues." : "View patient queue status."}
        liveSync={liveSync}
      />

      {staleCount > 0 ? (
        <Note tone="amber" icon={TriangleAlert} className="[&>div]:flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-bold">Old queue entries found</span>
              <span>
                {staleCount} {staleCount === 1 ? "entry" : "entries"} from earlier days {staleCount === 1 ? "is" : "are"}{" "}
                still marked as active.
              </span>
            </span>
            <Button variant="danger" onClick={onCleanUpStale} disabled={isCleaningUp}>
              {isCleaningUp ? <Loader2 className="animate-spin" /> : null}
              {isCleaningUp ? "Cleaning up…" : "Cancel old entries"}
            </Button>
          </div>
        </Note>
      ) : null}

      <Surface as="section" aria-label="Treatment type filter">
        <SectionTitle
          icon={Activity}
          title="Treatment Type Filter"
          description="Narrow the shared queue by treatment type, then continue with the consultation and procedure lanes below."
        />
        <FilterChips
          ariaLabel="Treatment type"
          options={treatmentFilters}
          value={activeTreatmentFilter}
          onChange={onTreatmentFilterChange}
        />
      </Surface>

      {stats ? (
        <section aria-label="Queue numbers" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total in queue" value={stats.totalInQueue} icon={Users} tone="blue" />
          <Kpi label="Average wait" value={`${stats.averageWaitTime} min`} icon={Timer} tone="amber" />
          <Kpi label="In progress" value={stats.inProgress} icon={Activity} tone="mint" />
          <Kpi label="Completed today" value={stats.completedToday} icon={CheckCircle} tone="slate" />
        </section>
      ) : null}

      <Tabs value={activeTab} onValueChange={onTabChange} className="gap-5">
        <TabsList aria-label="Queue type">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              <span>{tab.label}</span>
              <TabsCount>{tab.count}</TabsCount>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="consultations">
          <QueueLaneCard
            icon={Stethoscope}
            title="Consultation Queue Types"
            description="General consultation lanes available for front-desk and queue routing."
            actions={rowActions}
            resetKey={`${activeTreatmentFilter}:${consultation.activeLane}`}
            {...consultation}
          />
        </TabsContent>

        <TabsContent value="therapies">
          <QueueLaneCard
            icon={Activity}
            title="Treatment Queue Tabs"
            description="Current treatment lanes available for transfer and front-desk routing."
            actions={rowActions}
            resetKey={`${activeTreatmentFilter}:${procedure.activeLane}`}
            {...procedure}
          />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}
