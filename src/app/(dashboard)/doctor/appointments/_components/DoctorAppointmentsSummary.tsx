"use client";

import type { ReactNode } from "react";
import { AlertCircle, Calendar, CheckCircle, Clock, Play, UserX, Video, XCircle } from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FilterChips,
  IconBox,
  PageHero,
  Pill,
  SearchBox,
  Surface,
  type IconTone,
  type PillTone,
  type TbdIcon,
  type TbdOption,
} from "@/components/tbd";
import type { DoctorAppointmentViewFilter } from "../page";

interface DoctorAppointmentsSummaryProps {
  todayLabel: string;
  clinicId?: string | undefined;
  userId?: string | undefined;
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  activeAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  confirmedAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  expiredAppointmentsCount: number;
  noShowAppointmentsCount: number;
  totalAppointmentsCount: number;
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
  loading?: boolean;
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

/** Small number tile: seven of them sit in one row on a desktop. */
function StatTile({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  icon: TbdIcon;
  tone: IconTone;
  loading: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-card p-3.5 shadow-card dark:border dark:border-border/70">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs font-bold text-ink-muted">{label}</span>
        {loading ? (
          <Skeleton className="my-0.5 h-6 w-9 rounded-md" />
        ) : (
          <span className="text-2xl font-extrabold leading-[1.15] text-ink">{value}</span>
        )}
      </span>
      <IconBox icon={icon} tone={tone} size={34} />
    </div>
  );
}

export function DoctorAppointmentsSummary({
  todayLabel,
  clinicId,
  userId,
  searchTerm,
  appointmentViewFilter,
  activeAppointmentsCount,
  inProgressAppointmentsCount,
  confirmedAppointmentsCount,
  completedAppointmentsCount,
  cancelledAppointmentsCount,
  expiredAppointmentsCount,
  noShowAppointmentsCount,
  totalAppointmentsCount,
  setSearchTerm,
  setAppointmentViewFilter,
  loading = false,
  connectionSlot,
}: DoctorAppointmentsSummaryProps) {
  const filterOptions: TbdOption<DoctorAppointmentViewFilter>[] = [
    { value: "ALL", label: "All", count: totalAppointmentsCount },
    { value: "ACTIVE", label: "Active", count: activeAppointmentsCount },
    { value: "CONFIRMED", label: "Confirmed", count: confirmedAppointmentsCount },
    { value: "COMPLETED", label: "Completed", count: completedAppointmentsCount },
    { value: "CANCELLED", label: "Cancelled", count: cancelledAppointmentsCount },
    { value: "EXPIRED", label: "Expired", count: expiredAppointmentsCount },
    { value: "NO_SHOW", label: "No Show", count: noShowAppointmentsCount },
  ];

  return (
    <>
      <PageHero
        eyebrow="Doctor Appointments"
        title="My Appointments"
        description={`Today is ${todayLabel || "today"}. Review active visits and appointment history, including completed, cancelled, and no-show records.`}
        badge={connectionSlot ?? <ConnectionPill />}
        actions={
          <BookAppointmentDialog
            {...(clinicId ? { clinicId } : {})}
            {...(userId ? { initialDoctorId: userId } : {})}
            trigger={
              <Button size="md" className="w-full sm:w-auto">
                <Video />
                Book Video Appointment
              </Button>
            }
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" role="group" aria-label="Appointment counts">
        <StatTile label="Active" value={activeAppointmentsCount} icon={Clock} tone="slate" loading={loading} />
        <StatTile label="In Progress" value={inProgressAppointmentsCount} icon={Play} tone="blue" loading={loading} />
        <StatTile label="Completed" value={completedAppointmentsCount} icon={CheckCircle} tone="mint" loading={loading} />
        <StatTile label="Cancelled" value={cancelledAppointmentsCount} icon={XCircle} tone="rose" loading={loading} />
        <StatTile label="Expired" value={expiredAppointmentsCount} icon={AlertCircle} tone="slate" loading={loading} />
        <StatTile label="No Show" value={noShowAppointmentsCount} icon={UserX} tone="amber" loading={loading} />
        <StatTile label="Total" value={totalAppointmentsCount} icon={Calendar} tone="video" loading={loading} />
      </div>

      <Surface as="section" aria-label="Filter appointments">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="m-0 shrink-0 text-base font-bold text-ink">Filter Appointments</h2>
          <FilterChips
            ariaLabel="Appointment status"
            options={filterOptions}
            value={appointmentViewFilter}
            onChange={setAppointmentViewFilter}
            className="lg:justify-end"
          />
        </div>
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by patient name, appointment type, or complaint..."
          ariaLabel="Search appointments"
        />
      </Surface>
    </>
  );
}
