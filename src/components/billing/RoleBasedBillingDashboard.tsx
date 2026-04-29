"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/auth.types";
import {
  Invoice,
  Subscription,
  Payment,
  BillingPlan,
  BillingAnalytics,
  ClinicLedgerResponse,
} from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Plus, CreditCard, FileText, Wallet, BarChart3, Info, AlertCircle, Search, MessageCircle } from "lucide-react";
import { DashboardPageHeader as PatientPageHeader } from "@/components/dashboard/DashboardPageShell";
import { InvoiceForm } from "./InvoiceForm";
import { PaymentHistory } from "./PaymentHistory";
import { PatientBillingAnalytics } from "./PatientBillingAnalytics";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  useCreateSubscription,
  useCreateBillingPlan,
  useReconcilePayment,
  useReleaseAppointmentPayout,
  useGenerateInvoicePDF,
  useSendInvoiceViaWhatsApp,
  useMarkInvoiceAsPaid,
} from "@/hooks/query/useBilling";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentButton } from "@/components/payments";
import { showErrorToast, showInfoToast } from "@/hooks/utils/use-toast";
import { useCurrentClinicId } from "@/hooks/query/useClinics";

interface RoleBasedBillingDashboardProps {
  initialTab?: string;
  isLoading?: boolean;
  plans: BillingPlan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  analytics?: BillingAnalytics;
  ledger?: ClinicLedgerResponse;
  onRefetch?: () => void;
}

