"use client";

import { Calendar, CheckCircle, Clock, Play, Search, XCircle, AlertCircle, Video } from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DoctorAppointmentViewFilter } from "../page";

interface DoctorAppointmentsSummaryProps {
  todayLabel: string;
  clinicId?: string | undefined;
  userId?: string | undefined;
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  activeAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  noShowAppointmentsCount: number;
  totalAppointmentsCount: number;
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
}

export function DoctorAppointmentsSummary({
  todayLabel,
  clinicId,
  userId,
  searchTerm,
  appointmentViewFilter,
  activeAppointmentsCount,
  inProgressAppointmentsCount,
  completedAppointmentsCount,
  cancelledAppointmentsCount,
  noShowAppointmentsCount,
  totalAppointmentsCount,
  setSearchTerm,
  setAppointmentViewFilter,
}: DoctorAppointmentsSummaryProps) {
  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Appointments"
        title="My Appointments"
        description={`Today is ${todayLabel || "today"}. Review active visits and appointment history, including completed, cancelled, and no-show records.`}
        actionsSlot={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <BookAppointmentDialog
              {...(clinicId ? { clinicId } : {})}
              {...(userId ? { initialDoctorId: userId } : {})}
              trigger={
                <Button className="h-10 w-full rounded-xl border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm hover:from-orange-600 hover:to-amber-600 focus-visible:ring-2 focus-visible:ring-orange-500/30 animate-pulse sm:w-auto">
                  <Video className="mr-2 size-4" />
                  Book Video Appointment
                </Button>
              }
            />
            <WebSocketStatusIndicator />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardMetricCard
          label="Active"
          value={activeAppointmentsCount}
          icon={<Clock className="size-3.5 text-slate-600" />}
          accentClassName="border-l-slate-400"
          valueClassName="text-sm font-semibold text-slate-600 sm:text-base"
          compact
        />
        <DashboardMetricCard
          label="In Progress"
          value={inProgressAppointmentsCount}
          icon={<Play className="size-3.5 text-blue-600" />}
          accentClassName="border-l-blue-400"
          valueClassName="text-sm font-semibold text-blue-600 sm:text-base"
          compact
        />
        <DashboardMetricCard
          label="Completed"
          value={completedAppointmentsCount}
          icon={<CheckCircle className="size-3.5 text-purple-600" />}
          accentClassName="border-l-purple-400"
          valueClassName="text-sm font-semibold text-purple-600 sm:text-base"
          compact
        />
        <DashboardMetricCard
          label="Cancelled"
          value={cancelledAppointmentsCount}
          icon={<XCircle className="size-3.5 text-rose-600" />}
          accentClassName="border-l-rose-400"
          valueClassName="text-sm font-semibold text-rose-600 sm:text-base"
          compact
        />
        <DashboardMetricCard
          label="No Show"
          value={noShowAppointmentsCount}
          icon={<AlertCircle className="size-3.5 text-orange-600" />}
          accentClassName="border-l-orange-400"
          valueClassName="text-sm font-semibold text-orange-600 sm:text-base"
          compact
        />
        <DashboardMetricCard
          label="Total"
          value={totalAppointmentsCount}
          icon={<Calendar className="size-3.5 text-violet-600" />}
          accentClassName="border-l-violet-400"
          valueClassName="text-sm font-semibold text-violet-600 sm:text-base"
          compact
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="px-4 pb-3 pt-4">
          <CardTitle className="text-base font-semibold">Filter Appointments</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex flex-col gap-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by patient name, appointment type, or complaint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "ALL" as const, label: "All", count: totalAppointmentsCount },
                { value: "ACTIVE" as const, label: "Active", count: activeAppointmentsCount },
                { value: "COMPLETED" as const, label: "Completed", count: completedAppointmentsCount },
                { value: "CANCELLED" as const, label: "Cancelled", count: cancelledAppointmentsCount },
                { value: "NO_SHOW" as const, label: "No Show", count: noShowAppointmentsCount },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={appointmentViewFilter === filter.value ? "default" : "outline"}
                  className="h-10 flex-1 rounded-xl px-4 sm:flex-none"
                  onClick={() => setAppointmentViewFilter(filter.value)}
                >
                  <span className="mr-2">{filter.label}</span>
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold leading-none text-foreground">
                    {filter.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
