"use client";

import type { ReactNode } from "react";
import { AlertCircle, Calendar, RefreshCw, Users } from "lucide-react";
import {
  DateField,
  parseDateValue,
} from "@/components/appointments/manager/ManagerFilters";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chip, Kpi, Note, PageHero, Pill, SearchBox, Surface, type PillTone } from "@/components/tbd";
import { DoctorPatientsTable } from "./DoctorPatientsTable";
import type { DoctorPatientRow, DoctorPatientsStats } from "./doctorPatients.logic";

export type DoctorPatientsGenderFilter = "all" | "male" | "female";
export type DoctorPatientsAgeFilter = "all" | "young" | "middle" | "senior";

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
  searchTerm: string;
  genderFilter: DoctorPatientsGenderFilter;
  ageFilter: DoctorPatientsAgeFilter;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onGenderChange: (value: DoctorPatientsGenderFilter) => void;
  onAgeChange: (value: DoctorPatientsAgeFilter) => void;
  onDateRangeChange: (from: string, to: string) => void;
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
  searchTerm,
  genderFilter,
  ageFilter,
  dateFrom,
  dateTo,
  onSearchChange,
  onGenderChange,
  onAgeChange,
  onDateRangeChange,
  onPrescribe,
  actions,
  connectionSlot,
}: DoctorPatientsViewProps) {
  const hasFilters =
    searchTerm.trim().length > 0 ||
    genderFilter !== "all" ||
    ageFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const loadedLabel = loading
    ? "Loading patients…"
    : loadFailed
      ? "Patients not loaded"
      : `Loaded: ${totalPatients} ${totalPatients === 1 ? "patient" : "patients"}`;

  const clearFilters = () => {
    onSearchChange("");
    onGenderChange("all");
    onAgeChange("all");
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 lg:gap-4">
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
      </div>

      <Surface as="section" aria-label="Filter patients" className="!p-3.5 sm:!p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <SearchBox
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name…"
            ariaLabel="Search patients by name"
            className="lg:min-w-0 lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
            <DateField
              value={dateFrom}
              placeholder="Last visit from"
              ariaLabel="Last visit from date"
              onChange={(from) => onDateRangeChange(from, dateTo)}
              className="h-10 w-full rounded-xl lg:w-[168px]"
            />
            <DateField
              value={dateTo}
              placeholder="Last visit to"
              ariaLabel="Last visit to date"
              onChange={(to) => onDateRangeChange(dateFrom, to)}
              isDisabled={(date) => {
                const start = parseDateValue(dateFrom);
                return Boolean(start) && date < (start as Date);
              }}
              className="h-10 w-full rounded-xl lg:w-[168px]"
            />
          </div>
          <Select value={genderFilter} onValueChange={(value) => onGenderChange(value as DoctorPatientsGenderFilter)}>
            <SelectTrigger
              className="h-10 w-full rounded-xl border-line text-[13px] font-semibold lg:w-[148px]"
              aria-label="Filter by gender"
            >
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageFilter} onValueChange={(value) => onAgeChange(value as DoctorPatientsAgeFilter)}>
            <SelectTrigger
              className="h-10 w-full rounded-xl border-line text-[13px] font-semibold lg:w-[148px]"
              aria-label="Filter by age"
            >
              <SelectValue placeholder="Age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="young">Under 30</SelectItem>
              <SelectItem value="middle">30-60</SelectItem>
              <SelectItem value="senior">Over 60</SelectItem>
            </SelectContent>
          </Select>
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
