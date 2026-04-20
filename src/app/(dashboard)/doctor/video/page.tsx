"use client";

import { useMemo, useState } from "react";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useAppointments, useConfirmFinalVideoSlot, useConfirmVideoSlot } from "@/hooks/query/useAppointments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAppointmentPaymentStatus,
  isAppointmentAwaitingPayment,
  formatDateInIST,
  formatTimeInIST,
} from "@/lib/utils/appointmentUtils";
import { CheckCircle, Clock } from "lucide-react";

const isAwaitingDoctorConfirmation = (appointment: any) => {
  const status = String(appointment?.status || "").toUpperCase();
  const confirmedSlotIndex = appointment?.confirmedSlotIndex;
  const hasConfirmedSlot =
    confirmedSlotIndex !== null &&
    confirmedSlotIndex !== undefined &&
    !Number.isNaN(Number(confirmedSlotIndex));

  if (status === "AWAITING_SLOT_CONFIRMATION") return true;
  return status === "SCHEDULED" && !hasConfirmedSlot;
};

const parseSlotDateTime = (slot?: { date?: string; time?: string } | null) => {
  if (!slot?.date || !slot?.time) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(slot.time.trim()) ? `${slot.time.trim()}:00` : slot.time.trim();
  const parsed = new Date(`${slot.date}T${normalizedTime}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getLastProposedSlotDate = (appointment: any) => {
  const proposedSlots = Array.isArray(appointment?.proposedSlots) ? appointment.proposedSlots : [];
  const parsedSlots = proposedSlots
    .map((slot: { date?: string; time?: string }) => parseSlotDateTime(slot))
    .filter((value: Date | null): value is Date => Boolean(value))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime());

  if (parsedSlots.length > 0) return parsedSlots[0];
  return parseSlotDateTime({
    date: typeof appointment?.date === "string" ? appointment.date.slice(0, 10) : undefined,
    time: appointment?.time,
  });
};

const formatProposedSlotDate = (slot?: { date?: string; time?: string } | null) => {
  const parsed = parseSlotDateTime(slot);
  if (!parsed) return "Invalid slot";
  return formatDateInIST(parsed, { day: "2-digit", month: "short", year: "numeric" });
};

const formatProposedSlotTime = (slot?: { date?: string; time?: string } | null) => {
  const parsed = parseSlotDateTime(slot);
  if (!parsed) return "Invalid slot";
  return formatTimeInIST(parsed, { hour: "2-digit", minute: "2-digit", hour12: true });
};

export default function DoctorVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";
  const confirmSlotMutation = useConfirmVideoSlot();
  const confirmFinalSlotMutation = useConfirmFinalVideoSlot();
  const [optimisticallyConfirmedAppointmentIds, setOptimisticallyConfirmedAppointmentIds] = useState<Set<string>>(new Set());
  const { data: awaitingSlotData } = useAppointments({
    doctorId: userId,
    type: "VIDEO_CALL",
    status: ["SCHEDULED", "AWAITING_SLOT_CONFIRMATION"],
    limit: 50,
  });
  const [customSlotAppointment, setCustomSlotAppointment] = useState<any | null>(null);
  const [customSlotDate, setCustomSlotDate] = useState("");
  const [customSlotTime, setCustomSlotTime] = useState("");
  const [customSlotReason, setCustomSlotReason] = useState("");

  const allAwaitingSlotAppointments = (
    Array.isArray((awaitingSlotData as any)?.appointments)
      ? (awaitingSlotData as any).appointments
      : Array.isArray(awaitingSlotData)
        ? awaitingSlotData
        : []
  ).filter((appointment: any) => isAwaitingDoctorConfirmation(appointment));
  const visibleAwaitingSlotAppointments = useMemo(
    () => allAwaitingSlotAppointments.filter((appointment: any) => !optimisticallyConfirmedAppointmentIds.has(String(appointment?.id || ""))),
    [allAwaitingSlotAppointments, optimisticallyConfirmedAppointmentIds]
  );
  const now = new Date();
  const awaitingSlotAppointments = visibleAwaitingSlotAppointments.filter((appointment: any) => {
    const expiryAt = getLastProposedSlotDate(appointment);
    return !expiryAt || expiryAt.getTime() >= now.getTime();
  });
  const { data: paymentTrackedVideoData } = useAppointments({
    doctorId: userId,
    type: "VIDEO_CALL",
    status: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"],
    limit: 50,
  });
  const videoAppointments = Array.isArray((paymentTrackedVideoData as any)?.appointments)
    ? (paymentTrackedVideoData as any).appointments
    : Array.isArray(paymentTrackedVideoData)
      ? paymentTrackedVideoData
      : [];
  const unpaidVideoAppointments = videoAppointments.filter(
    (appointment: any) =>
      isAppointmentAwaitingPayment(appointment) &&
      getAppointmentPaymentStatus(appointment) !== "PAID"
  );

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Video"
        title="Video Consultations"
        description="Manage only video appointments, join active calls, and review online consultation links from the same dashboard pattern."
      />
      {awaitingSlotAppointments.length > 0 && (
        <Card className="border-l-4 border-l-amber-400 bg-amber-50/60 shadow-sm dark:bg-amber-950/20">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  <h2 className="font-semibold text-foreground">Awaiting Slot Confirmation</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select one patient-proposed slot. After confirmation, the video appointment appears with the join link flow.
                </p>
              </div>
              <Badge className="w-fit bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">
                {awaitingSlotAppointments.length} pending
              </Badge>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
              {awaitingSlotAppointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-amber-200 bg-card p-3 shadow-sm dark:border-amber-900/70 sm:p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {appointment.patient?.user?.name ||
                          appointment.patient?.name ||
                          appointment.patientName ||
                          "Patient"}{" "}
                        - Video appointment
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose from the proposed slots below.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        {(appointment.proposedSlots || []).map(
                          (slot: { date: string; time: string }, index: number) => (
                            <div
                              key={`${appointment.id}-${slot.date}-${slot.time}-${index}`}
                              className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm dark:border-amber-800/70 dark:bg-amber-950/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                                    Option {index + 1}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {formatProposedSlotDate(slot)}
                                  </p>
                                </div>
                                <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-100">
                                  Proposed
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-background/80 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-card/80">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Time
                                  </p>
                                  <p className="mt-0.5 font-semibold text-foreground">
                                    {formatProposedSlotTime(slot)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={confirmSlotMutation.isPending}
                                  className="h-8 rounded-full bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700"
                                  onClick={async () => {
                                    await confirmSlotMutation.mutateAsync({
                                      appointmentId: appointment.id,
                                      confirmedSlotIndex: index,
                                    });
                                    setOptimisticallyConfirmedAppointmentIds(prev => {
                                      const next = new Set(prev);
                                      next.add(String(appointment.id));
                                      return next;
                                    });
                                  }}
                                >
                                  Confirm this slot
                                </Button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      <div className="rounded-xl border border-dashed border-amber-200 bg-background/80 p-3 dark:border-amber-800/70 dark:bg-card/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Need a different slot?</p>
                            <p className="text-sm text-muted-foreground">
                              Use a custom fallback time when none of the proposed slots fit.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                              setCustomSlotAppointment(appointment);
                              setCustomSlotDate(
                                getLastProposedSlotDate(appointment)?.toLocaleDateString("en-CA", {
                                  timeZone: "Asia/Kolkata",
                                }) || ""
                              );
                              setCustomSlotTime(appointment?.time ? String(appointment.time).slice(0, 5) : "");
                            }}
                          >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            Pick fallback slot
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {unpaidVideoAppointments.length > 0 && (
        <Card className="border-l-4 border-l-rose-400 bg-rose-50/60 shadow-sm dark:bg-rose-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                <h2 className="font-semibold text-foreground">Patient Payment Pending</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {unpaidVideoAppointments.length} video consultation{unpaidVideoAppointments.length === 1 ? "" : "s"} cannot start yet because payment is still pending.
              </p>
            </div>
            <Badge className="w-fit bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100">
              {unpaidVideoAppointments.length} blocked
            </Badge>
          </CardContent>
        </Card>
      )}
      <Dialog open={!!customSlotAppointment} onOpenChange={(open) => !open && setCustomSlotAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set final video slot</DialogTitle>
            <DialogDescription>
              Use this when none of the patient-proposed slots work. The appointment will be finalized with the doctor-selected slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={customSlotDate} onChange={(e) => setCustomSlotDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={customSlotTime} onChange={(e) => setCustomSlotTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={customSlotReason}
                onChange={(e) => setCustomSlotReason(e.target.value)}
                placeholder="Optional note for why a custom slot was chosen"
                rows={3}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCustomSlotAppointment(null)}
                disabled={confirmFinalSlotMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!customSlotAppointment || !customSlotDate || !customSlotTime) return;
                  try {
                    const payload: {
                      appointmentId: string;
                      date: string;
                      time: string;
                      reason?: string;
                    } = {
                      appointmentId: customSlotAppointment.id,
                      date: customSlotDate,
                      time: customSlotTime,
                    };
                    if (customSlotReason.trim()) {
                      payload.reason = customSlotReason.trim();
                    }
                    await confirmFinalSlotMutation.mutateAsync(payload);
                    setCustomSlotAppointment(null);
                    setCustomSlotDate("");
                    setCustomSlotTime("");
                    setCustomSlotReason("");
                  } catch {
                    // mutation hook handles toast/error state
                  }
                }}
                disabled={confirmFinalSlotMutation.isPending || !customSlotDate || !customSlotTime}
              >
                {confirmFinalSlotMutation.isPending ? "Confirming..." : "Confirm final slot"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <VideoAppointmentsList
        title="Video Consultations"
        description="Manage and join video consultations with your patients"
        showStatistics={true}
        showJoinButton={true}
        showEndButton={true}
        showDownloadButton={true}
        limit={50}
        filters={{ doctorId: userId }}
      />
    </DashboardPageShell>
  );
}
