"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Payment } from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

interface PaymentHistoryProps {
  payments: Payment[];
  onRefetch?: (() => void) | undefined;
  compact?: boolean;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${color}`}>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-background/80 p-1.5 shadow-sm ring-1 ring-border/20">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
      </div>
    </div>
  );
}

function getStatusClasses(status: string): string {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "COMPLETED") return "bg-emerald-500 text-white";
  if (normalized === "FAILED") return "bg-red-500 text-white";
  if (normalized === "REFUNDED") return "bg-blue-500 text-white";
  return "bg-slate-500 text-white";
}

export function PaymentHistory({ payments, onRefetch, compact = false }: PaymentHistoryProps) {
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalCompleted = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "transactionId",
        header: "Transaction",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.transactionId || `Payment #${row.original.id.slice(-6).toUpperCase()}`}
            </span>
            <span className="text-xs text-muted-foreground">{row.original.method}</span>
          </div>
        ),
      },
      {
        accessorKey: "paymentDate",
        header: "Date",
        cell: ({ row }) => {
          const paymentDate = row.original.paymentDate ?? row.original.createdAt;
          return (
            <span className="text-sm text-muted-foreground">
              {paymentDate
                ? new Date(paymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.patientName || "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">INR {(row.original.amount || 0).toLocaleString("en-IN")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${getStatusClasses(String(row.original.status || "PENDING"))}`}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="TOTAL PAYMENTS"
            value={payments.length}
            icon={<FileText className="w-4 h-4 text-sky-600 dark:text-sky-300" />}
            color="border-sky-200/70 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30"
          />
          <StatCard
            label="TOTAL PAID (COMPLETED)"
            value={`INR ${totalCompleted.toLocaleString("en-IN")}`}
            icon={<CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
            color="border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
          />
          <StatCard
            label="COMPLETED COUNT"
            value={completedPayments.length}
            icon={<RefreshCw className="w-4 h-4 text-violet-600 dark:text-violet-300" />}
            color="border-violet-200/70 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/30"
          />
        </div>
      )}

      <Card className="border-border/70 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-extrabold text-foreground">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payments}
            pageSize={10}
            emptyMessage="No payment records found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
