"use client";

import { useEffect, useMemo, useState } from "react";
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
import { RefreshCw, Plus, CreditCard, FileText, Wallet, BarChart3, Info, AlertCircle, LayoutDashboard, Search, MessageCircle } from "lucide-react";
import { PatientPageHeader } from "@/components/patient/PatientPageShell";
import { InvoiceForm } from "./InvoiceForm";
import { PaymentHistory } from "./PaymentHistory";
import { PatientBillingAnalytics } from "./PatientBillingAnalytics";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useCreateSubscription,
  useCreateBillingPlan,
  useReconcilePayment,
  useReleaseAppointmentPayout,
  useGenerateInvoicePDF,
  useSendInvoiceViaWhatsApp,
} from "@/hooks/query/useBilling";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentButton } from "@/components/payments";
import { showInfoToast } from "@/hooks/utils/use-toast";

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
  const userRole = (session?.user?.role as Role) || Role.PATIENT;

  const isAdmin = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(userRole);
  const isReceptionist = userRole === Role.RECEPTIONIST;
  const isDoctor = [Role.DOCTOR, Role.ASSISTANT_DOCTOR].includes(userRole);
  const isPatient = userRole === Role.PATIENT;
  const canManageBilling = isAdmin || isReceptionist || isDoctor;
  const canViewAnalytics = isAdmin || userRole === Role.FINANCE_BILLING;

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [isSubscriptionPaymentOpen, setIsSubscriptionPaymentOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanCycle, setNewPlanCycle] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [newPlanAppointments, setNewPlanAppointments] = useState("");
  const [newPlanUnlimited, setNewPlanUnlimited] = useState(false);
  const [createPlanError, setCreatePlanError] = useState<string>("");
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

  const activeSubscription = subscriptions.find(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING"
  );

  const handleSubscribePlan = async () => {
    setSubscribeError("");
    if (!session?.user?.id || !planToConfirm) return;
    const clinicId = planToConfirm.clinicId || session.user.clinicId || "";
    if (!clinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId: session.user.id,
        clinicId,
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

    const clinicId = session?.user?.clinicId || plans[0]?.clinicId || "";
    const parsedPrice = Number(newPlanPrice);
    const parsedAppointments = Number(newPlanAppointments || "0");
    if (!clinicId || !newPlanName.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setCreatePlanError("Please fill valid plan name, clinic, and price.");
      return;
    }

    try {
      await createPlanMutation.mutateAsync({
        clinicId,
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
    if (!searchTerm.trim()) return invoices;
    const q = searchTerm.toLowerCase();
    return invoices.filter((invoice) => invoice.invoiceNumber.toLowerCase().includes(q));
  }, [invoices, searchTerm]);

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const q = searchTerm.toLowerCase();
    return payments.filter((payment) =>
      (payment.transactionId || `payment-${payment.id}`).toLowerCase().includes(q)
    );
  }, [payments, searchTerm]);

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
  const adminTabs = useMemo(
    () => (showLedgerTab ? ["overview", "plans", "subscriptions", "invoices", "payments", "ledger"] : ["overview", "plans", "subscriptions", "invoices", "payments"]),
    [showLedgerTab]
  );
  const availableTabs = useMemo(
    () => new Set(isPatient ? patientTabs : adminTabs),
    [isPatient, patientTabs, adminTabs]
  );
  const tabCount = isPatient ? patientTabs.length : (showLedgerTab ? 6 : 5);

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

  const billingDescription = !isPatient
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
        window.open(`/api/billing/invoices/${invoice.id}/download`, "_blank", "noopener,noreferrer");
        return;
      }

      showInfoToast(
        result.message || "Invoice PDF generation has been queued. Refresh in a moment to fetch the file."
      );
    } catch {
      // Error toast is already handled by the mutation wrapper.
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <PatientPageHeader
          eyebrow={isPatient ? "BILLING" : "BILLING DASHBOARD"}
          title={isPatient ? "My Billing" : "Billing Dashboard"}
          description={billingDescription}
          actionsSlot={
            <div className="flex items-center gap-2">
              {canManageBilling && (
                <Button variant="outline" className="h-10 px-4 rounded-xl flex items-center gap-2" onClick={() => setIsCreateInvoiceOpen(true)}>
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Button>
              )}
              <Button className="h-10 px-4 rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-none" onClick={() => onRefetch && onRefetch()}>
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
            icon={<FileText className="w-4 h-4 text-blue-600" />}
            color="bg-blue-50/50 border-blue-100"
          />
          <StatCard 
            label="PENDING INVOICES"
            value={pendingInvoicesCount}
            icon={<AlertCircle className="w-4 h-4 text-orange-600" />}
            color="bg-orange-50/50 border-orange-100"
          />
          <StatCard 
            label="COMPLETED PAYMENTS"
            value={payments.filter(p => p.status === 'COMPLETED').length}
            icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            color="bg-emerald-50/50 border-emerald-100"
          />
          <StatCard 
            label="TOTAL REVENUE"
            value={`₹${(paidAmount ?? 0).toLocaleString('en-IN')}`}
            icon={<Wallet className="w-4 h-4 text-purple-600" />}
            color="bg-purple-50/50 border-purple-100"
          />
        </div>
      )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            {[...(isPatient ? patientTabs : adminTabs)].map((val) => (
              <TabsTrigger
                key={val}
                value={val}
                className="capitalize whitespace-nowrap"
              >
                {val}
              </TabsTrigger>
            ))}
          </TabsList>

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
                <p className="text-sm">Total Paid: INR {(paidAmount ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-sm">Total Pending: INR {(pendingAmount ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-sm">Active Subscriptions: {patientAnalytics.activeSubscriptions}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-3">
                <p className="font-medium">No subscription plans available right now.</p>
                <p className="text-sm text-muted-foreground">
                  Please refresh or contact clinic admin to publish billing plans for this clinic.
                </p>
                  <Button variant="outline" size="lg" className="rounded-xl h-11 border-slate-200 text-slate-700 font-bold mt-2" onClick={() => onRefetch && onRefetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Plans
                  </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscribeError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {subscribeError}
                </div>
              ) : null}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow ring-1 ring-slate-100 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-slate-800">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="flex items-baseline gap-1 mt-1">
                      <p className="text-3xl font-bold text-[#006951]">₹{(plan.price ?? 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">/ {plan.billingCycle.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {plan.isUnlimitedAppointments ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 pointer-events-none rounded-full px-3">Unlimited Appointments</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 pointer-events-none rounded-full px-3">{plan.appointmentsIncluded || 0} Appointments</Badge>
                      )}
                    </div>
                    {isPatient && (
                      <div className="mt-8 pt-4 border-t border-slate-100">
                        {activeSubscription?.planId === plan.id ? (
                          <div className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200">
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

        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <CreditCard className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600">No subscriptions found</p>
                <p className="text-sm text-slate-500 mt-1">You haven't subscribed to any billing plans yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="rounded-2xl border-slate-200/50 shadow-sm hover:shadow-md hover:border-[#006951]/30 transition-all ring-1 ring-slate-100 group">
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center shrink-0 transition-colors group-hover:bg-emerald-100/60">
                        <CreditCard className="w-6 h-6 text-[#006951]" />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#006951] text-base leading-none">{sub.plan?.name || "Subscription Plan"}</p>
                        <p className="text-[13px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-tight">
                          Started on <span className="text-slate-600">{sub.startDate ? new Date(sub.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Not available"}</span>
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
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 transition-colors">
                        <Info className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600">No invoices found</p>
                <p className="text-sm text-slate-500 mt-1">There are no records matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="rounded-2xl border-slate-200/50 shadow-sm hover:shadow-md hover:border-[#006951]/30 transition-all ring-1 ring-slate-100 group">
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        invoice.status === 'PAID' 
                          ? 'bg-emerald-50 border-emerald-100/60 text-[#006951] group-hover:bg-emerald-100/60' 
                          : 'bg-orange-50 border-orange-100/60 text-orange-600 group-hover:bg-orange-100/60'
                      }`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-foreground text-base leading-none group-hover:text-[#006951] transition-colors">{invoice.invoiceNumber}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-tight">
                          Due on <span className="text-slate-600 font-bold">{new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right">
                      <div className="flex flex-col sm:items-end">
                        <p className="font-extrabold text-foreground text-xl tracking-tight">₹{(invoice.amount ?? 0).toLocaleString("en-IN")}</p>
                        <Badge className={`mt-2 rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${
                        invoice.status === 'PAID' ? 'bg-emerald-500 text-white' :
                        invoice.status === 'OVERDUE' ? 'bg-red-500 text-white' :
                        'bg-slate-500 text-white'
                        }`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-slate-100 transition-colors"
                        title="Generate invoice PDF"
                        disabled={generateInvoicePDFMutation.isPending}
                        onClick={() => void handleGenerateInvoicePDF(invoice)}
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                      </Button>
                      {canManageBilling && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-green-50 transition-colors"
                          title="Send invoice via WhatsApp"
                          disabled={sendInvoiceWhatsAppMutation.isPending}
                          onClick={() => sendInvoiceWhatsAppMutation.mutate(invoice.id)}
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentHistory payments={filteredPayments} onRefetch={onRefetch} compact={isPatient} />
        </TabsContent>

        {showLedgerTab && (
          <TabsContent value="ledger" className="space-y-6">
            {!ledger ? (
              <Card className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50">
                <CardContent className="py-12 text-center text-slate-500">
                  Ledger data is not available yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    label="TOTAL COLLECTIONS"
                    value={`₹${(ledger.summary.totalCollections ?? 0).toLocaleString("en-IN")}`}
                    icon={<Wallet className="w-4 h-4 text-blue-600" />}
                    color="bg-blue-50/50 border-blue-100"
                  />
                  <StatCard 
                    label="PENDING PAYOUTS"
                    value={`₹${(ledger.summary.pendingPayouts ?? 0).toLocaleString("en-IN")}`}
                    icon={<RefreshCw className="w-4 h-4 text-orange-600" />}
                    color="bg-orange-50/50 border-orange-100"
                  />
                  <StatCard 
                    label="PLATFORM REVENUE"
                    value={`₹${(ledger.summary.totalPlatformRevenue ?? 0).toLocaleString("en-IN")}`}
                    icon={<BarChart3 className="w-4 h-4 text-purple-600" />}
                    color="bg-purple-50/50 border-purple-100"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="rounded-2xl border-slate-200/60 shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="pb-3 border-b border-slate-50">
                      <CardTitle className="text-base font-bold text-slate-800">Revenue Breakup</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-slate-600">Appointments</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">₹{(ledger?.summary.byRevenueModel?.APPOINTMENT ?? 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-slate-600">Subscriptions</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">₹{(ledger?.summary.byRevenueModel?.SUBSCRIPTION ?? 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-sm font-bold text-foreground">Total System Revenue</span>
                        <span className="text-sm font-bold text-[#006951]">₹{((ledger?.summary.byRevenueModel?.APPOINTMENT || 0) + (ledger?.summary.byRevenueModel?.SUBSCRIPTION || 0)).toLocaleString("en-IN")}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-slate-200/60 shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="pb-3 border-b border-slate-50">
                      <CardTitle className="text-base font-bold text-slate-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex flex-col gap-2">
                      <Button variant="outline" size="lg" className="w-full justify-start rounded-xl h-11 border-slate-200 text-slate-700 font-bold">
                        <FileText className="w-4 h-4 mr-2 text-slate-400" />
                        Download PDF Statement
                      </Button>
                      <Button variant="outline" size="lg" className="w-full justify-start rounded-xl h-11 border-slate-200 text-slate-700 font-bold">
                        <RefreshCw className="w-4 h-4 mr-2 text-slate-400" />
                        Reconcile Pending Payouts
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border-slate-200/60 shadow-sm ring-1 ring-slate-100">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-base font-bold text-slate-800">Recent Payment Ledger Entries</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-0">
                    {ledger.payments.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-sm italic">No recent ledger entries found.</div>
                    ) : (
                      <div className="divide-y divide-slate-50 max-h-[500px] overflow-auto pr-2">
                        {ledger.payments.slice(0, 30).map((entry) => (
                          <div key={entry.paymentId} className="flex items-center justify-between py-4 group">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg ${entry.revenueModel === 'APPOINTMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {entry.revenueModel === 'APPOINTMENT' ? <BarChart3 className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-[13px]">{entry.paymentId}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                  {entry.revenueModel} • {entry.provider || 'UNKNOWN'} • {entry.appointmentType || 'OFFLINE'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">₹{(entry.amount ?? 0).toLocaleString("en-IN")}</p>
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${entry.payoutState === 'PAYMENT_COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.payoutState.replace('_', ' ')}</span>
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
        <Card className="rounded-2xl border-slate-200/60 shadow-sm ring-1 ring-slate-100 mt-6">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold text-slate-800">Financial Analytics Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="font-bold text-foreground text-xl mt-1">₹{(analytics.totalRevenue ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
              <p className="font-bold text-foreground text-xl mt-1">₹{(analytics.monthlyRevenue ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
              <p className="font-bold text-foreground text-xl mt-1">{analytics.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Invoices</p>
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
                <div className="text-[11px] font-bold uppercase tracking-tight mt-2 p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-xl">{subscribeError}</div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 rounded-xl text-slate-700 font-bold" onClick={() => setPlanToConfirm(null)}>
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
