"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Play,
  UserX,
  Video,
  XCircle,
} from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import {
  DateField,
  parseDateValue,
} from "@/components/appointments/manager/ManagerFilters";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
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
  IconBox,
  PageHero,
  Pill,
  SearchBox,
  Surface,
  type IconTone,
  type PillTone,
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
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
  setDateFilter: (value: DoctorAppointmentDateFilter) => void;
  setDateRange: (from: string, to: string) => void;
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
  setSearchTerm,
  setAppointmentViewFilter,
  setDateFilter,
  setDateRange,
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
                value={dateFrom}
                placeholder="From date"
                ariaLabel="From date"
                onChange={(from) => setDateRange(from, dateTo)}
                className="h-10 w-full rounded-xl lg:w-[168px]"
              />
              <DateField
                value={dateTo}
                placeholder="To date"
                ariaLabel="To date"
                onChange={(to) => setDateRange(dateFrom, to)}
                isDisabled={(date) => {
                  const start = parseDateValue(dateFrom);
                  return Boolean(start) && date < (start as Date);
                }}
                className="h-10 w-full rounded-xl lg:w-[168px]"
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
