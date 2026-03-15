"use client";

import { Payment } from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface PaymentHistoryProps {
  payments: Payment[];
  onRefetch?: (() => void) | undefined;
  /** When true (patient view), hides the internal summary stat cards */
  compact?: boolean;
}

function statusVariant(status: Payment["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "COMPLETED") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "secondary";
}

export function PaymentHistory({ payments, onRefetch, compact = false }: PaymentHistoryProps) {
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalCompleted = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary stat cards — hidden in compact/patient mode to avoid duplication */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Paid (Completed)</p>
              <p className="text-2xl font-bold">INR {totalCompleted.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedPayments.length}</p>
              </div>
              {onRefetch && (
                <Button variant="outline" size="sm" onClick={() => onRefetch()}>
                  Refresh
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact mode refresh button */}
      {compact && onRefetch && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onRefetch()}>
            Refresh
          </Button>
        </div>
      )}

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
              {payments.map((payment) => {
                const paymentDate = payment.paymentDate ?? payment.createdAt;
                return (
                  <div key={payment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {payment.transactionId || `Payment #${payment.id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentDate
                            ? new Date(paymentDate).toLocaleString("en-IN")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">INR {payment.amount.toLocaleString("en-IN")}</p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                          <Badge variant="outline">{payment.method}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download receipt"
                            onClick={() => {
                              const lines = [
                                "===== PAYMENT RECEIPT =====",
                                `Payment ID  : ${payment.id}`,
                                `Transaction : ${payment.transactionId || "N/A"}`,
                                `Amount      : INR ${payment.amount.toLocaleString("en-IN")}`,
                                `Method      : ${payment.method}`,
                                `Status      : ${payment.status}`,
                                `Date        : ${paymentDate ? new Date(paymentDate).toLocaleString("en-IN") : "N/A"}`,
                                "===========================",
                              ];
                              const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `receipt-${payment.id}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
