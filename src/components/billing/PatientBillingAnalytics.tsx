"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle, CreditCard, Receipt } from "lucide-react";
import type { Payment } from "@/types/billing.types";

interface PatientBillingAnalyticsProps {
  totalPayments: number;
  totalPaid: number;
  totalPending: number;
  activeSubscriptions: number;
  lastPayment?: Payment;
}

export function PatientBillingAnalytics({
  totalPayments,
  totalPaid,
  totalPending,
  activeSubscriptions,
  lastPayment,
}: PatientBillingAnalyticsProps) {
  const lastPaymentDate = lastPayment?.paymentDate ?? lastPayment?.createdAt;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Amount Paid */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Pending Amount */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{totalPending.toLocaleString("en-IN")}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Plan</p>
              <p className="text-2xl font-bold">
                {activeSubscriptions > 0 ? activeSubscriptions : "None"}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Last Payment */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Last Payment</p>
              {lastPayment ? (
                <div>
                  <p className="text-lg font-semibold truncate">
                    ₹{lastPayment.amount.toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {lastPayment.method}
                    </Badge>
                    {lastPaymentDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(lastPaymentDate).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No payments yet
                </p>
              )}
            </div>
            <Receipt className="h-8 w-8 text-gray-400 shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
