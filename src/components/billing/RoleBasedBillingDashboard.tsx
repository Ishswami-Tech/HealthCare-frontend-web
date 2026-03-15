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
import { RefreshCw, Plus, CreditCard, FileText, Wallet, BarChart3, Info } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { PaymentHistory } from "./PaymentHistory";
import { PatientBillingAnalytics } from "./PatientBillingAnalytics";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useCreateSubscription,
  useCreateBillingPlan,
  useReconcilePayment,
  useReleaseAppointmentPayout,
} from "@/hooks/query/useBilling";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentButton } from "@/components/payments";

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
      onRefetch && onRefetch();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isPatient ? "My Billing" : "Billing Dashboard"}
          </h1>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {!isPatient ? (
              `Role-wise billing access is active for ${userRole.replaceAll("_", " ")}.`
            ) : !activeSubscription ? (
              <>
                <Info className="w-4 h-4 text-blue-500" />
                <span>
                  Choose a subscription plan below and complete payment to book in-person appointments. 
                  {isLoading && <span className="ml-1 italic text-muted-foreground">(Refreshing...)</span>}
                </span>
              </>
            ) : (
              "Manage your billing, subscriptions, and payment history."
            )}
          </div>
        </div>
        {!isPatient ? (
          <div className="flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices/payments"
              className="w-64"
            />
            <Button variant="outline" onClick={() => onRefetch && onRefetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {canManageBilling && (
              <Button onClick={() => setIsCreateInvoiceOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => setIsCreatePlanOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={() => onRefetch && onRefetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

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

      {/* Mini stat grid — only for staff/admin, not patients */}
      {!isPatient && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Invoices</div>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pending Invoices</div>
              <div className="text-2xl font-bold">{pendingInvoicesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Payments</div>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Subscriptions</div>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full grid-cols-${tabCount}`}>
          {!isPatient && <TabsTrigger value="overview">Overview</TabsTrigger>}
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          {(!isPatient || patientHasInvoices) && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
          <TabsTrigger value="payments">Payments</TabsTrigger>
          {showLedgerTab && <TabsTrigger value="ledger">Ledger</TabsTrigger>}
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
                <Button variant="outline" onClick={() => onRefetch && onRefetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Plans
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
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">INR {(plan.price ?? 0).toLocaleString("en-IN")}</p>
                    <p className="text-sm text-muted-foreground">{plan.billingCycle}</p>
                    {plan.isUnlimitedAppointments ? (
                      <Badge className="mt-2">Unlimited Appointments</Badge>
                    ) : (
                      <Badge className="mt-2">{plan.appointmentsIncluded || 0} Appointments</Badge>
                    )}
                    {isPatient && (
                      <div className="mt-4">
                        {activeSubscription?.planId === plan.id ? (
                          <Badge variant="secondary">Current Plan</Badge>
                        ) : (
                          <Button
                            className="w-full"
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
            <Card><CardContent className="py-8 text-center text-muted-foreground">No subscriptions found.</CardContent></Card>
          ) : (
            subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{sub.plan?.name || "Subscription"}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.startDate ? new Date(sub.startDate).toLocaleDateString("en-IN") : "N/A"}
                    </p>
                  </div>
                  <Badge>{sub.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No invoices found.</CardContent></Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 mt-3 sm:mt-0">
                    <p className="font-bold">INR {(invoice.amount ?? 0).toLocaleString("en-IN")}</p>
                    <Badge className="w-fit">{invoice.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentHistory payments={filteredPayments} onRefetch={onRefetch} compact={isPatient} />
        </TabsContent>

        {showLedgerTab && (
          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                {!ledger ? (
                  <p className="text-sm text-muted-foreground">Ledger data is not available.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Collections</p>
                        <p className="text-lg font-semibold">INR {(ledger.summary.totalCollections ?? 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Pending Payouts</p>
                        <p className="text-lg font-semibold">INR {(ledger.summary.pendingPayouts ?? 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Platform Revenue</p>
                        <p className="text-lg font-semibold">INR {(ledger.summary.totalPlatformRevenue ?? 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium mb-2">Revenue Model Split</p>
                      <p className="text-sm text-muted-foreground">
                        Appointment: INR {(ledger.summary.byRevenueModel?.APPOINTMENT ?? 0).toLocaleString("en-IN")} | Subscription: INR {(ledger.summary.byRevenueModel?.SUBSCRIPTION ?? 0).toLocaleString("en-IN")} | Other: INR {(ledger.summary.byRevenueModel?.OTHER ?? 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium mb-2">Recent Payment Ledger Entries</p>
                      {ledger.payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No ledger entries found.</p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-auto">
                          {ledger.payments.slice(0, 20).map((entry) => (
                            <div key={entry.paymentId} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                              <div>
                                <p className="font-medium">{entry.paymentId}</p>
                                <p className="text-muted-foreground">
                                  {entry.revenueModel} {entry.appointmentType ? `| ${entry.appointmentType}` : ""} {entry.provider ? `| ${entry.provider}` : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">INR {(entry.amount ?? 0).toLocaleString("en-IN")}</p>
                                <p className="text-muted-foreground">{entry.payoutState}</p>
                                {entry.appointmentId && entry.payoutState === "PAYOUT_READY" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1"
                                    disabled={releasePayoutMutation.isPending}
                                    onClick={() => {
                                      void releasePayoutMutation.mutateAsync(entry.appointmentId as string);
                                    }}
                                  >
                                    Release Payout
                                  </Button>
                                )}
                                {(entry.status === "PENDING" || entry.status === "FAILED") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1"
                                    disabled={reconcilePaymentMutation.isPending}
                                    onClick={() => {
                                      const provider = (entry.provider || undefined) as "cashfree" | undefined;
                                      void reconcilePaymentMutation.mutateAsync({
                                        paymentId: entry.paymentId,
                                        ...(provider ? { provider } : {}),
                                      });
                                    }}
                                  >
                                    Reconcile
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {canViewAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Analytics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="font-bold">INR {(analytics.totalRevenue ?? 0).toLocaleString("en-IN")}</p></div>
            <div><p className="text-sm text-muted-foreground">Monthly Revenue</p><p className="font-bold">INR {(analytics.monthlyRevenue ?? 0).toLocaleString("en-IN")}</p></div>
            <div><p className="text-sm text-muted-foreground">Active Subscriptions</p><p className="font-bold">{analytics.activeSubscriptions}</p></div>
            <div><p className="text-sm text-muted-foreground">Pending Invoices</p><p className="font-bold">{analytics.pendingInvoices}</p></div>
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
              onRefetch && onRefetch();
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
                  <span className="font-semibold text-lg">{planToConfirm.name}</span>
                  <span className="font-bold text-lg whitespace-nowrap ml-2">INR {(planToConfirm.price ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{planToConfirm.description}</p>
              </div>
              {subscribeError && (
                <div className="text-sm mt-2 p-2 bg-destructive/15 text-destructive border border-destructive/30 rounded-md">{subscribeError}</div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPlanToConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  className="w-full sm:w-auto"
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
                Plan: <span className="font-medium text-foreground">{pendingSubscriptionPayment.planName}</span>
              </p>
              <PaymentButton
                subscriptionId={pendingSubscriptionPayment.subscriptionId}
                amount={pendingSubscriptionPayment.amount}
                description={pendingSubscriptionPayment.planName}
                autoStart
                className="w-full"
                onSuccess={() => {
                  setIsSubscriptionPaymentOpen(false);
                  setPendingSubscriptionPayment(null);
                  onRefetch && onRefetch();
                }}
              >
                Pay INR {(pendingSubscriptionPayment.amount ?? 0).toLocaleString("en-IN")}
              </PaymentButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
