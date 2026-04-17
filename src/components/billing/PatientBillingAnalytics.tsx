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
      <StatCard 
        label="AMOUNT PAID"
        value={`₹${totalPaid.toLocaleString("en-IN")}`}
        icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        color="bg-emerald-50/50 border-emerald-100"
      />

      {/* Pending Amount */}
      <StatCard 
        label="PENDING AMOUNT"
        value={`₹${totalPending.toLocaleString("en-IN")}`}
        icon={<AlertCircle className="w-4 h-4 text-orange-600" />}
        color="bg-orange-50/50 border-orange-100"
      />

      {/* Active Subscriptions */}
      <StatCard 
        label="ACTIVE PLAN"
        value={activeSubscriptions > 0 ? activeSubscriptions : "None"}
        icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
        color="bg-emerald-50/50 border-emerald-100"
      />

      {/* Last Payment */}
      <StatCard 
        label="LAST PAYMENT"
        value={lastPayment ? `₹${lastPayment.amount.toLocaleString("en-IN")}` : "None"}
        icon={<Receipt className="w-4 h-4 text-emerald-600" />}
        color="bg-emerald-50/50 border-emerald-100"
      />
    </div>
  );
}

// ─── Local StatCard Component ───────────────
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${color}`}>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-background/80 p-1.5 shadow-sm ring-1 ring-border/20">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
    </div>
  );
}
