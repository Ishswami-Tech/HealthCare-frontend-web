"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Calendar, ChevronRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SegTabs, Surface, type TbdOption } from "@/components/tbd";
import { HomeVisitCard, HomeVisitRow, type HomeVisitActions } from "./HomeVisitCard";
import type { HomeQueue, HomeVisit, HomeWorkspaceTab } from "./types";

const TABS: TbdOption<HomeWorkspaceTab>[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "clinic", label: "In-Person" },
];

const EMPTY_TITLE: Record<HomeWorkspaceTab, string> = {
  all: "No upcoming appointments",
  video: "No upcoming video visits",
  clinic: "No upcoming clinic visits",
};

export interface PatientHomeWorkspaceProps {
  /** Upcoming and in-progress visits, most urgent first. */
  visits: HomeVisit[];
  /** Live queue numbers for the checked-in visit (there is only ever one). */
  queue?: HomeQueue | null;
  /** The visit the queue numbers belong to. */
  queueVisitId?: string | null;
  isLoading?: boolean;
  actions: HomeVisitActions;
  /** Opens the booking flow. */
  onBook: () => void;
  isBookingOpening?: boolean;
  /** First tab to show. Used by the preview; the app always starts on "All". */
  initialTab?: HomeWorkspaceTab;
}

/**
 * "Healthcare Workspace" card: the patient's next visit with its actions, tabs to narrow by
 * visit type, and an empty state that leads to booking.
 */
export function PatientHomeWorkspace({
  visits,
  queue,
  queueVisitId,
  isLoading = false,
  actions,
  onBook,
  isBookingOpening = false,
  initialTab = "all",
}: PatientHomeWorkspaceProps) {
  const [tab, setTab] = useState<HomeWorkspaceTab>(initialTab);
  const shown = tab === "all" ? visits : visits.filter((visit) => visit.kind === tab);
  const [next, ...rest] = shown;

  return (
    <Surface as="section" aria-labelledby="patient-home-workspace" className="@container gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#047857] text-white"
          aria-hidden="true"
        >
          <Activity className="size-5" strokeWidth={2.2} />
        </span>
        <div className="flex min-w-[11rem] flex-1 flex-col">
          <h2 id="patient-home-workspace" className="m-0 text-base font-bold text-ink">
            Healthcare Workspace
          </h2>
          <span className="text-[13px] text-ink-muted">Your consultations at a glance</span>
        </div>
        {visits.length > 0 ? (
          <Link
            href="/patient/appointments"
            className="inline-flex shrink-0 items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            All appointments
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <SegTabs options={TABS} value={tab} onChange={setTab} ariaLabel="Filter visits by type" />

      {isLoading ? (
        <div className="flex flex-col gap-4 rounded-[18px] border border-line p-5" aria-busy="true" aria-label="Loading your visits">
          <Skeleton className="h-5 w-44 rounded-md" />
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-[60px] rounded-[14px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-52 max-w-full rounded-md" />
              <Skeleton className="h-3.5 w-36 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : next ? (
        <>
          <HomeVisitCard visit={next} queue={next.id === queueVisitId ? queue : null} actions={actions} />
          {rest.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="m-0 text-[13px] font-bold text-ink-muted">More upcoming</h3>
              <ul className="m-0 flex max-h-[19rem] list-none flex-col gap-2.5 overflow-y-auto p-0">
                {rest.map((visit) => (
                  <HomeVisitRow key={visit.id} visit={visit} actions={actions} />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-[18px] bg-[#f5f8fc] px-5 py-[26px] text-center dark:bg-white/5">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-[#dbeafe] text-[#2563eb] dark:bg-blue-500/15 dark:text-blue-300"
            aria-hidden="true"
          >
            <Calendar className="size-6" strokeWidth={2.2} />
          </span>
          <h3 className="m-0 mt-1.5 text-[15px] font-bold text-ink">{EMPTY_TITLE[tab]}</h3>
          <p className="m-0 text-[13px] text-ink-muted">Book a consultation with your doctor in under a minute.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
            <Button variant="outline" size="md" asChild>
              <Link href="/patient/appointments?tab=past">Past visits</Link>
            </Button>
            <Button variant="action" size="md" disabled={isBookingOpening} onClick={onBook}>
              {isBookingOpening ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
              {isBookingOpening ? "Opening…" : "Book now"}
            </Button>
          </div>
        </div>
      )}
    </Surface>
  );
}
