"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, Clock, Lock, MapPin, QrCode, UserRound, Video } from "lucide-react";
import { Divider, IconBox, InitialsAvatar, Pill, SectionTitle, SummaryLine, Surface } from "@/components/tbd";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { BookingDoctorRow } from "./BookingDoctor";
import { slotPeriodKeyOf } from "./BookingSlotGroups";
import { BookingNotice } from "./BookingStates";
import { BookingVisitFor, type BookingVisitForProps } from "./BookingVisitFor";
import type { BookingDoctorInfo, BookingLayout, BookingMode, BookingPeriodKey } from "./types";

export interface BookingReviewStepViewProps {
  layout: BookingLayout;
  mode: BookingMode;
  doctor: BookingDoctorInfo | null;
  serviceLabel?: string | undefined;
  serviceCategory?: string | undefined;
  /** Staff only: the patient the visit is booked for. */
  patientName?: string | undefined;
  /** Patient layout: who the visit is for (the signed-in person). */
  forPerson?: { name: string; relation: string } | undefined;
  /** Patient layout: choose who the visit is for (the patient or a family member). Replaces `forPerson`. */
  visitFor?: BookingVisitForProps | undefined;
  /** Patient layout: the chosen person, repeated in the summary next to the book / pay button. */
  visitForName?: string | undefined;
  /** "Mon, 28 Sept 2026" (page) or "Monday, 5 October 2026" (compact). */
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  locationName?: string | undefined;
  chiefComplaint: string;
  onChiefComplaintChange: (value: string) => void;
  urgency: string;
  onUrgencyChange: (value: string) => void;
  /** Video fee block (patients paying online). Absent = nothing is collected here. */
  payment?:
    | {
        amountLabel: string;
        accepted: boolean;
        onAcceptedChange: (accepted: boolean) => void;
        /** The existing gateway button, rendered by the dialog once the appointment exists. */
        payButton?: ReactNode;
      }
    | undefined;
  /** In-clinic plan check for patients. */
  plan?: { loading: boolean; required: boolean; activeTill?: string | null } | undefined;
  /** Page layout: the amber book / pay button, shown inside the summary card on wide screens. */
  confirmAction?: ReactNode;
}

const FIELD_LABEL = "mb-1.5 block text-[13px] font-bold text-ink";

type ReviewIcon = React.ComponentProps<typeof IconBox>["icon"];
type ReviewTone = NonNullable<React.ComponentProps<typeof IconBox>["tone"]>;

/** Date / time row tint: the slot period's colour (morning amber, afternoon blue, evening violet). */
const PERIOD_TONE: Record<BookingPeriodKey, ReviewTone> = {
  morning: "amber",
  afternoon: "blue",
  evening: "violet",
};

