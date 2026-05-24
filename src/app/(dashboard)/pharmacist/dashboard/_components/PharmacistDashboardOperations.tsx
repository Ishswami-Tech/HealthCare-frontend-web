"use client";

import { AlertTriangle, Clock, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PharmacistDashboardOperationsProps {
  onOpenInventory: () => void;
  onOpenAnalytics: () => void;
  onOpenHistory: () => void;
  onOpenExpiry: () => void;
}

export function PharmacistDashboardOperations({
  onOpenInventory,
  onOpenAnalytics,
  onOpenHistory,
  onOpenExpiry,
}: PharmacistDashboardOperationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pharmacy Operations</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex h-20 flex-col items-center justify-center gap-1 border-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
          onClick={onOpenInventory}
        >
          <Package className="size-5 text-emerald-600" />
          <span className="text-[11px] font-medium text-slate-600">Inventory</span>
        </Button>
        <Button
          variant="outline"
          className="flex h-20 flex-col items-center justify-center gap-1 border-slate-100 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          onClick={onOpenAnalytics}
        >
          <TrendingUp className="size-5 text-blue-600" />
          <span className="text-[11px] font-medium text-slate-600">Analytics</span>
        </Button>
        <Button
          variant="outline"
          className="flex h-20 flex-col items-center justify-center gap-1"
          onClick={onOpenHistory}
        >
          <Clock className="size-5 text-amber-600" />
          <span className="text-[10px]">History</span>
        </Button>
        <Button
          variant="outline"
          className="flex h-20 flex-col items-center justify-center gap-1"
          onClick={onOpenExpiry}
        >
          <AlertTriangle className="size-5 text-red-600" />
          <span className="text-[10px]">Expiry</span>
        </Button>
      </CardContent>
    </Card>
  );
}
