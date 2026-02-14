"use client";

// 1. React & Next.js
import { useState } from "react";
// 2. External libraries
import {
  Search,
  CheckCircle2,
  UserCheck,
  Loader2,
  Calendar,
  Clock,
  Stethoscope,
} from "lucide-react";
// 3. Internal components
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 4. Hooks & config
import { getSidebarLinksByRole } from "@/lib/config/sidebarLinks";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
// 5. Server actions & utils
import { checkInAppointment } from "@/lib/actions/enhanced-appointments.server";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
// 6. Types
/** Minimal appointment list item shape for API response */
interface AppointmentListItem {
  id: string;
  status?: string;
  startTime?: string;
  time?: string;
  patient?: { name?: string; firstName?: string; lastName?: string; phone?: string };
  doctor?: { name?: string; firstName?: string; lastName?: string };
}

export default function ReceptionistCheckInPage() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0] || "";

  const { data: appointmentsData, isPending: isLoading, refetch } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    date: today,
    limit: 100,
  });

  const appointments: AppointmentListItem[] = Array.isArray(appointmentsData)
    ? appointmentsData
    : appointmentsData?.appointments || [];

  const canCheckIn = (status: string) =>
    ["SCHEDULED", "CONFIRMED", "scheduled", "confirmed"].includes(status?.toUpperCase?.() || status);

  const filteredAppointments = appointments.filter((apt: AppointmentListItem) => {
    const patientName =
      apt.patient?.name ||
      `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() ||
      "";
    const doctorName =
      apt.doctor?.name ||
      `${apt.doctor?.firstName || ""} ${apt.doctor?.lastName || ""}`.trim() ||
      "";
    const matchesSearch =
      !searchTerm ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.patient?.phone || "").includes(searchTerm);
    return matchesSearch;
  });

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingInId(appointmentId);
    try {
      const result = await checkInAppointment(appointmentId);
      if (result.success) {
        showSuccessToast("Patient checked in successfully", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        refetch?.();
      } else {
        showErrorToast(result.error || "Failed to check in", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
      }
    } catch (error) {
      logger.error("Check-in failed", error instanceof Error ? error : undefined, {
        component: "ReceptionistCheckInPage",
        appointmentId,
      });
      showErrorToast(sanitizeErrorMessage(error), {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
    } finally {
      setCheckingInId(null);
    }
  };

  const sidebarLinks = getSidebarLinksByRole(Role.RECEPTIONIST);
  const displayName = user?.name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Receptionist";
  const avatarUrl = user?.profilePicture || "/avatar.png";

  if (isLoading) {
    return (
      <DashboardLayout title="Patient Check-in" allowedRole={Role.RECEPTIONIST}>
        <Sidebar
          links={sidebarLinks}
          user={{
            name: displayName,
            avatarUrl,
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Sidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Check-in" allowedRole={Role.RECEPTIONIST}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name: displayName,
          avatarUrl,
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="w-7 h-7" />
              Patient Check-in
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Appointments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Check in patients as they arrive at the reception
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, doctor, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Patient</th>
                        <th className="text-left p-3 text-sm font-medium">Doctor</th>
                        <th className="text-left p-3 text-sm font-medium">Time</th>
                        <th className="text-left p-3 text-sm font-medium">Status</th>
                        <th className="text-right p-3 text-sm font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No appointments for today
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt: AppointmentListItem) => {
                          const patientName =
                            apt.patient?.name ||
                            `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() ||
                            "Unknown";
                          const doctorName =
                            apt.doctor?.name ||
                            `${apt.doctor?.firstName || ""} ${apt.doctor?.lastName || ""}`.trim() ||
                            "Unknown";
                          const time =
                            apt.startTime || apt.time
                              ? new Date((apt.startTime || apt.time)!).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "—";
                          const status = apt.status || "Scheduled";
                          const isCheckedIn = ["CHECKED_IN", "checked_in", "IN_PROGRESS"].includes(
                            status?.toUpperCase?.() || status
                          );
                          const canCheckInThis = canCheckIn(status);

                          return (
                            <tr
                              key={apt.id}
                              className="border-t hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3">
                                <div className="font-medium">{patientName}</div>
                                {apt.patient?.phone && (
                                  <div className="text-xs text-muted-foreground">
                                    {apt.patient.phone}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                  {doctorName}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  {time}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={isCheckedIn ? "default" : "secondary"}
                                  className={
                                    isCheckedIn
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : ""
                                  }
                                >
                                  {status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                {canCheckInThis ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckIn(apt.id)}
                                    disabled={checkingInId === apt.id}
                                  >
                                    {checkingInId === apt.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Check In
                                      </>
                                    )}
                                  </Button>
                                ) : isCheckedIn ? (
                                  <span className="text-sm text-green-600 flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Checked In
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
