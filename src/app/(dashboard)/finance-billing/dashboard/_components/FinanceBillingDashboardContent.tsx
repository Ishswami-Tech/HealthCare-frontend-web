"use client";

import { ArrowRight, BarChart3, CheckCircle, Clock, CreditCard, Download, FileText, Receipt, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { formatDateInIST } from "@/lib/utils/date-time";
import { buildGatewayOrderId } from "@/lib/utils/gateway-order-id";
import { type Invoice, type Payment, type BillingAnalytics } from "@/types/billing.types";

interface FinanceBillingDashboardContentProps {
  push: (href: string) => void;
  isLoading: boolean;
  invoices: Invoice[];
  payments: Payment[];
  analytics: BillingAnalytics | undefined;
  currentTimestampMs: number | null;
  currentMonth: number | null;
  currentYear: number | null;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  formatCurrency: (amount: number) => string;
}

export function FinanceBillingDashboardContent({
  push,
  isLoading,
  invoices,
  payments,
  analytics,
  currentTimestampMs,
  currentMonth,
  currentYear,
  totalRevenue,
  pendingInvoices,
  paidInvoices,
  overdueInvoices,
  monthlyRevenue,
  formatCurrency,
}: FinanceBillingDashboardContentProps) {
  const recentInvoices = invoices
    .toSorted((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 6);
  const recentPayments = payments
    .toSorted((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Clock className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyValue = analytics?.monthlyRevenue ?? monthlyRevenue;
  const pendingValue = analytics?.pendingInvoices ?? pendingInvoices;

  return (
    <div className="gap-y-4 p-4 sm:gap-y-5 sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finance & Billing</h1>
          <p className="text-muted-foreground">Revenue overview and financial management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => push("/billing?tab=invoices")}>
            <FileText className="size-4" />
            Invoices
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => push("/billing?tab=analytics")}>
            <BarChart3 className="size-4" />
            Analytics
          </Button>
          <Button className="gap-2" onClick={() => push("/billing?tab=reports")}>
            <TrendingUp className="size-4" />
            Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <DashboardMetricCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtext="All time collected"
          accentClassName="border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          valueClassName="mt-1 text-xl font-bold text-emerald-700"
          labelClassName="text-emerald-600"
          compact
        />
        <DashboardMetricCard
          label="This Month"
          value={formatCurrency(monthlyValue)}
          subtext="Current period"
          accentClassName="border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
          valueClassName="mt-1 text-xl font-bold text-blue-700"
          labelClassName="text-blue-600"
          compact
        />
        <DashboardMetricCard
          label="Pending"
          value={pendingValue}
          subtext="Awaiting payment"
          accentClassName="border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
          valueClassName="mt-1 text-xl font-bold text-amber-600"
          labelClassName="text-amber-600"
          compact
        />
        <DashboardMetricCard
          label="Overdue"
          value={overdueInvoices}
          subtext="Past due date"
          accentClassName={overdueInvoices > 0 ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10" : "border-slate-100 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"}
          valueClassName={`mt-1 text-xl font-bold ${overdueInvoices > 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}
          labelClassName={overdueInvoices > 0 ? "text-red-600" : "text-slate-500"}
          compact
        />
        <DashboardMetricCard
          label="Paid"
          value={paidInvoices}
          subtext="Settled invoices"
          accentClassName="border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          valueClassName="mt-1 text-xl font-bold text-emerald-700"
          labelClassName="text-emerald-600"
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-blue-600" />
              Recent Invoices
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-blue-600" onClick={() => push("/billing?tab=invoices")}>
              See all <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <Empty className="min-h-[200px] border-border/70 bg-muted/20">
                <EmptyContent>
                  <EmptyMedia variant="icon">
                    <FileText className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No invoices found</EmptyTitle>
                  <EmptyDescription>Invoices will appear here once created.</EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="gap-y-2">
                {recentInvoices.map((inv) => {
                  const isOverdue =
                    !!currentTimestampMs &&
                    (inv.status === "OPEN" || inv.status === "OVERDUE") &&
                    !!inv.dueDate &&
                    new Date(inv.dueDate).getTime() < currentTimestampMs;

                  return (
                    <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100" suppressHydrationWarning>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => push("/billing?tab=invoices")}
                      >
                        <p className="text-sm font-medium">{inv.invoiceNumber ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Order Id: {inv.gatewayOrderId || buildGatewayOrderId(inv.invoiceNumber ?? "", inv.id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.patientName ?? "Patient"}
                          {inv.createdAt ? ` · ${formatDateInIST(inv.createdAt)}` : ""}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(inv.amount)}</span>
                        <Badge
                          className={`border-none text-xs ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : isOverdue
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isOverdue ? "OVERDUE" : inv.status}
                        </Badge>
                        <button
                          type="button"
                          id={`download-invoice-${inv.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/billing/invoices/${inv.id}/download`, "_blank", "noopener,noreferrer");
                          }}
                          title="Download PDF"
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="gap-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finance Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-blue-50" onClick={() => push("/billing?tab=invoices")}>
                <FileText className="size-5 text-blue-600" />
                <span className="text-[11px] font-medium text-slate-600">Invoices</span>
              </Button>
              <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-emerald-50" onClick={() => push("/billing?tab=analytics")}>
                <BarChart3 className="size-5 text-emerald-600" />
                <span className="text-[11px] font-medium text-slate-600">Analytics</span>
              </Button>
              <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-amber-50" onClick={() => push("/billing?tab=reports")}>
                <TrendingUp className="size-5 text-amber-600" />
                <span className="text-[11px] font-medium text-slate-600">Reports</span>
              </Button>
              <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-purple-50" onClick={() => push("/billing?tab=payments")}>
                <CreditCard className="size-5 text-purple-600" />
                <span className="text-[11px] font-medium text-slate-600">Payments</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-slate-500" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No recent payments</p>
              ) : (
                <div className="gap-y-2">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">{payment.method ?? "Payment"}</p>
                      </div>
                      <Badge className={`border-none text-xs ${payment.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
