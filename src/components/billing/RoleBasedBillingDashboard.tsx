"use client";

import { useMemo, useState } from "react";
import { Role } from "@/types/auth.types";
import { Invoice, Subscription, Payment, BillingPlan, BillingAnalytics } from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, CreditCard, FileText, Wallet, BarChart3 } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { PaymentHistory } from "./PaymentHistory";
import { PatientBillingAnalytics } from "./PatientBillingAnalytics";
import { useAuth } from "@/hooks/auth/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RoleBasedBillingDashboardProps {
  plans: BillingPlan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  analytics?: BillingAnalytics;
  onRefetch?: () => void;
}

export function RoleBasedBillingDashboard({
  plans,
  subscriptions,
  invoices,
  payments,
  analytics,
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

  const pendingInvoicesCount = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;
  const paidAmount = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  const patientAnalytics = {
    totalPayments: payments.length,
    totalPaid: paidAmount,
    totalPending: pendingAmount,
    activeSubscriptions: subscriptions.filter((s) => s.status === "ACTIVE").length,
    currentBalance: pendingAmount - paidAmount,
    lastPayment: payments.find((p) => p.status === "COMPLETED"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isPatient ? "My Billing" : "Billing Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Role-wise billing access is active for {userRole.replaceAll("_", " ")}.
          </p>
        </div>
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
        </div>
      </div>

      {isPatient && <PatientBillingAnalytics {...patientAnalytics} />}

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Total Paid: INR {paidAmount.toLocaleString("en-IN")}</p>
              <p className="text-sm">Total Pending: INR {pendingAmount.toLocaleString("en-IN")}</p>
              <p className="text-sm">Active Subscriptions: {patientAnalytics.activeSubscriptions}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No plans found.</CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">INR {plan.price.toLocaleString("en-IN")}</p>
                    <p className="text-sm text-muted-foreground">{plan.billingCycle}</p>
                    {plan.isUnlimitedAppointments ? (
                      <Badge className="mt-2">Unlimited Appointments</Badge>
                    ) : (
                      <Badge className="mt-2">{plan.appointmentsIncluded || 0} Appointments</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No subscriptions found.</CardContent></Card>
          ) : (
            subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="py-4 flex items-center justify-between">
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
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">INR {invoice.amount.toLocaleString("en-IN")}</p>
                    <Badge>{invoice.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentHistory payments={filteredPayments} onRefetch={onRefetch} />
        </TabsContent>
      </Tabs>

      {canViewAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Analytics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="font-bold">INR {analytics.totalRevenue.toLocaleString("en-IN")}</p></div>
            <div><p className="text-sm text-muted-foreground">Monthly Revenue</p><p className="font-bold">INR {analytics.monthlyRevenue.toLocaleString("en-IN")}</p></div>
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
    </div>
  );
}
