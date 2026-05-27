"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare, MapPin, QrCode } from "lucide-react";
import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { useAppointmentServices } from "@/hooks/query/useAppointments";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import { cn } from "@/lib/utils";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";
import {
  getQueuePositionLabel,
  resolveQueueDisplayLabel,
  toTitleCase,
} from "@/lib/queue/queue-adapter";
import type { QueueStatusSnapshot } from "@/lib/queue/queue-cache";
import type { Appointment } from "@/types/appointment.types";

type QueueAwareAppointment = Appointment & {
  locationId?: string;
  tokenNumber?: number;
  position?: number;
  queuePosition?: number;
  appointmentType?: string;
  queueCategory?: string;
  queueType?: string;
  serviceType?: string;
  serviceBucket?: string;
  displayLabel?: string;
  treatmentType?: string;
  notes?: string;
  checkedInAt?: string | null;
  metadata?: {
    tokenNumber?: number;
  };
};

type PatientQueueCardProps = {
  appointmentsData?: unknown;
  isAppointmentsPending?: boolean;
  onBookAppointment?: () => void;
};

function normalizeQueueLabelValue(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[_\s-]+/g, " ");
}

function formatQueueLabel(value: unknown): string {
  const normalized = normalizeQueueLabelValue(value);
  return normalized ? toTitleCase(normalized) : "";
}

function isGenericQueueLabel(value: string): boolean {
  const normalized = normalizeQueueLabelValue(value).toLowerCase();
  return !normalized || [
    "general consultation",
    "consultation",
    "queue",
    "general",
    "doctor consultation",
    "upcoming visit",
  ].includes(normalized);
}

