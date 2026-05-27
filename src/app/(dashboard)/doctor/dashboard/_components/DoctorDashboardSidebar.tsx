"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, FileText, Users, Video } from "lucide-react";

interface DoctorDashboardSidebarProps {
  onNavigateAppointments: () => void;
  onNavigatePatients: () => void;
}

export function DoctorDashboardSidebar({ onNavigateAppointments, onNavigatePatients }: DoctorDashboardSidebarProps) {
  return (
    <div className="flex flex-col gap-y-6">
      <Card className="overflow-hidden border-l-2 border-l-slate-400 shadow-sm">
        <div className="border-b border-border bg-muted/40 p-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <FileText className="size-4 text-muted-foreground" />
            Workspace Tools
          </h3>
        </div>
        <CardContent className="flex flex-col gap-y-2.5 p-3">
          <Button
            variant="outline"
            className="h-12 w-full justify-start border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
            onClick={onNavigateAppointments}
          >
            <div className="mr-3 flex size-8 items-center justify-center rounded bg-emerald-100 text-emerald-600 transition-colors dark:bg-emerald-500/20 dark:text-emerald-200">
              <Calendar className="size-4" />
            </div>
            Master Calendar
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full justify-start border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
            onClick={onNavigatePatients}
          >
            <div className="mr-3 flex size-8 items-center justify-center rounded bg-indigo-100 text-indigo-600 transition-colors dark:bg-indigo-500/20 dark:text-indigo-200">
              <Users className="size-4" />
            </div>
            Patient Directory
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full justify-start border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20"
            onClick={onNavigateAppointments}
          >
            <div className="mr-3 flex size-8 items-center justify-center rounded bg-amber-100 text-amber-600 transition-colors dark:bg-amber-500/20 dark:text-amber-200">
              <Video className="size-4" />
            </div>
            Appointments
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full justify-start border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
            onClick={onNavigateAppointments}
          >
            <div className="mr-3 flex size-8 items-center justify-center rounded bg-blue-100 text-blue-600 transition-colors dark:bg-blue-500/20 dark:text-blue-200">
              <Calendar className="size-4" />
            </div>
            Appointment Manager
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-l-2 border-l-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/30">
        <div className="absolute right-0 top-0 -z-0 size-16 rounded-bl-[100px] bg-amber-100 dark:bg-amber-900/40" />
        <div className="relative z-10 p-3.5">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-300" />
            Clinical Notice
          </h3>
          <p className="text-sm leading-relaxed text-amber-800/80 dark:text-amber-100/80">
            Consultation starts only after the patient is checked in. Video visits stay locked until payment is
            confirmed, and medicine packing/dispatch are handled by the medicine desk after the prescription is
            saved.
          </p>
        </div>
      </Card>
    </div>
  );
}
