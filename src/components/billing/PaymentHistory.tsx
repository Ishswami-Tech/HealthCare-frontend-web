"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  CreditCard,
  Home,
  Hospital,
  Pill as PillIcon,
  Receipt,
  RotateCcw,
  Star,
  Stethoscope,
  Video,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, Pill, Surface, statusLabel, type IconTone, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { Payment } from "@/types/billing.types";
import { BillingPager, useBillingPaging } from "./staff/BillingPager";
import {
  formatRupees,
  paymentDateValue,
  paymentMethodLabel,
  paymentReference,
  paymentStatusTone,
  sortPaymentsNewestFirst,
} from "./staff/billing.logic";

/**
 * Fields the payments API sends that the shared `Payment` type does not list
 * (`GET /billing/payments/user/:userId` returns the payment with its invoice and appointment).
 */
interface PaymentExtras {
  description?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  appointmentId?: string | null;
  appointment?: { type?: string | null } | null;
  invoice?: {
    id?: string | null;
    invoiceNumber?: string | null;
    billType?: string | null;
    description?: string | null;
  } | null;
}

export type PaymentRecord = Payment & PaymentExtras;

/** What a payment was for. Decides the icon, the title and the spend category. */
export type PaymentKind = "video" | "clinic" | "home" | "consultation" | "pharmacy" | "plan" | "other";

const KIND_LOOK: Record<PaymentKind, { title: string; icon: TbdIcon; tone: IconTone }> = {
  video: { title: "Video consult", icon: Video, tone: "video" },
  clinic: { title: "In-clinic visit", icon: Hospital, tone: "rose" },
  home: { title: "Home visit", icon: Home, tone: "orange" },
  consultation: { title: "Consultation", icon: Stethoscope, tone: "blue" },
  pharmacy: { title: "Pharmacy order", icon: PillIcon, tone: "mint" },
  plan: { title: "Plan payment", icon: Star, tone: "amber" },
  other: { title: "Payment", icon: Receipt, tone: "slate" },
};

function upper(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export function paymentKind(payment: Payment): PaymentKind {
  const record = payment as PaymentRecord;
  const appointmentType = upper(record.appointment?.type);
  if (appointmentType === "VIDEO_CALL") return "video";
  if (appointmentType === "IN_PERSON") return "clinic";
  if (appointmentType === "HOME_VISIT") return "home";

  const billType = upper(record.invoice?.billType);
  const paymentFor = upper(record.metadata?.["paymentFor"]);
  if (billType === "PHARMACY" || paymentFor.includes("PRESCRIPTION")) return "pharmacy";
  if (billType === "CONSULTATION" || paymentFor.includes("CONSULTATION")) return "consultation";
  if (billType === "SUBSCRIPTION" || record.subscriptionId) return "plan";
  if (billType === "APPOINTMENT" || record.appointmentId) return "consultation";
  return "other";
}

/** Money came back to the patient (a refunded payment). */
export function isRefundedPayment(payment: Payment): boolean {
  return upper(payment.status) === "REFUNDED";
}

/** Money was received (a completed payment). */
export function isPaidPayment(payment: Payment): boolean {
  return upper(payment.status) === "COMPLETED";
}

/** The invoice a payment belongs to, when there is one. */
export function paymentInvoiceId(payment: Payment): string | undefined {
  const record = payment as PaymentRecord;
  return record.invoiceId || record.invoice?.id || undefined;
}

/** Icon, title and second line for one payment. */
export function describePayment(payment: Payment): {
  kind: PaymentKind;
  title: string;
  detail: string;
  icon: TbdIcon;
  tone: IconTone;
} {
  const record = payment as PaymentRecord;
  const kind = paymentKind(payment);
  const look = KIND_LOOK[kind];
  const base = kind === "other" ? record.description?.trim() || look.title : look.title;
  const refunded = isRefundedPayment(payment);
  return {
    kind,
    title: refunded ? `Refund · ${base}` : base,
    detail: record.invoice?.invoiceNumber || paymentReference(payment),
    icon: refunded ? RotateCcw : look.icon,
    tone: refunded ? "mint" : look.tone,
  };
}

/** Rupees that moved: "−₹570" for a payment, "+₹300" for a refund, plain for the rest. */
export function paymentMoney(payment: Payment): { text: string; className: string } {
  const record = payment as PaymentRecord;
  if (isRefundedPayment(payment)) {
    const back = Number(record.refundAmount ?? 0) > 0 ? Number(record.refundAmount) : payment.amount;
    return { text: `+${formatRupees(back)}`, className: "text-brand" };
  }
  if (isPaidPayment(payment)) return { text: `−${formatRupees(payment.amount)}`, className: "text-ink" };
  return { text: formatRupees(payment.amount), className: "text-ink-muted" };
}

/** Status word a patient reads: "Paid" instead of "Completed". */
export function paymentStatusText(status: string | null | undefined): string {
  const key = upper(status);
  if (key === "COMPLETED") return "Paid";
  if (key === "REFUNDED") return "Refund";
  return statusLabel(key || "PENDING");
}

/** "28 Sept", with the year only when it is not this year. */
export function paymentDayLabel(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return "–";
  const sameYear =
    formatDateInIST(value, { year: "numeric" }) === formatDateInIST(now, { year: "numeric" });
  return (
    formatDateInIST(value, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }) ||
    "–"
  );
}

