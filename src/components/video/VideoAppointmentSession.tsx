"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { VideoAppointmentRoom } from "@/components/video/VideoAppointmentRoom";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";
import {
  getAppointmentPaymentStatus,
  isVideoNoShowEnforced,
} from "@/lib/utils/appointmentUtils";
import { getAppointmentViewState } from "@/lib/utils/appointmentUtils";

type SessionInput = {
  appointmentId: string;
  appointment?: VideoAppointment | null;
  onBack?: () => void;
};

function isValidAppointmentId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

function normalizeAppointment(
  appointment: any,
  fallbackId: string
): VideoAppointment | null {
  const resolvedAppointmentId = String(
    appointment?.id || appointment?.appointmentId || fallbackId || ""
  );

  if (!resolvedAppointmentId) return null;

  const startTime =
    appointment?.startTime ||
    appointment?.appointmentDate ||
    appointment?.scheduledFor ||
    appointment?.createdAt ||
    new Date().toISOString();

  const endTime =
    appointment?.endTime ||
    appointment?.scheduledEndTime ||
    new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

  return {
    id: resolvedAppointmentId,
    appointmentId: resolvedAppointmentId,
    roomName:
      appointment?.roomName ||
      appointment?.doctorName ||
      `Room ${resolvedAppointmentId}`,
    doctorId:
      appointment?.doctorId ||
      appointment?.doctor?.id ||
      appointment?.doctor?.userId ||
      "",
    patientId:
      appointment?.patientId ||
      appointment?.patient?.id ||
      appointment?.patient?.userId ||
      "",
    startTime,
    endTime,
    status: String(appointment?.status || "scheduled")
      .toLowerCase()
      .replace(/_/g, "-") as VideoAppointment["status"],
    paymentCompleted: getAppointmentViewState(appointment).paymentCompleted,
    sessionId: appointment?.sessionId,
    recordingUrl: appointment?.recordingUrl,
    notes: appointment?.notes,
    createdAt: appointment?.createdAt || startTime,
    updatedAt: appointment?.updatedAt || startTime,
  };
}

function getVideoPaymentAmount(appointment: any): number {
  const candidateValues = [
    appointment?.invoice?.amount,
    appointment?.invoice?.totalAmount,
    appointment?.payment?.amount,
    appointment?.amount,
    appointment?.videoConsultationFee,
    appointment?.consultationFee,
  ];

  for (const value of candidateValues) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      return amount;
    }
  }

  return 0;
}

export function VideoAppointmentSession({
  appointmentId,
  appointment,
  onBack,
}: SessionInput) {
  const router = useRouter();
  const resolvedAppointmentId = appointmentId.trim();

  if (!isValidAppointmentId(resolvedAppointmentId)) {
    return (
      <Card className="border border-border bg-background shadow-sm">
        <CardContent className="py-16 text-center">
          <p className="text-lg font-semibold">No appointment found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The appointment link is invalid, incomplete, or needs to be updated.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => {
                if (onBack) {
                  onBack();
                  return;
                }
                router.replace("/video-appointments");
              }}
            >
              Back to list
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <VideoAppointmentSessionContent
      appointmentId={resolvedAppointmentId}
      appointment={appointment ?? null}
      router={router}
      {...(onBack ? { onBack } : {})}
    />
  );
}

