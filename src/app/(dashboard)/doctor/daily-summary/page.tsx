"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/types/auth.types";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  CalendarIcon,
  UserX,
  RefreshCcw,
  Loader2,
  Phone,
  Mail,
  ArrowLeftRight,
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/hooks/utils/use-toast";
import { formatDateInIST } from "@/lib/utils/date-time";
import { updateAppointmentStatus } from "@/lib/actions/appointments.server";
import { reassignAppointmentDoctor } from "@/lib/actions/appointments.server";

interface NoShowAppointment {
  id: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate: string;
  status: string;
  type: string;
  reason?: string;
}

type ActionFilter = "all" | "reschedule" | "reassign" | "contact";

export default function NoShowManagementPage() {
  const router = useRouter();
  const { session } = useAuth();
  const clinicId = useCurrentClinicId();
  const [appointments, setAppointments] = useState<NoShowAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [selectedAppt, setSelectedAppt] = useState<NoShowAppointment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useWebSocketQuerySync();

  const fetchNoShows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/appointments/analytics/no-show-correlation`, {
        headers: { "X-Clinic-ID": clinicId || "" },
      });
      const json = await res.json();
      const data = json?.data?.noShows || json?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchNoShows();
  }, [fetchNoShows]);

  const handleStatusUpdate = useCallback(
    async (apptId: string, status: string) => {
      setIsProcessing(true);
      try {
        const result = await updateAppointmentStatus(apptId, { status, reason: "No-show follow-up" });
        if (result.success) {
          showSuccessToast("Updated", "Appointment status updated");
          fetchNoShows();
        } else {
          showErrorToast("Error", result.error || "Failed to update");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [fetchNoShows]
  );

  const handleReassign = useCallback(async (apptId: string, newDoctorId: string) => {
    setIsProcessing(true);
    try {
      const result = await reassignAppointmentDoctor(apptId, {
        newDoctorId,
        reason: "No-show reassignment",
      });
      if (result.success) {
        showSuccessToast("Reassigned", "Doctor reassigned successfully");
        fetchNoShows();
      } else {
        showErrorToast("Error", result.error || "Failed to reassign");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [fetchNoShows]);

  const filtered = useMemo(() => {
    if (actionFilter === "all") return appointments;
    return appointments.filter((a) => {
      if (actionFilter === "reschedule") return a.status === "NO_SHOW" || a.status === "CANCELLED";
      if (actionFilter === "reassign") return a.status === "NO_SHOW";
      return true;
    });
  }, [appointments, actionFilter]);

  const stats = useMemo(() => {
    const noShow = appointments.filter((a) => a.status === "NO_SHOW");
    const cancelled = appointments.filter((a) => a.status === "CANCELLED");
    const rescheduled = appointments.filter((a) => a.status === "RESCHEDULED");
    return { total: appointments.length, noShow: noShow.length, cancelled: cancelled.length, rescheduled: rescheduled.length };
  }, [appointments]);

  return (
    <ProtectedRoute allowedRoles={[Role.DOCTOR, Role.CLINIC_ADMIN, Role.RECEPTIONIST, Role.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <DashboardPageHeader title="No-Show Management" subtitle="Track and follow up on missed appointments" />

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, icon: UserX },
              { label: "No-Shows", value: stats.noShow, icon: UserX, color: "text-orange-500" },
              { label: "Cancelled", value: stats.cancelled, icon: UserX, color: "text-red-500" },
              { label: "Rescheduled", value: stats.rescheduled, icon: ArrowLeftRight, color: "text-blue-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3 text-center">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color || "text-gray-500"}`} />
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="reschedule">Reschedule</SelectItem>
                <SelectItem value="reassign">Reassign</SelectItem>
                <SelectItem value="contact">Contact Patient</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchNoShows} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCcw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
          </div>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>Missed Appointments</CardTitle>
              <CardDescription>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserX className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No no-show records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{apt.patientName || "Patient"}</span>
                          <Badge
                            variant={
                              apt.status === "NO_SHOW"
                                ? "destructive"
                                : apt.status === "CANCELLED"
                                ? "secondary"
                                : "outline"
                            }>
                            {apt.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Dr. {apt.doctorName || "—"} ·{" "}
                          {formatDateInIST(apt.appointmentDate || apt.date)}
                        </div>
                        {apt.reason && (
                          <div className="text-xs text-gray-400 mt-1">{apt.reason}</div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(apt.id, "RESCHEDULED")}
                          disabled={isProcessing}>
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/appointments/${apt.id}/reassignment-candidates`)
                          }>
                          <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                          Reassign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAppt(apt)}>
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
