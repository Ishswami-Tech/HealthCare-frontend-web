"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useClinicInvoices, useClinicPayments, useBillingAnalytics } from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import type { BillingAnalytics, Invoice, Payment } from "@/types/billing.types";

const FinanceBillingDashboardContent = dynamic(
  () => import("./_components/FinanceBillingDashboardContent").then(
    (module) => module.FinanceBillingDashboardContent
  ),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

const FINANCE_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function FinanceBillingDashboard() {
  const { push } = useRouter();
  const clinicId = useCurrentClinicId();
  const currentTimestamp = useCurrentTimestamp();

  useWebSocketQuerySync();

  const { data: invoicesRaw = [], isPending: invoicesPending } = useClinicInvoices(!!clinicId);
  const { data: paymentsRaw = [], isPending: paymentsPending } = useClinicPayments(undefined, !!clinicId);
  const { data: analytics } = useBillingAnalytics(clinicId);

  const invoiceList: Invoice[] = useMemo(
    () => (Array.isArray(invoicesRaw) ? (invoicesRaw as Invoice[]) : []),
    [invoicesRaw]
  );
  const paymentList: Payment[] = useMemo(
    () => (Array.isArray(paymentsRaw) ? (paymentsRaw as Payment[]) : []),
    [paymentsRaw]
  );
  const analyticsData = analytics as BillingAnalytics | undefined;
  const currentTimestampMs = currentTimestamp ?? null;
  const currentMonth = useMemo(
    () => (currentTimestampMs ? new Date(currentTimestampMs).getMonth() : null),
    [currentTimestampMs]
  );
  const currentYear = useMemo(
    () => (currentTimestampMs ? new Date(currentTimestampMs).getFullYear() : null),
    [currentTimestampMs]
  );

  const stats = useMemo(() => {
    const totalRevenue = paymentList
      .filter((payment) => payment.status === "COMPLETED")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const pendingInvoices = invoiceList.filter((invoice) => invoice.status === "OPEN").length;
    const paidInvoices = invoiceList.filter((invoice) => invoice.status === "PAID").length;

    const overdueInvoices = invoiceList.filter((invoice) => {
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      return (
        (invoice.status === "OPEN" || invoice.status === "OVERDUE") &&
        dueDate !== null &&
        !!currentTimestampMs &&
        dueDate.getTime() < currentTimestampMs
      );
    }).length;

    const monthlyRevenue = paymentList
      .filter((payment) => {
        const created = payment.createdAt ? new Date(payment.createdAt) : null;
        return (
          payment.status === "COMPLETED" &&
          created !== null &&
          currentMonth !== null &&
          currentYear !== null &&
          created.getMonth() === currentMonth &&
          created.getFullYear() === currentYear
        );
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    return { totalRevenue, pendingInvoices, paidInvoices, overdueInvoices, monthlyRevenue };
  }, [currentMonth, currentTimestampMs, currentYear, invoiceList, paymentList]);

  const isLoading =
    invoicesPending && paymentsPending && invoiceList.length === 0 && paymentList.length === 0;

  return isLoading ? (
    <DashboardPageSkeleton />
  ) : (
    <FinanceBillingDashboardContent
      push={push}
      isLoading={false}
      invoices={invoiceList}
      payments={paymentList}
      analytics={analyticsData}
      currentTimestampMs={currentTimestampMs}
      currentMonth={currentMonth}
      currentYear={currentYear}
      totalRevenue={stats.totalRevenue}
      pendingInvoices={stats.pendingInvoices}
      paidInvoices={stats.paidInvoices}
      overdueInvoices={stats.overdueInvoices}
      monthlyRevenue={stats.monthlyRevenue}
      formatCurrency={(amount) => FINANCE_CURRENCY_FORMATTER.format(amount)}
    />
  );
}
