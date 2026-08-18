"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatCardSkeletonProps = {
  icon: ReactNode;
  label: string;
  className?: string;
};

export function StatCardSkeleton({ icon, label, className }: StatCardSkeletonProps) {
  return (
    <Card className={cn("border-border bg-muted/20 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-0 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="size-7 rounded-xl bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="px-0">
        <div className="h-7 w-20 rounded bg-muted animate-pulse" />
        <div className="mt-1 h-2.5 w-28 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

type TableSkeletonProps = {
  columns: string[];
  rows?: number;
  className?: string;
  showPagination?: boolean;
};

export function TableSkeleton({ columns, rows = 3, className, showPagination = true }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-muted/20 shadow-none", className)}>
      <div className="border-b border-border px-4 py-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((column) => (
            <div key={column} className="text-sm font-semibold text-foreground">
              {column}
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {columns.map((column, columnIndex) => {
                const isStatusColumn = /status|state|type|payment/i.test(column);
                return (
                  <div key={`${rowIndex}-${column}`} className="flex min-h-8 items-center">
                    <div
                      className={cn(
                        "h-4 rounded bg-muted animate-pulse",
                        isStatusColumn ? "w-14 rounded-full" : columnIndex === 0 ? "w-24" : "w-20"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {showPagination ? (
        <div className="border-t border-border bg-muted/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 rounded-lg px-3">
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled className="h-8 rounded-lg px-3">
                Next
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Page 1 of 1</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type AppointmentListSkeletonProps = {
  className?: string;
  items?: number;
};

export function AppointmentListSkeleton({ className, items = 3 }: AppointmentListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} className="border-border bg-muted/20 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-full bg-muted animate-pulse" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
                <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border bg-muted/20 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-0 pb-2">
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="size-7 rounded-xl bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-7 w-20 rounded bg-muted animate-pulse" />
              <div className="mt-1 h-2.5 w-28 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-muted/20 shadow-none">
        <div className="border-b border-border px-4 py-3">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <TableSkeleton columns={["", "", "", ""]} rows={3} showPagination={false} />
        </div>
      </div>
    </div>
  );
}

export function BillingPageSkeleton({ columns = ["Date", "Description", "Status", "Amount"] }: { columns?: string[] }) {
  return (
    <div className="space-y-4">
      <TableSkeleton columns={columns} />
    </div>
  );
}
