"use client";

import { useState, lazy, Suspense } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { Permission } from "@/types/rbac.types";
import { Invoice } from "@/types/billing.types";
import { generateInvoicePDF } from "@/lib/actions/billing.server";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Plus,
  CheckCircle,
} from "lucide-react";

import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";

// ✅ Lazy load heavy components for code splitting (optimized for 10M users)
const RazorpayPaymentButton = lazy(() =>
  import("@/components/payments/RazorpayPaymentButton").then((module) => ({
    default: module.RazorpayPaymentButton,
  }))
);
import {
  useBillingPlans,
  useSubscriptions,
  useInvoices,
  usePayments,
  useBillingAnalytics,
  useCreateSubscription,
  useCancelSubscription,
} from "@/hooks/query/useBilling";
import {
  Download,
  Send,
} from "lucide-react";
import { toast } from "sonner";

function BillingPageContent() {
  const { session } = useAuth();
  const user = session?.user;
  const userId = user?.id || "user-1";
  const clinicId = "clinic-1";

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Hooks - using real API with Docker backend
  const { data: plans = [], isPending: plansPending } =
    useBillingPlans(clinicId);
  const { data: subscriptions = [], isPending: subscriptionsPending } =
    useSubscriptions(userId);
  const { data: invoices = [], isPending: invoicesPending } =
    useInvoices(userId);
  const { data: payments = [], isPending: paymentsPending } =
    usePayments(userId);
  const { data: analytics } = useBillingAnalytics(clinicId);

  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();

  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isCreateSubscriptionDialogOpen, setIsCreateSubscriptionDialogOpen] =
    useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const handleCreateSubscription = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    createSubscription.mutate(
      {
        userId,
        clinicId,
        planId: selectedPlan,
        autoRenew: true,
      },
      {
        onSuccess: () => {
          toast.success("Subscription created successfully");
          setIsCreateSubscriptionDialogOpen(false);
          setSelectedPlan("");
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to create subscription");
        },
      }
    );
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    cancelSubscription.mutate(
      { id: subscriptionId, immediate: false },
      {
        onSuccess: () => {
          toast.success("Subscription cancelled successfully");
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to cancel subscription");
        },
      }
    );
  };

  const sidebarLinks = getRoutesByRole((user?.role as Role) || Role.PATIENT).map(
    (route: any) => ({
      ...route,
      href: route.path,
    })
  );

  return (
    <DashboardLayout
      title="Billing & Subscriptions"
      allowedRole={[Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PATIENT]}
    >
      <Sidebar
        links={sidebarLinks}
        user={{
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "User",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          {/* Real-time WebSocket Status Indicator */}
          <div className="flex items-center justify-end mb-4">
            <WebSocketStatusIndicator />
          </div>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{analytics.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Revenue
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{analytics.monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Subscriptions
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.activeSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Invoices
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.pendingInvoices}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting payment
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="plans" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plans">Billing Plans</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            {/* Billing Plans Tab */}
            <TabsContent value="plans" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Billing Plans</h2>
                <Dialog
                  open={isCreatePlanDialogOpen}
                  onOpenChange={setIsCreatePlanDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Billing Plan</DialogTitle>
                      <DialogDescription>
                        Create a new billing plan for subscriptions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input placeholder="Basic Plan" />
                      </div>
                      <div>
                        <Label>Price (₹)</Label>
                        <Input type="number" placeholder="999" />
                      </div>
                      <div>
                        <Label>Billing Cycle</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatePlanDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast.info(
                            "API integration pending - This will create a plan when API is connected"
                          );
                          setIsCreatePlanDialogOpen(false);
                        }}
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {plansPending ? (
                <div className="text-center py-8">Loading plans...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan: any) => (
                    <Card key={plan.id}>
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <div className="text-3xl font-bold mt-2">
                          ₹{plan.price.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.billingCycle.toLowerCase()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {plan.description}
                        </p>
                        <div className="space-y-2">
                          {plan.isUnlimitedAppointments ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">
                                Unlimited appointments
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">
                                {plan.appointmentsIncluded} appointments
                                included
                              </span>
                            </div>
                          )}
                          {plan.features?.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          Select Plan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Subscriptions</h2>
                <Dialog
                  open={isCreateSubscriptionDialogOpen}
                  onOpenChange={setIsCreateSubscriptionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Subscription</DialogTitle>
                      <DialogDescription>
                        Subscribe to a billing plan
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Plan</Label>
                        <Select
                          value={selectedPlan}
                          onValueChange={setSelectedPlan}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan: any) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - ₹{plan.price}/
                                {plan.billingCycle.toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateSubscriptionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSubscription}
                        disabled={createSubscription.isPending}
                      >
                        {createSubscription.isPending
                          ? "Creating..."
                          : "Subscribe"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {subscriptionsPending ? (
                <div className="text-center py-8">Loading subscriptions...</div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription: any) => (
                    <Card key={subscription.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>
                              {subscription.plan?.name || "Subscription"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Started:{" "}
                              {new Date(
                                subscription.startDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              subscription.status === "ACTIVE"
                                ? "default"
                                : subscription.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Appointments Used
                            </p>
                            <p className="text-lg font-semibold">
                              {subscription.appointmentsUsed} /{" "}
                              {subscription.appointmentsLimit || "∞"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Next Billing
                            </p>
                            <p className="text-lg font-semibold">
                              {subscription.nextBillingDate
                                ? new Date(
                                    subscription.nextBillingDate
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Auto Renew
                            </p>
                            <p className="text-lg font-semibold">
                              {subscription.autoRenew ? "Yes" : "No"}
                            </p>
                          </div>
                          <div>
                            {subscription.status === "ACTIVE" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleCancelSubscription(subscription.id)
                                }
                                disabled={cancelSubscription.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {subscriptions.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No subscriptions found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <h2 className="text-2xl font-bold">Invoices</h2>
              {invoicesPending ? (
                <div className="text-center py-8">Loading invoices...</div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <Card key={invoice.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{invoice.invoiceNumber}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Due:{" "}
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                invoice.status === "PAID"
                                  ? "default"
                                  : invoice.status === "OVERDUE"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {invoice.status}
                            </Badge>
                            {invoice.status !== "PAID" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoiceForPayment(invoice);
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                Pay Now
                              </Button>
                            )}
                            {invoice.status === "PAID" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const result = await generateInvoicePDF(
                                      invoice.id
                                    );
                                    if (result.pdfUrl) {
                                      window.open(result.pdfUrl, "_blank");
                                    } else {
                                      toast.error("Failed to generate PDF");
                                    }
                                  } catch (error: any) {
                                    toast.error(
                                      error.message || "Failed to generate PDF"
                                    );
                                  }
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </Button>
                            )}
                            <span className="text-2xl font-bold">
                              ₹{invoice.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {invoice.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span>{item.description}</span>
                              <span>₹{item.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                          {invoice.status === "PAID" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const result = await generateInvoicePDF(
                                    invoice.id
                                  );
                                  if (result.pdfUrl) {
                                    window.open(result.pdfUrl, "_blank");
                                  } else {
                                    toast.error("Failed to generate PDF");
                                  }
                                } catch (error: any) {
                                  toast.error(
                                    error.message || "Failed to generate PDF"
                                  );
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          )}
                          {invoice.status === "PENDING" && (
                            <Button size="sm" variant="outline">
                              <Send className="w-4 h-4 mr-2" />
                              Send via WhatsApp
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {invoices.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No invoices found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <h2 className="text-2xl font-bold">Payment History</h2>
              {paymentsPending ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <Card key={payment.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>
                              Payment #{payment.transactionId || payment.id}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {payment.paymentDate
                                ? new Date(
                                    payment.paymentDate
                                  ).toLocaleDateString()
                                : "Pending"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                payment.status === "COMPLETED"
                                  ? "default"
                                  : payment.status === "FAILED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {payment.status}
                            </Badge>
                            <span className="text-2xl font-bold">
                              ₹{payment.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Payment Method
                            </p>
                            <p className="font-semibold">{payment.method}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Currency
                            </p>
                            <p className="font-semibold">{payment.currency}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {payments.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No payments found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Payment Dialog */}
          <Dialog
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>
                  Pay invoice {selectedInvoiceForPayment?.invoiceNumber}
                </DialogDescription>
              </DialogHeader>
              {selectedInvoiceForPayment && (
                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      ₹{selectedInvoiceForPayment.amount?.toLocaleString() || "0"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You will be redirected to Razorpay secure payment gateway
                    </p>
                  </div>
                  <Suspense fallback={<div className="text-center py-4">Loading payment button...</div>}>
                    <RazorpayPaymentButton
                      invoiceId={selectedInvoiceForPayment.id}
                      amount={selectedInvoiceForPayment.amount || 0}
                      currency={selectedInvoiceForPayment.currency || "INR"}
                      description={`Payment for invoice ${selectedInvoiceForPayment.invoiceNumber}`}
                      onSuccess={async (_) => {
                        setIsPaymentDialogOpen(false);
                        setSelectedInvoiceForPayment(null);
                        toast.success("Payment completed successfully!");
                        // Refresh invoices
                        window.location.reload();
                      }}
                      onError={(error) => {
                        toast.error(error || "Payment failed");
                      }}
                      className="w-full"
                    >
                      Pay with Razorpay
                    </RazorpayPaymentButton>
                  </Suspense>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsPaymentDialogOpen(false);
                      setSelectedInvoiceForPayment(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute 
      permission={Permission.VIEW_BILLING}
      allowedRoles={[Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT]}
    >
      <BillingPageContent />
    </ProtectedRoute>
  );
}
