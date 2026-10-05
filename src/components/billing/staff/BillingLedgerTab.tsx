"use client";

import { BarChart3, CreditCard, FileText, RefreshCw, Wallet } from "lucide-react";
import { Divider, EmptyBlock, IconBox, Kpi, Pill, SectionTitle, SummaryLine, Surface, statusLabel } from "@/components/tbd";
import type { ClinicLedgerResponse } from "@/types/billing.types";
import { formatRupees } from "./billing.logic";

const LEDGER_LIMIT = 30;

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-muted">
      <span className={`size-2 rounded-full ${colour}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function PlannedAction({ icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-line px-3.5 py-3">
      <IconBox icon={icon} tone="slate" size={36} />
      <span className="min-w-0 flex-1 text-sm font-bold text-ink">{label}</span>
      <Pill tone="slate">Not available yet</Pill>
    </div>
  );
}

/** Admin ledger: collections, payouts, platform revenue and the latest ledger entries. Props only. */
export function BillingLedgerTab({ ledger }: { ledger?: ClinicLedgerResponse | undefined }) {
  if (!ledger) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={Wallet}
          title="Ledger data is not available yet"
          description="Press Sync Data to try again."
        />
      </Surface>
    );
  }

  const { summary } = ledger;
  const appointments = summary.byRevenueModel?.APPOINTMENT ?? 0;
  const subscriptions = summary.byRevenueModel?.SUBSCRIPTION ?? 0;
  const entries = ledger.payments.slice(0, LEDGER_LIMIT);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi label="Total Collections" value={formatRupees(summary.totalCollections)} icon={Wallet} tone="blue" />
        <Kpi label="Pending Payouts" value={formatRupees(summary.pendingPayouts)} icon={RefreshCw} tone="amber" />
        <Kpi label="Platform Revenue" value={formatRupees(summary.totalPlatformRevenue)} icon={BarChart3} tone="violet" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <Surface as="section">
          <SectionTitle title="Revenue Breakup" />
          <SummaryLine label={<Legend colour="bg-emerald-500" label="Appointments" />} value={formatRupees(appointments)} />
          <SummaryLine label={<Legend colour="bg-blue-500" label="Subscriptions" />} value={formatRupees(subscriptions)} />
          <Divider />
          <SummaryLine
            bold
            label="Total System Revenue"
            value={<span className="text-brand">{formatRupees(appointments + subscriptions)}</span>}
          />
        </Surface>

        <Surface as="section">
          <SectionTitle title="Quick Actions" />
          <PlannedAction icon={FileText} label="Download PDF Statement" />
          <PlannedAction icon={RefreshCw} label="Reconcile Pending Payouts" />
        </Surface>
      </div>

      <Surface flush as="section" aria-labelledby="billing-ledger-entries">
        <div className="border-b border-hair px-5 py-4">
          <h2 id="billing-ledger-entries" className="m-0 text-base font-bold text-ink">
            Recent Payment Ledger Entries
          </h2>
        </div>
        {entries.length === 0 ? (
          <EmptyBlock icon={CreditCard} title="No recent ledger entries found" />
        ) : (
          <ul className="m-0 max-h-[500px] list-none overflow-auto p-0">
            {entries.map((entry) => {
              const isAppointment = entry.revenueModel === "APPOINTMENT";
              return (
                <li key={entry.paymentId} className="flex items-center gap-3.5 border-b border-hair px-5 py-3.5 last:border-b-0">
                  <IconBox icon={isAppointment ? BarChart3 : CreditCard} tone={isAppointment ? "mint" : "blue"} size={36} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold text-ink">{entry.paymentId}</span>
                    <span className="truncate text-xs text-ink-muted">
                      {statusLabel(entry.revenueModel)} · {entry.provider || "Unknown"} ·{" "}
                      {entry.appointmentType ? statusLabel(entry.appointmentType) : "Offline"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-ink">{formatRupees(entry.amount)}</span>
                    <Pill tone={entry.payoutState === "PAYMENT_COMPLETED" ? "green" : "amber"}>
                      {statusLabel(entry.payoutState)}
                    </Pill>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Surface>
    </div>
  );
}
