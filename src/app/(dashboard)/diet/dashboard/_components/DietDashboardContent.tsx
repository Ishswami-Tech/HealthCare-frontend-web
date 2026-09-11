"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Calendar, ChefHat, ClipboardList } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { DietSummaryCards } from "./DietSummaryCards";
import { useDietDashboardData } from "@/hooks/query/useDietDashboard";

export default function DietDashboardContent() {
  const data = useDietDashboardData();

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Diet & Nutrition"
        title="Nutrition Workspace"
        description="Manage diet plans, food catalogs, and nutritional recommendations for patients."
        meta={data.summary}
        actions={[
          { label: "New Plan", href: "/diet/dashboard#plans", icon: <ClipboardList className="size-4" /> },
          { label: "Food Catalog", href: "/diet/dashboard#catalog", icon: <Apple className="size-4" /> },
        ]}
      />

      <DietSummaryCards summary={data.summary} isLoading={data.isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="plans">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Recent Diet Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No diet plans created yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.plans.slice(0, 5).map((plan) => (
                  <li key={plan.id} className="rounded border p-3">
                    <p className="text-sm font-semibold capitalize">Goal: {plan.goal}</p>
                    <p className="text-xs text-muted-foreground">
                      Patient: {plan.patientId}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card id="catalog">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="size-4" />
              Food Catalog Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse and manage the food catalog for diet plan creation.
              Use the food catalog to check nutritional values and Ayurvedic compatibility.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