export function PatientQueueCard({
  appointmentsData,
  isAppointmentsPending = false,
  onBookAppointment,
}: PatientQueueCardProps) {
  const { push } = useRouter();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const appointmentPayload = appointmentsData as
    | { appointments?: unknown; data?: unknown }
    | undefined;

  const queueContext = useMemo(() => {
    const appointments = Array.isArray(appointmentsData)
      ? appointmentsData
      : appointmentPayload?.appointments ||
        (appointmentPayload?.data as { appointments?: unknown } | undefined)?.appointments ||
        appointmentPayload?.data ||
        [];

    if (!Array.isArray(appointments)) {
      return {
        hasAppointments: false,
        hasInPersonAppointment: false,
        activeAppointment: null as QueueAwareAppointment | null,
        queueSource: null as QueueAwareAppointment | null,
      };
    }

    const hasInPersonAppointment = (appointments as QueueAwareAppointment[]).some((apt) => {
      const status = normalizeAppointmentStatus(apt?.status);
      const type = String(apt?.type || apt?.appointmentType || "").toUpperCase();
      return (
        type === "IN_PERSON" &&
        status !== "CANCELLED" &&
        status !== "COMPLETED" &&
        status !== "NO_SHOW"
      );
    });

    const activeAppointment =
      (appointments as QueueAwareAppointment[]).find((apt) => {
        const status = normalizeAppointmentStatus(apt?.status);
        const isArrived = Boolean(apt.checkedInAt);
        return (
          (status === "IN_PROGRESS" || isArrived) &&
          status !== "CANCELLED" &&
          status !== "COMPLETED"
        );
      }) || null;

    return {
      hasAppointments: appointments.length > 0,
      hasInPersonAppointment,
      activeAppointment,
      queueSource: activeAppointment,
    };
  }, [appointmentsData, appointmentPayload?.appointments, appointmentPayload?.data]);

  const { hasAppointments, hasInPersonAppointment, queueSource } = queueContext;
  const { data: appointmentServices = [] } = useAppointmentServices(Boolean(queueSource));

  const serviceCatalogMap = useMemo(
    () =>
      new Map(
        appointmentServices.map((service) => [
          String(service.treatmentType || "").toUpperCase(),
          {
            label: service.label,
            serviceBucket: service.serviceBucket,
            queueCategory: service.queueCategory,
          },
        ])
      ),
    [appointmentServices]
  );

  const { data: queueStats } = useRealTimeQueueStatus(undefined, queueSource?.locationId);

  if (isAppointmentsPending) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading queue status…</p>
      </div>
    );
  }

  if (!queueSource) {
  const steps = [
      {
        step: "1",
        title: "Book appointment",
        description: "Choose a doctor and time",
        href: "/patient/appointments?openBooking=1",
        icon: CheckSquare,
        chipClass: "bg-emerald-100 text-emerald-700",
        disabled: false,
      },
      {
        step: "2",
        title: "Visit clinic",
        description: "Reach the location on time",
        href: "/patient/appointments",
        icon: MapPin,
        chipClass: "bg-sky-100 text-sky-700",
        disabled: false,
      },
      {
        step: "3",
        title: "Scan QR",
        description: "Join the queue when you arrive",
        href: "/patient/check-in",
        icon: QrCode,
        chipClass: "bg-violet-100 text-violet-700",
        disabled: !hasInPersonAppointment,
      },
    ] as const satisfies Array<{
      step: string;
      title: string;
      description: string;
      href: string;
      icon: typeof CheckSquare;
      chipClass: string;
      disabled: boolean;
    }>;

    return (
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-y-0.5">
            <h3 className="text-base font-semibold tracking-tight text-foreground">Join queue</h3>
            <p className="text-[11px] text-muted-foreground">
              {hasInPersonAppointment
                ? "Book a visit, reach the clinic, then scan to join"
                : "Book an appointment first, then scan QR at the clinic"}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="h-6 shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200"
          >
            {hasAppointments ? "No active queue" : "No appointment"}
          </Badge>
        </div>

        {!hasInPersonAppointment && (
          <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            You need an in-person appointment before you can scan QR.
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            const tileClasses = cn(
              "flex min-h-14 items-start gap-3 rounded-xl border px-3 py-2 text-left",
              item.step === "3"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground"
            );

            const content = (
              <>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    item.chipClass
                  )}
                >
                  {item.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-3.5 shrink-0" />
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "block text-[11px]",
                      item.step === "3" ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </>
            );

            if (item.step === "1") {
              return (
                <div key={item.step} className={tileClasses}>
                  {content}
                </div>
              );
            }

            return (
              <Button
                key={item.step}
                variant={item.step === "3" ? "default" : "outline"}
                disabled={item.disabled}
                className={cn(
                  "h-auto min-h-14 justify-start gap-3 rounded-xl px-3 py-2 text-left",
                  item.step === "3"
                    ? "text-left"
                    : "border-border bg-background text-left",
                  item.disabled ? "cursor-not-allowed opacity-60" : ""
                )}
                onClick={() => {
                  if (item.disabled) {
                    openQrGate({
                      onBookAppointment: () => {
                        if (onBookAppointment) {
                          onBookAppointment();
                          return;
                        }
                        push("/patient/appointments");
                      },
                    });
                    return;
                  }
                  push(item.href);
                }}
              >
                {content}
              </Button>
            );
          })}
        </div>

      </div>
    );
  }

  const stats = (queueStats || {}) as QueueStatusSnapshot;
  const currentToken = stats.currentToken || 0;
  const userToken =
    queueSource.tokenNumber ||
    queueSource.queuePosition ||
    queueSource.metadata?.tokenNumber ||
    0;
  const totalInQueue = stats.totalInQueue || 0;

  const normalizedStatus = normalizeAppointmentStatus(queueSource.status);
  const queueLabelCandidates = [
    queueSource.displayLabel,
    queueSource.treatmentType &&
      serviceCatalogMap.get(String(queueSource.treatmentType).toUpperCase())?.label,
    queueSource.serviceBucket,
    queueSource.serviceType,
    queueSource.treatmentType,
    queueSource.queueType,
    queueSource.queueCategory,
    queueSource.notes,
  ]
    .map(formatQueueLabel)
    .filter((value) => !isGenericQueueLabel(value));

  const queueLabel =
    queueLabelCandidates[0] ||
    formatQueueLabel(resolveQueueDisplayLabel(queueSource, serviceCatalogMap));

  const queueTypeLabel = toTitleCase(
    String(
      serviceCatalogMap.get(String(queueSource.treatmentType || "").toUpperCase())?.queueCategory ||
        queueSource.queueCategory ||
        queueSource.queueType ||
        queueSource.serviceType ||
        queueSource.treatmentType ||
        "Queue"
    )
  );

  const treatmentLabel = toTitleCase(
    String(queueSource.treatmentType || queueSource.serviceBucket || queueSource.serviceType || queueLabel)
  );
  const showTreatmentLabel = treatmentLabel && treatmentLabel !== queueLabel;
  const queuePositionLabel = getQueuePositionLabel({ position: userToken || queueSource.position || 0 });

  let peopleAhead = 0;
  const isArrived = Boolean(queueSource.checkedInAt) || normalizedStatus === "IN_PROGRESS";
  if (isArrived && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }

  const estimatedWait =
    typeof stats.estimatedWaitTime === "number" ? stats.estimatedWaitTime : 15;
  const isInProgress = normalizedStatus === "IN_PROGRESS";
  const isLiveQueue = Boolean(queueSource.locationId);
  const queueStateLabel = isInProgress
    ? "Now serving"
    : isArrived
      ? "Waiting in queue"
      : "Upcoming visit";

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-y-0.5">
          <h3 className="text-base font-semibold tracking-tight text-foreground">Live queue</h3>
          <p className="text-[11px] text-muted-foreground">Position and check-in status</p>
        </div>
        <Badge
          variant={isInProgress ? "default" : "secondary"}
          className={cn(
            "h-6 shrink-0 px-2.5 text-[10px] font-bold capitalize",
            isInProgress
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground border-none shadow-none"
          )}
        >
          {queueStateLabel}
        </Badge>
      </div>

      <div className="mb-3 rounded-xl border border-border/70 bg-muted/25 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-y-1">
            <h4 className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              {queueLabel}
            </h4>
            {showTreatmentLabel ? (
              <p className="truncate text-[11px] text-muted-foreground">{treatmentLabel}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Your selected queue</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Badge variant="outline" className="rounded-full border-border bg-background px-2 py-0.5 text-[10px] font-semibold">
              {queueTypeLabel}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
              {queuePositionLabel}
            </Badge>
          </div>
        </div>
        {!isLiveQueue && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Check in at the clinic to see live serving numbers.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
          <span className="block text-[9px] font-bold uppercase tracking-widest leading-none text-muted-foreground">
            Your number
          </span>
          <span className="mt-1 block text-lg font-bold text-primary">
            #{userToken || queueSource.position || "--"}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
          <span className="block text-[9px] font-bold uppercase tracking-widest leading-none text-muted-foreground">
            Serving now
          </span>
          <span className="mt-1 block text-lg font-bold text-foreground">
            {isLiveQueue ? `#${currentToken || "--"}` : "--"}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
          <span className="block text-[9px] font-bold uppercase tracking-widest leading-none text-muted-foreground">
            Ahead
          </span>
          <span className="mt-1 block text-lg font-bold text-foreground">
            {isLiveQueue ? (isInProgress ? "0" : peopleAhead) : "--"}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
          <span className="block text-[9px] font-bold uppercase tracking-widest leading-none text-muted-foreground">
            Wait
          </span>
          <span className="mt-1 block text-lg font-bold text-foreground">
            {isLiveQueue ? (isInProgress ? "0" : estimatedWait) : "--"}
            <span className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">Min</span>
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Total: {totalInQueue}
        </span>
        <p className="text-[10px] italic text-muted-foreground">Live queue sync</p>
      </div>
    </div>
  );
}


