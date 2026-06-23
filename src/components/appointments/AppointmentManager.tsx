"use client";

import { useState, useReducer, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";

import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import {
  useCancelAppointment,
  useMyAppointments,
  useAppointments,
  useProcessCheckIn,
  useRescheduleAppointment,
  useRejectVideoProposal,
} from "@/hooks/query/useAppointments";
import {
  AppointmentWithRelations,
} from "@/types/appointment.types";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { cn } from "@/lib/utils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import {
  formatDateInIST,
  formatISODateInIST,
  getAppointmentCounterpartyName,
  getAppointmentPaymentDisplayState,
  getAppointmentStatusBadgeLabel,
  getAppointmentDateTimeValue,
  getDisplayAppointmentDuration,
  getAppointmentViewState,
  getVideoAppointmentJoinBlockedReason,
  isVideoAppointmentPaymentCompleted,
  isVideoAppointmentJoinable,
  isTerminalAppointment,
  isTerminalAppointmentStatus,
  normalizeAppointmentStatus,
  getAppointmentDoctorName,
  getAppointmentPatientName,
  normalizePatientAppointment,
  getReceptionistAppointmentTimeLabel,
  getAppointmentPaymentAmount,
  wasCancelledDueToPaymentFailure,
  isAppointmentTimeSlotExpired,
  toTitleCase,
} from "@/lib/utils/appointmentUtils";
import {
  Calendar,
  Clock,
  Stethoscope,
  Video,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ChevronDown,
  Activity,
  Zap,
  CalendarPlus,
  Timer,
  CreditCard,
  X,
} from "lucide-react";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { PaymentCountdown } from "@/components/appointments/PaymentCountdown";
import { Role } from "@/types/auth.types";

type StatusFilter = "ALL" | "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  PENDING:     { label: "Payment Pending", color: "text-amber-800 dark:text-amber-200", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700" },
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800" },
  CONFIRMED:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700 dark:text-purple-300",dot: "bg-purple-500",bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800" },
  COMPLETED:   { label: "Completed",   color: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-600" },
  CANCELLED:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",       dot: "bg-red-500",    bg: "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700" },
  NO_SHOW:     { label: "No Show",     color: "text-orange-700 dark:text-orange-300",dot: "bg-orange-400",bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800" },
};

function getPaginationWindow(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set<number>([1, totalPages, currentPage]);
  for (const offset of [-1, 1]) {
    const page = currentPage + offset;
    if (page > 1 && page < totalPages) {
      visible.add(page);
    }
  }

  return Array.from({ length: totalPages }, (_, index) => index + 1).reduce<Array<number | "ellipsis">>((pages, page) => {
    if (!visible.has(page)) {
      return pages;
    }

    const previous = pages[pages.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      pages.push("ellipsis");
    }

    pages.push(page);
    return pages;
  }, []);
}

function formatAppointmentManagerDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return formatDateInIST(parsed, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  cardBorder: string;
  cardHover: string;
  className?: string;
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconBorder,
  iconColor,
  cardBorder,
  cardHover,
  className,
}: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${cardBorder} bg-card p-3 transition-all ${cardHover} hover:shadow-sm sm:p-4 ${className || ""}`}>
      <div className={`rounded-xl ${iconBg} border p-2 ${iconBorder} ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  apt: AppointmentWithRelations;
  expandedCard: string | null;
  checkInRoute: string;
  cancellingAppointment: boolean;
  onCancelAppointment: (id: string) => void;
  handleJoinVideo: (appointment: any) => void;
  onExpand: (id: string | null) => void;
  onSelect: (apt: AppointmentWithRelations | null) => void;
  onReschedule: (apt: AppointmentWithRelations) => void;
  onBookNew: (apt: AppointmentWithRelations | any) => void;
  viewerRole?: string;
}

type AppointmentManagerState = {
  searchQuery: string;
  isRescheduleDialogOpen: boolean;
  rescheduleData: { date: string; time: string };
  isRejectDialogOpen: boolean;
  rejectReason: string;
  currentPage: number;
  expandedCard: string | null;
};

type AppointmentManagerAction =
  | { type: "setSearchQuery"; value: string }
  | { type: "setIsRescheduleDialogOpen"; value: boolean }
  | {
      type: "setRescheduleData";
      value:
        | { date: string; time: string }
        | ((prev: { date: string; time: string }) => { date: string; time: string });
    }
  | { type: "setIsRejectDialogOpen"; value: boolean }
  | { type: "setRejectReason"; value: string }
  | {
      type: "setCurrentPage";
      value: number | ((prev: number) => number);
    }
  | { type: "setExpandedCard"; value: string | null }
  | { type: "resetRescheduleState" };

const initialAppointmentManagerState: AppointmentManagerState = {
  searchQuery: "",
  isRescheduleDialogOpen: false,
  rescheduleData: { date: "", time: "" },
  isRejectDialogOpen: false,
  rejectReason: "",
  currentPage: 1,
  expandedCard: null,
};

