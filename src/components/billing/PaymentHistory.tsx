"use client";

import { Payment } from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface PaymentHistoryProps {
  payments: Payment[];
  onRefetch?: (() => void) | undefined;
}

function statusVariant(status: Payment["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "COMPLETED") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "secondary";
}

export function PaymentHistory({ payments, onRefetch }: PaymentHistoryProps) {
  const total = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">INR {total.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {payments.filter((p) => p.status === "COMPLETED").length}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onRefetch && onRefetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              No payment records found
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {payment.transactionId || `Payment #${payment.id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleString("en-IN")
                          : new Date(payment.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold">INR {(payment.amount ?? 0).toLocaleString("en-IN")}</p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                        <Badge variant="outline">{payment.method}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
