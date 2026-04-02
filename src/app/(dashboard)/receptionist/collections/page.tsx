"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useClinicInvoices,
  useClinicPayments,
} from "@/hooks/query/useBilling";
import { markInvoiceAsPaid } from "@/lib/actions/billing.server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, CreditCard, Search, CheckCircle, RefreshCw } from "lucide-react";
import { PaymentButton } from "@/components/payments";
import { InvoiceForm } from "@/components/billing/InvoiceForm";
import { useLayoutStore } from "@/stores/layout.store";
import { useToast } from "@/hooks/utils/use-toast";

export default function ReceptionistCollectionsPage() {
  const { session } = useAuth();
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle("Collections & Payments");
  }, [setPageTitle]);

  const {
    data: invoices = [],
    isPending: invoicesPending,
    refetch: refetchInvoices,
  } = useClinicInvoices(true);

  const {
    data: payments = [],
    isPending: paymentsPending,
    refetch: refetchPayments,
  } = useClinicPayments(undefined, true);

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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

  async function handleMarkPaid(invoiceId: string) {
    setMarkingPaidId(invoiceId);
    try {
      const result = await markInvoiceAsPaid(invoiceId);
      if (result.success) {
        toast({ title: "Invoice marked as paid" });
        void refetchInvoices();
      } else {
        toast({ title: result.error || "Failed to mark invoice as paid", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to mark invoice as paid", variant: "destructive" });
    } finally {
      setMarkingPaidId(null);
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return !q || inv.id.toLowerCase().includes(q) || (inv.patientName ?? "").toLowerCase().includes(q);
  });

  const filteredPayments = (payments as any[]).filter((pay) => {
    const q = search.toLowerCase();
    return (
      !q ||
      pay.id.toLowerCase().includes(q) ||
      (pay.patientName || "").toLowerCase().includes(q) ||
      (pay.transactionId || "").toLowerCase().includes(q)
    );
  });

  const openInvoices = filteredInvoices.filter(
    (inv) => inv.status === "OPEN" || inv.status === "OVERDUE"
  );
  const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const todayPayments = filteredPayments.filter((pay) => {
    if (!pay.createdAt) return false;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const payDay = new Date(pay.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return today === payDay;
  });

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
              <p className="text-xs text-muted-foreground">{formatAmount(totalOpenAmount)} pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s Collections</p>
              <p className="text-2xl font-bold">{todayPayments.length}</p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(todayPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{filteredInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient or invoice ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreateInvoice(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => { void refetchInvoices(); void refetchPayments(); }}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSuccess={() => {
              setShowCreateInvoice(false);
              void refetchInvoices();
            }}
            onCancel={() => setShowCreateInvoice(false)}
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">
            Invoices
            {openInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 rounded-full px-1 text-xs">
                {openInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Invoices tab */}
        <TabsContent value="invoices" className="space-y-3 mt-4">
          {invoicesPending ? (
            <p className="text-sm text-muted-foreground">Loading invoices...</p>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No invoices found.
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">Invoice #{invoice.id.slice(-8).toUpperCase()}</p>
                    {invoice.patientName && (
                      <p className="text-sm text-muted-foreground">Patient: {invoice.patientName}</p>
                    )}
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
                      <div className="flex gap-2">
                        <PaymentButton
                          invoiceId={invoice.id}
                          amount={invoice.amount}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                          disabled={markingPaidId === invoice.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payments tab */}
        <TabsContent value="payments" className="space-y-3 mt-4">
          {paymentsPending ? (
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          ) : filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No payments found.
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment: any) => (
              <Card key={payment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {payment.method || "Payment"} — #{payment.id.slice(-8).toUpperCase()}
                    </p>
                    {payment.patientName && (
                      <p className="text-sm text-muted-foreground">
                        Patient: {payment.patientName}
                      </p>
                    )}
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
      </Tabs>
    </div>
  );
}
