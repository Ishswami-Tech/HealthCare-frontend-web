"use client";

import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function PatientQueueCard() {
  const { data: appointmentsData, isPending: isAppointmentsPending } = useMyAppointments();

  const activeAppointment = useMemo(() => {
    const appointments = Array.isArray(appointmentsData)
      ? appointmentsData
      : appointmentsData?.appointments ||
        appointmentsData?.data?.appointments ||
        appointmentsData?.data ||
        [];

    if (!Array.isArray(appointments)) return null;

    return appointments.find(
      (apt: any) => apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS"
    );
  }, [appointmentsData]);

  const { data: queueStats } = useRealTimeQueueStatus(
    undefined,
    activeAppointment?.locationId
  );

  if (isAppointmentsPending) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading queue status…
        </p>
      </div>
    );
  }

  if (!activeAppointment) return null;

  const stats = (queueStats as any)?.data || {};
  const currentToken = stats.currentToken || 0;
  const userToken =
    activeAppointment.tokenNumber ||
    activeAppointment.queuePosition ||
    activeAppointment.metadata?.tokenNumber ||
    0;
  const totalInQueue = stats.totalInQueue || 0;

  let peopleAhead = 0;
  if (activeAppointment.status === "CONFIRMED" && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }

  const estimatedWait =
    typeof stats.estimatedWaitTime === "number" ? stats.estimatedWaitTime : 15;
  const isInProgress = activeAppointment.status === "IN_PROGRESS";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Queue Status
          </h3>
          <p className="text-sm text-muted-foreground">
            Live position in the clinical queue
          </p>
        </div>
        <Badge
          variant={isInProgress ? "default" : "secondary"}
          className={cn(
            "h-7 px-3 font-bold capitalize",
            isInProgress
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground border-none shadow-none"
          )}
        >
          {isInProgress ? "Now Serving" : "Waiting"}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Your Token
          </span>
          <span className="text-3xl font-bold text-primary">
            #{userToken || "--"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Serving
          </span>
          <span className="text-3xl font-bold text-foreground">
            #{currentToken || "--"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Ahead
          </span>
          <span className="text-3xl font-bold text-foreground">
            {isInProgress ? "0" : peopleAhead}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Estimated
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {isInProgress ? "0" : estimatedWait}
            </span>
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Min
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Total Patients: {totalInQueue}
        </span>
        <p className="text-xs italic text-muted-foreground">
          Calculated based on current clinic velocity.
        </p>
      </div>
    </div>
  );
}
