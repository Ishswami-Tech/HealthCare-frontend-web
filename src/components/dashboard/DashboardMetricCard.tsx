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
  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl border-l-4 py-0 shadow-sm transition-shadow duration-300 hover:shadow-md",
        accentClassName,
        className
      )}
    >
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 px-2.5 pb-0.5", compact ? "pt-2" : "pt-3")}>
        <CardTitle className={cn("text-[10px] font-medium uppercase tracking-wide text-muted-foreground", labelClassName)}>
          {label}
        </CardTitle>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </CardHeader>
      <CardContent className={cn("px-2.5 pt-0", compact ? "pb-2" : "pb-3")}>
        <div className={cn("font-semibold leading-none", valueClassName)}>{value}</div>
        {subtext ? <p className="mt-1 text-[11px] text-muted-foreground">{subtext}</p> : null}
      </CardContent>
    </Card>
  );
}