function appointmentManagerReducer(
  state: AppointmentManagerState,
  action: AppointmentManagerAction
): AppointmentManagerState {
  switch (action.type) {
    case "setSearchQuery":
      return { ...state, searchQuery: action.value };
    case "setIsRescheduleDialogOpen":
      return { ...state, isRescheduleDialogOpen: action.value };
    case "setRescheduleData":
      return {
        ...state,
        rescheduleData:
          typeof action.value === "function"
            ? action.value(state.rescheduleData)
            : action.value,
      };
    case "setIsRejectDialogOpen":
      return { ...state, isRejectDialogOpen: action.value };
    case "setRejectReason":
      return { ...state, rejectReason: action.value };
    case "setCurrentPage":
      return {
        ...state,
        currentPage:
          typeof action.value === "function"
            ? action.value(state.currentPage)
            : action.value,
      };
    case "setExpandedCard":
      return { ...state, expandedCard: action.value };
    case "resetRescheduleState":
      return {
        ...state,
        isRescheduleDialogOpen: false,
        rescheduleData: { date: "", time: "" },
        isRejectDialogOpen: false,
        rejectReason: "",
        expandedCard: null,
      };
    default:
      return state;
  }
}

function AppointmentCard({
  apt,
  expandedCard,
  checkInRoute,
  cancellingAppointment,
  onCancelAppointment,
  handleJoinVideo,
  onExpand,
  onSelect,
  onReschedule,
  onBookNew,
  viewerRole,
}: AppointmentCardProps) {
  const viewState = getAppointmentViewState(apt);
  const effectiveStatus = viewState.normalizedStatus;
  const cfg = (STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG["SCHEDULED"]) as { label: string; color: string; dot: string; bg: string };
  const statusLabel = viewState.displayStatusLabel;
  const isExpanded = expandedCard === apt.id;
  const appointmentDateTime = getAppointmentDateTimeValue(apt);
  const normalizedAppointment = normalizePatientAppointment(apt);
  const doctorName =
    (apt as any).doctorLabel ||
    getAppointmentDoctorName(apt) ||
    normalizedAppointment.doctorName;
  const patientName =
    (apt as any).patientLabel ||
    getAppointmentPatientName(apt);
  const counterpartyName =
    getAppointmentCounterpartyName(apt, viewerRole) ||
    patientName ||
    doctorName;
  const locationName = (apt as any).locationLabel || normalizedAppointment.locationName;
  const appointmentTypeLabel =
    apt.type === "VIDEO_CALL"
      ? "Video Consultation"
      : apt.type === "IN_PERSON"
        ? "In-Person Visit"
        : String(apt.type || "Appointment").replace(/_/g, " ");
  const isVideoAppointment = apt.type === "VIDEO_CALL";
  const displayTimeLabel = getReceptionistAppointmentTimeLabel(
    apt as unknown as Record<string, unknown>
  );
  const rawTimeValue = apt.time || "";
  const normalizedDate = appointmentDateTime?.toISOString() || apt.date;
  const displayDuration = getDisplayAppointmentDuration(apt);

  // Auto-expand video appointments that are in PENDING (i.e. waiting on
  // payment). The countdown timer is critical info the patient must see
  // immediately — we don't want them to have to click into the card.
  useEffect(() => {
    if (
      effectiveStatus === "PENDING" &&
      isVideoAppointment &&
      expandedCard !== apt.id &&
      typeof onExpand === "function"
    ) {
      onExpand(apt.id);
    }
    // Intentionally only react to status / type changes — avoid loops when
    // expandedCard changes due to user action.
  }, [effectiveStatus, isVideoAppointment, expandedCard, apt.id, onExpand]);

  const isCancelled = effectiveStatus === "CANCELLED" || effectiveStatus === "NO_SHOW";
  const isConfirmed = effectiveStatus === "CONFIRMED";
  return (
    <div className={`w-full overflow-visible rounded-2xl border transition-all duration-200 hover:shadow-md ${
      isCancelled
        ? "bg-red-50/60 border-red-200/80 dark:bg-red-950/15 dark:border-red-900/50"
        : isConfirmed
          ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60 hover:border-emerald-300"
        : `bg-card border-border hover:border-emerald-200 ${isExpanded ? "shadow-md border-emerald-300" : ""}`
    }`}>
      {/* Card header */}
      <button
        type="button"
        className="flex w-full cursor-pointer flex-col p-3 text-left sm:p-4"
        onClick={() => {
          onExpand(isExpanded ? null : apt.id);
          onSelect(isExpanded ? null : apt);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onExpand(isExpanded ? null : apt.id);
            onSelect(isExpanded ? null : apt);
          }
        }}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-sm font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300 sm:h-10 sm:w-10">
              {toTitleCase(doctorName).charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{toTitleCase(doctorName)}</p>
              <div className="mt-0.5 flex flex-col gap-0.5 text-xs leading-tight opacity-60">
                {patientName && (
                  <p className="truncate">Patient: {toTitleCase(patientName)}</p>
                )}
                {!patientName && counterpartyName && counterpartyName !== doctorName && (
                  <p className="truncate">Counterparty: {toTitleCase(counterpartyName)}</p>
                )}
                {!isVideoAppointment && locationName && locationName !== doctorName && (
                  <p className="truncate">Location: {toTitleCase(locationName)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${cfg.bg} ${cfg.color} ${cfg.dot ? "" : "border-border"}`}>
              <span className={`size-1.5 rounded-full ${cfg.dot}`} />
              {toTitleCase(statusLabel)}
            </span>
            {/* Appointment type chip — replaces the duplicate "Video" badge.
                Video calls get a subtle blue/cyan tint, in-person gets a
                soft slate tint. Strong border keeps it readable. */}
            {apt.type === "VIDEO_CALL" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-sky-800 shadow-sm dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200">
                <Video className="size-3.5" />
                {appointmentTypeLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-200">
                <Stethoscope className="size-3.5" />
                {appointmentTypeLabel}
              </span>
            )}
            {/* Payment pending badge for video appointments awaiting payment */}
            {isVideoAppointment && !viewState.paymentCompleted && !isCancelled && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 shadow-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <CreditCard className="size-3.5" />
                Payment Pending
              </span>
            )}
            <ChevronDown className={`size-4 opacity-40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Date/time row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-70">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatAppointmentManagerDate(normalizedDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {displayTimeLabel}
          </span>
          {displayDuration && (
            <span className="flex items-center gap-1.5">
              <Timer className="size-3.5" />
              {displayDuration} min
            </span>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border/60 bg-muted/30 p-3 sm:p-4">
          {effectiveStatus === "PENDING" && isVideoAppointment ? (
            // PENDING = video appointment created but payment not yet completed.
            // Show a live countdown with a "Complete Payment" CTA so the patient
            // can act before the backend auto-cancels the slot.
            <div className="space-y-3">
              <PaymentCountdown
                paymentExpiresAt={viewState.paymentExpiresAt}
                paymentWindowMinutes={viewState.paymentWindowMinutes}
                onExpire={() => {
                  // Refresh list once the deadline hits so the UI reflects the
                  // now-cancelled appointment without a manual reload.
                  try {
                    (window as Window & { __refreshAppointments?: () => void })
                      .__refreshAppointments?.();
                  } catch {
                    /* noop */
                  }
                }}
                showCompletePaymentCta
                onCompletePayment={() => {
                  // Defer to the existing payment button so the same flow is used.
                  const paymentButton = document.querySelector<HTMLButtonElement>(
                    `[data-appointment-pay="${getEffectiveAppointmentId(apt)}"]`
                  );
                  paymentButton?.click();
                }}
                ctaDisabled={cancellingAppointment}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your video appointment slot is reserved. Once payment is complete, it will be confirmed and the doctor will see it on their dashboard.
                </p>
                <PaymentButton
                  appointmentId={getEffectiveAppointmentId(apt)}
                  amount={getAppointmentPaymentAmount(apt)}
                  appointmentType="VIDEO_CALL"
                  description={`Video consultation with ${doctorName || "doctor"}`}
                  className="h-10 w-full justify-center sm:w-auto sm:px-5"
                  data-appointment-pay={getEffectiveAppointmentId(apt)}
                >
                  <CreditCard className="mr-2 size-4" />
                  Pay & Confirm
                </PaymentButton>
              </div>
            </div>
          ) : isTerminalAppointmentStatus(effectiveStatus) ? (
            effectiveStatus === "CANCELLED" && wasCancelledDueToPaymentFailure(apt) ? (
              isAppointmentTimeSlotExpired(apt) ? (
                // Expired slot: do NOT show retry payment; the backend will
                // refuse the charge anyway. Offer "Book New" only.
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">Appointment Expired</p>
                    <p className="mt-0.5">
                      This {isVideoAppointment ? "video " : ""}appointment was cancelled because payment was not completed in time, and the time slot has already passed.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 w-full justify-center sm:w-auto sm:px-5"
                    onClick={() => onBookNew(apt)}
                    disabled={cancellingAppointment}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Book New Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">Payment Not Completed</p>
                    <p className="mt-0.5">
                      {isVideoAppointment
                        ? "This video appointment was cancelled because payment was not completed within the 3-hour window. You can still retry payment below before the slot begins."
                        : "This appointment was cancelled because payment was not completed. You can retry payment for the same appointment below."}
                    </p>
                  </div>
                  {isVideoAppointment ? (
                    <PaymentButton
                      appointmentId={getEffectiveAppointmentId(apt)}
                      amount={getAppointmentPaymentAmount(apt)}
                      appointmentType="VIDEO_CALL"
                      description={`Video consultation with ${doctorName || "doctor"}`}
                      className="h-10 w-full justify-center"
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Retry Payment
                    </PaymentButton>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 w-full justify-center"
                      onClick={() => onBookNew(apt)}
                      disabled={cancellingAppointment}
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Book New Appointment
                    </Button>
                  )}
                </div>
              )
            ) : (
              <p className="text-sm italic text-muted-foreground">
                {effectiveStatus === "CANCELLED"
                  ? "This appointment was cancelled. Book a new appointment to continue."
                  : effectiveStatus === "COMPLETED"
                    ? "This appointment has been completed."
                    : effectiveStatus === "NO_SHOW"
                      ? "Marked as no-show. Book a new appointment if you still need care."
                      : "No further actions available for this appointment."}
              </p>
            )
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Details column (left) */}
              <div className="space-y-2 min-w-0 flex-1">
                {!isVideoAppointment && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Check-in Route</p>
                    <p className="text-sm font-medium">{checkInRoute}</p>
                  </div>
                )}
              </div>
              {/* Action buttons column (right) */}
              <div className="flex flex-col gap-2 sm:min-w-[200px] sm:max-w-[240px] sm:items-stretch">
                {isVideoAppointment ? (
                  <>
                    {!viewState.paymentCompleted ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                        <p className="font-semibold">Payment Pending</p>
                        <p className="mt-0.5">Complete the payment to unlock the video call.</p>
                      </div>
                    ) : null}
                    {viewState.paymentCompleted ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-10 w-full justify-center border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-lg"
                        onClick={() => handleJoinVideo(apt)}
                      >
                        <Video className="mr-2 size-4" />
                        Join Video
                      </Button>
                    ) : (
                      <PaymentButton
                        appointmentId={getEffectiveAppointmentId(apt)}
                        amount={getAppointmentPaymentAmount(apt)}
                        appointmentType="VIDEO_CALL"
                        description={`Video consultation with ${doctorName || "doctor"}`}
                        className="h-10 w-full justify-center"
                      >
                        <CreditCard className="mr-2 size-4" />
                        Complete Payment
                      </PaymentButton>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-10 w-full justify-center"
                      onClick={() => onReschedule(apt)}
                      disabled={cancellingAppointment}
                    >
                      Reschedule
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 w-full justify-center border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                      onClick={() => onCancelAppointment(apt.id)}
                      disabled={cancellingAppointment}
                    >
                      <X className="mr-2 size-4" />
                      Cancel Appointment
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AppointmentManagerProps {
  filterType?: "VIDEO_CALL" | "IN_PERSON";
  defaultConsultationMode?: "VIDEO" | "IN_PERSON";
  isAdminView?: boolean;
  clinicId?: string;
  patientId?: string;
  hideBookButton?: boolean;
  autoOpenBookDialog?: boolean;
  appointmentsData?: unknown;
  isAppointmentsPending?: boolean;
  onRefreshAppointments?: () => Promise<unknown> | unknown;
}

function getEffectiveAppointmentId(appointment: AppointmentWithRelations | any): string {
  return String(appointment?.appointmentId || appointment?.id || "");
}

export default function AppointmentManager({ 
  filterType, 
  defaultConsultationMode, 
  isAdminView = false,
  clinicId: propClinicId,
  patientId: propPatientId,
  hideBookButton = false,
  autoOpenBookDialog = false,
  appointmentsData: externalAppointmentsData,
  isAppointmentsPending: externalAppointmentsPending,
  onRefreshAppointments,
}: AppointmentManagerProps = {}) {
  const { session } = useAuth();
  const user = session?.user;
  const hasShownRealtimeToastRef = useRef(false);
  const currentTimestamp = useCurrentTimestamp();
  const rescheduleMinDate = useMemo(() => {
    if (!currentTimestamp) return null;
    const today = new Date(currentTimestamp);
    today.setHours(0, 0, 0, 0);
    return today;
  }, [currentTimestamp]);
  const checkInRoute = useMemo(() => {
    const userRole = String(user?.role || "").toUpperCase().replace(/\s+/g, "_");
    if (userRole === Role.RECEPTIONIST) {
      return "/receptionist/check-in";
    }
    if (userRole === Role.CLINIC_LOCATION_HEAD) {
      return "/clinic-location-head/check-in";
    }
    return "/patient/check-in";
  }, [user?.role]);

  // Real-time WebSocket integration
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();

  const selectedAppointmentRef = useRef<AppointmentWithRelations | null>(null);
  // Book-appointment dialog state (separate from reschedule dialog so cancelled
  // appointments route users to the main booking flow with all the slots
  // and doctor information pre-configured).
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [bookPrefill, setBookPrefill] = useState<{
    doctorId?: string;
    consultationMode?: "IN_PERSON" | "VIDEO";
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [
    {
      searchQuery,
      isRescheduleDialogOpen,
      rescheduleData,
      isRejectDialogOpen,
      rejectReason,
      currentPage,
      expandedCard,
    },
    dispatch,
  ] = useReducer(appointmentManagerReducer, initialAppointmentManagerState);

  const setSearchQuery = (value: string) => dispatch({ type: "setSearchQuery", value });
  const setIsRescheduleDialogOpen = (value: boolean) =>
    dispatch({ type: "setIsRescheduleDialogOpen", value });
  const setRescheduleData = (
    value:
      | { date: string; time: string }
      | ((prev: { date: string; time: string }) => { date: string; time: string })
  ) => dispatch({ type: "setRescheduleData", value });
  const setIsRejectDialogOpen = (value: boolean) =>
    dispatch({ type: "setIsRejectDialogOpen", value });
  const setRejectReason = (value: string) => dispatch({ type: "setRejectReason", value });
  const setCurrentPage = (
    value: number | ((prev: number) => number)
  ) => dispatch({ type: "setCurrentPage", value });
  const setExpandedCard = (value: string | null) => dispatch({ type: "setExpandedCard", value });
  const ITEMS_PER_PAGE = 5;

  //”€â”€â”€ Data Fetching”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  
  // Choose hook based on view role
  // Sanitize filters to avoid undefined properties breaking exactOptionalPropertyTypes
  const adminFilters = useMemo(() => {
    if (!isAdminView) return undefined;
    const filters: any = {
      clinicId: propClinicId || "",
    };
    if (propPatientId) filters.patientId = propPatientId;
    if (filterType) filters.type = filterType;
    if (dateFilter.start) filters.startDate = dateFilter.start;
    if (dateFilter.end) filters.endDate = dateFilter.end;
    return filters;
  }, [isAdminView, propClinicId, propPatientId, filterType, dateFilter.start, dateFilter.end]);

  const personalFilters = useMemo(() => {
    if (isAdminView) return undefined;
    const filters: any = {};
    if (propClinicId) filters.clinicId = propClinicId;
    if (dateFilter.start) filters.startDate = dateFilter.start;
    if (dateFilter.end) filters.endDate = dateFilter.end;
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [isAdminView, dateFilter.start, dateFilter.end, propClinicId]);

  const adminAppointments = useAppointments(adminFilters);
  const myPersonalAppointments = useMyAppointments(personalFilters);
  const queryClient = useQueryClient();

  const { mutate: cancelAppointment, isPending: cancellingAppointment } = useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: reschedulingAppointment } = useRescheduleAppointment();
  const { mutate: rejectVideoProposal, isPending: rejectingProposal } = useRejectVideoProposal();
  const { mutate: processCheckIn, isPending: processingCheckIn } = useProcessCheckIn();

  const appointmentsFetching =
    externalAppointmentsPending ??
    (isAdminView ? adminAppointments.isFetching : myPersonalAppointments.isFetching);
  const isAppointmentsLoading =
    externalAppointmentsPending ??
    (isAdminView ? adminAppointments.isPending : myPersonalAppointments.isPending);
  const refetch = isAdminView ? adminAppointments.refetch : myPersonalAppointments.refetch;
  const rawData =
    externalAppointmentsData !== undefined
      ? externalAppointmentsData
      : isAdminView
        ? adminAppointments.data
        : myPersonalAppointments.data;

  const fetchedAppointments = useMemo((): AppointmentWithRelations[] => {
    let list: AppointmentWithRelations[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray((rawData as any)?.data?.appointments)) list = (rawData as any).data.appointments;
    else if (Array.isArray((rawData as any)?.appointments)) list = (rawData as any).appointments;
    else if (Array.isArray((rawData as any)?.data)) list = (rawData as any).data;

    if (list.length === 0) return list;

    // Deduplicate appointments that share the same doctor/patient/date/time/location.
    // This guards against double-bookings created by payment retries
    // or webhook replays returning the same logical slot multiple times.
    const seen = new Map<string, AppointmentWithRelations>();
    for (const apt of list) {
      const record = apt as any;

      // Build a composite key that includes all identifying attributes.
      // This handles cases where IDs differ but the logical appointment is the same.
      const doctor =
        record?.doctor?.fullName ||
        record?.doctor?.name ||
        record?.doctorLabel ||
        record?.doctorName ||
        "doctor";
      const patient =
        record?.patient?.fullName ||
        record?.patient?.name ||
        record?.patientLabel ||
        record?.patientName ||
        "patient";
      const date =
        record?.date ||
        record?.scheduledDate ||
        record?.appointmentDate ||
        "";
      const time =
        record?.time ||
        record?.startTime ||
        record?.scheduledStartTime ||
        record?.slot ||
        "";
      const location =
        record?.location?.name ||
        record?.locationLabel ||
        record?.locationName ||
        "location";

      const key = `${doctor}|${patient}|${date}|${time}|${location}`;

      // Keep the first occurrence of this logical appointment.
      // If IDs differ but the composite key matches, treat as duplicates.
      if (!seen.has(key)) {
        seen.set(key, apt);
      }
    }

    const deduped = Array.from(seen.values());

    // Optional: Log for debugging in browser console
    if (typeof window !== 'undefined' && list.length !== deduped.length) {
      console.log(`[AppointmentManager] Deduped ${list.length} appointments to ${deduped.length}`);
    }

    return deduped;
  }, [rawData]);

  const allAppointments = fetchedAppointments;
  const patientScopedAppointments = useMemo(() => {
    // Admin views already fetch filtered by clinic/patient€” don't re-filter.
    if (isAdminView) return allAppointments;

    // Patient view uses /appointments/my-appointments (already server scoped).
    // Do not perform client-side patientId/userId filtering here.
    return allAppointments;
  }, [allAppointments, isAdminView]);

  const handleRefreshAppointments = useCallback(async () => {
    if (onRefreshAppointments) {
      void onRefreshAppointments();
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["appointment"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["myAppointments"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["appointmentStats"], exact: false }),
    ]);

    await refetch();
  }, [onRefreshAppointments, queryClient, refetch]);

  // Expose a global hook so nested components (e.g. the live countdown
  // in <PaymentCountdown>) can ask the manager to refresh the appointment
  // list when the payment window expires. This avoids needing to thread
  // callbacks through the entire tree.
  useEffect(() => {
    const w = window as Window & { __refreshAppointments?: () => void };
    w.__refreshAppointments = () => {
      void handleRefreshAppointments();
    };
    return () => {
      if (w.__refreshAppointments) {
        delete w.__refreshAppointments;
      }
    };
  }, [handleRefreshAppointments]);

  const normalizedAppointments = useMemo(() => {
    return patientScopedAppointments
      .map((appointment) => {
        const normalized = normalizePatientAppointment(appointment);
        const viewState = getAppointmentViewState(appointment);
        const paymentDisplay = getAppointmentPaymentDisplayState(appointment);
        const isTerminalStatus = isTerminalAppointment(appointment);
        const displayStatus =
          viewState.isVideo && !paymentDisplay.paymentCompleted && !isTerminalStatus
            ? "SCHEDULED"
            : viewState.normalizedStatus;
        return {
          ...appointment,
          status: displayStatus,
          type: normalized.type,
          location: {
            ...(appointment.location || {}),
            name: normalized.locationName,
          },
          doctorLabel: normalized.doctorName,
          locationLabel: normalized.locationName,
          normalizedDate: normalized.normalizedDate,
          normalizedTime: normalized.normalizedTime,
          appointmentDateTime: normalized.dateTime,
        } as any;
      })
      .sort((a, b) => {
        const aCancelled = normalizeAppointmentStatus(a.status) === "CANCELLED";
        const bCancelled = normalizeAppointmentStatus(b.status) === "CANCELLED";

        if (aCancelled !== bCancelled) {
          return aCancelled ? 1 : -1;
        }

        const aTime = a.appointmentDateTime?.getTime() ?? 0;
        const bTime = b.appointmentDateTime?.getTime() ?? 0;
        return bTime - aTime;
      });
  }, [patientScopedAppointments]);

  const filteredAppointments = useMemo(() => {
    const parseAppointmentDate = (value: string) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDate = dateFilter.start ? parseAppointmentDate(`${dateFilter.start}T00:00:00`) : null;
    const endDate = dateFilter.end ? parseAppointmentDate(`${dateFilter.end}T23:59:59.999`) : null;

    return normalizedAppointments.filter(apt => {
      const matchesType = !filterType || apt.type === filterType;
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : apt.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        apt.doctorLabel.toLowerCase().includes(q) ||
        apt.doctor?.user?.firstName?.toLowerCase().includes(q) ||
        apt.doctor?.user?.lastName?.toLowerCase().includes(q) ||
        (apt as any).doctorName?.toLowerCase().includes(q) ||
        apt.locationLabel.toLowerCase().includes(q) ||
        (apt as any).locationName?.toLowerCase().includes(q) ||
        apt.status?.toLowerCase().includes(q);
      const appointmentDate = apt.appointmentDateTime;
      const matchesStartDate = !startDate || (appointmentDate !== null && appointmentDate >= startDate);
      const matchesEndDate = !endDate || (appointmentDate !== null && appointmentDate <= endDate);
      return matchesType && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [normalizedAppointments, statusFilter, searchQuery, dateFilter.start, dateFilter.end, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Stats
  const stats = useMemo(() => {
    const total = normalizedAppointments.length;
    const upcoming = normalizedAppointments.filter(a => ["SCHEDULED", "CONFIRMED"].includes(a.status)).length;
    const completed = normalizedAppointments.filter(a => a.status === "COMPLETED").length;
    const inProgress = normalizedAppointments.filter(a => a.status === "IN_PROGRESS").length;
    return { total, upcoming, completed, inProgress };
  }, [normalizedAppointments]);

  const formatDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Date TBD";
    return formatDateInIST(parsed, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const parseDateValue = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const formatDateValue = (value: string, placeholder: string) => {
    const parsed = parseDateValue(value);
    return parsed
      ? formatDateInIST(parsed, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : placeholder;
  };

  const toDateString = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const handleCancelAppointment = useCallback((id: string) => {
    cancelAppointment({ id, reason: "Cancelled via appointment manager" }, {
      onSuccess: () => showSuccessToast("Appointment cancelled", { id: TOAST_IDS.APPOINTMENT.DELETE, description: "Your appointment has been cancelled." }),
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to cancel", { id: TOAST_IDS.APPOINTMENT.DELETE }),
    });
  }, [cancelAppointment]);

  // Opens the main booking dialog (not the reschedule dialog) with
  // the cancelled appointment's doctor and mode pre-selected.
  const handleOpenBookDialogFromCancelled = useCallback((apt: AppointmentWithRelations | any) => {
    const doctorId =
      (apt as any).doctorId ||
      (apt as any).appointmentDoctorId ||
      undefined;
    const mode = apt.type === "VIDEO_CALL" ? "VIDEO" : "IN_PERSON";
    setBookPrefill({ doctorId, consultationMode: mode });
    setIsBookDialogOpen(true);
  }, []);

  const handleRescheduleSubmit = () => {
    const selectedAppointment = selectedAppointmentRef.current;
    if (!selectedAppointment) return;
    const appointmentId = getEffectiveAppointmentId(selectedAppointment);
    rescheduleAppointment({ id: appointmentId, data: { date: rescheduleData.date, time: rescheduleData.time } }, {
      onSuccess: () => {
        showSuccessToast("Appointment rescheduled", { id: TOAST_IDS.APPOINTMENT.UPDATE, description: "Your appointment has been rescheduled." });
        setIsRescheduleDialogOpen(false);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reschedule", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  const handleRejectProposal = () => {
    const selectedAppointment = selectedAppointmentRef.current;
    if (!selectedAppointment) return;
    const appointmentId = getEffectiveAppointmentId(selectedAppointment);
    rejectVideoProposal({ id: appointmentId, reason: rejectReason }, {
      onSuccess: () => {
        showSuccessToast("Proposal rejected", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        setIsRejectDialogOpen(false);
        setRejectReason("");
        selectedAppointmentRef.current = null;
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reject", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  const handleJoinVideo = useCallback(async (appointment: any) => {
    try {
      const appointmentId = getEffectiveAppointmentId(appointment);
      if (!appointmentId) {
        showErrorToast("Missing appointment details for this video session.", {
          id: TOAST_IDS.VIDEO.ERROR,
        });
        return;
      }

      let latestAppointment = appointment;
      if (!isVideoAppointmentJoinable(latestAppointment)) {
        const refreshedQuery = await refetch();
        const refreshedAppointments = (() => {
          const data = (refreshedQuery as any)?.data;
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.appointments)) return data.appointments;
          if (Array.isArray(data?.data?.appointments)) return data.data.appointments;
          if (Array.isArray(data?.data)) return data.data;
          return [];
        })();

        latestAppointment =
          refreshedAppointments.find((item: any) => getEffectiveAppointmentId(item) === appointmentId) || appointment;
      }

      if (!isVideoAppointmentJoinable(latestAppointment)) {
        showErrorToast(getVideoAppointmentJoinBlockedReason(latestAppointment), {
          id: TOAST_IDS.VIDEO.ERROR,
        });
        return;
      }

      window.location.href = buildVideoSessionRoute(appointmentId);
    } catch (error: unknown) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to join video",
        { id: TOAST_IDS.VIDEO.ERROR }
      );
    }
  }, [refetch]);

  useEffect(() => {
    if (isRealTimeEnabled && isConnected && !hasShownRealtimeToastRef.current) {
      hasShownRealtimeToastRef.current = true;
      showInfoToast("Live updates active", { id: TOAST_IDS.GLOBAL.INFO, description: "Appointments update in real-time", duration: 2000 });
    }

    if (!isConnected) {
      hasShownRealtimeToastRef.current = false;
    }
  }, [isRealTimeEnabled, isConnected]);

  if (isAppointmentsLoading) {
    return (
    <div className="flex flex-col gap-y-4 p-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:rounded-2xl">
      <CardHeader className="pb-1.5 sm:pb-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 sm:h-8 sm:w-8">
               <Calendar className="size-5 text-emerald-600" />
            </div>
            Current Appointments
          </CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-3 lg:w-auto lg:justify-end">
            {isRealTimeEnabled && (
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isConnected ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                <span className={`size-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                {isConnected ? "Live" : "Connecting…"}
              </span>
            )}

            {!hideBookButton && (
              <BookAppointmentDialog
                defaultOpen={autoOpenBookDialog}
                {...(propClinicId ? { clinicId: propClinicId } : {})}
                {...(propPatientId ? { initialPatientId: propPatientId } : {})}
                trigger={
                <Button
                  className="h-9 w-full gap-2 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-sm font-bold text-white shadow-md transition-all active:scale-95 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-500/30 sm:w-auto sm:px-5 animate-pulse"
                >
                  <Video className="size-4" />
                  Book Video Appointment
                </Button>
                }
              />
            )}

            <Button
              variant="outline"
              onClick={() => void handleRefreshAppointments()}
              className="h-9 w-full gap-2 rounded-xl border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition-all shadow-sm hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/25 dark:text-sky-300 dark:hover:bg-sky-950/45 sm:w-auto"
              disabled={appointmentsFetching}
              title="Refresh Appointments"
            >
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200">
                <RefreshCw className={`size-3.5 ${appointmentsFetching ? "animate-spin" : ""}`} />
              </span>
              <span className="font-medium">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4 sm:gap-y-5">

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Stethoscope className="size-5" />}
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            iconBorder="border-blue-100 dark:border-blue-900"
            iconColor="text-blue-600"
            cardBorder="border-blue-100 dark:border-blue-900"
            cardHover="hover:border-blue-300"
            className="bg-blue-50/70 dark:bg-blue-950/20"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon={<Calendar className="size-5" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            iconBorder="border-emerald-100 dark:border-emerald-900"
            iconColor="text-emerald-600"
            cardBorder="border-emerald-100 dark:border-emerald-900"
            cardHover="hover:border-emerald-300"
            className="bg-emerald-50/70 dark:bg-emerald-950/20"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={<Zap className="size-5" />}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            iconBorder="border-amber-100 dark:border-amber-900"
            iconColor="text-amber-600"
            cardBorder="border-amber-100 dark:border-amber-900"
            cardHover="hover:border-amber-300"
            className="bg-amber-50/70 dark:bg-amber-950/20"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<CheckCircle className="size-5" />}
            iconBg="bg-violet-50 dark:bg-violet-950/30"
            iconBorder="border-violet-100 dark:border-violet-900"
            iconColor="text-violet-600"
            cardBorder="border-violet-100 dark:border-violet-900"
            cardHover="hover:border-violet-300"
            className="bg-violet-50/70 dark:bg-violet-950/20"
          />
      </div>

      {/* Search and Filters (REPLICATING DASHBOARD EXACTLY) */}
      <div className="mb-6 flex flex-col gap-y-3.5 sm:mb-8 sm:gap-y-4">
        {/* 1. Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, location..."
            className="pl-10 h-11 border-muted/30 bg-muted/5 rounded-lg text-sm focus-visible:ring-primary shadow-sm w-full"
          />
        </div>

        <div className="flex h-11 max-w-full gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card p-1 shadow-sm sm:h-12 sm:gap-1.5 sm:rounded-2xl sm:p-1.5 scrollbar-hide">
          {(["ALL", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as StatusFilter[]).map(s => {
            const isActive = statusFilter === s;
            const labelMap: Record<string, string> = {
              ALL: "All",
              SCHEDULED: "Scheduled",
              CONFIRMED: "Confirmed",
              IN_PROGRESS: "In Progress",
              COMPLETED: "Completed",
              CANCELLED: "Cancelled"
            };

            return (
              <button
                type="button"
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "h-full whitespace-nowrap rounded-lg px-3 text-[11px] font-semibold transition-all sm:rounded-xl sm:px-5 sm:text-sm",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {labelMap[s]}
              </button>
            );
          })}
        </div>

        {/* 3. Default View Label */}
        <p className="px-1 text-[13px] text-muted-foreground/80">
          Default view shows all appointments, newest first.
        </p>

        {/* 4. Date Range Pickers (From date, To date) */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-between rounded-xl border-border/70 bg-background text-left text-sm font-medium shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/30 sm:w-44",
                  !dateFilter.start && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 size-4 opacity-50" />
                {formatDateValue(dateFilter.start, "From date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl border border-border/60 bg-popover p-3 shadow-xl" align="start" sideOffset={8}>
              <CalendarPicker
                mode="single"
                selected={parseDateValue(dateFilter.start)}
                onSelect={(date) => setDateFilter((p) => ({ ...p, start: toDateString(date) }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-between rounded-xl border-border/70 bg-background text-left text-sm font-medium shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/30 sm:w-44",
                  !dateFilter.end && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 size-4 opacity-50" />
                {formatDateValue(dateFilter.end, "To date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl border border-border/60 bg-popover p-3 shadow-xl" align="start" sideOffset={8}>
              <CalendarPicker
                mode="single"
                selected={parseDateValue(dateFilter.end)}
                onSelect={(date) => setDateFilter((p) => ({ ...p, end: toDateString(date) }))}
                disabled={(date) => {
                  const startDate = parseDateValue(dateFilter.start);
                  return !!startDate && date < startDate;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFilter.start || dateFilter.end || (statusFilter && statusFilter !== "SCHEDULED")) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter({ start: "", end: "" });
              setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="h-8 text-primary hover:bg-primary/5"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Appointments list */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-muted/20 py-12 text-center">
          <Calendar className="size-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">
            {allAppointments.length === 0 ? "No appointments yet" : "No appointments match your filters"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {allAppointments.length === 0
              ? "Book your first appointment to get started"
              : "Try adjusting the status filter or search query"}
          </p>
          {allAppointments.length === 0 && !hideBookButton && (
            <BookAppointmentDialog
              defaultOpen={autoOpenBookDialog}
              {...(propClinicId ? { clinicId: propClinicId } : {})}
              {...(propPatientId ? { initialPatientId: propPatientId } : {})}
              trigger={
                <Button className="mt-4 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 animate-pulse">
                  <Video className="size-4" />
                  Book Video Appointment
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-y-2.5 sm:gap-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Showing {filteredAppointments.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredAppointments.length)} of {filteredAppointments.length}
            </p>
          </div>
          {filteredAppointments
            .slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE)
            .map((apt) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                expandedCard={expandedCard}
                checkInRoute={checkInRoute}
                cancellingAppointment={cancellingAppointment}
                onCancelAppointment={handleCancelAppointment}
                handleJoinVideo={handleJoinVideo}
                onExpand={setExpandedCard}
                onSelect={(appointment) => {
                  selectedAppointmentRef.current = appointment;
                }}
                onReschedule={(apt) => {
                  selectedAppointmentRef.current = apt;
                  setRescheduleData({
                    date: formatISODateInIST(apt.date),
                    time: apt.time || "",
                  });
                  setIsRescheduleDialogOpen(true);
                }}
                onBookNew={handleOpenBookDialogFromCancelled}
                viewerRole={user?.role}
              />
            ))}
          {filteredAppointments.length > ITEMS_PER_PAGE && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 sm:pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 rounded-lg border-border/60 px-3 text-sm sm:h-9 sm:px-4"
              >
                Prev
              </Button>
              <span className="hidden rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                Page {safeCurrentPage} of {totalPages}
              </span>
              {getPaginationWindow(safeCurrentPage, totalPages).map((page, index) =>
                page === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">...
                  </span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "size-8 rounded-lg text-sm font-semibold transition-all sm:h-9 sm:w-9",
                      page === safeCurrentPage
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "border border-border/60 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                    )}
                  >
                    {page}
                  </button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 rounded-lg border-border/60 px-3 text-sm sm:h-9 sm:px-4"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription>
              Choose a new date and time for your appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-y-4 py-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium">New Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between rounded-xl border-border/70 bg-background text-left font-medium shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/30",
                      !rescheduleData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 size-4" />
                    {formatDateValue(rescheduleData.date, "Pick a new date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl border border-border/60 bg-popover p-3 shadow-xl" align="start" sideOffset={8} suppressHydrationWarning>
                  <CalendarPicker
                    mode="single"
                    selected={parseDateValue(rescheduleData.date)}
                    onSelect={(date) => setRescheduleData((p) => ({ ...p, date: toDateString(date) }))}
                    disabled={(date) => !!rescheduleMinDate && date < rescheduleMinDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label htmlFor="appointment-reschedule-time" className="text-sm font-medium mb-1.5 block">
                New Time
              </label>
              <Input
                id="appointment-reschedule-time"
                type="time"
                value={rescheduleData.time}
                onChange={(e) => setRescheduleData(p => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRescheduleDialogOpen(false)}
              className="h-11 px-6 rounded-xl border-border/50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={reschedulingAppointment || !rescheduleData.date || !rescheduleData.time}
              className="h-11 px-8 rounded-xl font-semibold shadow-sm transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
            >
              {reschedulingAppointment ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Proposal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the proposed time slots.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="reject-proposal-reason" className="text-sm font-medium mb-1.5 block">
              Reason
            </label>
            <Textarea
              id="reject-proposal-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Only available in evenings"
              className="mt-2 rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              className="h-11 px-6 rounded-xl border-border/50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectProposal}
              disabled={!rejectReason || rejectingProposal}
              className="h-11 px-8 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              {rejectingProposal ? "Rejecting..." : "Reject Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main booking dialog (controlled) — opened when the user clicks
          "Book New Appointment" on a cancelled appointment so they get the
          full booking flow with all time slots and the doctor pre-filled. */}
      <BookAppointmentDialog
        hideTrigger
        open={isBookDialogOpen}
        onOpenChange={setIsBookDialogOpen}
        {...(bookPrefill?.doctorId ? { initialDoctorId: bookPrefill.doctorId } : {})}
        {...(bookPrefill?.consultationMode
          ? { initialConsultationMode: bookPrefill.consultationMode }
          : {})}
        {...(propClinicId ? { clinicId: propClinicId } : {})}
        {...(propPatientId ? { initialPatientId: propPatientId } : {})}
        onBooked={() => {
          setIsBookDialogOpen(false);
          setBookPrefill(null);
        }}
      />
      </CardContent>
    </Card>
  );
}



