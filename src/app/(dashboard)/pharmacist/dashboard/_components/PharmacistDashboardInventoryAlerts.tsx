"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type InventoryItem = {
  id?: string;
  name?: string;
  medicineName?: string;
  currentStock?: number;
  quantity?: number;
  minStock?: number;
  minThreshold?: number;
  unit?: string;
};

interface PharmacistDashboardInventoryAlertsProps {
  inventoryItems: InventoryItem[];
  lowStockCount: number;
  onRestock: (itemId: string, itemName: string) => void;
}

export function PharmacistDashboardInventoryAlerts({
  inventoryItems,
  lowStockCount,
  onRestock,
}: PharmacistDashboardInventoryAlertsProps) {
  const lowStockItems = inventoryItems
    .reduce<InventoryItem[]>((items, item) => {
      if ((item.currentStock || item.quantity || 0) < (item.minStock || item.minThreshold || 0)) {
        items.push(item);
      }
      return items;
    }, [])
    .slice(0, 3);

  return (
    <Card className="border-red-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-700">
          <AlertTriangle className="size-4" />
          Inventory Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="gap-y-4">
          {lowStockItems.map((item) => (
            <div
              key={item.id || item.name || item.medicineName}
              className="flex items-center justify-between rounded-md border border-red-100 bg-red-50 p-3 text-sm"
            >
              <div>
                <p className="font-semibold text-red-900">{item.name || item.medicineName}</p>
                <p className="text-xs text-red-700">
                  Stock: {item.currentStock || item.quantity} {item.unit || "units"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-red-200 text-xs text-red-700 hover:bg-red-100"
                onClick={() => onRestock(item.id || item.name || "", item.name || item.medicineName || "")}
              >
                Restock
              </Button>
            </div>
          ))}
          {lowStockCount === 0 && (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <AlertTriangle className="size-5" />
                </EmptyMedia>
                <EmptyTitle>All inventory levels normal</EmptyTitle>
                <EmptyDescription>
                  Nothing is below the configured low-stock threshold right now.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
