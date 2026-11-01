"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, ListRow, Pill } from "@/components/tbd";
import { RecordInvoicePaymentDialog } from "@/components/billing/RecordInvoicePaymentDialog";
import { useInPersonDeskFeesDue } from "@/hooks/query/useInPerson";
import type { CollectionMethod } from "@/types/billing.types";
import type { DeskFeeDue } from "@/types/in-person.types";
import { RECEPTION_ROUTES, todayKey } from "./useReceptionDesk";

/**
 * Desk fees at reception: the unpaid consultation bill of a visit of the day (e.g. the desk fee of
 * a plan-less walk-in, amount from clinic settings). Collecting is a record-only payment at the
 * counter (POST /billing/invoices/:id/record-payment through RecordInvoicePaymentDialog). It never
 * blocks the consultation: the fee only stays visible on the desk until it is collected.
 */

const QUICK_METHODS: Array<{ value: CollectionMethod; label: string; icon: typeof Banknote }> = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CARD", label: "Card", icon: CreditCard },
];

/** "₹300", "₹250.5" (rupees, en-IN grouping). */
export function deskFeeAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Today's unpaid desk fees of the reception location, keyed by appointment id. */
export function useDeskFeesToday(enabled = true) {
  const query = useInPersonDeskFeesDue(todayKey(), enabled);
  const fees = useMemo(() => query.data?.fees ?? [], [query.data]);
  const byAppointment = useMemo(() => new Map(fees.map((fee) => [fee.appointmentId, fee])), [fees]);
  return { ...query, fees, byAppointment, totalDue: query.data?.totalDue ?? 0 };
}

/** The "Fee due ₹X" tag of a desk row. */
export function DeskFeeDuePill({ fee }: { fee: DeskFeeDue | undefined }) {
  if (!fee) return null;
  return <Pill tone="amber">Fee due {deskFeeAmount(fee.balance)}</Pill>;
}

/** Cash / UPI / Card buttons that open the record-payment dialog with that method preselected. */
export function DeskFeeQuickCollect({
  clinicId,
  fee,
  onRecorded,
  size = "md",
}: {
  clinicId: string;
  fee: DeskFeeDue;
  onRecorded?: () => void;
  size?: "sm" | "md";
}) {
  const [method, setMethod] = useState<CollectionMethod | null>(null);
  return (
    <>
      <span className="flex flex-wrap items-center gap-2" role="group" aria-label={`Collect ${deskFeeAmount(fee.balance)} from ${fee.patientName}`}>
        {QUICK_METHODS.map(({ value, label, icon: Icon }) => (
          <Button key={value} size={size} variant={value === "CASH" ? "default" : "outline"} onClick={() => setMethod(value)}>
            <Icon aria-hidden="true" /> {label}
          </Button>
        ))}
      </span>
      {method ? (
        <RecordInvoicePaymentDialog
          clinicId={clinicId}
          invoiceId={fee.invoiceId}
          invoiceNumber={fee.invoiceNumber}
          balance={fee.balance}
          initialMethod={method}
          open
          onOpenChange={(open) => {
            if (!open) setMethod(null);
          }}
          onRecorded={() => {
            setMethod(null);
            onRecorded?.();
          }}
        />
      ) : null}
    </>
  );
}

/** The inline "Collect ₹X desk fee" prompt (check-in / walk-in success, patient collect page). */
export function DeskFeePrompt({ clinicId, fee, onRecorded }: { clinicId: string; fee: DeskFeeDue; onRecorded?: () => void }) {
  const partial = fee.paidAmount > 0;
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 dark:border-amber-800 dark:bg-amber-950/30"
      role="region"
      aria-label="Desk fee to collect"
    >
      <p className="m-0 flex items-start gap-2 text-sm font-bold text-[#92400e] dark:text-amber-200">
        <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Collect {deskFeeAmount(fee.balance)} desk fee
          {partial ? ` (${deskFeeAmount(fee.paidAmount)} of ${deskFeeAmount(fee.totalAmount)} already paid)` : ""}
          {fee.invoiceNumber ? ` · bill ${fee.invoiceNumber}` : ""}
        </span>
      </p>
      <p className="m-0 text-[13px] text-[#92400e] dark:text-amber-200">
        No active plan, so the clinic charges a desk fee. The consultation goes ahead either way; the fee stays on the
        desk list until it is collected.
      </p>
      <DeskFeeQuickCollect clinicId={clinicId} fee={fee} onRecorded={onRecorded} />
    </div>
  );
}

/** Every unpaid desk fee of today at this location (Collect payment page). */
export function DeskFeesDueRows({ clinicId, fees }: { clinicId: string; fees: DeskFeeDue[] }) {
  return (
    <div>
      {fees.map((fee) => (
        <ListRow
          key={fee.invoiceId}
          left={<InitialsAvatar name={fee.patientName} size={36} />}
          title={
            <Link href={RECEPTION_ROUTES.collect(fee.patientUserId, fee.appointmentId)} className="hover:text-brand-dark hover:underline">
              {fee.patientName}
            </Link>
          }
          description={[fee.doctorName, fee.time, fee.invoiceNumber].filter(Boolean).join(" · ")}
          right={
            <span className="flex flex-wrap items-center justify-end gap-2">
              <DeskFeeDuePill fee={fee} />
              <DeskFeeQuickCollect clinicId={clinicId} fee={fee} size="sm" />
            </span>
          }
        />
      ))}
    </div>
  );
}