function VideoAppointmentSessionContent({
  appointmentId,
  appointment,
  onBack,
  router,
}: {
  appointmentId: string;
  appointment?: VideoAppointment | null;
  onBack?: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: appointmentQuery, isPending, isFetched, error, refetch } =
    useVideoAppointment(appointmentId);
  const [isPreflightComplete, setIsPreflightComplete] = React.useState(false);
  const liveAppointmentSource = React.useMemo(
    () => (appointmentQuery as any)?.appointment || (appointmentQuery as any)?.data || null,
    [appointmentQuery]
  );
  const shouldUseFallbackAppointment = React.useMemo(() => {
    if (liveAppointmentSource) return false;
    if (!appointment) return false;

    const statusCode = error && typeof error === "object" ? (error as { statusCode?: unknown }).statusCode : undefined;
    if (statusCode === 404) return true;

    if (error === null || error === undefined) return true;

    return false;
  }, [appointment, error, liveAppointmentSource]);

  React.useEffect(() => {
    let active = true;
    setIsPreflightComplete(false);

    void refetch()
      .catch(() => {
        // The query state already captures the failure; keep the preflight moving.
      })
      .finally(() => {
        if (active) {
          setIsPreflightComplete(true);
        }
      });

    return () => {
      active = false;
    };
  }, [appointmentId, refetch]);

  const normalizedAppointment = React.useMemo(() => {
    if (liveAppointmentSource) {
      return normalizeAppointment(liveAppointmentSource, appointmentId);
    }

    if (shouldUseFallbackAppointment) {
      return normalizeAppointment(appointment, appointmentId);
    }

    return null;
  }, [appointment, appointmentId, liveAppointmentSource, shouldUseFallbackAppointment]);

  const rawAppointment = React.useMemo(() => {
    if (liveAppointmentSource) {
      return liveAppointmentSource;
    }

    if (shouldUseFallbackAppointment) {
      return appointment;
    }

    return null;
  }, [appointment, liveAppointmentSource, shouldUseFallbackAppointment]);

  const paymentCompleted = React.useMemo(() => {
    return getAppointmentViewState(rawAppointment).paymentCompleted;
  }, [rawAppointment]);

  const paymentStatusLabel = React.useMemo(() => {
    const paymentStatus = getAppointmentPaymentStatus(rawAppointment);
    return paymentStatus === "N_A" ? "PENDING" : paymentStatus;
  }, [rawAppointment]);

  const paymentAmount = React.useMemo(() => getVideoPaymentAmount(rawAppointment), [rawAppointment]);
  const paymentStatusTone = paymentCompleted
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";

  const errorStatusCode = React.useMemo(() => {
    if (!error || typeof error !== "object") return undefined;
    const maybeError = error as { statusCode?: unknown };
    return typeof maybeError.statusCode === "number" ? maybeError.statusCode : undefined;
  }, [error]);

  const errorMessage = React.useMemo(() => {
    if (errorStatusCode === 404) {
      const errorText = error instanceof Error ? error.message.toLowerCase() : "";

      // Match the specific backend messages emitted by ensureAppointmentJoinable
      if (errorText.includes("cancelled") || errorText.includes("canceled")) {
        return "This appointment was cancelled.";
      }
      if (errorText.includes("completed")) {
        return "This appointment has already been completed.";
      }
      if (isVideoNoShowEnforced() && (errorText.includes("no-show") || errorText.includes("no show"))) {
        return "This appointment was marked as no-show.";
      }
      // Covers the unconfirmed scheduled state while keeping the message generic
      if (
        errorText.includes("not confirmed for video") ||
        errorText.includes("awaiting") ||
        errorText.includes("not confirmed")
      ) {
        return "This appointment is not confirmed for video yet. Please wait for the doctor to confirm your slot.";
      }

      // Genuine record-not-found (ID mismatch / stale link)
      return "Appointment not found. The link may be outdated â€” please return to your appointments list.";
    }

    if (errorStatusCode === 403) {
      const errorText = error instanceof Error ? error.message.toLowerCase() : "";
      if (errorText.includes("payment")) {
        return "Payment is required to join this appointment.";
      }
      return "You do not have permission to join this session.";
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (isFetched && !normalizedAppointment) {
      return "Unable to load this video session.";
    }

    return "Server error. Please try again later.";
  }, [error, errorStatusCode, isFetched, normalizedAppointment]);

  const blockedStatusMessage = React.useMemo(() => {
    if (!normalizedAppointment) return null;
    
    const status = String(normalizedAppointment.status).toUpperCase();
    if (status === 'CANCELLED' || status === 'CANCELED') {
      return "This appointment was cancelled and cannot be joined.";
    }
    if (status === 'COMPLETED') {
      return "This appointment has already been completed.";
    }
    if (isVideoNoShowEnforced() && (status === 'NO_SHOW' || status === 'NO SHOW')) {
      return "This appointment was marked as a no-show and cannot be joined.";
    }
    
    return null;
  }, [normalizedAppointment]);

  const displayErrorMessage = blockedStatusMessage || errorMessage;
  const isBlocked = !!blockedStatusMessage || ((error || isFetched) && !normalizedAppointment);

  if (!isPending && normalizedAppointment && !paymentCompleted && !blockedStatusMessage) {
    return (
      <Card className="overflow-hidden border border-border bg-background shadow-sm">
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold">Payment required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Video appointments must be paid before joining. Current status: {paymentStatusLabel}.
              </p>
              <div className="mt-3">
                <Badge className={paymentStatusTone}>
                  {paymentCompleted ? "Payment verified" : "Payment pending"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.replace("/video-appointments")}>
              Back to list
            </Button>
          </div>

          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="space-y-3">
              <p className="font-medium">Complete the video appointment payment to continue.</p>
              <p className="text-sm text-muted-foreground">
                You will not be able to open the session until the payment is completed.
              </p>

              {paymentAmount > 0 ? (
                <PaymentButton
                  appointmentId={appointmentId}
                  amount={paymentAmount}
                  appointmentType="VIDEO_CALL"
                  description="Video Consult"
                  className="h-10 rounded-xl px-5 font-semibold"
                >
                  Pay â‚¹{paymentAmount}
                </PaymentButton>
              ) : (
                <Button variant="default" onClick={() => router.replace("/video-appointments")}>
                  Go to appointments
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending && !normalizedAppointment) {
    return (
      <Card className="overflow-hidden border border-border bg-background shadow-sm">
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Button variant="outline" disabled>
              Back to list
            </Button>
          </div>
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
              <div>
                <p className="font-medium">Preparing video session</p>
                <p className="text-sm text-muted-foreground">Loading appointment details and meeting room.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3 rounded-2xl border p-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-[60vh] w-full rounded-xl" />
              </div>
              <div className="space-y-3 rounded-2xl border p-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPreflightComplete) {
    return (
      <Card className="overflow-hidden border border-border bg-background shadow-sm">
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Button variant="outline" disabled>
              Back to list
            </Button>
          </div>
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
              <div>
                <p className="font-medium">Checking latest appointment status</p>
                <p className="text-sm text-muted-foreground">
                  Verifying whether this session is still joinable before loading the room.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isBlocked) {
    return (
      <Card className="border border-border bg-background shadow-sm">
        <CardContent className="py-16 text-center">
          <p className="text-lg font-semibold">Video session unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{displayErrorMessage}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button
              onClick={() => {
                if (onBack) {
                  onBack();
                  return;
                }
                router.replace("/video-appointments");
              }}
            >
              Back to list
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 min-h-0 flex-col gap-4">
        <div className="rounded-3xl border border-border bg-background px-4 py-4 shadow-sm lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Video consultation</h2>
              <p className="text-sm text-muted-foreground">
                Live session loaded directly from the appointment link.
              </p>
              <div className="pt-1">
                <Badge className={paymentStatusTone}>
                  {paymentCompleted ? "Payment verified" : "Payment pending"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="rounded-2xl border border-border bg-muted px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Session</p>
                  <p className="text-sm font-semibold text-foreground">
                    {appointmentId.slice(-8).toUpperCase()}
                  </p>
                </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  router.replace("/video-appointments");
                }}
              >
                Back to list
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <VideoAppointmentRoom
            appointment={normalizedAppointment as VideoAppointment}
            autoStart={true}
            onLeaveRoom={() => {
              if (onBack) {
                onBack();
                return;
              }
              router.replace("/video-appointments");
            }}
          />
        </div>
      </div>
    </div>
  );
}

