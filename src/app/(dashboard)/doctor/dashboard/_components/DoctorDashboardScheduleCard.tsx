"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Calendar, CheckCircle, Loader2, Play, Pill, Users, Video } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { getVideoSessionDecision } from "@/lib/utils/appointmentUtils";
import { theme } from "@/lib/utils/theme-utils";
import type { TransformedAppointment } from "./doctor-dashboard.logic";

interface DoctorDashboardScheduleCardProps {
  appointments: TransformedAppointment[];
  onJoinVideoSession: (appointmentId: string) => void;
  onStartConsultationForAppointment: (appointmentId: string, doctorId: string) => void | Promise<void>;
  onOpenPrescription: (appointment: TransformedAppointment) => void;
  onOpenEhr: (patientId: string) => void;
  onCompleteAppointment: (appointmentId: string) => void | Promise<void>;
  isStartPending: boolean;
  isCompletePending: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
    case "CONFIRMED":
      return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
    case "COMPLETED":
      return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
}

export function DoctorDashboardScheduleCard({
  appointments,
  onJoinVideoSession,
  onStartConsultationForAppointment,
  onOpenPrescription,
  onOpenEhr,
  onCompleteAppointment,
  isStartPending,
  isCompletePending,
}: DoctorDashboardScheduleCardProps) {
  const columns = useMemo<ColumnDef<TransformedAppointment>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className={`size-9 ${row.original.isVideo ? "bg-indigo-100/80 text-indigo-600" : "bg-blue-100/80 text-blue-600"} rounded-full flex items-center justify-center shrink-0`}
            >
              {row.original.isVideo ? <Video className="size-4" /> : <Users className="size-4" />}
            </div>
            <div>
              <div className={`mb-1 flex items-center gap-2 font-semibold leading-none ${theme.textColors.heading}`}>
                {row.original.patientName}
                {row.original.priority === "URGENT" && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-black animate-pulse ring-2 ring-destructive/20">
                    URGENT
                  </Badge>
                )}
              </div>
              <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${theme.textColors.tertiary}`}>
                <span>{row.original.type}</span>
                <span className="text-muted-foreground">·</span>
                <span>{row.original.duration}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => {
          const stateLabel =
            row.original.scheduleState === "PAST"
              ? "Past"
              : row.original.scheduleState === "TODAY"
                ? "Today"
                : "Upcoming";

          const stateClasses =
            row.original.scheduleState === "PAST"
              ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
              : row.original.scheduleState === "TODAY"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

          return (
            <div className="flex flex-col gap-1">
              <div className={`text-sm font-semibold tracking-tight ${theme.textColors.primary}`}>
                {row.original.dateLabel}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium ${theme.textColors.tertiary}`}>{row.original.timeLabel}</span>
                <Badge variant="outline" className={`h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider ${stateClasses}`}>
                  {stateLabel}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wider ${getStatusColor(row.original.statusEnum || "")}`}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const appointment = row.original;
          const videoSessionDecision = appointment.isVideo ? getVideoSessionDecision(appointment) : null;

          return (
            <div className="flex flex-col gap-2">
              {appointment.statusEnum === "CONFIRMED" && appointment.isVideo && videoSessionDecision?.canJoin && (
                <div className="flex flex-col items-start gap-1.5">
                  <Button
                    size="sm"
                    className="h-9 w-full justify-center gap-1.5 border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-lg"
                    onClick={() => onJoinVideoSession(appointment.id)}
                  >
                    <Play className="size-3 fill-current" />
                    Join Session
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Join opens 10 minutes before your visit and stays open for 3 hours after start.
                  </p>
                </div>
              )}
              {appointment.statusEnum === "CONFIRMED" && !appointment.isVideo && (
                <Button
                  size="sm"
                  className="h-8 w-full gap-1.5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                  disabled={isStartPending}
                  onClick={() => onStartConsultationForAppointment(appointment.id, appointment.doctorId)}
                >
                  {isStartPending ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3 fill-current" />}
                  Start
                </Button>
              )}
              {appointment.statusEnum === "IN_PROGRESS" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100"
                    onClick={() => onOpenPrescription(appointment)}
                  >
                    <Pill className="size-3" />
                    Prescribe
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 border-none bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    disabled={isCompletePending}
                    onClick={() => onCompleteAppointment(appointment.id)}
                  >
                    {isCompletePending ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                    Complete
                  </Button>
                </div>
              )}
              {appointment.statusEnum !== "IN_PROGRESS" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
                  onClick={() => onOpenEhr(appointment.patientId)}
                >
                  EHR
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [isCompletePending, isStartPending, onCompleteAppointment, onJoinVideoSession, onOpenEhr, onOpenPrescription, onStartConsultationForAppointment]
  );

  return (
    <Card className="overflow-hidden border-l-2 border-l-blue-400 shadow-sm">
      <CardHeader className="border-b border-border bg-muted/40 px-4 pb-3 pt-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Calendar className="size-5 text-muted-foreground" />
          Full Schedule List
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 opacity-90 transition-opacity hover:opacity-100 sm:p-3">
        <DataTable columns={columns} data={appointments} pageSize={10} emptyMessage="Your schedule is clear for today." />
      </CardContent>
    </Card>
  );
}
