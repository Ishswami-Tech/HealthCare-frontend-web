"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, IndianRupee, Loader2, Search, Stethoscope, Users } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import {
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/query/useAppointments";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { cn } from "@/lib/utils";

type ClinicAppointment = {
  id: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentDate?: string;
  date?: string;
  time?: string;
  type?: string;
  status: string;
  paymentStatus?: string;
  paymentCompleted?: boolean;
  paymentAmount?: number | null;
};

const STATUS_FILTER_OPTIONS = [
  "all",
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "EXPIRED",
];

// Statuses a clinic admin can manually set from this view. Deliberately
// excludes system-managed states (SCHEDULED, EXPIRED, IN_PROGRESS) that
// should only change via their own workflows (payment, check-in, video).
const ASSIGNABLE_STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "CONFIRMED" || normalized === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized === "CANCELLED" || normalized === "NO_SHOW" || normalized === "EXPIRED") {
    return "bg-red-100 text-red-700";
  }
  return "bg-amber-100 text-amber-700";
}

export default function ClinicAdminAppointmentsPage() {
  const { data: currentClinic } = useCurrentClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isPending, refetch } = useAppointments({ limit: 100 });
  const appointments: ClinicAppointment[] = useMemo(
    () => ((data as { appointments?: unknown[] } | undefined)?.appointments ?? []) as ClinicAppointment[],
    [data]
  );

  const updateStatusMutation = useUpdateAppointmentStatus();

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" || String(appointment.status).toUpperCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        appointment.patientName?.toLowerCase().includes(term) ||
        appointment.doctorName?.toLowerCase().includes(term) ||
        appointment.patientPhone?.toLowerCase().includes(term)
      );
    });
  }, [appointments, searchTerm, statusFilter]);

  const headerMeta = `${currentClinic?.name || "Your clinic"} • ${appointments.length} appointments`;

  const columns: ColumnDef<ClinicAppointment>[] = [
    {
      accessorKey: "date",
      header: "Date & Time",
      cell: ({ row }) => {
        const raw = row.original as unknown as Record<string, unknown>;
        return (
          <div className="text-sm">
            <div className="font-medium">{getReceptionistAppointmentDateLabel(raw)}</div>
            <div className="text-xs text-muted-foreground">
              {getReceptionistAppointmentTimeLabel(raw)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.patientName || "Unknown patient"}</div>
          {row.original.patientPhone && (
            <div className="text-xs text-muted-foreground">{row.original.patientPhone}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => row.original.doctorName || "—",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => row.original.type || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const appointment = row.original;
        const currentStatus = String(appointment.status).toUpperCase();
        return (
          <Select
            value={currentStatus}
            onValueChange={(nextStatus) => {
              if (nextStatus === currentStatus) return;
              updateStatusMutation.mutate(
                { appointmentId: appointment.id, status: nextStatus },
                { onSuccess: () => refetch() }
              );
            }}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className={cn("h-7 w-[140px] border-none text-xs font-semibold", statusBadgeClass(currentStatus))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Always include the current status even if it isn't one an admin can pick,
                  so the select has a valid value to display. */}
              {!ASSIGNABLE_STATUSES.includes(currentStatus) && (
                <SelectItem value={currentStatus}>{currentStatus}</SelectItem>
              )}
              {ASSIGNABLE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const appointment = row.original;
        if (appointment.paymentCompleted) {
          return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
        }
        return (
          <Link
            href="/clinic-admin/payments"
            className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
            title="Reconcile this payment"
          >
            <IndianRupee className="size-3" />
            {appointment.paymentStatus || "Pending"}
          </Link>
        );
      },
    },
  ];

  return (
    <DashboardPageShell className="mx-auto max-w-7xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Clinic Admin"
        title="Appointments"
        description="View every appointment across the clinic and update its status."
        meta={headerMeta}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total",
            value: appointments.length,
            icon: Calendar,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Confirmed",
            value: appointments.filter((a) => String(a.status).toUpperCase() === "CONFIRMED").length,
            icon: Users,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Payment Pending",
            value: appointments.filter((a) => !a.paymentCompleted).length,
            icon: Stethoscope,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-500/10",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-none bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-black">{stat.value}</p>
                </div>
                <div className={cn("rounded-2xl p-3", stat.bg)}>
                  <stat.icon className={cn("size-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border-none bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patient or doctor name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAppointments}
        emptyMessage={isPending ? "Loading appointments..." : "No appointments matching your filters"}
        pageSize={10}
        toolbar={
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        }
      />
    </DashboardPageShell>
  );
}