/** "UPI", "To UPI" for a refund, or a dash when the method is not known. */
export function paymentMethodText(payment: Payment): string {
  const label = paymentMethodLabel(payment.method);
  if (label === "-") return "–";
  return isRefundedPayment(payment) ? `To ${label}` : label;
}

interface PaymentHistoryProps {
  payments: Payment[];
  /** Kept for callers that pass it; the list itself has no refresh control. */
  onRefetch?: (() => void) | undefined;
  /** Hides the three totals above the list. */
  compact?: boolean;
  /** Card heading. Pass `null` for a list without one. */
  title?: ReactNode;
  /** Shown at the right of the title ("See all"). */
  action?: ReactNode;
  /** Show only the first rows (newest first) and no paging. */
  limit?: number;
  /** Adds the Status column. */
  showStatus?: boolean;
  loading?: boolean;
  /** The list could not be loaded (the page shows the reason above). */
  failed?: boolean;
  /** When given, a payment with an invoice becomes a link to that invoice. */
  invoiceHref?: ((invoiceId: string) => string) | undefined;
  /** Changes when the filters change, so the pager goes back to page 1. */
  resetKey?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const HEAD = "text-xs font-bold uppercase tracking-[0.4px] text-ink-muted";

function Total({ label, value, last = false }: { label: string; value: string | number; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 px-[18px] py-2.5 sm:py-0",
        !last && "border-b border-line sm:border-r sm:border-b-0",
      )}
    >
      <dt className="text-xs font-bold text-ink-muted">{label}</dt>
      <dd className="m-0 text-xl font-extrabold text-ink">{value}</dd>
    </div>
  );
}

/**
 * List of payments in the shared look: what it was for, date, method, status, amount.
 * Props only — used on the patient billing screens and on the patient branch of `/billing`.
 */
