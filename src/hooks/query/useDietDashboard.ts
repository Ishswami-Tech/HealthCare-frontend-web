"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryData } from "@/hooks/core/useQueryData";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { API_ENDPOINTS } from "@/lib/config/config";
import { getDietPlans } from "@/lib/actions/diet.server";

type DietPlan = {
  id: string;
  patientId: string;
  goal: string;
  createdAt?: string;
};

type Summary = {
  totalPlans: number;
  activePlans: number;
  totalFoodItems: number;
};

export function useDietDashboardData() {
  const { isConnected } = useWebSocketStatus();

  const summaryQuery = useQueryData<Summary>(
    ["diet", "dashboard", "summary"],
    async () => {
      const plans = (await getDietPlans()) as DietPlan[];
      return {
        totalPlans: Array.isArray(plans) ? plans.length : 0,
        activePlans: Array.isArray(plans) ? plans.filter((p) => !p.createdAt).length : 0,
        totalFoodItems: 0,
      };
    },
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const plansQuery = useQueryData<DietPlan[]>(
    ["diet", "plans"],
    async () => (await getDietPlans()) as DietPlan[],
    { refetchInterval: isConnected ? false : 120_000 }
  );

  return {
    summary: summaryQuery.data ?? { totalPlans: 0, activePlans: 0, totalFoodItems: 0 },
    plans: plansQuery.data ?? [],
    isLoading: summaryQuery.isPending || plansQuery.isPending,
    refetch: () => {
      summaryQuery.refetch();
      plansQuery.refetch();
    },
  };
}
