"use client";

import type { ReactNode } from "react";
import { AlertCircle, Calendar, Clock, RefreshCw, Repeat, Users } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Chip, ConnectionPill, DateField, Kpi, Note, PageHero, SearchBox, Surface } from "@/components/tbd";
import { DoctorPatientsTable } from "./DoctorPatientsTable";
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
  /** Sent to the server, which searches name, phone and e-mail. */
  searchTerm: string;
  /** Last-visit range (ISO days, `yyyy-mm-dd`; empty = no bound). Applied on the client. */
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (from: string, to: string) => void;
  onPrescribe: (row: DoctorPatientRow) => void;
  /** The banner buttons: "OPD Registration" and "Register Patient" (each opens its dialog). */
  actions: ReactNode;
  /** Replaces the live connection tag (used by the design preview). */
  connectionSlot?: ReactNode;
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
  searchTerm,
  dateFrom,
  dateTo,
  onSearchChange,
  onDateRangeChange,
  onPrescribe,
  actions,
  connectionSlot,
}: DoctorPatientsViewProps) {
  const hasFilters = searchTerm.trim().length > 0 || Boolean(dateFrom) || Boolean(dateTo);
  const loadedLabel = loading
    ? "Loading patients…"
    : loadFailed
      ? "Patients not loaded"
      : `Loaded: ${totalPatients} ${totalPatients === 1 ? "patient" : "patients"}`;

  const clearFilters = () => {
    onSearchChange("");
    onDateRangeChange("", "");
  };

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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi
          label="Total Patients"
          value={loading ? numberSkeleton : loadFailed ? "—" : totalPatients}
          hint="Under your care"
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
        <Kpi
          label="Today"
          value={loading ? numberSkeleton : stats.todayAppointments}
          hint="Appointments today"
          icon={Clock}
          tone="amber"
          className={KPI_CLASS}
        />
        <Kpi
          label="Returning patients"
          value={loading ? numberSkeleton : stats.returningPatients}
          // Patients with more than one appointment, and their share of the patients who have any.
          hint={stats.returningPatients > 0 ? `${stats.returningShare}% of booked patients` : "Booked more than once"}
          icon={Repeat}
          tone="mint"
          className={KPI_CLASS}
        />
      </div>

      <Surface as="section" aria-label="Filter patients" className="!p-3.5 sm:!p-4">
        {/* The server searches name, phone and e-mail; it has no gender or age filter.
            The last-visit range is applied on the client. */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <SearchBox
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, phone or e-mail…"
            ariaLabel="Search patients by name, phone or e-mail"
            className="lg:min-w-0 lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
            <DateField
              variant="placeholder"
              id="doctor-patients-last-visit-from"
              label="Last visit from"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(from) => onDateRangeChange(from, dateTo)}
              className="w-full lg:w-[168px]"
            />
            <DateField
              variant="placeholder"
              id="doctor-patients-last-visit-to"
              label="Last visit to"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(to) => onDateRangeChange(dateFrom, to)}
              className="w-full lg:w-[168px]"
            />
          </div>
          {hasFilters ? (
            <Button variant="ghost" size="md" onClick={clearFilters} className="text-brand lg:ml-auto">
              Clear filters
            </Button>
          ) : null}
        </div>
      </Surface>

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
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onPrescribe={onPrescribe}
        />
      )}
    </DashboardPageShell>
  );
}