export function PaymentHistory({
  payments,
  compact = false,
  title = "Recent Transactions",
  action,
  limit,
  showStatus = true,
  loading = false,
  failed = false,
  invoiceHref,
  resetKey = "",
  emptyTitle = "No payment records found",
  emptyDescription = "Your payments will show here once they are made.",
  className,
}: PaymentHistoryProps) {
  const sorted = useMemo(() => sortPaymentsNewestFirst(payments), [payments]);
  const limited = useMemo(() => (limit ? sorted.slice(0, limit) : sorted), [sorted, limit]);
  const paging = useBillingPaging(limited, resetKey);
  const rows = limit ? limited : paging.pageRows;
  const completed = sorted.filter(isPaidPayment);
  const totalCompleted = completed.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const blank = loading || failed;
  const columns = showStatus
    ? "minmax(0,2.4fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) 120px 16px"
    : "minmax(0,2.4fr) minmax(0,1fr) minmax(0,1.2fr) 120px 16px";
  const rowClass = "flex items-center gap-3.5 py-[11px] text-ink @2xl:grid @2xl:gap-4";

  return (
    <Surface as="section" className={cn("@container gap-4 p-[22px]", className)} aria-label="Payments">
      {title || action ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}

      {compact ? null : (
        <dl className="m-0 flex flex-col rounded-[14px] border border-hair bg-[#f8fafc] py-1 sm:flex-row sm:py-3.5 dark:bg-white/5">
          <Total label="Total Payments" value={blank ? "–" : sorted.length} />
          <Total label="Total Paid" value={blank ? "–" : formatRupees(totalCompleted)} />
          <Total label="Paid Count" value={blank ? "–" : completed.length} last />
        </dl>
      )}

      <div className="flex flex-col" aria-busy={loading}>
        <div
          aria-hidden="true"
          className="hidden items-center gap-4 border-b border-line pb-2.5 @2xl:grid"
          style={{ gridTemplateColumns: columns }}
        >
          <span className={HEAD}>Transaction</span>
          <span className={HEAD}>Date</span>
          <span className={HEAD}>Method</span>
          {showStatus ? <span className={HEAD}>Status</span> : null}
          <span className={cn(HEAD, "text-right")}>Amount</span>
          <span />
        </div>

        {loading ? (
          <div aria-hidden="true">
            {Array.from({ length: limit ? Math.min(limit, 5) : 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(rowClass, "border-b border-hair last:border-b-0")}
                style={{ gridTemplateColumns: columns }}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Skeleton className="size-[42px] shrink-0 rounded-[13px]" />
                  <Skeleton className="h-3.5 w-36 rounded" />
                </span>
                <Skeleton className="hidden h-3.5 w-16 rounded @2xl:block" />
                <Skeleton className="hidden h-3.5 w-14 rounded @2xl:block" />
                {showStatus ? <Skeleton className="hidden h-[22px] w-14 rounded-lg @2xl:block" /> : null}
                <Skeleton className="h-3.5 w-14 justify-self-end rounded" />
                <span className="hidden @2xl:block" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          failed ? (
            <EmptyBlock
              icon={AlertCircle}
              tone="rose"
              title="Payments could not be loaded"
              description="Please try again in a moment."
            />
          ) : (
            <EmptyBlock icon={CreditCard} title={emptyTitle} description={emptyDescription} />
          )
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {rows.map((payment) => {
              const about = describePayment(payment);
              const money = paymentMoney(payment);
              const invoiceId = paymentInvoiceId(payment);
              const href = invoiceHref && invoiceId ? invoiceHref(invoiceId) : undefined;
              const day = paymentDayLabel(paymentDateValue(payment));
              const method = paymentMethodText(payment);
              const status = (
                <Pill tone={paymentStatusTone(payment.status)}>{paymentStatusText(payment.status)}</Pill>
              );
              const body = (
                <>
                  <span className="flex min-w-0 flex-1 items-center gap-3.5">
                    <IconBox icon={about.icon} tone={about.tone} size={42} className="!rounded-[13px]" />
                    <span className="flex min-w-0 flex-col gap-px">
                      <span className="truncate text-sm font-bold">{about.title}</span>
                      <span className="truncate text-xs text-ink-muted">
                        <span className="@2xl:hidden">{[day, method].filter((part) => part !== "–").join(" · ")} · </span>
                        {about.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden text-[13px] text-ink-soft @2xl:block">{day}</span>
                  <span className="hidden truncate text-[13px] text-ink-soft @2xl:block">{method}</span>
                  {showStatus ? <span className="hidden @2xl:flex">{status}</span> : null}
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={cn("text-sm font-extrabold", money.className)}>{money.text}</span>
                    {showStatus ? <span className="@2xl:hidden">{status}</span> : null}
                  </span>
                  <span className="hidden @2xl:block">
                    {href ? <ChevronRight className="size-4 text-ink-muted" strokeWidth={2.2} aria-hidden="true" /> : null}
                  </span>
                </>
              );
              return (
                <li key={payment.id} className="border-b border-hair last:border-b-0">
                  {href ? (
                    <Link
                      href={href}
                      className={cn(
                        rowClass,
                        "rounded-[10px] hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                      )}
                      style={{ gridTemplateColumns: columns }}
                      aria-label={`${about.title}, ${day}, ${money.text}. Open invoice`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={rowClass} style={{ gridTemplateColumns: columns }}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {blank || limit || paging.total <= 10 ? null : (
        <div className="-mx-[22px] -mb-[22px]">
          <BillingPager paging={paging} id="payment-history" />
        </div>
      )}
    </Surface>
  );
}