// ─── Module-scope StatCard Component ───────────────
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${color}`}>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-background/80 p-1.5 shadow-sm ring-1 ring-border/20">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function RoleBasedBillingDashboard({
  initialTab,
  isLoading = false,
  plans,
  subscriptions,
  invoices,
  payments,
  analytics,
  ledger,
  onRefetch,
}: RoleBasedBillingDashboardProps) {
  const { session } = useAuth();
  const clinicId = useCurrentClinicId();
  const userRole = (session?.user?.role as Role) || Role.PATIENT;

  const isAdmin = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(userRole);
  const isReceptionist = userRole === Role.RECEPTIONIST;
  const isDoctor = [Role.DOCTOR, Role.ASSISTANT_DOCTOR].includes(userRole);
  const isPatient = userRole === Role.PATIENT;
  const canManageBilling = isAdmin || isReceptionist || isDoctor;
  const canMarkInvoicesPaid = isAdmin || isReceptionist;
  const canViewAnalytics = isAdmin || userRole === Role.FINANCE_BILLING;

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [isSubscriptionPaymentOpen, setIsSubscriptionPaymentOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanCycle, setNewPlanCycle] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [newPlanAppointments, setNewPlanAppointments] = useState("");
  const [newPlanUnlimited, setNewPlanUnlimited] = useState(false);
  const [createPlanError, setCreatePlanError] = useState<string>("");
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [pendingSubscriptionPayment, setPendingSubscriptionPayment] = useState<{
    subscriptionId: string;
    planName: string;
    amount: number;
  } | null>(null);
  const [subscribeError, setSubscribeError] = useState<string>("");
  const releasePayoutMutation = useReleaseAppointmentPayout();
  const reconcilePaymentMutation = useReconcilePayment();
  const createSubscriptionMutation = useCreateSubscription();
  const createPlanMutation = useCreateBillingPlan();
  const sendInvoiceWhatsAppMutation = useSendInvoiceViaWhatsApp();
  const generateInvoicePDFMutation = useGenerateInvoicePDF();
  const markInvoiceAsPaidMutation = useMarkInvoiceAsPaid();

  const activeSubscription = subscriptions.find(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING"
  );
  const showPlansTab = isPatient;
  const showSubscriptionsTab = isPatient;

  const handleSubscribePlan = async () => {
    setSubscribeError("");
    if (!session?.user?.id || !planToConfirm) return;
    const resolvedClinicId = planToConfirm.clinicId || clinicId || "";
    if (!resolvedClinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId: session.user.id,
        clinicId: resolvedClinicId,
        planId: planToConfirm.id,
      });

      if (!created?.id) {
        setSubscribeError("Subscription was created with an invalid response.");
        return;
      }

      setPendingSubscriptionPayment({
        subscriptionId: created.id,
        planName: planToConfirm.name,
        amount: planToConfirm.price ?? 0,
      });
      setPlanToConfirm(null);
      setIsSubscriptionPaymentOpen(true);
    } catch (error) {
      setSubscribeError(
        error instanceof Error
          ? error.message
          : "Failed to create subscription."
      );
    }
  };

  const handleCreatePlan = async () => {
    setCreatePlanError("");
    if (!session?.user?.profileComplete) {
      setCreatePlanError("Profile incomplete. Complete your profile before creating billing plans.");
      return;
    }

    const resolvedClinicId = clinicId || plans[0]?.clinicId || "";
    const parsedPrice = Number(newPlanPrice);
    const parsedAppointments = Number(newPlanAppointments || "0");
    if (!resolvedClinicId || !newPlanName.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setCreatePlanError("Please fill valid plan name, clinic, and price.");
      return;
    }

    try {
      await createPlanMutation.mutateAsync({
        clinicId: resolvedClinicId,
        name: newPlanName.trim(),
        price: parsedPrice,
        currency: "INR",
        billingCycle: newPlanCycle,
        isActive: true,
        isUnlimitedAppointments: newPlanUnlimited,
        ...(newPlanUnlimited ? {} : { appointmentsIncluded: Math.max(1, parsedAppointments || 1) }),
        description: `${newPlanName.trim()} (${newPlanCycle.toLowerCase()})`,
      });

      setIsCreatePlanOpen(false);
      setNewPlanName("");
      setNewPlanPrice("");
      setNewPlanCycle("MONTHLY");
      setNewPlanAppointments("");
      setNewPlanUnlimited(false);
      setCreatePlanError("");
      if (onRefetch) {
        onRefetch();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create billing plan.";
      setCreatePlanError(message);
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const startAt = startDateFilter ? new Date(`${startDateFilter}T00:00:00`).getTime() : null;
    const endAt = endDateFilter ? new Date(`${endDateFilter}T23:59:59.999`).getTime() : null;
    return invoices.filter((invoice) =>
      (invoiceStatusFilter === "all" || invoice.status === invoiceStatusFilter) &&
      (() => {
        const invoiceDateValue = invoice.createdAt || invoice.dueDate;
        const invoiceDate = invoiceDateValue ? new Date(invoiceDateValue).getTime() : null;
        return (
          invoiceDate === null ||
          ((startAt === null || invoiceDate >= startAt) && (endAt === null || invoiceDate <= endAt))
        );
      })() &&
      (
        !searchTerm.trim() ||
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.id.toLowerCase().includes(q) ||
        (invoice.patientName || "").toLowerCase().includes(q)
      )
    );
  }, [endDateFilter, invoiceStatusFilter, invoices, searchTerm, startDateFilter]);

  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const startAt = startDateFilter ? new Date(`${startDateFilter}T00:00:00`).getTime() : null;
    const endAt = endDateFilter ? new Date(`${endDateFilter}T23:59:59.999`).getTime() : null;
    return payments.filter((payment) => {
      const paymentPatientName =
        "patientName" in payment && typeof payment.patientName === "string"
          ? payment.patientName
          : "";
      const paymentDateValue = payment.paymentDate || payment.createdAt;
      const paymentDate = paymentDateValue ? new Date(paymentDateValue).getTime() : null;
      return (
        (paymentStatusFilter === "all" || payment.status === paymentStatusFilter) &&
        (paymentMethodFilter === "all" || payment.method === paymentMethodFilter) &&
        (
          paymentDate === null ||
          ((startAt === null || paymentDate >= startAt) && (endAt === null || paymentDate <= endAt))
        ) &&
        (
          !searchTerm.trim() ||
          (payment.transactionId || `payment-${payment.id}`).toLowerCase().includes(q) ||
          payment.id.toLowerCase().includes(q) ||
          paymentPatientName.toLowerCase().includes(q)
        )
      );
    });
  }, [endDateFilter, paymentMethodFilter, paymentStatusFilter, payments, searchTerm, startDateFilter]);

  const pendingInvoicesCount = invoices.filter(
    (i) => i.status === "DRAFT" || i.status === "OPEN" || i.status === "OVERDUE"
  ).length;
  const paidAmount = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "DRAFT" || i.status === "OPEN" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  const lastCompletedPayment = payments.find((p) => p.status === "COMPLETED");
  const activeSubscriptionsCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const patientAnalytics = {
    totalPayments: payments.length,
    totalPaid: paidAmount,
    totalPending: pendingAmount,
    activeSubscriptions: activeSubscriptionsCount,
    ...(lastCompletedPayment ? { lastPayment: lastCompletedPayment } : {}),
  };

  const showLedgerTab = isAdmin;
  // Patients see: plans, subscriptions, payments (invoices only if they have any)
  const patientHasInvoices = isPatient && invoices.length > 0;
  const patientTabs = useMemo(
    () => ["plans", "subscriptions", "payments", ...(patientHasInvoices ? ["invoices"] : [])],
    [patientHasInvoices]
  );
  const staffTabs = useMemo(
    () => ["overview", "invoices", "payments", ...(showLedgerTab ? ["ledger"] : [])],
    [showLedgerTab]
  );
  const availableTabs = useMemo(
    () => new Set(isPatient ? patientTabs : staffTabs),
    [isPatient, patientTabs, staffTabs]
  );
  const tabCount = isPatient ? patientTabs.length : staffTabs.length;

  useEffect(() => {
    // Default to "plans" for patients, "overview" for staff
    const fallback = isPatient ? "plans" : "overview";
    if (!initialTab) {
      setActiveTab(fallback);
      return;
    }
    const normalized = initialTab.toLowerCase();
    setActiveTab(availableTabs.has(normalized) ? normalized : fallback);
  }, [initialTab, availableTabs, isPatient]);

  const billingDescription = isReceptionist
    ? "Collections and invoice payments for your clinic."
    : !isPatient
    ? `Role-wise billing access active for ${userRole.replaceAll("_", " ")}`
    : !activeSubscription
    ? "Select a plan to unlock in-person appointments"
    : "Manage your billing, subscriptions, and history";

  const handleGenerateInvoicePDF = async (invoice: Invoice) => {
    try {
      const result = await generateInvoicePDFMutation.mutateAsync(invoice.id);

      if (!result.success) {
        return;
      }

      if (result.pdfUrl) {
        window.open(result.pdfUrl, "_blank", "noopener,noreferrer");
        return;
      }

      showInfoToast(
        result.message || "Invoice PDF generation has been queued. Refresh in a moment to fetch the file."
      );
    } catch {
      // Error toast is already handled by the mutation wrapper.
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    setMarkingPaidId(invoiceId);
    try {
      await markInvoiceAsPaidMutation.mutateAsync(invoiceId);
      onRefetch?.();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setMarkingPaidId(null);
    }
  };

  const invoiceColumns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.invoiceNumber || `#${row.original.id.slice(-8).toUpperCase()}`}
            </span>
            <span className="text-xs text-muted-foreground">
              Due:{" "}
              {row.original.dueDate
                ? formatDateInIST(row.original.dueDate, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-semibold">INR {(row.original.amount ?? 0).toLocaleString("en-IN")}</span>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.patientName || "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${
              row.original.status === "PAID"
                ? "bg-emerald-500 text-white"
                : row.original.status === "OVERDUE"
                  ? "bg-red-500 text-white"
                  : "bg-slate-500 text-white"
            }`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {(row.original.status === "OPEN" || row.original.status === "OVERDUE") && (
              <PaymentButton invoiceId={row.original.id} amount={row.original.amount} />
            )}
            {canMarkInvoicesPaid &&
              (row.original.status === "OPEN" || row.original.status === "OVERDUE") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void handleMarkInvoicePaid(row.original.id)}
                  disabled={
                    markingPaidId === row.original.id || markInvoiceAsPaidMutation.isPending
                  }
                >
                  {markingPaidId === row.original.id ? "Marking..." : "Mark Paid"}
                </Button>
              )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              title="View invoice"
              disabled={generateInvoicePDFMutation.isPending}
              onClick={() => setSelectedInvoice(row.original)}
            >
              <FileText className="mr-1 w-4 h-4" />
              View Invoice
            </Button>
            {canManageBilling && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                title="Send invoice via WhatsApp"
                disabled={sendInvoiceWhatsAppMutation.isPending}
                onClick={() => sendInvoiceWhatsAppMutation.mutate(row.original.id)}
              >
                <MessageCircle className="mr-1 w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                WhatsApp
              </Button>
            )}
          </div>
        ),
      },
    ],
    [
      canMarkInvoicesPaid,
      canManageBilling,
      generateInvoicePDFMutation.isPending,
      markInvoiceAsPaidMutation.isPending,
      markingPaidId,
      sendInvoiceWhatsAppMutation.isPending,
    ]
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <PatientPageHeader
          eyebrow={isPatient ? "BILLING" : isReceptionist ? "COLLECTIONS" : "BILLING DASHBOARD"}
          title={isPatient ? "My Billing" : isReceptionist ? "Collections & Payments" : "Billing Dashboard"}
          description={billingDescription}
          actionsSlot={
            <div className="flex items-center gap-2">
              {canManageBilling && (
                <Button variant="outline" className="h-10 px-4 rounded-xl flex items-center gap-2" onClick={() => setIsCreateInvoiceOpen(true)}>
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Button>
              )}
              <Button className="h-10 px-4 rounded-xl flex items-center gap-2 border-none bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400" onClick={() => onRefetch && onRefetch()}>
                <RefreshCw className="w-4 h-4" />
                Sync Data
              </Button>
            </div>
          }
        />

      {isPatient && <PatientBillingAnalytics {...patientAnalytics} />}

      {/* CTA banner for patients with no active subscription */}
      {isPatient && activeSubscriptionsCount === 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">No active plan</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                  Subscribe to a plan to unlock in-person appointment booking.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab("plans")}
                className="shrink-0"
              >
                View Plans →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Stat Grid — only for staff/admin */}
      {!isPatient && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            label="TOTAL INVOICES"
            value={invoices.length}
            icon={<FileText className="w-4 h-4 text-sky-600 dark:text-sky-300" />}
            color="border-sky-200/70 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30"
          />
          <StatCard 
            label="PENDING INVOICES"
            value={pendingInvoicesCount}
            icon={<AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300" />}
            color="border-amber-200/70 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30"
          />
          <StatCard 
            label="COMPLETED PAYMENTS"
            value={payments.filter(p => p.status === 'COMPLETED').length}
            icon={<CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
            color="border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
          />
          <StatCard 
            label="PAID REVENUE"
            value={`₹${(paidAmount ?? 0).toLocaleString('en-IN')}`}
            icon={<Wallet className="w-4 h-4 text-violet-600 dark:text-violet-300" />}
            color="border-violet-200/70 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/30"
          />
        </div>
      )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            {[...(isPatient ? patientTabs : staffTabs)].map((val) => (
              <TabsTrigger
                key={val}
                value={val}
                className="capitalize"
              >
                {val}
              </TabsTrigger>
            ))}
          </TabsList>

          {(activeTab === "invoices" || activeTab === "payments") && (
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    activeTab === "invoices"
                      ? "Search by invoice number, patient, or invoice id"
                      : "Search by transaction, patient, or payment id"
                  }
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full md:w-44"
              />
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full md:w-44"
              />
              {activeTab === "invoices" && (
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Invoice status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                    <SelectItem value="UNCOLLECTIBLE">Uncollectible</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {activeTab === "payments" && (
                <>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                      <SelectItem value="WALLET">Wallet</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setInvoiceStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setPaymentMethodFilter("all");
                }}
              >
                Reset
              </Button>
            </div>
          )}

        {!isPatient && (
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Total Paid Revenue: INR {(paidAmount ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-sm">Total Pending: INR {(pendingAmount ?? 0).toLocaleString("en-IN")}</p>
                {isPatient && <p className="text-sm">Active Subscriptions: {patientAnalytics.activeSubscriptions}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showPlansTab && (
        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-3">
                <p className="font-medium">No subscription plans available right now.</p>
                <p className="text-sm text-muted-foreground">
                  Please refresh or contact clinic admin to publish billing plans for this clinic.
                </p>
                  <Button variant="outline" size="lg" className="mt-2 h-11 rounded-xl font-bold" onClick={() => onRefetch && onRefetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Plans
                  </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscribeError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {subscribeError}
                </div>
              ) : null}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="flex flex-col rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40 transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="flex items-baseline gap-1 mt-1">
                      <p className="text-3xl font-bold text-[#006951]">₹{(plan.price ?? 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">/ {plan.billingCycle.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {plan.isUnlimitedAppointments ? (
                        <Badge variant="outline" className="pointer-events-none rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Unlimited Appointments</Badge>
                      ) : (
                        <Badge variant="outline" className="pointer-events-none rounded-full border-sky-200 bg-sky-50 px-3 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">{plan.appointmentsIncluded || 0} Appointments</Badge>
                      )}
                    </div>
                    {isPatient && (
                      <div className="mt-8 border-t border-border/60 pt-4">
                        {activeSubscription?.planId === plan.id ? (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/50 p-2.5">
                            <Badge variant="secondary" className="bg-[#006951]/10 text-[#006951] hover:bg-[#006951]/10 px-3 font-bold border-none">Current Plan</Badge>
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            className="w-full rounded-xl bg-[#006951] hover:bg-[#005a45] shadow-sm font-bold h-11 transition-all active:scale-[0.98]"
                            onClick={() => setPlanToConfirm(plan)}
                          >
                            Subscribe & Pay
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          )}
        </TabsContent>
        )}

        {showSubscriptionsTab && (
        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No subscriptions found</p>
                <p className="mt-1 text-sm text-muted-foreground">You haven't subscribed to any billing plans yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="group rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40 transition-all hover:border-emerald-700/30 hover:shadow-md dark:hover:border-emerald-400/30">
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/60 bg-emerald-50 transition-colors group-hover:bg-emerald-100/60 dark:border-emerald-900 dark:bg-emerald-950/30 dark:group-hover:bg-emerald-900/50">
                        <CreditCard className="w-6 h-6 text-[#006951]" />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#006951] text-base leading-none">{sub.plan?.name || "Subscription Plan"}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-tight text-muted-foreground">
                          Started on <span className="text-foreground">{sub.startDate ? formatDateInIST(sub.startDate, { day: "numeric", month: "short", year: "numeric" }) : "Not available"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`rounded-full px-3.5 py-1 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${
                        sub.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                        sub.status === 'TRIALING' ? 'bg-blue-500 text-white' :
                        'bg-slate-500 text-white'
                      }`}>
                        {sub.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="rounded-xl transition-colors hover:bg-muted">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        )}

        <TabsContent value="invoices" className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No invoices found</p>
                <p className="mt-1 text-sm text-muted-foreground">There are no records matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={invoiceColumns}
              data={filteredInvoices}
              pageSize={10}
              emptyMessage="No invoices found"
            />
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentHistory payments={filteredPayments} onRefetch={onRefetch} compact={isPatient} />
        </TabsContent>

        {showLedgerTab && (
          <TabsContent value="ledger" className="space-y-6">
            {!ledger ? (
              <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Ledger data is not available yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    label="TOTAL COLLECTIONS"
                    value={`₹${(ledger.summary.totalCollections ?? 0).toLocaleString("en-IN")}`}
                    icon={<Wallet className="w-4 h-4 text-sky-600 dark:text-sky-300" />}
                    color="border-sky-200/70 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30"
                  />
                  <StatCard 
                    label="PENDING PAYOUTS"
                    value={`₹${(ledger.summary.pendingPayouts ?? 0).toLocaleString("en-IN")}`}
                    icon={<RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-300" />}
                    color="border-amber-200/70 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30"
                  />
                  <StatCard 
                    label="PLATFORM REVENUE"
                    value={`₹${(ledger.summary.totalPlatformRevenue ?? 0).toLocaleString("en-IN")}`}
                    icon={<BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-300" />}
                    color="border-violet-200/70 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/30"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40">
                    <CardHeader className="border-b border-border/60 pb-3">
                      <CardTitle className="text-base font-bold text-foreground">Revenue Breakup</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-muted-foreground">Appointments</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">₹{(ledger?.summary.byRevenueModel?.APPOINTMENT ?? 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-muted-foreground">Subscriptions</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">₹{(ledger?.summary.byRevenueModel?.SUBSCRIPTION ?? 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-sm font-bold text-foreground">Total System Revenue</span>
                        <span className="text-sm font-bold text-[#006951]">₹{((ledger?.summary.byRevenueModel?.APPOINTMENT || 0) + (ledger?.summary.byRevenueModel?.SUBSCRIPTION || 0)).toLocaleString("en-IN")}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40">
                    <CardHeader className="pb-3 border-b border-border/60">
                      <CardTitle className="text-base font-bold text-foreground">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex flex-col gap-2">
                      <Button variant="outline" size="lg" className="h-11 w-full justify-start rounded-xl font-bold">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        Download PDF Statement
                      </Button>
                      <Button variant="outline" size="lg" className="h-11 w-full justify-start rounded-xl font-bold">
                        <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                        Reconcile Pending Payouts
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold text-foreground">Recent Payment Ledger Entries</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-0">
                    {ledger.payments.length === 0 ? (
                      <div className="py-12 text-center text-sm italic text-muted-foreground">No recent ledger entries found.</div>
                    ) : (
                      <div className="max-h-[500px] divide-y divide-border/50 overflow-auto pr-2">
                        {ledger.payments.slice(0, 30).map((entry) => (
                          <div key={entry.paymentId} className="flex items-center justify-between py-4 group">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 rounded-lg p-1.5 ${entry.revenueModel === 'APPOINTMENT' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300'}`}>
                                {entry.revenueModel === 'APPOINTMENT' ? <BarChart3 className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-[13px]">{entry.paymentId}</p>
                                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                                  {entry.revenueModel} • {entry.provider || 'UNKNOWN'} • {entry.appointmentType || 'OFFLINE'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">₹{(entry.amount ?? 0).toLocaleString("en-IN")}</p>
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${entry.payoutState === 'PAYMENT_COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{entry.payoutState.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {!isPatient && analytics && (
        <Card className="mt-6 rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground">Financial Analytics Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paid Revenue</p>
              <p className="font-bold text-foreground text-xl mt-1">₹{(paidAmount ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Revenue</p>
              <p className="font-bold text-foreground text-xl mt-1">₹{(analytics.monthlyRevenue ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Subscriptions</p>
              <p className="font-bold text-foreground text-xl mt-1">{analytics.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Invoices</p>
              <p className="font-bold text-foreground text-xl mt-1">{analytics.pendingInvoices}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSuccess={() => {
              setIsCreateInvoiceOpen(false);
              if (onRefetch) {
                onRefetch();
              }
            }}
            onCancel={() => setIsCreateInvoiceOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice?.invoiceNumber
                ? `Invoice ${selectedInvoice.invoiceNumber}`
                : "Invoice Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Patient
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {selectedInvoice.patientName || "Unknown"}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-2">
                    <Badge
                      className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${
                        selectedInvoice.status === "PAID"
                          ? "bg-emerald-500 text-white"
                          : selectedInvoice.status === "OVERDUE"
                            ? "bg-red-500 text-white"
                            : "bg-slate-500 text-white"
                      }`}
                    >
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    INR {(selectedInvoice.amount ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {selectedInvoice.dueDate
                      ? formatDateInIST(selectedInvoice.dueDate, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Line Items</p>
                </div>
                <div className="divide-y">
                  {selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty {item.quantity} x INR {item.unitPrice.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          INR {item.total.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      No line items available.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {canManageBilling && (
                  <Button
                    variant="outline"
                    onClick={() => sendInvoiceWhatsAppMutation.mutate(selectedInvoice.id)}
                    disabled={sendInvoiceWhatsAppMutation.isPending}
                  >
                    <MessageCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => void handleGenerateInvoicePDF(selectedInvoice)}
                  disabled={generateInvoicePDFMutation.isPending}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Open PDF
                </Button>
                {(selectedInvoice.status === "OPEN" || selectedInvoice.status === "OVERDUE") && (
                  <PaymentButton invoiceId={selectedInvoice.id} amount={selectedInvoice.amount} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreatePlanOpen}
        onOpenChange={(open) => {
          setIsCreatePlanOpen(open);
          if (!open) {
            setCreatePlanError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Billing Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {createPlanError && (
              <p className="text-sm text-destructive">{createPlanError}</p>
            )}
            <Input
              placeholder="Plan name (e.g. Monthly In-Person)"
              value={newPlanName}
              onChange={(e) => {
                setNewPlanName(e.target.value);
                if (createPlanError) setCreatePlanError("");
              }}
            />
            <Input
              placeholder="Price in INR"
              type="number"
              min={1}
              value={newPlanPrice}
              onChange={(e) => {
                setNewPlanPrice(e.target.value);
                if (createPlanError) setCreatePlanError("");
              }}
            />
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={newPlanCycle}
              onChange={(e) => setNewPlanCycle(e.target.value as "MONTHLY" | "QUARTERLY" | "YEARLY")}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                id="unlimited-appointments"
                type="checkbox"
                checked={newPlanUnlimited}
                onChange={(e) => setNewPlanUnlimited(e.target.checked)}
              />
              <label htmlFor="unlimited-appointments" className="text-sm">
                Unlimited appointments
              </label>
            </div>
            {!newPlanUnlimited && (
              <Input
                placeholder="Appointments included"
                type="number"
                min={1}
                value={newPlanAppointments}
                onChange={(e) => setNewPlanAppointments(e.target.value)}
              />
            )}
            <Button
              className="w-full"
              onClick={() => {
                void handleCreatePlan();
              }}
              disabled={createPlanMutation.isPending}
            >
              {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!planToConfirm} onOpenChange={(open) => !open && setPlanToConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
          </DialogHeader>
          {planToConfirm && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center wrap-break-word">
                  <span className="font-semibold text-lg">{planToConfirm?.name}</span>
                  <span className="font-bold text-lg whitespace-nowrap ml-2">INR {(planToConfirm?.price ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{planToConfirm?.description}</p>
              </div>
              {subscribeError && (
                <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] font-bold uppercase tracking-tight text-destructive">{subscribeError}</div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6">
                <Button variant="outline" size="lg" className="h-11 w-full rounded-xl font-bold sm:w-auto" onClick={() => setPlanToConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto h-11 rounded-xl bg-[#006951] hover:bg-[#005a45] text-white font-bold transition-all shadow-sm active:scale-95"
                  onClick={() => void handleSubscribePlan()} 
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? "Hold on..." : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSubscriptionPaymentOpen} onOpenChange={setIsSubscriptionPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Subscription Payment</DialogTitle>
          </DialogHeader>
          {pendingSubscriptionPayment && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Plan: <span className="font-medium text-foreground">{pendingSubscriptionPayment?.planName}</span>
              </p>
              <PaymentButton
                subscriptionId={pendingSubscriptionPayment?.subscriptionId || ""}
                amount={pendingSubscriptionPayment?.amount || 0}
                description={pendingSubscriptionPayment?.planName || ""}
                autoStart
                className="w-full h-11 rounded-xl font-bold bg-[#006951] hover:bg-[#005a45]"
                onSuccess={() => {
                  setIsSubscriptionPaymentOpen(false);
                  setPendingSubscriptionPayment(null);
                  if (onRefetch) {
                    onRefetch();
                  }
                }}
              >
                Pay INR {(pendingSubscriptionPayment?.amount ?? 0).toLocaleString("en-IN")}
              </PaymentButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
