"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Receipt, AlertTriangle, CreditCard, Clock } from "lucide-react";
import type { Payment } from "@/types/billing.types";

interface PatientBillingAnalyticsProps {
  totalPayments: number;
  totalPaid: number;
  totalPending: number;
  activeSubscriptions: number;
  currentBalance: number;
  lastPayment?: Payment;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  NET_BANKING: "Net Banking",
  WALLET: "Wallet",
  CHEQUE: "Cheque",
};

export function PatientBillingAnalytics({
  totalPaid,
  totalPending,
  activeSubscriptions,
  lastPayment,
}: PatientBillingAnalyticsProps) {
  const lastPaymentDate = lastPayment?.paymentDate || lastPayment?.createdAt;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Subscription Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Subscription
          </p>
          <div className="flex items-center gap-2">
            {activeSubscriptions > 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Active
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-semibold text-muted-foreground">No plan</span>
              </>
            )}
          </div>
          {activeSubscriptions === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Subscribe to book in-person appointments
            </p>
          )}
        </CardContent>
      </Card>

      {/* Amount Paid */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Total Paid
          </p>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500 shrink-0" />
            <span className="text-xl font-bold">
              ₹{(totalPaid ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Amount */}
      <Card className={`border-l-4 ${totalPending > 0 ? "border-l-yellow-500" : "border-l-muted"}`}>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Pending Dues
          </p>
          <div className="flex items-center gap-2">
            {totalPending > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <span className={`text-xl font-bold ${totalPending > 0 ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
              ₹{(totalPending ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          {totalPending > 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Payment due</p>
          )}
        </CardContent>
      </Card>

      {/* Last Payment */}
      <Card className="border-l-4 border-l-slate-400">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Last Payment
          </p>
          {lastPayment ? (
            <div>
              <div className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xl font-bold">
                  ₹{(lastPayment.amount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {METHOD_LABELS[lastPayment.method] ?? lastPayment.method}
                </Badge>
                {lastPaymentDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(lastPaymentDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