/** "05:18 PM" / "17:18" -> "17:18" (for the period colour); null when it is not a time. */
function toTwentyFourHour(label: string): string | null {
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(label);
  if (!match) return null;
  let hour = Number(match[1]) % 24;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

/** One compact icon-left detail row of the Confirm step. */
function ReviewDetailRow({
  icon,
  tone,
  title,
  subtitle,
}: {
  icon: ReviewIcon;
  tone: ReviewTone;
  title: string;
  subtitle?: string | undefined;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconBox icon={icon} tone={tone} size={36} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-ink">{title}</span>
        {subtitle ? <span className="truncate text-xs text-ink-muted">{subtitle}</span> : null}
      </span>
    </div>
  );
}

function ReasonFields({
  chiefComplaint,
  onChiefComplaintChange,
  urgency,
  onUrgencyChange,
  complaintLabel,
  complaintLabelClassName,
}: Pick<
  BookingReviewStepViewProps,
  "chiefComplaint" | "onChiefComplaintChange" | "urgency" | "onUrgencyChange"
> & { complaintLabel: string; complaintLabelClassName?: string }) {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <label htmlFor="book-appointment-chief-complaint" className={complaintLabelClassName ?? FIELD_LABEL}>
          {complaintLabel}
        </label>
        <Textarea
          id="book-appointment-chief-complaint"
          value={chiefComplaint}
          onChange={(event) => onChiefComplaintChange(event.target.value)}
          placeholder="Briefly describe your symptoms or reason for visit..."
          className="min-h-[96px] flex-1 resize-none rounded-[14px] text-sm leading-normal"
        />
      </div>
      <div>
        <label htmlFor="book-appointment-urgency" className={FIELD_LABEL}>
          Urgency
        </label>
        <Select value={urgency} onValueChange={onUrgencyChange}>
          <SelectTrigger id="book-appointment-urgency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low - Routine checkup</SelectItem>
            <SelectItem value="Normal">Normal - Regular visit</SelectItem>
            <SelectItem value="High">High - Urgent care needed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/** Terms box for the video fee. Same checkbox, wording and links as before. */
function VideoPaymentPolicy({
  accepted,
  onAcceptedChange,
}: {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}) {
  return (
    <div className="rounded-xl bg-[#f3f7fd] p-3 dark:bg-well/60">
      <div className="flex items-start gap-3">
        <Checkbox
          id="video-payment-policy"
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="video-payment-policy" className="text-[13px] font-bold leading-snug text-ink">
            I accept the video appointment terms and privacy policy
          </Label>
          <p className="m-0 text-xs leading-relaxed text-ink-muted">
            Video appointment payments are non-refundable. If you miss the appointment, you must rebook a new slot.
          </p>
          <p className="m-0 text-[11px] leading-relaxed text-ink-muted">
            Read our{" "}
            <Link href="/terms" prefetch={false} className="font-bold text-brand underline underline-offset-4">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" prefetch={false} className="font-bold text-brand underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanNotice({ plan }: { plan: { loading: boolean; required: boolean; activeTill?: string | null } }) {
  if (plan.loading) {
    return (
      <BookingNotice tone="green" title="Checking your plan">
        <p className="m-0 text-xs">We&apos;re checking your plan before booking this in-person appointment.</p>
      </BookingNotice>
    );
  }
  if (plan.required) {
    return (
      <BookingNotice tone="amber" title="Plan required">
        <p className="m-0 text-xs">
          In-clinic visits are covered by a monthly plan. You need an active plan for this clinic to continue.{" "}
          <Link href="/patient/payments?tab=plans" className="font-bold underline">
            See plans
          </Link>{" "}
          or ask the reception desk to book this visit for you.
        </p>
      </BookingNotice>
    );
  }
  const till = plan.activeTill ? formatDateInIST(plan.activeTill) : "";
  if (till) {
    return (
      <BookingNotice tone="green" title={`Plan active till ${till}`}>
        <p className="m-0 text-xs">This in-clinic visit is covered by your monthly plan. No payment now.</p>
      </BookingNotice>
    );
  }
  return (
    <BookingNotice tone="green" title="Plan check">
      <p className="m-0 text-xs">We&apos;ll verify your plan before confirming this appointment.</p>
    </BookingNotice>
  );
}

/** Consultation fee + total, shown once: in the visit card (patient page) or the payment card (staff). */
function FeeLines({ amountLabel }: { amountLabel: string }) {
  return (
    <>
      <SummaryLine label="Consultation fee" value={amountLabel} className="text-ink-soft" />
      <div className="flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
        <span className="text-[15px] font-extrabold text-ink">Total</span>
        <span className="text-xl font-extrabold tracking-[-0.4px] text-ink">{amountLabel}</span>
      </div>
    </>
  );
}

/** Fee lines + total + terms + the pay button (boards WebBookConfirm / WebBookConfirmClinic, right card). */
function PaymentSummary({
  mode,
  payment,
  plan,
  confirmAction,
  visitForName,
  className,
  showBreakdown = true,
}: Pick<BookingReviewStepViewProps, "mode" | "payment" | "plan" | "confirmAction" | "visitForName"> & {
  className?: string;
  /** False when the fee lines and "Visit for" are already shown in the visit card (patient page). */
  showBreakdown?: boolean;
}) {
  const isVideo = mode === "VIDEO";
  return (
    <Surface className={cn("gap-3 p-4", className)}>
      {showBreakdown ? <SectionTitle title="Payment summary" /> : null}
      {showBreakdown && visitForName ? (
        <div className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink-soft">
          <span className="shrink-0">Visit for</span>
          <span className="min-w-0 break-words text-right font-bold text-ink">{visitForName}</span>
        </div>
      ) : null}
      {payment ? (
        <>
          {showBreakdown ? <FeeLines amountLabel={payment.amountLabel} /> : null}
          <VideoPaymentPolicy accepted={payment.accepted} onAcceptedChange={payment.onAcceptedChange} />
        </>
      ) : plan ? (
        <PlanNotice plan={plan} />
      ) : (
        <p className="m-0 text-sm text-ink-muted">
          {isVideo ? "No online payment is needed to book this video visit." : "No online payment is taken for this visit."}
        </p>
      )}
      {confirmAction ? <div className="w-full">{confirmAction}</div> : null}
      {payment?.payButton}
      {payment ? (
        <p className="m-0 text-center text-xs leading-normal text-ink-muted [text-wrap:balance]">
          <Lock className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          Secure payment
          <span className="block">Accept the terms above, then confirm to create the appointment and open payment.</span>
        </p>
      ) : null}
    </Surface>
  );
}

/** Step "Confirm": what you are booking, who for, why, and what it costs. */
export function BookingReviewStepView(props: BookingReviewStepViewProps) {
  return props.layout === "page" ? <ReviewPage {...props} /> : <ReviewCompact {...props} />;
}

// ── Patient layout (boards WebBookConfirm, WebBookConfirmClinic) ───────────

function ReviewPage({
  mode,
  doctor,
  forPerson,
  visitFor,
  visitForName,
  dateLabel,
  timeLabel,
  durationMinutes,
  locationName,
  chiefComplaint,
  onChiefComplaintChange,
  urgency,
  onUrgencyChange,
  payment,
  plan,
  confirmAction,
}: BookingReviewStepViewProps) {
  const isVideo = mode === "VIDEO";
  const time24 = toTwentyFourHour(timeLabel);
  const periodTone = time24 ? PERIOD_TONE[slotPeriodKeyOf([], time24)] : "mint";
  const duration = durationMinutes > 0 ? `${durationMinutes} min` : undefined;
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-3">
        <Surface className="gap-3 p-4">
          <BookingDoctorRow doctor={doctor} right={isVideo ? undefined : <Pill tone="clinic">In-clinic</Pill>} />
          <Divider />
          <div className="grid gap-3 sm:grid-cols-2">
            <ReviewDetailRow
              icon={Clock}
              tone={periodTone}
              title={`${dateLabel} · ${timeLabel}`}
              subtitle={duration}
            />
            <ReviewDetailRow
              icon={isVideo ? Video : Building2}
              tone={isVideo ? "video" : "mint"}
              title={isVideo ? "Video consultation" : "In-clinic visit"}
              subtitle={isVideo ? "Join from My appointments" : "Check in with the desk QR"}
            />
            {!isVideo && locationName ? (
              <ReviewDetailRow icon={MapPin} tone="mint" title={locationName} subtitle="Location" />
            ) : null}
            {visitForName ? (
              <ReviewDetailRow icon={UserRound} tone="slate" title={visitForName} subtitle="Visit for" />
            ) : null}
          </div>
          {payment ? (
            <>
              <Divider />
              <FeeLines amountLabel={payment.amountLabel} />
            </>
          ) : null}
        </Surface>

        <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
          {visitFor ? (
            <Surface className="h-full gap-3 p-4">
              <BookingVisitFor {...visitFor} />
            </Surface>
          ) : forPerson ? (
            <Surface className="h-full gap-3 p-4">
              <SectionTitle title="Who is this for?" />
              <div className="flex gap-2.5">
                <div className="flex min-h-[108px] w-[120px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-brand bg-mint-soft px-2 text-center">
                  <InitialsAvatar name={forPerson.name} size={40} />
                  <span className="max-w-full truncate text-[13px] font-bold text-ink">{forPerson.name}</span>
                  <span className="text-xs text-ink-muted">{forPerson.relation}</span>
                </div>
              </div>
            </Surface>
          ) : null}
          <Surface className={cn("h-full gap-3 p-4", !forPerson && !visitFor && "sm:col-span-2")}>
            <ReasonFields
              chiefComplaint={chiefComplaint}
              onChiefComplaintChange={onChiefComplaintChange}
              urgency={urgency}
              onUrgencyChange={onUrgencyChange}
              complaintLabel="Reason for visit"
              complaintLabelClassName="mb-2 block text-sm font-bold text-ink"
            />
          </Surface>
        </div>

        {!isVideo ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
              aria-hidden="true"
            >
              <QrCode className="size-4" strokeWidth={2.2} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-extrabold text-[#064e3b] dark:text-emerald-200">
                Check in with QR when you arrive
              </span>
              <span className="text-[13px] leading-[1.55] text-brand-dark">
                Scan the QR at the clinic desk to confirm your visit and get a queue token.
              </span>
            </span>
          </div>
        ) : null}
      </div>

      <PaymentSummary
        mode={mode}
        payment={payment}
        plan={plan}
        confirmAction={confirmAction}
        visitForName={visitForName}
        showBreakdown={false}
      />
    </div>
  );
}

// ── Staff layout (board DocAppointmentDialogs3, "Confirm") ─────────────────

function ReviewCompact({
  mode,
  doctor,
  serviceLabel,
  serviceCategory,
  patientName,
  dateLabel,
  timeLabel,
  durationMinutes,
  chiefComplaint,
  onChiefComplaintChange,
  urgency,
  onUrgencyChange,
  payment,
  plan,
}: BookingReviewStepViewProps) {
  const rows: Array<{ label: string; value: ReactNode; sub?: ReactNode }> = [
    ...(patientName !== undefined ? [{ label: "Patient", value: patientName }] : []),
    { label: "Service", value: serviceLabel, sub: serviceCategory },
    { label: "Doctor", value: doctor?.name, sub: doctor?.subtitle },
    { label: "Date", value: dateLabel },
    { label: "Time", value: timeLabel },
    ...(durationMinutes > 0 ? [{ label: "Duration", value: `${durationMinutes} min` }] : []),
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm font-medium text-ink-muted">Review your appointment before confirming</p>
      <dl className="m-0 flex flex-col overflow-hidden rounded-2xl border border-hair bg-[#f8fafc] dark:bg-well/50">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-hair px-3.5 py-[11px] last:border-b-0"
          >
            <dt className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
              {row.label}
            </dt>
            <dd className="m-0 flex min-w-0 flex-col text-right">
              <span className="break-words text-[15px] font-bold text-ink">{row.value}</span>
              {row.sub ? <span className="text-[13px] text-ink-muted">{row.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      {payment ? (
        <PaymentSummary
          mode={mode}
          payment={payment}
          plan={plan}
          className="border border-hair shadow-none"
        />
      ) : plan ? (
        <PlanNotice plan={plan} />
      ) : null}
      <ReasonFields
        chiefComplaint={chiefComplaint}
        onChiefComplaintChange={onChiefComplaintChange}
        urgency={urgency}
        onUrgencyChange={onUrgencyChange}
        complaintLabel="Chief Complaint"
      />
    </div>
  );
}
