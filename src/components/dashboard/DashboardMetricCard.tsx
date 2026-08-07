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
        "group relative gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
        accentClassName,
        className
      )}
    >
      {/* Top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Soft corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10" />

      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between gap-x-2 px-3.5 pb-0.5",
          compact ? "pt-2.5" : "pt-3.5"
        )}
      >
        <CardTitle
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
            labelClassName
          )}
        >
          {label}
        </CardTitle>
        {icon ? (
          <div className="shrink-0 rounded-lg bg-primary/8 p-1.5 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/12">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className={cn("px-3.5 pt-1", compact ? "pb-2.5" : "pb-3.5")}>
        <div
          className={cn(
            "font-bold leading-none tracking-tight text-foreground",
            valueClassName
          )}
        >
          {value}
        </div>
        {subtext ? (
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            {subtext}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
