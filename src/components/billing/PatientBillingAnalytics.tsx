"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, CreditCard, Wallet, Receipt, AlertCircle } from "lucide-react";

interface PatientBillingAnalyticsProps {
  totalPayments: number;
  totalPaid: number;
  totalPending: number;
  activeSubscriptions: number;
  currentBalance: number;
  lastPayment?: any;
}

export function PatientBillingAnalytics({
  totalPayments,
  totalPaid,
  totalPending,
  activeSubscriptions,
  currentBalance,
  lastPayment,
}: PatientBillingAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Payments */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{totalPayments}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString()}
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
                ₹{totalPending.toLocaleString()}
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
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold">{activeSubscriptions}</p>
            </div>
            <Wallet className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Current Balance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentBalance > 0 ? '+' : ''}₹{Math.abs(currentBalance).toLocaleString()}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Last Payment */}
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Payment</p>
              {lastPayment ? (
                <div>
                  <p className="text-lg font-semibold">
                    ₹{lastPayment.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {lastPayment.method}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(lastPayment.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground">No recent payments</p>
              )}
            </div>
            <Receipt className="h-8 w-8 text-gray-600" />
          </div>
        </CardContent>
      </Card>

      {/* Payment Trend */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Payment Trend</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: '75%' }}
                    />
                  </div>
                  <span className="text-sm font-medium">This Month</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all duration-500"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <span className="text-sm font-medium">Last Month</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment activity has increased by 15% compared to last month
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
