"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, Loader2, QrCode, Search, Stethoscope, UserCheck } from "lucide-react";

import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useAppointmentServices, useAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  checkInAppointment,
  getAppointmentReassignmentCandidates,
  reassignAppointmentDoctor,
  updateAppointmentStatus,
} from "@/lib/actions/appointments.server";
import { callNextPatient } from "@/lib/actions/queue.server";
import { getQueuePositionLabel, resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";

type ViewAppointment = {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  primaryDoctorId?: string;
  assignedDoctorId?: string;
  doctorName: string;
  doctorRole?: string;
  timeLabel: string;
  status: string;
  queuePosition: number | null;
  queueType: string;
  notes: string;
  waitLabel: string;
  isWalkIn: boolean;
  isDelegated: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  NO_SHOW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function normalizeAppointment(
  app: any,
  serviceCatalogMap: Map<string, { label: string; serviceBucket: string; queueCategory: string }>
): ViewAppointment {
  const startAt = app.startTime || app.appointmentDate || (app.date && app.time ? `${app.date}T${app.time}` : null);
  const parsed = startAt ? new Date(startAt) : null;

  return {
    id: app.id,
    patientName:
      app.patient?.name ||
      `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.trim() ||
      "Unknown Patient",
    patientPhone: app.patient?.phone || "",
    doctorId: app.doctor?.id || app.doctorId || "",
    primaryDoctorId: app.primaryDoctorId || app.metadata?.primaryDoctorId || app.doctorId || "",
    assignedDoctorId: app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || "",
    doctorName:
      app.doctor?.name ||
      `${app.doctor?.firstName || ""} ${app.doctor?.lastName || ""}`.trim() ||
      "Unassigned Doctor",
    doctorRole: String(app.doctor?.role || app.doctor?.user?.role || "").toUpperCase(),
    timeLabel:
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : app.time || "TBD",
    status: String(app.status || "SCHEDULED").toUpperCase(),
    queuePosition: typeof app.queuePosition === "number" ? app.queuePosition : null,
    queueType: resolveQueueDisplayLabel(app, serviceCatalogMap),
    notes: app.notes || app.reason || "",
    waitLabel:
      typeof app.estimatedWaitTime === "number"
        ? `${app.estimatedWaitTime} min`
        : typeof app.waitTime === "number"
          ? `${app.waitTime} min`
          : typeof app.waitTime === "string"
            ? app.waitTime
            : "Pending",
    isWalkIn: Boolean(app.isWalkIn),
    isDelegated:
      Boolean(app.primaryDoctorId || app.metadata?.primaryDoctorId) &&
      String(app.primaryDoctorId || app.metadata?.primaryDoctorId || "") !==
        String(app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || ""),
  };
}

export default function ReceptionistAppointmentsPage() {
  useAuth();
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();
  const { data: serviceCatalog = [] } = useAppointmentServices();

  const today = new Date().toISOString().split("T")[0] || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [selectedReassignments, setSelectedReassignments] = useState<Record<string, string>>({});
  const [reassignmentCandidates, setReassignmentCandidates] = useState<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        role: string;
        eligible: boolean;
        reason?: string;
        isCurrent: boolean;
        isPrimary: boolean;
      }>
    >
  >({});

  const {
    data: appointmentsData,
    isPending,
    refetch,
  } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    limit: 200,
  });
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });

  const assignableDoctors = useMemo(() => {
    const normalize = (users: any[]) =>
      users
        .map((user) => {
          const role = String(user.role || user.doctor?.user?.role || "").toUpperCase();
          return {
            id: user.doctor?.id || user.id,
            name:
              user.name ||
              user.doctor?.user?.name ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown Doctor",
            role,
          };
        })
        .filter((doctor) => doctor.id && (doctor.role === "DOCTOR" || doctor.role === "ASSISTANT_DOCTOR"));

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors)) return normalize((doctorsData as any).data.doctors);
    if (Array.isArray((doctorsData as any)?.data)) return normalize((doctorsData as any).data);
    return normalize((doctorsData as any)?.doctors || []);
  }, [doctorsData]);

  const appointments = useMemo(() => {
    const raw = Array.isArray(appointmentsData)
      ? appointmentsData
      : appointmentsData?.appointments || [];
    const serviceMap = new Map(
      serviceCatalog.map((service) => [
        String(service.treatmentType).toUpperCase(),
        {
          label: service.label,
          serviceBucket: service.serviceBucket,
          queueCategory: service.queueCategory,
        },
      ])
    );

    return raw.map((appointment) => normalizeAppointment(appointment, serviceMap));
  }, [appointmentsData, serviceCatalog]);

  const availableQueueTypes = useMemo(() => {
    return Array.from(
      new Set(appointments.map((appointment) => appointment.queueType).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        !searchTerm ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesQueue = queueFilter === "all" || appointment.queueType === queueFilter;
      return matchesSearch && matchesStatus && matchesQueue;
    });
  }, [appointments, queueFilter, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((item) => item.status === "SCHEDULED").length;
    const confirmed = appointments.filter((item) => item.status === "CONFIRMED").length;
    const inProgress = appointments.filter((item) => item.status === "IN_PROGRESS").length;
    const completed = appointments.filter((item) => item.status === "COMPLETED").length;
    return { total, scheduled, confirmed, inProgress, completed };
  }, [appointments]);

  const doctorBacklog = useMemo(() => {
    const grouped = new Map<
      string,
      {
        doctorId: string;
        doctorName: string;
        scheduled: number;
        confirmed: number;
        inProgress: number;
        nextPatient: string | null;
      }
    >();

    for (const appointment of filteredAppointments) {
      const current = grouped.get(appointment.doctorName) || {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        nextPatient: null,
      };

      if (appointment.status === "SCHEDULED") current.scheduled += 1;
      if (appointment.status === "CONFIRMED") {
        current.confirmed += 1;
        if (!current.nextPatient || appointment.queuePosition === 1) {
          current.nextPatient = appointment.patientName;
        }
      }
      if (appointment.status === "IN_PROGRESS") current.inProgress += 1;
      grouped.set(appointment.doctorName, current);
    }

    return Array.from(grouped.values()).sort((a, b) => b.confirmed - a.confirmed || b.scheduled - a.scheduled);
  }, [filteredAppointments]);

  useEffect(() => {
    const pendingAppointmentIds = filteredAppointments
      .filter(
        (appointment) =>
          (appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") &&
          !reassignmentCandidates[appointment.id]
      )
      .map((appointment) => appointment.id);

    if (pendingAppointmentIds.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const responses = await Promise.all(
        pendingAppointmentIds.map(async (appointmentId) => {
          const result = await getAppointmentReassignmentCandidates(appointmentId);
          return {
            appointmentId,
            candidates: result.success ? result.candidates || [] : [],
          };
        })
      );

      if (cancelled) {
        return;
      }

      setReassignmentCandidates((current) => {
        const next = { ...current };
        for (const response of responses) {
          next[response.appointmentId] = response.candidates;
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [filteredAppointments, reassignmentCandidates]);

  async function handleConfirmArrival(appointmentId: string) {
    setActiveActionId(appointmentId);
    const result = await checkInAppointment(appointmentId);
    if (result.success) {
      showSuccessToast("Patient confirmed and added to queue", { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to confirm patient arrival", { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
    }
    setActiveActionId(null);
  }

  async function handleMarkNoShow(appointmentId: string) {
    setActiveActionId(appointmentId);
    const result = await updateAppointmentStatus(appointmentId, { status: "NO_SHOW" });
    if (result.success) {
      showSuccessToast("Appointment marked as no-show", { id: TOAST_IDS.APPOINTMENT.UPDATE });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to mark no-show", { id: TOAST_IDS.APPOINTMENT.UPDATE });
    }
    setActiveActionId(null);
  }

  async function handleNotifyNext(doctorId: string) {
    if (!doctorId) {
      showErrorToast("Doctor is required to call the next patient");
      return;
    }

    setActiveDoctorId(doctorId);
    const result = (await callNextPatient(doctorId, "clinic")) as
      | { success?: boolean; message?: string }
      | null;
    if (result?.success) {
      showSuccessToast("Next patient moved into consultation", { id: TOAST_IDS.QUEUE.CALL_NEXT });
      await refetch?.();
    } else {
      showErrorToast(result?.message || "No waiting patient available for this doctor", {
        id: TOAST_IDS.QUEUE.CALL_NEXT,
      });
    }
    setActiveDoctorId(null);
  }

  async function handleReassignDoctor(appointmentId: string) {
    const selectedDoctorId = selectedReassignments[appointmentId];
    if (!selectedDoctorId) {
      showErrorToast("Select a doctor or assistant doctor first");
      return;
    }

    setActiveActionId(appointmentId);
    const result = await reassignAppointmentDoctor(appointmentId, {
      doctorId: selectedDoctorId,
      reason: "Reception desk reassignment",
    });

    if (result.success) {
      showSuccessToast("Appointment reassigned successfully", {
        id: TOAST_IDS.APPOINTMENT.UPDATE,
      });
      const refreshedCandidates = await getAppointmentReassignmentCandidates(appointmentId);
      if (refreshedCandidates.success && refreshedCandidates.candidates) {
        setReassignmentCandidates((current) => ({
          ...current,
          [appointmentId]: refreshedCandidates.candidates || [],
        }));
      }
      setSelectedReassignments((current) => {
        const next = { ...current };
        delete next[appointmentId];
        return next;
      });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to reassign appointment", {
        id: TOAST_IDS.APPOINTMENT.UPDATE,
      });
    }

    setActiveActionId(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reception Queue Workspace</h1>
          <p className="text-muted-foreground">
            Schedule appointments, confirm arrivals, and manage the doctor backlog with live data
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link href="/receptionist/check-in">
              <QrCode className="w-4 h-4 mr-2" />
              QR / Manual Check-In
            </Link>
          </Button>
          <BookAppointmentDialog
            {...(clinicId ? { clinicId } : {})}
            trigger={
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Scheduled</div><div className="text-2xl font-bold">{stats.scheduled}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Queued</div><div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.confirmed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">In Progress</div><div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.inProgress}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Completed</div><div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.completed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search patient, doctor, or phone"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
              <Select value={queueFilter} onValueChange={setQueueFilter}>
                <SelectTrigger><SelectValue placeholder="Queue" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queues</SelectItem>
                  {availableQueueTypes.map((queueType) => (
                    <SelectItem key={queueType} value={queueType}>
                      {queueType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Doctor Queue Backlog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doctorBacklog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isPending ? "Loading doctor backlog..." : "No appointments match the selected filters."}
            </p>
          ) : (
            doctorBacklog.map((doctor) => (
              <div key={doctor.doctorName} className="rounded-xl border bg-card p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">{doctor.doctorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.nextPatient ? `Next queued patient: ${doctor.nextPatient}` : "No confirmed patient waiting"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Scheduled {doctor.scheduled}</Badge>
                  <Badge className={STATUS_STYLES.CONFIRMED}>Queued {doctor.confirmed}</Badge>
                  <Badge className={STATUS_STYLES.IN_PROGRESS}>In Progress {doctor.inProgress}</Badge>
                </div>
                <Button
                  variant="outline"
                  disabled={!doctor.doctorId || activeDoctorId === doctor.doctorId}
                  onClick={() => void handleNotifyNext(doctor.doctorId)}
                >
                  {activeDoctorId === doctor.doctorId ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Notify Next
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Appointment List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments match the current search and filter values.</p>
          ) : (
            filteredAppointments.map((appointment) => {
              const canConfirmArrival = appointment.status === "SCHEDULED";
              const canMarkNoShow = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

              return (
                <div key={appointment.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{appointment.patientName}</p>
                        {appointment.isWalkIn ? <Badge variant="outline">Walk-in</Badge> : null}
                        <Badge className={STATUS_STYLES[appointment.status] || STATUS_STYLES.SCHEDULED}>
                          {appointment.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{appointment.doctorName}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{appointment.patientPhone || "No phone"}</span>
                        <span>{appointment.timeLabel}</span>
                        <span>{appointment.queueType}</span>
                        <span>{getQueuePositionLabel({ position: appointment.queuePosition ?? 0 })}</span>
                        <span>Wait {appointment.waitLabel}</span>
                        <span>
                          Serving doctor: {appointment.doctorName}
                          {appointment.doctorRole === "ASSISTANT_DOCTOR" ? " (Assistant Doctor)" : ""}
                        </span>
                        {appointment.isDelegated ? (
                          <span>Delegated from primary doctor</span>
                        ) : null}
                      </div>
                      {appointment.notes ? <p className="text-sm text-muted-foreground">{appointment.notes}</p> : null}
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {(() => {
                            const candidates =
                              reassignmentCandidates[appointment.id] ||
                              assignableDoctors.map((doctor) => ({
                                ...doctor,
                                eligible: true,
                                isCurrent: doctor.id === appointment.doctorId,
                                isPrimary: doctor.id === appointment.doctorId,
                              }));

                            const selectedCandidate = candidates.find(
                              (candidate) =>
                                candidate.id ===
                                (selectedReassignments[appointment.id] || appointment.doctorId)
                            );

                            return (
                              <>
                          <Select
                            value={selectedReassignments[appointment.id] || appointment.doctorId}
                            onValueChange={(value) =>
                              setSelectedReassignments((current) => ({
                                ...current,
                                [appointment.id]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="min-w-[220px]">
                              <SelectValue placeholder="Assign doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {candidates.map((doctor) => (
                                <SelectItem
                                  key={doctor.id}
                                  value={doctor.id}
                                  disabled={!doctor.eligible && !doctor.isCurrent}
                                >
                                  {doctor.name}
                                  {doctor.role === "ASSISTANT_DOCTOR" ? " (Assistant)" : ""}
                                  {!doctor.eligible && !doctor.isCurrent ? " - Unavailable" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCandidate && !selectedCandidate.eligible && !selectedCandidate.isCurrent ? (
                            <p className="text-xs text-amber-600 dark:text-amber-300">
                              {selectedCandidate.reason || "This servicing doctor is not eligible"}
                            </p>
                          ) : null}
                          <Button
                            variant="outline"
                            onClick={() => void handleReassignDoctor(appointment.id)}
                            disabled={
                              activeActionId === appointment.id ||
                              !selectedReassignments[appointment.id] ||
                              selectedReassignments[appointment.id] === appointment.doctorId
                            }
                          >
                            Reassign Doctor
                          </Button>
                              </>
                            );
                          })()}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                      {canConfirmArrival ? (
                        <Button
                          onClick={() => void handleConfirmArrival(appointment.id)}
                          disabled={activeActionId === appointment.id}
                        >
                          {activeActionId === appointment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <UserCheck className="w-4 h-4 mr-2" />
                          )}
                          Confirm Arrival
                        </Button>
                      ) : null}
                      {canMarkNoShow ? (
                        <Button
                          variant="outline"
                          onClick={() => void handleMarkNoShow(appointment.id)}
                          disabled={activeActionId === appointment.id}
                        >
                          Mark No Show
                        </Button>
                      ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
