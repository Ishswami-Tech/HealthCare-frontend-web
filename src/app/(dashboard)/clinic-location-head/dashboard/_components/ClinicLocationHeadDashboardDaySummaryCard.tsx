"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users } from "lucide-react";
import type { ClinicLocationHeadDashboardStats } from "./clinic-location-head-dashboard.types";

interface ClinicLocationHeadDashboardDaySummaryCardProps {
  stats: ClinicLocationHeadDashboardStats;
}

export function ClinicLocationHeadDashboardDaySummaryCard({
  stats,
}: ClinicLocationHeadDashboardDaySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-slate-500" />
          Day Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Completed</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle className="size-3" /> {stats.completed}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">In progress</span>
          <span className="font-semibold text-blue-600">{stats.inProgress}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Queue waiting</span>
          <span className="font-semibold text-amber-600">{stats.waiting}</span>
        </div>
        {stats.totalToday > 0 && (
          <div className="border-t pt-2">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion rate</span>
              <span>{Math.round((stats.completed / stats.totalToday) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.round((stats.completed / stats.totalToday) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
