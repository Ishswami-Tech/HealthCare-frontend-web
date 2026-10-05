"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Eye, Pill as PillIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/loading";
import { CellTitle, EmptyBlock, GridHead, GridRow, Pill, SearchBox, Surface } from "@/components/tbd";
import {
  DESK_STATE_LABEL,
  DESK_STATE_TONE,
  canDispense,
  isUrgent,
  itemsLabel,
  moneyLine,
  sentTimeLabel,
  type DeskQueueItem,
} from "./pharmacist-dashboard.logic";

interface PharmacistDashboardQueueCardProps {
  /** Rows to show (already filtered by the search box). */
  queueItems: DeskQueueItem[];
  /** Size of the whole queue, before the search filter. */
  totalCount: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  /** Link to the dispensing screen for a prescription. */
  prescriptionHref: (prescriptionId: string) => string;
  /** Link to the full prescriptions list. */
  allPrescriptionsHref: string;
  /** Opens the "Record cash payment" dialog so the entry becomes dispensable. */
  onRecordCashPayment?: (item: DeskQueueItem) => void;
  isRecordingCashPayment?: boolean;
  /** Opens the pharmacy invoice PDF for a paid queue entry. */
  onPrintInvoice?: (invoiceId: string) => void;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const COLUMNS = "1.2fr 0.8fr 156px 206px";
const PAGE_SIZE = 5;

/** The medicine-desk queue: every prescription with its state and the one right action. */
export function PharmacistDashboardQueueCard({
  queueItems,
  totalCount,
  searchTerm,
  onSearchTermChange,
  prescriptionHref,
  allPrescriptionsHref,
  onRecordCashPayment,
  isRecordingCashPayment = false,
  onPrintInvoice,
  loading = false,
  errorMessage = null,
  onRetry,
}: PharmacistDashboardQueueCardProps) {
  const [showAll, setShowAll] = useState(false);
  const searching = searchTerm.trim().length > 0;
  const rows = showAll || searching ? queueItems : queueItems.slice(0, PAGE_SIZE);
  const hidden = queueItems.length - rows.length;

  return (
    <Surface flush as="section" aria-labelledby="pharmacy-queue-title">
      <div className="flex flex-col gap-3 border-b border-hair px-5 py-3.5 sm:flex-row sm:items-center">
        <h2 id="pharmacy-queue-title" className="m-0 flex-1 whitespace-nowrap text-base font-bold text-ink">
          Prescription Queue
        </h2>
        <SearchBox
          value={searchTerm}
          onChange={onSearchTermChange}
          placeholder="Search patient..."
          ariaLabel="Search patient in the queue"
          className="sm:w-[260px]"
        />
      </div>

      {loading ? (
        <div className="p-5" aria-busy="true">
          <SkeletonList items={4} />
        </div>
      ) : errorMessage ? (
        <EmptyBlock
          icon={CircleAlert}
          title="The queue could not be loaded"
          description={errorMessage}
          action={
            onRetry ? (
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            ) : undefined
          }
        />
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={PillIcon}
          title={searching ? "No patient matches your search" : "No pending prescriptions in the queue"}
          description={
            searching
              ? "Check the spelling or clear the search to see the whole queue."
              : "Prescriptions sent by doctors show here until they are dispensed."
          }
        />
      ) : (
        <div role="table" aria-label="Prescription queue">
          <GridHead columns={COLUMNS} labels={["Patient", "Medicines", "Status", "Actions"]} />
          {rows.map((item) => {
            const href = prescriptionHref(item.id);
            const sentTime = sentTimeLabel(item.sentAt);
            return (
              <GridRow key={item.id} columns={COLUMNS} className="lg:min-h-16">
                <CellTitle
                  title={item.patientName}
                  description={[item.reference, sentTime].filter(Boolean).join(" · ")}
                />
                <CellTitle title={itemsLabel(item.itemsCount)} description={moneyLine(item)} />
                <div className="flex flex-row flex-wrap items-start gap-1 lg:flex-col">
                  <Pill tone={DESK_STATE_TONE[item.state]}>{DESK_STATE_LABEL[item.state]}</Pill>
                  {isUrgent(item) ? <Pill tone="rose">Urgent</Pill> : null}
                </div>
                <div className="flex items-center gap-2">
                  {canDispense(item) ? (
                    <Button asChild>
                      <Link
                        href={href}
                        title={item.state === "partially_dispensed" ? "Finish dispensing" : "Dispense prescription"}
                      >
                        <Check aria-hidden="true" />
                        Dispense
                      </Link>
                    </Button>
                  ) : null}
                  {item.state === "awaiting_payment" && onRecordCashPayment ? (
                    <Button
                      variant="action"
                      disabled={isRecordingCashPayment}
                      onClick={() => onRecordCashPayment(item)}
                      title="Record cash payment received at the counter"
                    >
                      Mark paid — cash
                    </Button>
                  ) : null}
                  {canDispense(item) && item.invoiceId && onPrintInvoice ? (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onPrintInvoice(item.invoiceId as string)}
                      aria-label={`Print pharmacy invoice for ${item.patientName}`}
                      title="Print pharmacy invoice"
                    >
                      <Printer aria-hidden="true" />
                    </Button>
                  ) : null}
                  <Button asChild size="icon" variant="outline">
                    <Link href={href} aria-label={`View prescription for ${item.patientName}`} title="View prescription">
                      <Eye aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </GridRow>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
        <span>
          {loading || errorMessage
            ? "Medicine desk queue"
            : searching
              ? `${queueItems.length} of ${totalCount} ${totalCount === 1 ? "prescription" : "prescriptions"} match`
              : `${totalCount} ${totalCount === 1 ? "prescription" : "prescriptions"} in the queue`}
        </span>
        <span className="flex items-center gap-4">
          {hidden > 0 ? (
            <button
              type="button"
              className="text-[13px] font-bold text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
              onClick={() => setShowAll(true)}
            >
              Show {hidden} more
            </button>
          ) : null}
          <Link
            href={allPrescriptionsHref}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-dark"
          >
            See all
            <ArrowRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </span>
      </div>
    </Surface>
  );
}
