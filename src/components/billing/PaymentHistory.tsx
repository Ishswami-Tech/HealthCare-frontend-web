"use client";

import { Payment } from "@/types/billing.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, CreditCard, RefreshCw } from "lucide-react";

interface PaymentHistoryProps {
  payments: Payment[];
  onRefetch?: (() => void) | undefined;
  /** When true (patient view), hides the internal summary stat cards */
  compact?: boolean;
}

function statusVariant(status: Payment["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "COMPLETED") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "secondary";
}

// ─── Local StatCard Component ───────────────
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
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
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
    </div>
  );
}

export function PaymentHistory({ payments, onRefetch, compact = false }: PaymentHistoryProps) {
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalCompleted = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary stat cards — hidden in compact/patient mode */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="TOTAL PAYMENTS"
            value={payments.length}
            icon={<FileText className="w-4 h-4 text-blue-600" />}
            color="bg-blue-50/50 border-blue-100"
          />
          <StatCard 
            label="TOTAL PAID (COMPLETED)"
            value={`₹${totalCompleted.toLocaleString("en-IN")}`}
            icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            color="bg-emerald-50/50 border-emerald-100"
          />
          <StatCard 
            label="COMPLETED COUNT"
            value={completedPayments.length}
            icon={<RefreshCw className="w-4 h-4 text-purple-600" />}
            color="bg-purple-50/50 border-purple-100"
          />
        </div>
      )}


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-extrabold text-slate-800">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
              <p className="font-semibold text-sm">No payment records found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {payments.map((payment) => {
                const paymentDate = payment.paymentDate ?? payment.createdAt;
                const status = payment.status;
                const isCompleted = status === "COMPLETED";
                const isFailed = status === "FAILED";
                const isRefunded = status === "REFUNDED";

                return (
                  <Card key={payment.id} className="rounded-2xl border-slate-200/50 shadow-sm hover:shadow-md hover:border-[#006951]/30 transition-all ring-1 ring-slate-100 group">
                    <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                          isCompleted 
                            ? 'bg-emerald-50 border-emerald-100/60 text-[#006951] group-hover:bg-emerald-100/60' 
                            : isFailed 
                              ? 'bg-red-50 border-red-100/60 text-red-600 group-hover:bg-red-100/60' 
                              : 'bg-slate-50 border-slate-100/60 text-slate-500 group-hover:bg-slate-100/60'
                        }`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-base leading-none group-hover:text-[#006951] transition-colors truncate max-w-[200px] sm:max-w-none">
                            {payment.transactionId || `Payment #${payment.id.slice(-6).toUpperCase()}`}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-tight">
                            <span className="opacity-70">{paymentDate ? new Date(paymentDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Date unavailable"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                        <div className="flex flex-col sm:items-end">
                          <p className="font-extrabold text-slate-900 text-xl tracking-tight">₹{payment.amount.toLocaleString("en-IN")}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${
                              isCompleted ? 'bg-emerald-500 text-white' :
                              isFailed ? 'bg-red-500 text-white' :
                              isRefunded ? 'bg-blue-500 text-white' :
                              'bg-slate-500 text-white'
                            }`}>
                              {status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                          title="Download receipt"
                          onClick={() => {
                            const lines = [
                              "===== PAYMENT RECEIPT =====",
                              `Payment ID  : ${payment.id}`,
                              `Transaction : ${payment.transactionId || "N/A"}`,
                              `Amount      : INR ${payment.amount.toLocaleString("en-IN")}`,
                              `Method      : ${payment.method}`,
                              `Status      : ${payment.status}`,
                              `Date        : ${paymentDate ? new Date(paymentDate).toLocaleString("en-IN") : "N/A"}`,
                              "===========================",
                            ];
                            const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `receipt-${payment.id}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
