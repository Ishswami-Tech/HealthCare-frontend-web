"use client";

import type { ReactNode } from "react";
import { AudioLines, CalendarPlus, Check, MapPin, QrCode, ScanLine, Video } from "lucide-react";
import { Divider, Kv, SoftCard, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingDoctorRow } from "./BookingDoctor";
import { BookingNotice } from "./BookingStates";
import type { BookingDetail, BookingDoctorInfo, BookingMode } from "./types";

export interface BookingSuccessAction {
  label: string;
  onClick: () => void;
}

export interface BookingSuccessStepViewProps {
  mode: BookingMode;
  /** Video visit created but the fee is not paid yet. */
  paymentPending: boolean;
  /** Video visit and the online payment went through. */
  paid?: boolean | undefined;
  doctor: BookingDoctorInfo | null;
  /** Line under the doctor's name ("Video Consultation", "In-clinic · Booking 1A2B3C4D"). */
  subtitle: string;
  details: BookingDetail[];
  /** Right side of the doctor row (for example a "View payments" link). */
  cardAction?: ReactNode;
  /** Countdown while a payment is pending (rendered by the dialog). */
  countdown?: ReactNode;
  /** Saves the visit to the person's calendar. Hidden while payment is pending. */
  onAddToCalendar?: (() => void) | undefined;
  /** Link to a map for the clinic address. */
  directionsHref?: string | undefined;
  /** In-clinic, patient only: opens the check-in page. */
  checkInAction?: BookingSuccessAction | undefined;
  /** The closing button ("Go to Home", "Go to appointments", "Done"). */
  primaryAction?: BookingSuccessAction | undefined;
}

const VISIT_DAY_STEPS = [
  { icon: MapPin, label: "Reach the clinic", strong: false },
  { icon: ScanLine, label: "Scan desk QR", strong: true },
  { icon: AudioLines, label: "Join the queue", strong: false },
] as const;

/** Last step: the visit is booked (boards WebBooked and WebBookedClinic). */
export function BookingSuccessStepView({
  mode,
  paymentPending,
  paid = false,
  doctor,
  subtitle,
  details,
  cardAction,
  countdown,
  onAddToCalendar,
  directionsHref,
  checkInAction,
  primaryAction,
}: BookingSuccessStepViewProps) {
  const isVideo = mode === "VIDEO";
  const title = isVideo ? (paymentPending ? "Complete Payment" : "Appointment Confirmed") : "Clinic visit booked";
  const description = isVideo
    ? paymentPending
      ? "Your selected time is saved. Pay below to book the video appointment."
      : paid
        ? "Your payment is complete and the appointment is confirmed."
        : "Your video appointment is booked. You can track the status from your appointments page."
    : "Your slot is reserved. Remember to check in with the QR at the clinic — that confirms your visit and puts you in the queue.";

  const secondary: ReactNode[] = [];
  if (isVideo && !paymentPending && onAddToCalendar) {
    secondary.push(
      <Button key="calendar" variant="outline" size="xl" className="w-full" onClick={onAddToCalendar}>
        <CalendarPlus aria-hidden="true" />
        Add to Calendar
      </Button>,
    );
  }
  if (!isVideo && directionsHref) {
    secondary.push(
      <Button key="directions" variant="outline" size="xl" className="w-full" asChild>
        <a href={directionsHref} target="_blank" rel="noopener noreferrer">
          <MapPin aria-hidden="true" />
          Directions
        </a>
      </Button>,
    );
  }
  const buttons: ReactNode[] = [...secondary];
  if (checkInAction) {
    // One main button: with a check-in button present it is the emerald one.
    buttons.push(
      <Button key="check-in" size="xl" className="w-full" onClick={checkInAction.onClick}>
        <QrCode aria-hidden="true" />
        {checkInAction.label}
      </Button>,
    );
  }
  if (primaryAction) {
    buttons.push(
      <Button
        key="primary"
        variant={checkInAction ? "outline" : "default"}
        size="xl"
        className="w-full"
        onClick={primaryAction.onClick}
      >
        {primaryAction.label}
      </Button>,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-col items-center gap-2.5 pt-3 text-center">
        <div
          className={cn(
            "flex size-[104px] items-center justify-center rounded-full",
            paymentPending ? "bg-[#fef3c7] dark:bg-amber-500/15" : "bg-mint",
          )}
          aria-hidden="true"
        >
          <div
            className={cn(
              "flex size-[74px] items-center justify-center rounded-full text-white",
              paymentPending
                ? "bg-[#d97706] shadow-[0_10px_24px_rgba(217,119,6,0.3)]"
                : "bg-[#047857] shadow-[0_10px_24px_rgba(4,120,87,0.35)]",
            )}
          >
            {paymentPending ? (
              <Video className="size-8" strokeWidth={2.4} />
            ) : (
              <Check className="size-9" strokeWidth={3} />
            )}
          </div>
        </div>
        <h3 className="m-0 mt-2.5 text-2xl font-extrabold tracking-[-0.4px] text-ink">{title}</h3>
        <p className="m-0 max-w-[460px] text-sm leading-normal text-ink-muted">{description}</p>
      </div>

      <Surface className="gap-4">
        <BookingDoctorRow doctor={doctor} subtitle={subtitle} right={cardAction} />
        <Divider />
        <div className={cn("grid grid-cols-1 gap-4 min-[420px]:grid-cols-2", !isVideo && details.length === 3 && "sm:grid-cols-3")}>
          {details.map((item) => (
            <Kv
              key={item.label}
              label={item.label}
              value={
                item.tone === "brand" ? <span className="text-brand">{item.value}</span> : item.value
              }
            />
          ))}
        </div>
      </Surface>

      {isVideo && paymentPending ? (
        <BookingNotice tone="amber" icon={Video} title="Payment required">
          <p className="m-0 text-xs">
            Your appointment is created. Complete payment from the confirm screen to finish booking.
          </p>
          {countdown}
        </BookingNotice>
      ) : null}

      {!isVideo ? (
        <SoftCard tone="sun" className="p-[22px]">
          <div className="flex flex-col gap-4">
            <span className="text-base font-extrabold text-ink">On the day of your visit</span>
            <ol className="m-0 grid list-none grid-cols-3 gap-3 p-0">
              {VISIT_DAY_STEPS.map((step) => (
                <li key={step.label} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "flex size-[46px] items-center justify-center rounded-[14px]",
                      step.strong ? "bg-[#10b981] text-white" : "bg-white/70 text-[#047857] dark:bg-white/10 dark:text-emerald-300",
                    )}
                    aria-hidden="true"
                  >
                    <step.icon className="size-[22px]" strokeWidth={2.2} />
                  </span>
                  <span className="text-[13px] font-bold text-ink-muted">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </SoftCard>
      ) : null}

      {buttons.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            buttons.length === 2 && "sm:grid-cols-2",
            buttons.length >= 3 && "sm:grid-cols-3",
          )}
        >
          {buttons}
        </div>
      ) : null}
    </div>
  );
}
