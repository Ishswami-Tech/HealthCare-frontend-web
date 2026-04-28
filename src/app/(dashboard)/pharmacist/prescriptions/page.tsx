"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useDispensePrescription,
  usePrescriptions,
} from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  Pill,
  Search,
  User,
} from "lucide-react";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";

type PrescriptionRow = {
  id: string;
  patientName: string;
  doctorName: string;
  prescribedAt: string;
  status: "PENDING" | "FILLED" | "CANCELLED";
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  canDispense: boolean;
  queueCategory?: string;
  queueStatus?: "PENDING" | "DISPENSED" | "CANCELLED";
  queuePosition?: number | null;
  medicines: Array<{
    name: string;
    dosage: string;
    quantity: number;
    available: boolean;
  }>;
};

function normalizePrescription(raw: any): PrescriptionRow {
  const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.medicines) ? raw.medicines : [];
  const queueEntry = normalizeQueueEntry(raw);

  return {
    id: raw.id,
    patientName:
      raw.patient?.user?.name || raw.patient?.name || raw.patientName || "Unknown Patient",
    doctorName:
      raw.doctor?.user?.name || raw.doctor?.name || raw.doctorName || "Unknown Doctor",
    prescribedAt: raw.date || raw.createdAt || new Date().toISOString(),
    status: String(raw.status || "PENDING").toUpperCase() as "PENDING" | "FILLED" | "CANCELLED",
    paymentStatus: String(raw.paymentStatus || "PENDING").toUpperCase() as
      | "PENDING"
      | "PARTIAL"
      | "PAID",
    totalAmount: Number(raw.totalAmount || 0),
    paidAmount: Number(raw.paidAmount || 0),
    pendingAmount: Number(raw.pendingAmount || 0),
    canDispense: Boolean(raw.canDispense),
    queueCategory: queueEntry.queueCategory,
    queueStatus: raw.queueStatus,
    queuePosition: queueEntry.position > 0 ? queueEntry.position : null,
    medicines: items.map((item: any) => ({
      name: item.medicine?.name || item.name || "Medicine",
      dosage: item.dosage || "As prescribed",
      quantity: Number(item.quantity || 0),
      available: Number(item.medicine?.stock || item.stock || 0) >= Number(item.quantity || 0),
    })),
  };
}

function getPrescriptionState(prescription: PrescriptionRow) {
  if (prescription.status === "FILLED") {
    return {
      key: "dispensed",
      label: "Dispensed",
      badgeClass: "bg-emerald-100 text-emerald-800",
      icon: CheckCircle,
    };
  }

  if (prescription.status === "CANCELLED") {
    return {
      key: "cancelled",
      label: "Cancelled",
      badgeClass: "bg-red-100 text-red-800",
      icon: AlertTriangle,
    };
  }

  if (!prescription.canDispense) {
    return {
      key: "awaiting_payment",
      label: "Payment pending",
      badgeClass: "bg-amber-100 text-amber-800",
      icon: CreditCard,
    };
  }

  return {
    key: "ready_to_dispense",
    label: "Ready To Dispense",
    badgeClass: "bg-blue-100 text-blue-800",
    icon: Package,
  };
}

export default function PharmacistPrescriptionsPage() {
  useAuth();
  useWebSocketQuerySync();

  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: prescriptionsData = [], isPending } = usePrescriptions(clinicId || "", {
    limit: 100,
  });
  const dispensePrescription = useDispensePrescription();

  const prescriptions = useMemo(
    () => (Array.isArray(prescriptionsData) ? prescriptionsData : []).map(normalizePrescription),
    [prescriptionsData]
  );

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) => {
      const state = getPrescriptionState(prescription);
      const matchesSearch =
        !searchTerm ||
        prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some((medicine) =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === "all" || state.key === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const activePrescriptions = filteredPrescriptions.filter(
    (prescription) => prescription.status !== "FILLED" && prescription.status !== "CANCELLED"
  );
  const historyPrescriptions = filteredPrescriptions.filter(
    (prescription) => prescription.status === "FILLED" || prescription.status === "CANCELLED"
  );

  const handleDispense = async (prescriptionId: string) => {
    await dispensePrescription.mutateAsync({
      prescriptionId,
      dispensingData: {},
    });
  };

  const activeColumns = useMemo<ColumnDef<PrescriptionRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.patientName}</span>
            <span className="text-xs text-muted-foreground">ID: {row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.doctorName}</span>,
      },
      {
        accessorKey: "prescribedAt",
        header: "Prescribed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.prescribedAt).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "State",
        cell: ({ row }) => {
          const state = getPrescriptionState(row.original);
          const StateIcon = state.icon;
          return (
            <Badge className={`${state.badgeClass} flex items-center gap-1`}>
              <StateIcon className="w-3.5 h-3.5" />
              {state.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{row.original.paymentStatus}</Badge>,
      },
      {
        accessorKey: "queuePosition",
        header: "Queue",
        cell: ({ row }) =>
          row.original.queuePosition ? (
            <Badge variant="outline">
              {getQueuePositionLabel({ position: row.original.queuePosition ?? 0 })}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "medicines",
        header: "Medicines",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.medicines.map((medicine) => medicine.name).join(", ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleDispense(row.original.id)}
              disabled={!row.original.canDispense || dispensePrescription.isPending}
            >
              <Package className="mr-2 h-4 w-4" />
              Dispense
            </Button>
          </div>
        ),
      },
    ],
    [dispensePrescription.isPending]
  );

  const historyColumns = useMemo<ColumnDef<PrescriptionRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.patientName}</span>
            <span className="text-xs text-muted-foreground">ID: {row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.doctorName}</span>,
      },
      {
        accessorKey: "prescribedAt",
        header: "Prescribed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.prescribedAt).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "State",
        cell: ({ row }) => {
          const state = getPrescriptionState(row.original);
          const StateIcon = state.icon;
          return (
            <Badge className={`${state.badgeClass} flex items-center gap-1`}>
              <StateIcon className="w-3.5 h-3.5" />
              {state.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{row.original.paymentStatus}</Badge>,
      },
      {
        accessorKey: "medicines",
        header: "Medicines",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.medicines.map((medicine) => medicine.name).join(", ")}
          </span>
        ),
      },
    ],
    []
  );

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Prescription Management</h1>
        <p className="text-gray-600">
          Payment-gated medicine handover for active clinic prescriptions
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search prescriptions, patients, doctors, medicines..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border bg-background px-3 py-2"
            >
              <option value="all">All States</option>
              <option value="awaiting_payment">Payment pending</option>
              <option value="ready_to_dispense">Ready To Dispense</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePrescriptions.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <DataTable
                  columns={activeColumns}
                  data={activePrescriptions}
                  pageSize={10}
                  emptyMessage="No active prescriptions"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <Pill className="h-10 w-10 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold">No active prescriptions</h3>
                  <p className="text-sm text-gray-500">
                    Active prescriptions awaiting payment or dispense will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyPrescriptions.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <DataTable
                  columns={historyColumns}
                  data={historyPrescriptions}
                  pageSize={10}
                  emptyMessage="No dispense history"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <CheckCircle className="h-10 w-10 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold">No dispense history</h3>
                  <p className="text-sm text-gray-500">
                    Dispensed and cancelled prescriptions will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
