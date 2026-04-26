"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments, useForceCheckInAppointment } from "@/hooks/query/useAppointments";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  getAppointmentStatusDisplayName,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import { getAppointmentViewState } from "@/lib/utils/appointmentUtils";


interface AppointmentListItem {
  id: string;
  locationId?: string;
  status?: string;
  type?: string;
  date?: string;
  appointmentDate?: string;
  startTime?: string;
  time?: string;
  payment?: { status?: string };
  checkedInAt?: string | null;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  patient?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  };
  doctor?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface CheckInRow {
  id: string;
  locationId?: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  paymentStatus: string;
  canCheckIn: boolean;
  isConfirmedArrival: boolean;
}

const getTodayDateInIst = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getPersonName = (
  entity?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  },
  fallbackName?: string
) =>
  fallbackName ||
  entity?.name ||
  entity?.user?.name ||
  `${entity?.firstName || entity?.user?.firstName || ""} ${entity?.lastName || entity?.user?.lastName || ""}`.trim() ||
  "";

const getPatientPhone = (appointment: AppointmentListItem) =>
  appointment.patientPhone || appointment.patient?.phone || appointment.patient?.user?.phone || "";


export default function ReceptionistCheckInPage() {
  const { session } = useAuth();
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [confirmedAppointmentIds, setConfirmedAppointmentIds] = useState<string[]>([]);
  const todayDate = getTodayDateInIst();
  const forceCheckInMutation = useForceCheckInAppointment();
  const assignedLocationId = useMemo(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const candidate =
      (typeof user?.locationId === "string" ? user.locationId : "") ||
      (typeof user?.clinicLocationId === "string" ? user.clinicLocationId : "") ||
      (typeof user?.assignedLocationId === "string" ? user.assignedLocationId : "");
    return candidate || null;
  }, [session?.user]);

  const { data: appointmentsData, isPending: isLoading, refetch } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    date: todayDate,
    ...(assignedLocationId ? { locationId: assignedLocationId } : {}),
    limit: 100,
  });

  const appointments: AppointmentListItem[] = Array.isArray(appointmentsData)
    ? appointmentsData
    : appointmentsData?.appointments || [];

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        const patientName = getPersonName(apt.patient, apt.patientName);
        const doctorName = getPersonName(apt.doctor, apt.doctorName);
        const patientPhone = getPatientPhone(apt);
        const normalizedSearch = searchTerm.toLowerCase();
        const rowLocationId = apt.locationId || assignedLocationId || undefined;

        const matchesLocation =
          !assignedLocationId || rowLocationId === assignedLocationId;

        return (
          matchesLocation &&
          (
            !searchTerm ||
            patientName.toLowerCase().includes(normalizedSearch) ||
            doctorName.toLowerCase().includes(normalizedSearch) ||
            patientPhone.includes(searchTerm)
          )
        );
      }),
    [appointments, assignedLocationId, searchTerm]
  );

  const checkInRows = useMemo<CheckInRow[]>(
    () =>
      filteredAppointments.map((apt) => {
        const viewState = getAppointmentViewState(apt);
        const status = apt.status || "Scheduled";
        const normalizedStatus = String(status).toUpperCase();
        const rowLocationId = apt.locationId || assignedLocationId || undefined;
        const isRecentlyCheckedIn = confirmedAppointmentIds.includes(apt.id);
        const isConfirmedArrival = isRecentlyCheckedIn || Boolean(apt.checkedInAt);

        return {
          id: apt.id,
          ...(rowLocationId ? { locationId: rowLocationId } : {}),
          patientName: getPersonName(apt.patient, apt.patientName) || "Unknown",
          patientPhone: getPatientPhone(apt),
          doctorName: getPersonName(apt.doctor, apt.doctorName) || "Unknown",
          dateLabel: getReceptionistAppointmentDateLabel(apt as unknown as Record<string, unknown>),
          timeLabel: getReceptionistAppointmentTimeLabel(apt as unknown as Record<string, unknown>),
          status,
          paymentStatus: viewState.paymentStatus,
          canCheckIn: !isConfirmedArrival && ["SCHEDULED", "CONFIRMED"].includes(normalizedStatus),
          isConfirmedArrival,
        };
      }),
    [confirmedAppointmentIds, filteredAppointments]
  );

  const handleCheckIn = async (appointmentId: string, locationId?: string) => {
    const locationToSend = assignedLocationId || locationId;
    if (!locationToSend) {
      showErrorToast("Reception location is required for manual check-in.", {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
      return;
    }
    setCheckingInId(appointmentId);
    try {
      await forceCheckInMutation.mutateAsync({
        appointmentId,
        reason: "Reception desk manual check-in for this location",
        ...(locationToSend ? { locationId: locationToSend } : {}),
      });
      setConfirmedAppointmentIds((current) =>
        current.includes(appointmentId) ? current : [...current, appointmentId]
      );
      await refetch?.();
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.CHECK_IN, duration: 5000 });
    } finally {
      setCheckingInId(null);
    }
  };

  const columns = useMemo<ColumnDef<CheckInRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.patientName}</div>
            {row.original.patientPhone ? (
              <div className="text-xs text-muted-foreground">{row.original.patientPhone}</div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.doctorName}</span>
          </div>
        ),
      },
      {
        accessorKey: "dateLabel",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.dateLabel}</span>
          </div>
        ),
      },
      {
        accessorKey: "timeLabel",
        header: "Time",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.timeLabel}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isConfirmedArrival ? "default" : "secondary"}
            className={
              row.original.isConfirmedArrival
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none shadow-none"
            }
          >
            {row.original.isConfirmedArrival
              ? "Arrived"
              : getAppointmentStatusDisplayName(row.original.status || "")}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{row.original.paymentStatus}</Badge>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.canCheckIn ? (
              <Button
                size="sm"
                onClick={() => handleCheckIn(row.original.id, row.original.locationId)}
                disabled={checkingInId === row.original.id}
              >
                {checkingInId === row.original.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Confirm Arrival
                  </>
                )}
              </Button>
            ) : row.original.isConfirmedArrival ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Arrived
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
    ],
    [checkingInId]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-card p-6">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-300" />
      </div>
    );
  }

  return (
    <DashboardPageShell className="p-6">
      <DashboardPageHeader
        eyebrow="Reception Check-In"
        title="Patient Arrival Confirmation"
        description="Confirm today’s in-person arrivals and move ready patients into the consultation flow."
        meta={
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4 text-emerald-500" />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointments For Manual Check-In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing today&apos;s in-person scheduled appointments for manual arrival confirmation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, doctor, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <DataTable
            columns={columns}
            data={checkInRows}
            emptyMessage="No appointments found"
            pageSize={10}
            compact
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
