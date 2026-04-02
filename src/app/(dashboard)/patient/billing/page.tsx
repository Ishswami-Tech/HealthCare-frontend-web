"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useInvoices,
  usePayments,
  useSubscriptions,
} from "@/hooks/query/useBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CreditCard, Wallet, ExternalLink } from "lucide-react";
import { PaymentButton } from "@/components/payments";
import { useLayoutStore } from "@/stores/layout.store";

export default function PatientBillingPage() {
  const { session } = useAuth();
  const router = useRouter();
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);

  useEffect(() => {
    setPageTitle("My Billing & Payments");
  }, [setPageTitle]);

  const userId = session?.user?.id || "";

  const { data: invoices = [], isPending: invoicesPending } = useInvoices(userId);
  const { data: payments = [], isPending: paymentsPending } = usePayments(userId);
  const { data: subscriptions = [], isPending: subscriptionsPending } = useSubscriptions(userId);

  const openInvoices = invoices.filter(
    (inv) => inv.status === "OPEN" || inv.status === "OVERDUE"
  );

  function statusColor(status: string) {
    switch (status?.toUpperCase()) {
      case "PAID": return "bg-green-100 text-green-700 border-green-200";
      case "OPEN": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "OVERDUE": return "bg-red-100 text-red-700 border-red-200";
      case "DRAFT": return "bg-gray-100 text-gray-700 border-gray-200";
      case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Invoices</p>
              <p className="text-2xl font-bold">{openInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{(payments as any[]).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold">
                {(subscriptions as any[]).filter((s) => s.status === "ACTIVE").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-3 mt-4">
          {invoicesPending ? (
            <p className="text-sm text-muted-foreground">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No invoices found.
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Invoice #{invoice.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                    </p>
                    <Badge variant="outline" className={statusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-semibold">{formatAmount(invoice.amount)}</p>
                    {(invoice.status === "OPEN" || invoice.status === "OVERDUE") && (
                      <PaymentButton
                        invoiceId={invoice.id}
                        amount={invoice.amount}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-3 mt-4">
          {paymentsPending ? (
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          ) : (payments as any[]).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No payment history found.
              </CardContent>
            </Card>
          ) : (
            (payments as any[]).map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {payment.method || "Payment"} — #{payment.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.createdAt ? formatDate(payment.createdAt) : "—"}
                    </p>
                    {payment.transactionId && (
                      <p className="text-xs text-muted-foreground">
                        Txn: {payment.transactionId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      {formatAmount(payment.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={statusColor(payment.status || "COMPLETED")}
                    >
                      {payment.status || "COMPLETED"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="space-y-3 mt-4">
          {subscriptionsPending ? (
            <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
          ) : (subscriptions as any[]).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No active subscriptions. Contact the clinic to subscribe to a plan.
              </CardContent>
            </Card>
          ) : (
            (subscriptions as any[]).map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{sub.planName || "Subscription Plan"}</p>
                    <p className="text-sm text-muted-foreground">
                      Valid: {sub.startDate ? formatDate(sub.startDate) : "—"} —{" "}
                      {sub.endDate ? formatDate(sub.endDate) : "Ongoing"}
                    </p>
                    <Badge variant="outline" className={statusColor(sub.status)}>
                      {sub.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {sub.amount != null && (
                      <p className="text-lg font-semibold">{formatAmount(sub.amount)}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {sub.remainingVisits != null
                        ? `${sub.remainingVisits} visits remaining`
                        : "Unlimited visits"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.push("/billing")}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Full Billing Dashboard
        </Button>
      </div>
    </div>
  );
}
