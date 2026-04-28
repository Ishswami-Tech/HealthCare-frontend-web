"use client";

import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";
import type { QueueStatusSnapshot } from "@/lib/queue/queue-cache";
import type { Appointment } from "@/types/appointment.types";

type QueueAwareAppointment = Appointment & {
  locationId?: string;
  tokenNumber?: number;
  queuePosition?: number;
  metadata?: {
    tokenNumber?: number;
  };
};

type PatientQueueCardProps = {
  appointmentsData?: unknown;
  isAppointmentsPending?: boolean;
};

export function PatientQueueCard({
  appointmentsData,
  isAppointmentsPending = false,
}: PatientQueueCardProps) {
  const appointmentPayload = appointmentsData as
    | { appointments?: unknown; data?: unknown }
    | undefined;

  const activeAppointment = useMemo<QueueAwareAppointment | null>(() => {
    const appointments = Array.isArray(appointmentsData)
      ? appointmentsData
      : appointmentPayload?.appointments ||
        (appointmentPayload?.data as { appointments?: unknown } | undefined)?.appointments ||
        appointmentPayload?.data ||
        [];

    if (!Array.isArray(appointments)) return null;

    return (appointments as QueueAwareAppointment[]).find((apt) => {
      const status = normalizeAppointmentStatus(apt?.status);
      const isArrived = Boolean((apt as QueueAwareAppointment & { checkedInAt?: string | null }).checkedInAt);
      return (status === "IN_PROGRESS" || isArrived) && status !== "CANCELLED" && status !== "COMPLETED";
    }) || null;
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

  const stats = (queueStats || {}) as QueueStatusSnapshot;
  const currentToken = stats.currentToken || 0;
  const userToken =
    activeAppointment.tokenNumber ||
    activeAppointment.queuePosition ||
    activeAppointment.metadata?.tokenNumber ||
    0;
  const totalInQueue = stats.totalInQueue || 0;

  const normalizedStatus = normalizeAppointmentStatus(activeAppointment.status);

  let peopleAhead = 0;
  const isArrived = Boolean((activeAppointment as QueueAwareAppointment & { checkedInAt?: string | null }).checkedInAt) || normalizedStatus === "IN_PROGRESS";

  if (isArrived && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }

  const estimatedWait =
    typeof stats.estimatedWaitTime === "number" ? stats.estimatedWaitTime : 15;
  const isInProgress = normalizedStatus === "IN_PROGRESS";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
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
          {isInProgress ? "Now Serving" : isArrived ? "Waiting" : "Not Checked In"}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Your Token
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-primary">
            #{userToken || "--"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Serving
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            #{currentToken || "--"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Ahead
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            {isInProgress ? "0" : peopleAhead}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
            Estimated
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {isInProgress ? "0" : estimatedWait}
            </span>
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Min
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:pt-5 sm:flex-row sm:items-center sm:justify-between">
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
