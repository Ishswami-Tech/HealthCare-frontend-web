"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus, Receipt, Send, Settings2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  InitialsAvatar,
  Kv,
  ListRow,
  LoadError,
  Note,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { BillingAdminNav, InvoiceStatusPill } from "@/components/billing/clinic-admin/BillingAdminNav";
import { FeeScheduleDialog } from "@/components/billing/clinic-admin/FeeScheduleDialog";
import { downloadCsv, duesAgeing, toCsv } from "@/components/billing/clinic-admin/billing-admin.logic";
import { useBillingOpsSummary, useOverdueInvoices } from "@/hooks/query/useClinicAdminBilling";
import { useClinicInvoices, useClinicPayments } from "@/hooks/query/useBilling";
import { useClinicSettingsSection } from "@/hooks/query/useClinicSettingsSection";
import { readFeeSchedule } from "@/lib/utils/clinic-settings-sections";
import { currentMonthRange } from "@/lib/utils/earnings-range";
import { formatRupees } from "@/lib/utils/currency";
import { formatDateTimeLabel } from "@/lib/utils/date-time";
import { paymentMethodLabel, invoiceNumberLabel } from "@/components/billing/staff/billing.logic";

// CaBilling (B1): month overview for the clinic admin. Doctors and assistants never reach it
// (route guard + backend @Roles + billing redaction).
export default function CaBillingPage() {
  const range = useMemo(() => currentMonthRange(), []);
  const summary = useBillingOpsSummary(range);
  const overdue = useOverdueInvoices();
  const payments = useClinicPayments({ startDate: range.from, endDate: range.to });
  const invoices = useClinicInvoices();
  const fees = useClinicSettingsSection(readFeeSchedule);
  const [feesOpen, setFeesOpen] = useState(false);

  const collectedPayments = useMemo(
    () => (payments.data ?? []).filter((payment) => String(payment.status).toUpperCase() === "COMPLETED"),
    [payments.data],
  );
  const byMode = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of collectedPayments) {
      const key = paymentMethodLabel(payment.method);
      totals.set(key, (totals.get(key) ?? 0) + (Number(payment.amount) || 0));
    }
    const sum = [...totals.values()].reduce((a, b) => a + b, 0);
    return { sum, rows: [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([label, amount]) => ({ label, amount, share: sum ? Math.round((amount / sum) * 100) : 0 })) };
  }, [collectedPayments]);
  const ageing = useMemo(() => duesAgeing(overdue.data ?? []), [overdue.data]);

  const s = summary.data;
  const collectionRate = s && s.billed.amount > 0 ? Math.round((s.collected.amount / s.billed.amount) * 1000) / 10 : null;

  const exportCsv = () => {
    const rows = (invoices.data ?? []).map((invoice) => [
      invoiceNumberLabel(invoice),
      invoice.patientName ?? "",
      invoice.createdAt,
      invoice.amount,
      invoice.status,
    ]);
    downloadCsv(`invoices-${range.from}-to-${range.to}.csv`, toCsv(["Invoice", "Patient", "Created", "Amount", "Status"], rows));
  };

  return (
    <TbdPage
      title="Billing overview"
      description="Doctors and assistant doctors never see these amounts. Clinic admin is the only role with full billing access."
      actions={
        <>
          <Button variant="outline" size="md" onClick={exportCsv} disabled={!invoices.data?.length}>
            <Download aria-hidden="true" /> Export CSV
          </Button>
          <Button variant="outline" size="md" onClick={() => setFeesOpen(true)}>
            <Settings2 aria-hidden="true" /> Set service fees
          </Button>
          <Button asChild size="md">
            <Link href="/clinic-admin/billing/new">
              <Plus aria-hidden="true" /> New invoice
            </Link>
          </Button>
        </>
      }
    >
      <BillingAdminNav />

      {summary.error && !s ? (
        <LoadError title="Billing summary could not be loaded" message={summary.error.message} onRetry={() => void summary.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Gross billed" value={s ? formatRupees(s.billed.amount) : "…"} hint={s ? `${s.billed.count} invoices this month` : undefined} />
          <StatTile tone="brand" label="Collected" value={s ? formatRupees(s.collected.amount) : "…"} hint={collectionRate !== null ? `${collectionRate}% collection rate` : undefined} />
          <StatTile tone="amber" label="Pending dues" value={s ? formatRupees(s.outstanding.amount) : "…"} hint={s ? `${s.outstanding.count} invoices unpaid` : undefined} href="/clinic-admin/billing/invoices?status=PENDING" />
          <StatTile tone="rose" label="Overdue" value={s ? formatRupees(s.overdue.amount) : "…"} hint={s ? `${s.overdue.count} past due date` : undefined} href="/clinic-admin/billing/reminders" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Collections by payment mode">
            <SectionTitle title="Collections by payment mode" description={`${range.from} – ${range.to}`} icon={Wallet} />
            {payments.isPending ? (
              <SkeletonRows rows={3} />
            ) : byMode.rows.length === 0 ? (
              <EmptyBlock icon={Wallet} title="No collections yet this month" />
            ) : (
              <div className="flex flex-col gap-3">
                {byMode.rows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-ink">{row.label}</span>
                      <span className="text-ink-soft">
                        {formatRupees(row.amount)} · {row.share}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-well">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${row.share}%` }} />
                    </div>
                  </div>
                ))}
                <Kv label="Total collected" value={formatRupees(byMode.sum)} strong />
              </div>
            )}
          </Surface>

          <Surface as="section" aria-label="Recent payments">
            <SectionTitle
              title="Recent payments"
              icon={Receipt}
              action={
                <Link className="text-[13px] font-bold text-brand" href="/clinic-admin/billing/invoices">
                  All invoices
                </Link>
              }
            />
            {payments.isPending ? (
              <SkeletonRows rows={4} />
            ) : payments.error ? (
              <LoadError title="Payments could not be loaded" message={payments.error.message} onRetry={() => void payments.refetch()} />
            ) : (payments.data ?? []).length === 0 ? (
              <EmptyBlock icon={Receipt} title="No payments this month" />
            ) : (
              (payments.data ?? []).slice(0, 6).map((payment) => (
                <ListRow
                  key={payment.id}
                  left={<InitialsAvatar name={payment.patientName ?? "Patient"} size={36} />}
                  title={payment.patientName ?? "Patient"}
                  description={`${paymentMethodLabel(payment.method)} · ${formatDateTimeLabel(payment.paymentDate ?? payment.createdAt)}`}
                  right={
                    <span className="flex items-center gap-2">
                      <span className="font-extrabold text-ink">{formatRupees(payment.amount)}</span>
                      <InvoiceStatusPill status={payment.status} />
                    </span>
                  }
                  {...(payment.invoiceId ? { href: `/clinic-admin/billing/invoices/${payment.invoiceId}` } : {})}
                />
              ))
            )}
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Dues ageing">
            <SectionTitle title="Dues ageing" icon={Send} />
            {overdue.isPending ? (
              <SkeletonRows rows={3} />
            ) : overdue.error ? (
              <LoadError title="Unpaid invoices could not be loaded" message={overdue.error.message} onRetry={() => void overdue.refetch()} />
            ) : (
              <>
                {ageing.map((bucket) => (
                  <Kv key={bucket.label} label={`${bucket.label} (${bucket.count})`} value={formatRupees(bucket.amount)} />
                ))}
                <Button asChild variant="outline" className="mt-2 w-full" disabled={(overdue.data ?? []).length === 0}>
                  <Link href="/clinic-admin/billing/reminders">
                    <Send aria-hidden="true" /> Send reminders for {(overdue.data ?? []).length} unpaid invoices
                  </Link>
                </Button>
              </>
            )}
          </Surface>

          <Surface as="section" aria-label="Fee schedule">
            <SectionTitle
              title="Fee schedule"
              icon={Settings2}
              action={
                <Button variant="ghost" size="sm" onClick={() => setFeesOpen(true)}>
                  Edit
                </Button>
              }
            />
            {fees.isPending ? (
              <SkeletonRows rows={3} />
            ) : fees.value.length === 0 ? (
              <Note tone="amber">No fees set yet. Add them so new invoices can be raised in one tap.</Note>
            ) : (
              fees.value.map((fee) => <Kv key={fee.code} label={fee.detail ? `${fee.label} · ${fee.detail}` : fee.label} value={formatRupees(fee.amount)} />)
            )}
          </Surface>
          <Note tone="blue">Video visits keep the 5-hour join window. Fees are never shown to the doctor or the assistant doctor.</Note>
        </div>
      </div>

      <FeeScheduleDialog open={feesOpen} onClose={() => setFeesOpen(false)} items={fees.value} onSave={fees.save} saving={fees.isSaving} />
    </TbdPage>
  );
}
