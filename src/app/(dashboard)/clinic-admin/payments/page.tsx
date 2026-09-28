"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, IndianRupee, Loader2, Search, ShieldCheck, User } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { usePatients } from "@/hooks/query/usePatients";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useManualReconcileAppointmentPayment } from "@/hooks/query/useBilling";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

type PatientSearchResult = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
};

type ReconcilableAppointment = {
  id: string;
  date: string;
  time?: string;
  type?: string;
  status: string;
  doctorName?: string;
  paymentStatus?: string;
  paymentCompleted?: boolean;
  paymentAmount?: number;
  paymentTransactionId?: string;
};

const NON_RECONCILABLE_STATUSES = new Set(["CANCELLED", "COMPLETED"]);

function patientDisplayName(patient: PatientSearchResult): string {
  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim();
  return fullName || patient.name || patient.phone || patient.email || "Unknown patient";
}

export default function ClinicAdminPaymentsPage() {
  const { data: currentClinic } = useCurrentClinic();
  const clinicId = currentClinic?.id;

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [reconcileTarget, setReconcileTarget] = useState<ReconcilableAppointment | null>(null);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [transactionIdInput, setTransactionIdInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: patientsData, isPending: isSearching } = usePatients(
    clinicId || "",
    { search: searchTerm, limit: 10 },
    { enabled: !!clinicId && searchTerm.length >= 2 }
  );
  const patients: PatientSearchResult[] = useMemo(() => {
    const raw = (patientsData as { patients?: unknown[]; data?: unknown[] } | undefined) ?? {};
    return ((raw.patients ?? raw.data ?? (Array.isArray(patientsData) ? patientsData : [])) ??
      []) as PatientSearchResult[];
  }, [patientsData]);

  const {
    data: appointmentsData,
    isPending: isLoadingAppointments,
    refetch: refetchAppointments,
  } = useAppointments(
    selectedPatient ? { patientId: selectedPatient.id, limit: 25 } : undefined,
    { enabled: !!selectedPatient }
  );
  const patientAppointments: ReconcilableAppointment[] = useMemo(
    () => ((appointmentsData as { appointments?: unknown[] } | undefined)?.appointments ??
      []) as ReconcilableAppointment[],
    [appointmentsData]
  );

  const reconcileMutation = useManualReconcileAppointmentPayment();

  const closeDialog = () => {
    setReconcileTarget(null);
    setOrderIdInput("");
    setTransactionIdInput("");
  };

  const handleConfirmPayment = async () => {
    if (!reconcileTarget) return;
    await reconcileMutation.mutateAsync({
      appointmentId: reconcileTarget.id,
      ...(orderIdInput.trim() ? { orderId: orderIdInput.trim() } : {}),
      ...(transactionIdInput.trim() ? { transactionId: transactionIdInput.trim() } : {}),
    });
    closeDialog();
    refetchAppointments();
  };

  const columns: ColumnDef<ReconcilableAppointment>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.date}</div>
          {row.original.time && (
            <div className="text-xs text-muted-foreground">{row.original.time}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => row.original.doctorName || "—",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => row.original.type || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const paid = row.original.paymentCompleted;
        return (
          <Badge className={paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            {paid ? "Paid" : row.original.paymentStatus || "Pending"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentAmount",
      header: "Amount",
      cell: ({ row }) =>
        row.original.paymentAmount ? `₹${row.original.paymentAmount.toLocaleString("en-IN")}` : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const appointment = row.original;
        const alreadyReconciled = appointment.paymentCompleted;
        const blocked = NON_RECONCILABLE_STATUSES.has(String(appointment.status).toUpperCase());
        if (alreadyReconciled) {
          return (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="size-3.5" /> Confirmed
            </span>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={blocked}
            onClick={() => setReconcileTarget(appointment)}
            className="gap-1.5"
          >
            <ShieldCheck className="size-3.5" />
            Confirm Payment Received
          </Button>
        );
      },
    },
  ];

  return (
    <DashboardPageShell className="mx-auto max-w-6xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Clinic Admin"
        title="Payment Reconciliation"
        description="Look up a patient's appointments and confirm a payment manually when it was received at the payment provider but never recorded automatically (e.g. a missed webhook)."
      />

      <Card className="border-none bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patient by name, phone, or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-10"
            />
          </div>

          {isSearching && searchTerm.length >= 2 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Searching...
            </p>
          )}

          {!isSearching && searchTerm.length >= 2 && patients.length === 0 && (
            <p className="text-sm text-muted-foreground">No patients matched &ldquo;{searchTerm}&rdquo;.</p>
          )}

          {patients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatient(patient)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selectedPatient?.id === patient.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                  }`}
                >
                  <User className="size-3.5" />
                  {patientDisplayName(patient)}
                  {patient.phone && (
                    <span className="text-xs text-muted-foreground">{patient.phone}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <DataTable
          columns={columns}
          data={patientAppointments || []}
          emptyMessage={isLoadingAppointments ? "Loading appointments..." : "No appointments found for this patient"}
          pageSize={10}
          toolbar={
            <div className="px-1 text-sm text-muted-foreground">
              Appointments for <span className="font-medium">{patientDisplayName(selectedPatient)}</span>
            </div>
          }
        />
      )}

      <Dialog open={!!reconcileTarget} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="size-5" /> Confirm Payment Received
            </DialogTitle>
            <DialogDescription>
              This independently re-verifies the payment with the payment provider before confirming
              anything — it will not mark the appointment paid on your say-so alone. Use this only when
              you have confirmed the money was actually received (e.g. from the provider dashboard or a
              transaction receipt).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reconcile-order-id">Order ID (optional)</Label>
              <Input
                id="reconcile-order-id"
                placeholder="e.g. order_1790140447772_n4grsb"
                value={orderIdInput}
                onChange={(event) => setOrderIdInput(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reconcile-transaction-id">Transaction ID (optional)</Label>
              <Input
                id="reconcile-transaction-id"
                placeholder="e.g. 6559935603"
                value={transactionIdInput}
                onChange={(event) => setTransactionIdInput(event.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave these blank to let the system use the appointment&apos;s existing payment record. Fill
              them in only if the payment was never recorded locally at all.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={reconcileMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={reconcileMutation.isPending} className="gap-2">
              {reconcileMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
