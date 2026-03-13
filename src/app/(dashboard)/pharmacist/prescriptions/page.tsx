"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      label: "Awaiting Payment",
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

  const renderPrescriptionCard = (prescription: PrescriptionRow, allowDispense: boolean) => {
    const state = getPrescriptionState(prescription);
    const StateIcon = state.icon;

    return (
      <Card key={prescription.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{prescription.patientName}</h3>
                <p className="text-sm text-gray-600">{prescription.doctorName}</p>
                <p className="text-xs text-gray-500">Prescription ID: {prescription.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${state.badgeClass} flex items-center gap-1`}>
                <StateIcon className="w-3.5 h-3.5" />
                {state.label}
              </Badge>
              <Badge variant="outline">{prescription.paymentStatus}</Badge>
              {prescription.queuePosition ? (
                <Badge variant="outline">
                  {getQueuePositionLabel({ position: prescription.queuePosition ?? 0 })}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(prescription.prescribedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>
                Paid ₹{prescription.paidAmount.toLocaleString()} / ₹
                {prescription.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{prescription.queueCategory || "MEDICINE_DESK"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Medicines ({prescription.medicines.length})</h4>
            {prescription.medicines.map((medicine, index) => (
              <div
                key={`${prescription.id}-${index}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{medicine.name}</span>
                    {!medicine.available ? (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600">{medicine.dosage}</p>
                </div>
                <span className="text-sm text-gray-500">{medicine.quantity}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm">
            {prescription.pendingAmount > 0 ? (
              <p className="text-amber-700">
                Prescription payment is pending. Remaining amount: ₹
                {prescription.pendingAmount.toLocaleString()}
              </p>
            ) : (
              <p className="text-emerald-700">
                Payment received. Medicine handover can be completed.
              </p>
            )}
          </div>

          {allowDispense ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleDispense(prescription.id)}
                disabled={!prescription.canDispense || dispensePrescription.isPending}
              >
                <Package className="mr-2 h-4 w-4" />
                Dispense Medicines
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

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
              <option value="awaiting_payment">Awaiting Payment</option>
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
            activePrescriptions.map((prescription) =>
              renderPrescriptionCard(prescription, true)
            )
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
            historyPrescriptions.map((prescription) =>
              renderPrescriptionCard(prescription, false)
            )
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
