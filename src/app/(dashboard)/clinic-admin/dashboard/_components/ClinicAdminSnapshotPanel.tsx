"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeInIST } from "@/lib/utils/date-time";
import { CalendarDays, Activity, Users, Stethoscope } from "lucide-react";

type DoctorRoster = {
  id: string;
  name: string;
  specialization: string;
  isActive: boolean;
  hasSchedule: boolean;
};

type AppointmentSnapshot = {
  raw: any;
  patientName: string;
  doctorName: string;
  doctorId: string;
  locationName: string;
  paymentStatus: string;
  status: string;
  dateLabel: string;
  timeLabel: string;
  appointmentType: string;
};

function resolveDoctorLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Doctor";
  }

  const parts = trimmed.split(/\s+/);
  const lastPart = parts[parts.length - 1];
  return parts.length > 1 && lastPart ? lastPart : trimmed;
}

function getAppointmentDoctorId(appointment: AppointmentSnapshot): string {
  return String(
    appointment.doctorId ||
      appointment.raw?.doctorId ||
      appointment.raw?.doctor?.id ||
      appointment.raw?.assignedDoctorId ||
      appointment.raw?.assignedDoctor?.id ||
      ""
  ).trim();
}

function getAppointmentDoctorName(appointment: AppointmentSnapshot): string {
  return String(appointment.doctorName || appointment.raw?.doctorName || "Doctor").trim();
}

function getAppointmentTypeLabel(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === "VIDEO_CALL" || normalized === "VIDEO") return "Video";
  if (normalized === "HOME_VISIT") return "Home visit";
  if (normalized === "IN_PERSON" || normalized === "INPERSON") return "In-person";
  return value.trim() || "Consultation";
}

function buildMorningSummaryPreview(
  doctorName: string,
  dateLabel: string,
  appointments: AppointmentSnapshot[]
): string {
  const doctorLabel = resolveDoctorLabel(doctorName);
  const list = appointments.length
    ? appointments
        .slice(0, 8)
        .map((appointment, index) => {
          const location = appointment.locationName ? ` @ ${appointment.locationName}` : "";
          const typeLabel = getAppointmentTypeLabel(appointment.appointmentType);
          return `${index + 1}. ${appointment.timeLabel || "TBD"} - ${appointment.patientName || "Patient"}${location} (${typeLabel})`;
        })
        .join("\n")
    : "No confirmed appointments for today.";

  return [
    `Good morning Dr. ${doctorLabel}!`,
    "",
    `Here is your appointment summary for ${dateLabel}:`,
    "",
    list,
    "",
    `Total: ${appointments.length} appointment(s). Have a productive day!`,
  ].join("\n");
}

export function ClinicAdminSnapshotPanel({
  doctorRosters,
  todayAppointments,
}: {
  doctorRosters: DoctorRoster[];
  todayAppointments: AppointmentSnapshot[];
}) {
  const todayConfirmedAppointments = useMemo(
    () =>
      todayAppointments.filter(
        (appointment) =>
          String(appointment.status || "").toUpperCase() === "CONFIRMED" ||
          String(appointment.paymentStatus || "").toUpperCase() === "PAID"
      ),
    [todayAppointments]
  );

  const doctorSummaries = useMemo(
    () =>
      doctorRosters.map((doctor) => {
        const matchingAppointments = todayConfirmedAppointments.filter((appointment) => {
          const appointmentDoctorId = getAppointmentDoctorId(appointment);
          if (appointmentDoctorId && appointmentDoctorId === doctor.id) {
            return true;
          }

          const appointmentDoctorName = getAppointmentDoctorName(appointment).toLowerCase();
          const doctorName = doctor.name.toLowerCase();
          return appointmentDoctorName && doctorName && appointmentDoctorName === doctorName;
        });

        return {
          ...doctor,
          confirmedAppointments: matchingAppointments,
          previewText: buildMorningSummaryPreview(
            doctor.name,
            formatDateTimeInIST(new Date(), { day: "2-digit", month: "short", year: "numeric" }, "en-IN"),
            matchingAppointments
          ),
        };
      }),
    [doctorRosters, todayConfirmedAppointments]
  );

  const appointmentLedger = useMemo(
    () =>
      [...todayAppointments]
        .sort((a, b) => {
          const aTime = String(a.timeLabel || "");
          const bTime = String(b.timeLabel || "");
          return aTime.localeCompare(bTime);
        })
        .slice(0, 12),
    [todayAppointments]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="overflow-hidden border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/20">
        <CardHeader className="border-b border-border bg-background/70 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Morning Template Preview
          </CardTitle>
          <CardDescription className="text-xs">
            This mirrors the doctor summary that is sent from the backend every morning.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {doctorSummaries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {doctorSummaries.map((doctor) => (
                <div key={doctor.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization || "General"}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        doctor.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }
                    >
                      {doctor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                    <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground">
                      {doctor.previewText}
                    </pre>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {doctor.confirmedAppointments.length} confirmed
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {doctor.hasSchedule ? "Schedule set" : "Schedule missing"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <CalendarDays className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No doctor preview available</EmptyTitle>
                <EmptyDescription>
                  Add a doctor to the clinic to see the morning WhatsApp summary preview.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/20">
        <CardHeader className="border-b border-border bg-background/70 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Stethoscope className="size-4 text-primary" />
            Doctor Availability
          </CardTitle>
          <CardDescription className="text-xs">
            Quick availability snapshot for the clinic team.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {doctorSummaries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs">Doctor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Today</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorSummaries.map((doctor) => (
                    <TableRow key={doctor.id} className="border-border/60">
                      <TableCell className="py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{doctor.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{doctor.specialization || "General"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant="outline"
                          className={
                            doctor.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {doctor.hasSchedule ? "Ready" : "Schedule missing"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right text-sm font-semibold">
                        {doctor.confirmedAppointments.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No doctors loaded</EmptyTitle>
                <EmptyDescription>Doctor availability appears here once the clinic roster is loaded.</EmptyDescription>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/20 xl:col-span-2">
        <CardHeader className="border-b border-border bg-background/70 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="size-4 text-primary" />
            Clinic Appointment Ledger
          </CardTitle>
          <CardDescription className="text-xs">
            Today's clinic appointments with patient and doctor names.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {appointmentLedger.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs">Patient</TableHead>
                    <TableHead className="text-xs">Doctor</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                    <TableHead className="text-right text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentLedger.map((appointment, index) => (
                    <TableRow key={appointment.raw?.id || `${appointment.patientName}-${index}`} className="border-border/60 transition-colors hover:bg-muted/20">
                      <TableCell className="py-2 font-semibold">{appointment.patientName || "Patient"}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{appointment.doctorName || "Assigned doctor"}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">
                        <div>{appointment.dateLabel}</div>
                        <div className="text-xs">{appointment.timeLabel}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant="outline"
                          className={
                            String(appointment.paymentStatus || "").toUpperCase() === "PAID"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {String(appointment.paymentStatus || "").toUpperCase() === "PAID"
                            ? "Paid"
                            : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Badge
                          variant="outline"
                          className="border-border bg-background text-[10px] font-semibold uppercase text-muted-foreground"
                        >
                          {getAppointmentTypeLabel(appointment.appointmentType)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <Activity className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No appointments found today</EmptyTitle>
                <EmptyDescription>
                  Once appointments are booked, they will appear here with patient and doctor names.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          )}

          <div className="mt-3 flex justify-end">
            <Button asChild variant="link" className="h-auto p-0 text-xs font-semibold uppercase text-primary hover:no-underline">
              <Link href="/appointments" prefetch={false}>
                Open appointments page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
