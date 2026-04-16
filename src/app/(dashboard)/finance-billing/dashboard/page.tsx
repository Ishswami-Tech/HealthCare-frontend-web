"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/ui/loader";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useClinicInvoices,
  useClinicPayments,
  useBillingAnalytics,
} from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import type { Invoice, Payment, BillingAnalytics } from "@/types/billing.types";
import {
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Receipt,
  Download,
} from "lucide-react";

export default function FinanceBillingDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const clinicId = session?.user?.clinicId ?? "";

  useWebSocketQuerySync();

  const { data: invoicesRaw = [], isPending: invoicesPending } = useClinicInvoices(!!clinicId);
  const { data: paymentsRaw = [], isPending: paymentsPending } = useClinicPayments(undefined, !!clinicId);
  const { data: analytics } = useBillingAnalytics(clinicId);

  const invoiceList: Invoice[] = Array.isArray(invoicesRaw) ? (invoicesRaw as Invoice[]) : [];
  const paymentList: Payment[] = Array.isArray(paymentsRaw) ? (paymentsRaw as Payment[]) : [];
  const analyticsData = analytics as BillingAnalytics | undefined;

  const stats = useMemo(() => {
    const totalRevenue = paymentList
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingInvoices = invoiceList.filter((inv) => inv.status === "OPEN").length;
    const paidInvoices = invoiceList.filter((inv) => inv.status === "PAID").length;

    const overdueInvoices = invoiceList.filter((inv) => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      return (inv.status === "OPEN" || inv.status === "OVERDUE") &&
        dueDate !== null &&
        dueDate < new Date();
    }).length;

    const now = new Date();
    const monthlyRevenue = paymentList
      .filter((p) => {
        const created = p.createdAt ? new Date(p.createdAt) : null;
        return (
          p.status === "COMPLETED" &&
          created !== null &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalRevenue, pendingInvoices, paidInvoices, overdueInvoices, monthlyRevenue };
  }, [invoiceList, paymentList]);

  const recentInvoices = useMemo(
    () =>
      [...invoiceList]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 6),
    [invoiceList]
  );

  const recentPayments = useMemo(
    () =>
      [...paymentList]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 5),
    [paymentList]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const isLoading =
    invoicesPending && paymentsPending && invoiceList.length === 0 && paymentList.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Billing</h1>
          <p className="text-muted-foreground">Revenue overview and financial management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/billing?tab=invoices")}
          >
            <FileText className="w-4 h-4" />
            Invoices
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/billing?tab=analytics")}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          <Button className="gap-2" onClick={() => router.push("/billing?tab=reports")}>
            <TrendingUp className="w-4 h-4" />
            Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-tight flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">All time collected</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-tight flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(analyticsData?.monthlyRevenue ?? stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Current period</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 uppercase tracking-tight flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">
              {analyticsData?.pendingInvoices ?? stats.pendingInvoices}
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${stats.overdueInvoices > 0 ? "border-red-200" : "border-slate-100"}`}>
          <CardHeader className="pb-2">
            <CardTitle
              className={`text-xs font-medium uppercase tracking-tight flex items-center gap-1 ${
                stats.overdueInvoices > 0 ? "text-red-600" : "text-slate-500"
              }`}
            >
              <AlertCircle className="w-3 h-3" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${
                stats.overdueInvoices > 0 ? "text-red-600" : "text-slate-900 dark:text-white"
              }`}
            >
              {stats.overdueInvoices}
            </div>
            <p className="text-xs text-slate-400 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-tight flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">{stats.paidInvoices}</div>
            <p className="text-xs text-slate-400 mt-1">Settled invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Recent Invoices
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-blue-600"
              onClick={() => router.push("/billing?tab=invoices")}
            >
              See all <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No invoices found</p>
                <p className="text-xs mt-1">Invoices will appear here once created</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv) => {
                  const isOverdue =
                    (inv.status === "OPEN" || inv.status === "OVERDUE") &&
                    !!inv.dueDate &&
                    new Date(inv.dueDate) < new Date();

                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => router.push("/billing?tab=invoices")}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {inv.invoiceNumber ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.patientName ?? "Patient"}
                          {inv.createdAt
                            ? ` · ${new Date(inv.createdAt).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(inv.amount)}
                        </span>
                        <Badge
                          className={`text-xs border-none ${
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
                          id={`download-invoice-${inv.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `/api/billing/invoices/${inv.id}/download`,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                          title="Download PDF"
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions + Recent Payments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finance Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-blue-50"
                onClick={() => router.push("/billing?tab=invoices")}
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium text-slate-600">Invoices</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-emerald-50"
                onClick={() => router.push("/billing?tab=analytics")}
              >
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium text-slate-600">Analytics</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-amber-50"
                onClick={() => router.push("/billing?tab=reports")}
              >
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span className="text-[11px] font-medium text-slate-600">Reports</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-purple-50"
                onClick={() => router.push("/billing?tab=payments")}
              >
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-medium text-slate-600">Payments</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No recent payments
                </p>
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.method ?? "Payment"}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs border-none ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
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
