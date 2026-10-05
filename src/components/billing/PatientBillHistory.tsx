"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, FileText, IndianRupee, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { RecordInvoicePaymentDialog } from "@/components/billing/RecordInvoicePaymentDialog";
import { usePatientBills } from "@/hooks/query/usePatientBilling";
import { API_ENDPOINTS } from "@/lib/config/config";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { PatientBillRow } from "@/types/billing.types";

interface PatientBillHistoryProps {
  clinicId: string;
  patientId: string;
  /** User.id of the patient — only used to label the "Pay online" description. */
  patientUserId?: string;
}

const TYPE_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "IPD", label: "IPD" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
  { value: "REFUNDED", label: "Refunded" },
];

function formatMoney(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-500 text-white";
    case "PARTIAL":
      return "bg-amber-500 text-white";
    case "VOID":
      return "bg-slate-400 text-white";
    case "REFUNDED":
      return "bg-blue-500 text-white";
    default:
      return "bg-orange-500 text-white";
  }
}

function typeBadgeClass(billType: string): string {
  switch (billType) {
    case "CONSULTATION":
      return "border-sky-300 text-sky-700 dark:text-sky-300";
    case "PHARMACY":
      return "border-violet-300 text-violet-700 dark:text-violet-300";
    default:
      return "border-border text-muted-foreground";
  }
}

function SummaryChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-background/80 p-1.5 shadow-sm ring-1 ring-border/20">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
    </div>
  );
}

/**
 * Per-patient Bill History tab: consultation + pharmacy invoices (and any
 * other bill type) merged with legacy orphan payments, newest first.
 * Backend: GET /billing/patients/:patientId/bills
 */
export function PatientBillHistory({ clinicId, patientId }: PatientBillHistoryProps) {
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collectRow, setCollectRow] = useState<PatientBillRow | null>(null);

  const filters = useMemo(
    () => ({
      ...(type !== "ALL" ? { type } : {}),
      ...(status !== "ALL" ? { status } : {}),
      limit: 50,
    }),
    [type, status],
  );

  const { data, isPending, refetch } = usePatientBills(clinicId, patientId, filters);
  const rows = data?.rows ?? [];
  const summary = data?.summary ?? { totalBilled: 0, totalPaid: 0, outstanding: 0 };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryChip
          label="Total billed"
          value={formatMoney(summary.totalBilled)}
          icon={<FileText className="size-4 text-sky-600 dark:text-sky-300" />}
        />
        <SummaryChip
          label="Total paid"
          value={formatMoney(summary.totalPaid)}
          icon={<IndianRupee className="size-4 text-emerald-600 dark:text-emerald-300" />}
        />
        <SummaryChip
          label="Outstanding"
          value={formatMoney(summary.outstanding)}
          icon={<Wallet className="size-4 text-amber-600 dark:text-amber-300" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 bg-card">
        <CardHeader className="p-2 pb-0 sm:p-4 sm:pb-0">
          <CardTitle className="text-lg font-extrabold text-foreground">Bills</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-3 pt-3 sm:p-4">
          {isPending ? (
            <p className="p-4 text-sm text-muted-foreground">Loading bill history…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No bills found for this patient yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Date</TableHead>
                  <TableHead>Bill no.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const expanded = expandedId === row.id;
                  const canCollect =
                    row.source === "INVOICE" && row.balance > 0 && row.status !== "VOID";
                  return (
                    <Fragment key={row.id}>
                      <TableRow>
                        <TableCell>
                          {row.payments.length > 0 ? (
                            <button
                              type="button"
                              aria-label={expanded ? "Collapse payments" : "Expand payments"}
                              onClick={() => setExpandedId(expanded ? null : row.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {expanded ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateInIST(row.date, { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">
                          {row.invoiceNumber || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass(row.billType)}`}
                          >
                            {row.billType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.opdNumber || "—"}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                          {row.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatMoney(row.total)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatMoney(row.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatMoney(row.balance)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusBadgeClass(row.status)}`}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {canCollect ? (
                              <Button size="sm" variant="outline" onClick={() => setCollectRow(row)}>
                                Collect
                              </Button>
                            ) : null}
                            {canCollect ? (
                              <PaymentButton
                                invoiceId={row.id}
                                amount={row.balance}
                                clinicId={clinicId}
                                description={`Bill ${row.invoiceNumber ?? row.id}`}
                                className="h-8 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                Pay online
                              </PaymentButton>
                            ) : null}
                            {row.downloadable ? (
                              <a
                                href={API_ENDPOINTS.BILLING.INVOICES.DOWNLOAD(row.id)}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                <Download className="size-3.5" />
                                PDF
                              </a>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow>
                          <TableCell />
                          <TableCell colSpan={10} className="bg-muted/30">
                            <div className="flex flex-col gap-y-1 py-2">
                              {row.payments.map((payment) => (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between text-xs text-muted-foreground"
                                >
                                  <span>
                                    {formatDateInIST(payment.createdAt, {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    · {payment.method || "—"}
                                    {payment.transactionId ? ` · ${payment.transactionId}` : ""}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">
                                      {payment.status}
                                    </Badge>
                                    <span className="font-semibold text-foreground">
                                      {formatMoney(payment.amount)}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {collectRow ? (
        <RecordInvoicePaymentDialog
          clinicId={clinicId}
          invoiceId={collectRow.id}
          invoiceNumber={collectRow.invoiceNumber}
          balance={collectRow.balance}
          open={Boolean(collectRow)}
          onOpenChange={(next) => {
            if (!next) setCollectRow(null);
          }}
          onRecorded={() => {
            setCollectRow(null);
            void refetch();
          }}
        />
      ) : null}
    </div>
  );
}
