"use client";

import { AlertTriangle, CheckCircle, Clock, Package, Pill, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PharmacistDashboardStatsGridProps {
  pendingPrescriptions: number;
  awaitingPayment: number;
  dispensedToday: number;
  lowStockItems: number;
  monthlyDispensed: number;
}

function StatCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  tone: string;
}) {
  return (
    <Card className={`shadow-sm ${tone}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-tight text-slate-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

export function PharmacistDashboardStatsGrid({
  pendingPrescriptions,
  awaitingPayment,
  dispensedToday,
  lowStockItems,
  monthlyDispensed,
}: PharmacistDashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Pending"
        value={pendingPrescriptions}
        description="Prescriptions to fill"
        tone="border-slate-100"
      />
      <StatCard
        title="Payment Due"
        value={awaitingPayment}
        description="Awaiting checkout"
        tone="border-slate-100"
      />
      <StatCard
        title="Dispensed"
        value={dispensedToday}
        description="Today's total"
        tone="border-emerald-100"
      />
      <StatCard
        title="Low Stock"
        value={lowStockItems}
        description="Action required"
        tone="border-rose-100"
      />
      <StatCard
        title="Monthly"
        value={monthlyDispensed}
        description="Volume this month"
        tone="border-slate-100"
      />
    </div>
  );
}
