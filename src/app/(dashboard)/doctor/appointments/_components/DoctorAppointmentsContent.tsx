"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Loader2, Eye, Play, Video, CheckCircle } from "lucide-react";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { getAppointmentPatientName, getAppointmentViewState, getDisplayAppointmentDuration, getReceptionistAppointmentDateLabel, getReceptionistAppointmentTimeLabel, getAppointmentDateTimeValue, formatDateInIST, formatTimeInIST } from "@/lib/utils/appointmentUtils";
import { DoctorAppointmentsSummary } from "./DoctorAppointmentsSummary";
import { DoctorAppointmentsDetailsDialog } from "./DoctorAppointmentsDetailsDialog";
import type { DoctorAppointmentViewFilter, TransformedAppointment } from "../page";

interface Props {
  isLoadingAppointments: boolean;
  todayLabel: string;
  clinicId?: string | undefined;
  userId?: string | undefined;
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  appointments: TransformedAppointment[];
  filteredAppointments: TransformedAppointment[];
  activeAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  noShowAppointmentsCount: number;
  totalAppointmentsCount: number;
  selectedAppointment: TransformedAppointment | null;
  selectedAppointmentIsClosed: boolean;
  diagnosis: string;
  prescription: string;
  consultationNotes: string;
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
  setSelectedAppointment: (value: TransformedAppointment | null) => void;
  setDiagnosis: (value: string) => void;
  setPrescription: (value: string) => void;
  setConsultationNotes: (value: string) => void;
  completeAppointmentPending: boolean;
  updateAppointmentPending: boolean;
  openAppointmentDetails: (appointment: TransformedAppointment) => void;
  saveConsultationDraft: (appointmentId: string) => Promise<void>;
  completeConsultation: (appointmentId: string, data?: { diagnosis?: string; prescription?: string; notes?: string }) => Promise<void>;
  startConsultation: (appointmentId: string, doctorId: string, options?: { openVideoAfterStart?: boolean }) => Promise<void>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
    case "RESCHEDULED":
    case "ON_HOLD":
    case "AWAITING_SLOT_CONFIRMATION":
      return "bg-amber-100 text-amber-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "SCHEDULED":
      return "bg-gray-100 text-gray-800";
    case "COMPLETED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800";
    case "NO_SHOW":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: string) {
  return (
    {
      PENDING: "Pending",
      RESCHEDULED: "Rescheduled",
      ON_HOLD: "On Hold",
      AWAITING_SLOT_CONFIRMATION: "Awaiting Slot",
      IN_PROGRESS: "In Progress",
      SCHEDULED: "Scheduled",
      CONFIRMED: "Confirmed",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      NO_SHOW: "No Show",
    }[status] || status
  );
}

export function DoctorAppointmentsContent(props: Props) {
  const {
    isLoadingAppointments,
    todayLabel,
    clinicId,
    userId,
    searchTerm,
    appointmentViewFilter,
    appointments,
    filteredAppointments,
    activeAppointmentsCount,
    inProgressAppointmentsCount,
    completedAppointmentsCount,
    cancelledAppointmentsCount,
    noShowAppointmentsCount,
    totalAppointmentsCount,
    selectedAppointment,
    selectedAppointmentIsClosed,
    diagnosis,
    prescription,
    consultationNotes,
    setSearchTerm,
    setAppointmentViewFilter,
    setSelectedAppointment,
    setDiagnosis,
    setPrescription,
    setConsultationNotes,
    completeAppointmentPending,
    updateAppointmentPending,
    openAppointmentDetails,
    saveConsultationDraft,
    completeConsultation,
    startConsultation,
  } = props;

  const appointmentColumns = useMemo<ColumnDef<TransformedAppointment>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium text-foreground">{app.patientName}</div>
              <div className="text-xs text-muted-foreground">
                {app.patientAge ? `${app.patientAge} years` : "Age not set"}
                {app.patientGender ? `  ${app.patientGender}` : "  Unknown"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex flex-col gap-y-1">
              <div className="text-sm font-medium text-foreground">{app.type}</div>
              <div className="text-xs text-muted-foreground">
                {app.appointmentDate}  {app.time}  {app.duration}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge className={getStatusColor(row.original.status)}>{getStatusLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "chiefComplaint",
        header: "Details",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex min-w-0 flex-col gap-y-1">
              <div className="text-sm text-foreground line-clamp-1">{app.chiefComplaint}</div>
              <div className="text-xs text-muted-foreground">{app.patientPhone || app.patientEmail || "Not available"}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
              <Button variant="outline" size="sm" className="size-9 rounded-xl" onClick={() => openAppointmentDetails(app)} aria-label={`View details for ${app.patientName}`}>
                <Eye className="size-4" />
              </Button>
              {app.status === "CONFIRMED" && app.type === "VIDEO_CALL" && (
                <Button size="sm" className="h-9 rounded-xl px-3 gap-2" onClick={() => { window.location.assign(buildVideoSessionRoute(app.id)); }}>
                  <Play className="mr-1 size-4" />
                  Join Session
                </Button>
              )}
              {app.status === "CONFIRMED" && app.type !== "VIDEO_CALL" && (
                <Button size="sm" className="h-9 rounded-xl px-3 gap-2" onClick={() => startConsultation(app.id, app.doctorId)}>
                  <Play className="mr-1 size-4" />
                  Start
                </Button>
              )}
              {app.status === "IN_PROGRESS" && app.type === "VIDEO_CALL" && (
                <>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl px-3 gap-2" onClick={() => { window.location.assign(buildVideoSessionRoute(app.id)); }}>
                    <Video className="mr-1 size-4" />
                    Open video
                  </Button>
                  <Button size="sm" className="h-9 rounded-xl px-3 gap-2" onClick={() => completeConsultation(app.id, { diagnosis, prescription, notes: consultationNotes })} disabled={completeAppointmentPending}>
                    <CheckCircle className="mr-1 size-4" />
                    Complete
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [completeAppointmentPending, completeConsultation, consultationNotes, diagnosis, openAppointmentDetails, prescription, startConsultation],
  );

  if (isLoadingAppointments) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <DoctorAppointmentsSummary
        todayLabel={todayLabel}
        clinicId={clinicId}
        userId={userId}
        searchTerm={searchTerm}
        appointmentViewFilter={appointmentViewFilter}
        activeAppointmentsCount={activeAppointmentsCount}
        inProgressAppointmentsCount={inProgressAppointmentsCount}
        completedAppointmentsCount={completedAppointmentsCount}
        cancelledAppointmentsCount={cancelledAppointmentsCount}
        noShowAppointmentsCount={noShowAppointmentsCount}
        totalAppointmentsCount={totalAppointmentsCount}
        setSearchTerm={setSearchTerm}
        setAppointmentViewFilter={setAppointmentViewFilter}
      />

      <DataTable columns={appointmentColumns} data={filteredAppointments} emptyMessage="No appointments match this view" pageSize={10} />

      <DoctorAppointmentsDetailsDialog
        selectedAppointment={selectedAppointment}
        selectedAppointmentIsClosed={selectedAppointmentIsClosed}
        diagnosis={diagnosis}
        prescription={prescription}
        consultationNotes={consultationNotes}
        updateAppointmentPending={updateAppointmentPending}
        completeAppointmentPending={completeAppointmentPending}
        setSelectedAppointment={setSelectedAppointment}
        setDiagnosis={setDiagnosis}
        setPrescription={setPrescription}
        setConsultationNotes={setConsultationNotes}
        saveConsultationDraft={saveConsultationDraft}
        completeConsultation={completeConsultation}
      />
    </>
  );
}
