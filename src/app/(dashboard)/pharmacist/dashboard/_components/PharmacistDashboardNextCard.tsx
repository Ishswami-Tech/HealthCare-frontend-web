import Link from "next/link";
import { Check, ChevronRight, CircleCheck, IndianRupee, Pill as PillIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/loading";
import { EmptyBlock, InitialsAvatar, Pill, Surface } from "@/components/tbd";
import {
  DESK_STATE_LABEL,
  DESK_STATE_TONE,
  canDispense,
  formatRupees,
  isUrgent,
  sentTimeLabel,
  type DeskQueueItem,
  type DeskQueueLine,
} from "./pharmacist-dashboard.logic";

interface PharmacistDashboardNextCardProps {
  /** The prescription to pick up next; null when the queue is empty. */
  item: DeskQueueItem | null;
  loading?: boolean;
  /** Link to the dispensing screen for a prescription. */
  prescriptionHref: (prescriptionId: string) => string;
  onRecordCashPayment?: (item: DeskQueueItem) => void;
  isRecordingCashPayment?: boolean;
  onPrintInvoice?: (invoiceId: string) => void;
}

const SHELL = "border border-[#a7f3d0] dark:border-emerald-800";

function quantityLabel(line: DeskQueueLine): string {
  if (line.quantity <= 0) return "";
  if (line.remaining > 0 && line.remaining < line.quantity) return `${line.remaining} of ${line.quantity} left`;
  return `Qty ${line.quantity}`;
}

function StockLabel({ line }: { line: DeskQueueLine }) {
  if (line.stock === null) return null;
  const needed = line.remaining > 0 ? line.remaining : line.quantity;
  if (line.stock <= 0) {
    return <span className="text-xs font-semibold text-[#e11d48] dark:text-rose-300">Out of stock</span>;
  }
  if (line.stock < needed) {
    return <span className="text-xs font-semibold text-[#b45309] dark:text-amber-300">Only {line.stock} in stock</span>;
  }
  return <span className="text-xs font-semibold text-brand">{line.stock} in stock</span>;
}

/** Feature card: the next prescription to hand over, with its medicines and one main button. */
export function PharmacistDashboardNextCard({
  item,
  loading = false,
  prescriptionHref,
  onRecordCashPayment,
  isRecordingCashPayment = false,
  onPrintInvoice,
}: PharmacistDashboardNextCardProps) {
  const heading = (
    <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#065f46] dark:text-emerald-300">
      <PillIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
      Next prescription
    </span>
  );
  const strip =
    "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#d1fae5] bg-[#ecfdf5] px-5 py-3 dark:border-emerald-900 dark:bg-emerald-950/30";

  if (loading) {
    return (
      <Surface flush as="section" className={SHELL} aria-busy="true" aria-label="Next prescription">
        <div className={strip}>{heading}</div>
        <div className="p-5">
          <SkeletonList items={2} />
        </div>
      </Surface>
    );
  }

  if (!item) {
    return (
      <Surface flush as="section" className={SHELL} aria-label="Next prescription">
        <div className={strip}>{heading}</div>
        <EmptyBlock
          icon={PillIcon}
          title="No prescription is waiting"
          description="New prescriptions show here as soon as a doctor sends them to the pharmacy."
          className="py-8"
        />
      </Surface>
    );
  }

  const ready = canDispense(item);
  const awaitingPayment = item.state === "awaiting_payment";
  const sentTime = sentTimeLabel(item.sentAt);
  const source = [item.doctorName ? `From ${item.doctorName}` : "", sentTime].filter(Boolean).join(" · ");
  const details = [item.diagnosis, item.locationName].filter(Boolean).join(" · ");
  const href = prescriptionHref(item.id);

  return (
    <Surface flush as="section" className={SHELL} aria-label="Next prescription">
      <div className={strip}>
        {heading}
        {source ? <span className="text-xs font-semibold text-ink-soft">{source}</span> : null}
      </div>

      <div className="flex flex-col gap-3.5 px-5 py-[18px]">
        <div className="flex flex-wrap items-center gap-3.5">
          <InitialsAvatar name={item.patientName} size={52} />
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={DESK_STATE_TONE[item.state]} dot>
                {DESK_STATE_LABEL[item.state]}
              </Pill>
              {isUrgent(item) ? <Pill tone="rose">Urgent</Pill> : null}
              {item.reference ? <Pill tone="slate">{item.reference}</Pill> : null}
            </div>
            <h2 className="m-0 truncate text-xl font-extrabold leading-[1.15] tracking-[-0.3px] text-ink">
              {item.patientName}
            </h2>
            {details ? <p className="m-0 text-[13px] text-ink-soft">{details}</p> : null}
          </div>

          {ready ? (
            <Button asChild size="md" className="w-full sm:w-auto">
              <Link href={href}>
                <CircleCheck aria-hidden="true" />
                {item.state === "partially_dispensed" ? "Finish dispensing" : "Dispense"}
              </Link>
            </Button>
          ) : awaitingPayment && onRecordCashPayment ? (
            <Button
              size="md"
              variant="action"
              className="w-full sm:w-auto"
              disabled={isRecordingCashPayment}
              onClick={() => onRecordCashPayment(item)}
            >
              <IndianRupee aria-hidden="true" />
              Mark paid — cash
            </Button>
          ) : null}
        </div>

        {item.lines.length > 0 ? (
          <ul className="m-0 flex list-none flex-col rounded-[14px] border border-line bg-[#fbfdfc] p-0 dark:bg-white/[0.03]">
            {item.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-3.5 border-b border-hair px-3.5 py-2.5 last:border-b-0"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
                  aria-hidden="true"
                >
                  <PillIcon className="size-4" strokeWidth={2.2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="break-words text-sm font-bold text-ink">{line.name}</span>
                  {line.directions ? (
                    <span className="break-words text-xs text-ink-muted">{line.directions}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-px whitespace-nowrap">
                  <span className="text-sm font-bold text-ink">{quantityLabel(line)}</span>
                  <StockLabel line={line} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
          {ready && item.paidAmount !== null && item.paidAmount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#065f46] dark:text-emerald-300">
              <Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
              Paid {formatRupees(item.paidAmount)}
              {item.paidInCash ? " in cash" : ""}
            </span>
          ) : null}
          {awaitingPayment && item.pendingAmount !== null && item.pendingAmount > 0 ? (
            <span className="text-[13px] font-bold text-[#92400e] dark:text-amber-300">
              {formatRupees(item.pendingAmount)} to collect before dispensing
            </span>
          ) : null}
          <span className="flex-1" />
          {ready && item.invoiceId && onPrintInvoice ? (
            <Button variant="outline" onClick={() => onPrintInvoice(item.invoiceId as string)}>
              <Printer aria-hidden="true" />
              Print invoice
            </Button>
          ) : null}
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-dark"
          >
            View prescription
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Surface>
  );
}
