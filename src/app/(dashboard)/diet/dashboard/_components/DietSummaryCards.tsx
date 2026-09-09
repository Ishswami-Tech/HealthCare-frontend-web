"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Apple, Calendar, ClipboardList, ChefHat } from "lucide-react";

type Summary = {
  totalPlans: number;
  activePlans: number;
  totalFoodItems: number;
};

export function DietSummaryCards({ summary, isLoading }: { summary: Summary; isLoading: boolean }) {
  const items = [
    { label: "Total Plans", value: summary.totalPlans, Icon: ClipboardList },
    { label: "Active Plans", value: summary.activePlans, Icon: Calendar },
    { label: "Food Items", value: summary.totalFoodItems, Icon: Apple },
    { label: "Recipes", value: 0, Icon: ChefHat },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "…" : value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
