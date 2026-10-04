"use client";

import { Loader2, ScanLine, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PatientHomeHero } from "@/components/patient/PatientHomeHero";
import { PatientQuickActions } from "@/components/patient/PatientQuickActions";
import type { HomeVisitActions } from "./HomeVisitCard";
import { PatientHomeLibrary, type PatientHomeLibraryProps } from "./PatientHomeLibrary";
import { PatientHomeStats } from "./PatientHomeStats";
import { PatientHomeWorkspace } from "./PatientHomeWorkspace";
import type { HomeQueue, HomeStat, HomeVisit, HomeWorkspaceTab } from "./types";

export interface PatientHomeViewProps {
  /** Greeting word, already translated ("Hi"). */
  hello: string;
  firstName: string;
  /** Line under the greeting. */
  subtitle: string;
  /** The clinic's doctor for the banner card. Shown only while there is no upcoming visit. */
  doctor?: { name?: string; subtitle?: string } | null;

  /** True while the backend still marks the patient's profile as incomplete. */
  showProfileBanner: boolean;
  onCompleteProfile: () => void;

  onBook: () => void;
  isBookingOpening: boolean;
  onScanCheckIn: () => void;

  stats: HomeStat[];
  isStatsLoading: boolean;

  visits: HomeVisit[];
  isVisitsLoading: boolean;
  queue?: HomeQueue | null;
  queueVisitId?: string | null;
  visitActions: HomeVisitActions;
  initialWorkspaceTab?: HomeWorkspaceTab;

  library: PatientHomeLibraryProps;
}

/**
 * Patient Home, drawn from props only. One layout for every state: no visit, a video visit,
 * a clinic visit waiting for check-in, and a clinic visit in the queue. The state comes from
 * the first item of `visits`.
 */
export function PatientHomeView({
  hello,
  firstName,
  subtitle,
  doctor,
  showProfileBanner,
  onCompleteProfile,
  onBook,
  isBookingOpening,
  onScanCheckIn,
  stats,
  isStatsLoading,
  visits,
  isVisitsLoading,
  queue,
  queueVisitId,
  visitActions,
  initialWorkspaceTab,
  library,
}: PatientHomeViewProps) {
  const showDoctor = !isVisitsLoading && visits.length === 0 && Boolean(doctor?.name);

  return (
    <DashboardPageShell>
      {showProfileBanner ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 text-[#92400e] sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex flex-col gap-0.5">
            <p className="m-0 text-sm font-bold">Complete your profile</p>
            <p className="m-0 text-[13px] leading-snug">
              Add your name and basic details so your doctors can identify you.
            </p>
          </div>
          <Button variant="outline" className="self-start sm:self-auto" onClick={onCompleteProfile}>
            Complete now
          </Button>
        </div>
      ) : null}

      <PatientHomeHero
        hello={hello}
        name={firstName}
        question={subtitle}
        doctorName={showDoctor ? doctor?.name : undefined}
        doctorSubtitle={doctor?.subtitle}
        doctorHref="/patient/appointments?openBooking=1"
        actions={
          <>
            <Button variant="outline" size="md" className="dark:bg-card" onClick={onScanCheckIn}>
              <ScanLine aria-hidden="true" />
              Scan check-in
            </Button>
            <Button variant="action" size="md" disabled={isBookingOpening} onClick={onBook}>
              {isBookingOpening ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Video aria-hidden="true" />}
              {isBookingOpening ? "Opening…" : "Book video appointment"}
            </Button>
          </>
        }
      />

      <PatientHomeStats stats={stats} isLoading={isStatsLoading} />

      <PatientHomeWorkspace
        visits={visits}
        queue={queue}
        queueVisitId={queueVisitId}
        isLoading={isVisitsLoading}
        actions={visitActions}
        onBook={onBook}
        isBookingOpening={isBookingOpening}
        initialTab={initialWorkspaceTab}
      />

      <PatientQuickActions />

      <PatientHomeLibrary {...library} />
    </DashboardPageShell>
  );
}
