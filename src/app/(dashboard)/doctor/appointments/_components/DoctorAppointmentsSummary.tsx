"use client";

import type { ReactNode } from "react";
import {
  Calendar as CalendarIcon,
  CalendarCheck2,
  CheckCircle,
  Clock,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConnectionPill,
  DateField,
  IconBox,
  PageHero,
  SearchBox,
  Surface,
  type IconTone,
  type TbdIcon,
} from "@/components/tbd";
import type { DoctorAppointmentDateFilter, DoctorAppointmentViewFilter } from "../page";

interface DoctorAppointmentsSummaryProps {
  todayLabel: string;
  clinicId?: string | undefined;
  userId?: string | undefined;
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  dateFilter: DoctorAppointmentDateFilter;
  dateFrom: string;
  dateTo: string;
  activeAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  confirmedAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  expiredAppointmentsCount: number;
  noShowAppointmentsCount: number;
  totalAppointmentsCount: number;
  /** "Follow-ups only" toggle, orthogonal to status (a follow-up can be any status). */
  followUpOnly: boolean;
  followUpAppointmentsCount: number;
  /** Visit-type filter, also orthogonal to status. */
  visitTypeFilter: "ALL" | "IN_PERSON" | "VIDEO_CALL";
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
  setDateFilter: (value: DoctorAppointmentDateFilter) => void;
  setDateRange: (from: string, to: string) => void;
  setFollowUpOnly: (value: boolean) => void;
  setVisitTypeFilter: (value: "ALL" | "IN_PERSON" | "VIDEO_CALL") => void;
  loading?: boolean;
  /** Replaces the live connection tag (used by the design preview). */
  connectionSlot?: ReactNode;
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

const DATE_OPTIONS: { value: DoctorAppointmentDateFilter; label: string }[] = [
  { value: "ALL", label: "All dates" },
  { value: "TODAY", label: "Today" },
  { value: "TOMORROW", label: "Tomorrow" },
  { value: "THIS_WEEK", label: "This week" },
  { value: "CUSTOM", label: "Custom range" },
];

function statusLabel(
  value: DoctorAppointmentViewFilter,
  counts: {
    all: number;
    active: number;
    inProgress: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    expired: number;
    noShow: number;
  },
): string {
  switch (value) {
    case "ALL":
      return `All statuses (${counts.all})`;
    case "ACTIVE":
      return `Active (${counts.active})`;
    case "IN_PROGRESS":
      return `In progress (${counts.inProgress})`;
    case "CONFIRMED":
      return `Confirmed (${counts.confirmed})`;
    case "COMPLETED":
      return `Completed (${counts.completed})`;
    case "CANCELLED":
      return `Cancelled (${counts.cancelled})`;
    case "EXPIRED":
      return `Expired (${counts.expired})`;
    case "NO_SHOW":
      return `No show (${counts.noShow})`;
    default:
      return value;
  }
}

export function DoctorAppointmentsSummary({
  todayLabel,
  clinicId,
  userId,
  searchTerm,
  appointmentViewFilter,
  dateFilter,
  dateFrom,
  dateTo,
  activeAppointmentsCount,
  inProgressAppointmentsCount,
  confirmedAppointmentsCount,
  completedAppointmentsCount,
  cancelledAppointmentsCount,
  expiredAppointmentsCount,
  noShowAppointmentsCount,
  totalAppointmentsCount,
  followUpOnly,
  followUpAppointmentsCount,
  visitTypeFilter,
  setSearchTerm,
  setAppointmentViewFilter,
  setDateFilter,
  setDateRange,
  setFollowUpOnly,
  setVisitTypeFilter,
  loading = false,
  connectionSlot,
}: DoctorAppointmentsSummaryProps) {
  const counts = {
    all: totalAppointmentsCount,
    active: activeAppointmentsCount,
    inProgress: inProgressAppointmentsCount,
    confirmed: confirmedAppointmentsCount,
    completed: completedAppointmentsCount,
    cancelled: cancelledAppointmentsCount,
    expired: expiredAppointmentsCount,
    noShow: noShowAppointmentsCount,
  };

  const statusValues: DoctorAppointmentViewFilter[] = [
    "ALL",
    "ACTIVE",
    "IN_PROGRESS",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "EXPIRED",
    "NO_SHOW",
  ];

  return (
    <>
      <PageHero
        eyebrow="Doctor Appointments"
        title="My Appointments"
        description={`Today is ${todayLabel || "today"}. Review active visits and appointment history.`}
        badge={connectionSlot ?? <ConnectionPill />}
      />

      {/* Four tiles that actually partition the list — each visit counts in exactly one, so they
          add up to something a doctor can trust at a glance. Cancelled / expired / no-show are
          still one click away in the status dropdown below (same as "Confirmed" already was);
          they're audit information, not what a doctor needs to see on every page load. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Appointment counts">
        <StatTile label="Not started" value={activeAppointmentsCount} icon={Clock} tone="slate" loading={loading} />
        <StatTile label="In Progress" value={inProgressAppointmentsCount} icon={Play} tone="blue" loading={loading} />
        <StatTile label="Completed" value={completedAppointmentsCount} icon={CheckCircle} tone="mint" loading={loading} />
        <StatTile label="Total" value={totalAppointmentsCount} icon={CalendarIcon} tone="video" loading={loading} />
      </div>

      <Surface as="section" aria-label="Filter appointments" className="!p-3.5 sm:!p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DoctorAppointmentDateFilter)}
          >
            <SelectTrigger
              aria-label="Filter by date"
              className="h-10 w-full rounded-xl border-line text-[13px] font-semibold lg:w-[148px]"
            >
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter === "CUSTOM" ? (
            <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
              <DateField
                variant="placeholder"
                id="doctor-appointments-date-from"
                label="From date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(from) => setDateRange(from, dateTo)}
                className="w-full lg:w-[168px]"
              />
              <DateField
                variant="placeholder"
                id="doctor-appointments-date-to"
                label="To date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(to) => setDateRange(dateFrom, to)}
                className="w-full lg:w-[168px]"
              />
            </div>
          ) : null}

          <Select
            value={appointmentViewFilter}
            onValueChange={(value) =>
              setAppointmentViewFilter(value as DoctorAppointmentViewFilter)
            }
          >
            <SelectTrigger
              aria-label="Filter by status"
              className="h-10 w-full rounded-xl border-line text-[13px] font-semibold lg:w-[190px]"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {statusLabel(value, counts)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={visitTypeFilter}
            onValueChange={(value) => setVisitTypeFilter(value as "ALL" | "IN_PERSON" | "VIDEO_CALL")}
          >
            <SelectTrigger
              aria-label="Filter by visit type"
              className="h-10 w-full rounded-xl border-line text-[13px] font-semibold lg:w-[150px]"
            >
              <SelectValue placeholder="Visit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All visit types</SelectItem>
              <SelectItem value="IN_PERSON">In-clinic</SelectItem>
              <SelectItem value="VIDEO_CALL">Video call</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={followUpOnly ? "default" : "outline"}
            size="md"
            aria-pressed={followUpOnly}
            className="h-10 shrink-0 rounded-xl text-[13px] font-semibold"
            onClick={() => setFollowUpOnly(!followUpOnly)}
          >
            <CalendarCheck2 aria-hidden="true" className="size-4" />
            Follow-ups ({followUpAppointmentsCount})
          </Button>

          <div className="min-w-0 flex-1">
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search patient, type, or complaint..."
              ariaLabel="Search appointments"
            />
          </div>
        </div>
      </Surface>
    </>
  );
}
