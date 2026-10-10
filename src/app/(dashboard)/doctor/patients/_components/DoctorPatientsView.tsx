"use client";

import type { ReactNode } from "react";
import { AlertCircle, Calendar, RefreshCw, Users } from "lucide-react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Chip, Kpi, Note, PageHero, Pill, type PillTone } from "@/components/tbd";
import type { PatientDirectoryFacets } from "@/types/patient-directory.types";
import { DoctorPatientsFilters } from "./DoctorPatientsFilters";
import { DoctorPatientsTable } from "./DoctorPatientsTable";
import { hasAnyFilter, type DirectoryFilterState } from "./directoryFilters";
import type { DoctorPatientRow, DoctorPatientsStats } from "./doctorPatients.logic";

export interface DoctorPatientsViewProps {
  /** The first load of the list is still running. */
  loading: boolean;
  /** The list could not be loaded and there is nothing to show. */
  loadFailed: boolean;
  onRetry: () => void;
  rows: DoctorPatientRow[];
  totalPatients: number;
  stats: DoctorPatientsStats;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Rows per page: 10, 50, 200 or 500. */
  onPageSizeChange: (pageSize: number) => void;
  filters: DirectoryFilterState;
  facets: PatientDirectoryFacets | undefined;
  onFiltersChange: (patch: Partial<DirectoryFilterState>) => void;
  onClearFilters: () => void;
  onPrescribe: (row: DoctorPatientRow) => void;
  /** The banner buttons: "OPD Registration" and "Register Patient" (each opens its dialog). */
  actions: ReactNode;
  /** Replaces the live connection tag (used by the design preview). */
  connectionSlot?: ReactNode;
}

/** Live-updates tag in the banner: the same socket state the old indicator showed. */
function ConnectionPill() {
  const { isConnected, connectionStatus, error } = useWebSocketStatus();

  let tone: PillTone = "slate";
  let label = "Offline";
  if (error) {
    tone = "rose";
    label = "Connection error";
  } else if (connectionStatus === "connecting") {
    tone = "amber";
    label = "Connecting";
  } else if (connectionStatus === "reconnecting") {
    tone = "amber";
    label = "Reconnecting";
  } else if (isConnected) {
    tone = "green";
    label = "Connected";
  }

  return (
    <span role="status" aria-label={`Live updates: ${label}`}>
      <Pill tone={tone} dot>
        {label}
      </Pill>
    </span>
  );
}

/** On a phone two stat cards share a row, so the icon square is dropped to leave room for the text. */
const KPI_CLASS = "max-[479px]:[&>span[aria-hidden=true]]:hidden";

const numberSkeleton = (
  <span className="my-1 block h-[22px] w-10 animate-pulse rounded-md bg-accent" aria-hidden="true" />
);

export function DoctorPatientsView({
  loading,
  loadFailed,
  onRetry,
  rows,
  totalPatients,
  stats,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  filters,
  facets,
  onFiltersChange,
  onClearFilters,
  onPrescribe,
  actions,
  connectionSlot,
}: DoctorPatientsViewProps) {
  const hasFilters = hasAnyFilter(filters);
  const loadedLabel = loading
    ? "Loading patients…"
    : loadFailed
      ? "Patients not loaded"
      : `${totalPatients.toLocaleString("en-IN")} ${totalPatients === 1 ? "patient" : "patients"}${hasFilters ? " match" : ""}`;

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Doctor Patients"
        title="My Patients"
        description="Review patient records, EHR summaries, contact details and follow-up context from a shared clinical workspace."
        badge={
          <>
            <Chip icon={Users}>{loadedLabel}</Chip>
            {connectionSlot ?? <ConnectionPill />}
          </>
        }
        actions={actions}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 lg:gap-4">
        <Kpi
          label="Total Patients"
          value={loading ? numberSkeleton : loadFailed ? "—" : totalPatients}
          hint={hasFilters ? "Matching the filters" : "In this clinic"}
          icon={Users}
          tone="mint"
          className={KPI_CLASS}
        />
        <Kpi
          label="This Week"
          value={loading ? numberSkeleton : stats.upcomingAppointments}
          hint="Appointments scheduled"
          icon={Calendar}
          tone="blue"
          className={KPI_CLASS}
        />
      </div>

      <DoctorPatientsFilters
        filters={filters}
        facets={facets}
        onChange={onFiltersChange}
        onClear={onClearFilters}
      />

      {loadFailed ? (
        <Note tone="rose" icon={AlertCircle}>
          <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span>
              <b className="font-bold">Patients could not be loaded.</b> Check your connection and try again.
            </span>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw />
              Try again
            </Button>
          </div>
        </Note>
      ) : (
        <DoctorPatientsTable
          rows={rows}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={totalPatients}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          onPrescribe={onPrescribe}
        />
      )}
    </DashboardPageShell>
  );
}
