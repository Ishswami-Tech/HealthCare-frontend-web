"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Calendar, ArrowRight } from "lucide-react";
import type { RecordOfUnknown } from "./clinic-location-head-dashboard.types";

interface ClinicLocationHeadDashboardRecentAppointmentsCardProps {
  appointments: RecordOfUnknown[];
  onSeeAll: () => void;
}

export function ClinicLocationHeadDashboardRecentAppointmentsCard({
  appointments,
  onSeeAll,
}: ClinicLocationHeadDashboardRecentAppointmentsCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5 text-blue-600" />
          Recent Appointments
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-blue-600" onClick={onSeeAll} type="button">
          See all <ArrowRight className="size-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <Empty className="min-h-[200px] border-border/70 bg-muted/20">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <Calendar className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No recent appointments found</EmptyTitle>
              <EmptyDescription>Scheduled visits for this location will appear here.</EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="gap-y-2">
            {appointments.map((appointment, idx) => {
              const status = String(appointment.status ?? "").toUpperCase();
              const isActive = status === "IN_PROGRESS";
              const patientName =
                (appointment.patientName as string) ??
                ((appointment.patient as RecordOfUnknown)?.name as string) ??
                "Patient";
              const doctorName =
                (appointment.doctorName as string) ??
                ((appointment.doctor as RecordOfUnknown)?.name as string) ??
                "";
              const time = (appointment.scheduledTime as string) ?? (appointment.time as string) ?? "";

              return (
                <div
                  key={(appointment.id as string) ?? idx}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isActive ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-2 flex-shrink-0 rounded-full ${
                        isActive ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {time}
                        {doctorName ? ` · Dr. ${doctorName}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge className={`border-none text-xs ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {status.replace(/_/g, " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
