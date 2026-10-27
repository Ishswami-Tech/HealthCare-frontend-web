"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AppointmentListSkeleton, StatCardSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { statusLabel, statusTone } from "@/components/tbd/status";
import { useSetLabBookingStatus, useStaffLabBookings } from "@/hooks/query/useLabBookings";
import type { LabBooking, LabBookingStatus } from "@/lib/actions/lab-bookings.server";
import { formatDateInIST } from "@/lib/utils/date-time";
import { CalendarClock, FlaskConical, MapPin, RefreshCw, Search, User } from "lucide-react";

type FilterStatus = "ALL" | LabBookingStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SAMPLE_COLLECTED", label: "Sample collected" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

/** CONFIRMED -> SAMPLE_COLLECTED -> COMPLETED; CANCELLED is terminal, and so is COMPLETED. */
const NEXT_STATUS: Partial<Record<LabBookingStatus, Exclude<LabBookingStatus, "REQUESTED">>> = {
  CONFIRMED: "SAMPLE_COLLECTED",
  SAMPLE_COLLECTED: "COMPLETED",
};
const TERMINAL: ReadonlySet<LabBookingStatus> = new Set(["COMPLETED", "CANCELLED"]);
const CANCELLABLE: ReadonlySet<LabBookingStatus> = new Set(["CONFIRMED", "SAMPLE_COLLECTED"]);

/** `statusTone()`'s palette, as badge background/text classes. */
const TONE_CLASSES: Record<string, string> = {
  rose: "bg-red-100 text-red-800",
  teal: "bg-green-100 text-green-800",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  slate: "bg-gray-100 text-gray-800",
};

/** "07:00-09:00" -> "7:00 AM – 9:00 AM". */
function windowLabel(window: string): string {
  const [from, to] = window.split("-");
  const format = (value?: string) => {
    const [hours, minutes] = String(value ?? "").split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value ?? "";
    const suffix = (hours ?? 0) >= 12 ? "PM" : "AM";
    const hour12 = (hours ?? 0) % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };
  return to ? `${format(from)} – ${format(to)}` : window;
}

function BookingRow({ booking }: { booking: LabBooking }) {
  const setStatus = useSetLabBookingStatus();
  const next = NEXT_STATUS[booking.status];
  const canCancel = CANCELLABLE.has(booking.status);
  const busy = setStatus.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <User className="size-4 text-gray-400" />
            {booking.patientName || "Unknown patient"}
          </span>
          <Badge variant="outline" className="text-xs">
            {booking.packageName}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {formatDateInIST(`${booking.slotDate}T00:00:00+05:30`, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            · {windowLabel(booking.slotWindow)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {[booking.addressLine, booking.city].filter(Boolean).join(", ")}
          </span>
        </div>
        {booking.tests.length > 0 ? (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <FlaskConical className="size-3.5" />
            {booking.tests.join(", ")}
          </span>
        ) : null}
        {booking.notes ? <p className="text-xs text-gray-500">Note: {booking.notes}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge className={TONE_CLASSES[statusTone(booking.status)] ?? TONE_CLASSES.slate}>
          {statusLabel(booking.status)}
        </Badge>
        {!TERMINAL.has(booking.status) ? (
          <div className="flex items-center gap-2">
            {next ? (
              <Button size="sm" disabled={busy} onClick={() => setStatus.mutate({ id: booking.id, status: next })}>
                Mark {statusLabel(next).toLowerCase()}
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setStatus.mutate({ id: booking.id, status: "CANCELLED" })}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Staff view of every home lab-collection booking for the clinic: list, filter by status, and
 * advance CONFIRMED -> SAMPLE_COLLECTED -> COMPLETED (or CANCELLED). Shared between the
 * receptionist and lab-technician dashboards — both roles can act on these per the backend's
 * `@Roles(RECEPTIONIST, CLINIC_ADMIN, LAB_TECHNICIAN, SUPER_ADMIN)` on `GET/PATCH /lab-bookings`.
 */
export function LabBookingsManager() {
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");

  const query = useStaffLabBookings(filter === "ALL" ? undefined : filter);
  const bookings = useMemo(() => query.data ?? [], [query.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter(
      (b) =>
        (b.patientName ?? "").toLowerCase().includes(term) ||
        b.packageName.toLowerCase().includes(term) ||
        b.addressLine.toLowerCase().includes(term)
    );
  }, [bookings, search]);

  const counts = useMemo(() => {
    const byStatus = new Map<string, number>();
    for (const b of bookings) byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
    return byStatus;
  }, [bookings]);

  const showSkeleton = query.isPending && bookings.length === 0;

  if (showSkeleton) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <div className="h-9 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCardSkeleton icon={<FlaskConical className="size-4 text-blue-600" />} label="Confirmed" />
          <StatCardSkeleton icon={<FlaskConical className="size-4 text-blue-600" />} label="Sample collected" />
          <StatCardSkeleton icon={<FlaskConical className="size-4 text-green-600" />} label="Completed" />
          <StatCardSkeleton icon={<FlaskConical className="size-4 text-red-600" />} label="Cancelled" />
        </div>
        <AppointmentListSkeleton items={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Lab Bookings</h1>
          <p className="text-gray-600">Home sample-collection bookings for this clinic.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.get("CONFIRMED") ?? 0}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.get("SAMPLE_COLLECTED") ?? 0}</div>
            <div className="text-sm text-gray-600">Sample collected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.get("COMPLETED") ?? 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.get("CANCELLED") ?? 0}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-gray-400" />
              <Input
                placeholder="Search by patient, package or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? "default" : "outline"}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-5" />
            Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {query.error ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <FlaskConical className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Bookings could not be loaded</EmptyTitle>
                <EmptyDescription>{query.error.message}</EmptyDescription>
              </EmptyContent>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </Empty>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <FlaskConical className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No bookings found</EmptyTitle>
                <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
