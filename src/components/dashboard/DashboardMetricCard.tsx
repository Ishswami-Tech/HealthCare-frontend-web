"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  subtext?: string;
  accentClassName?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  compact?: boolean;
}

export function DashboardMetricCard({
  label,
  value,
  icon,
  subtext,
  accentClassName,
  className,
  labelClassName,
  valueClassName,
  compact = false,
}: DashboardMetricCardProps) {
  // Design "kpi": label, big number, small line under it, icon on the right.
  // `accentClassName` is kept for existing call sites; the coloured left edge is gone.
  return (
    <Card
      className={cn(
        "flex-row items-center gap-3.5 rounded-[18px] transition-shadow duration-300 hover:shadow-md",
        compact ? "px-4 py-3" : "px-[18px] py-4",
        accentClassName,
        className
      )}
    >
      <CardContent className="flex min-w-0 flex-1 flex-col gap-0.5 p-0">
        <CardHeader className="block p-0">
          <CardTitle className={cn("truncate text-xs font-bold leading-tight text-ink-muted", labelClassName)}>
            {label}
          </CardTitle>
        </CardHeader>
        <div className={cn("truncate text-[26px] font-extrabold leading-[1.15] text-ink", valueClassName)}>{value}</div>
        {subtext ? <p className="truncate text-xs text-ink-muted">{subtext}</p> : null}
      </CardContent>
      {icon ? <div className="shrink-0">{icon}</div> : null}
    </Card>
  );
}
