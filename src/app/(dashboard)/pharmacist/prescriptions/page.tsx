"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useDispensePrescription,
  useMedicines,
  usePharmacyBatchAudit,
  usePrescriptions,
  useReversePrescriptionDispense,
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
} from "lucide-react";
import {
  getQueuePositionLabel,
  normalizeQueueEntry,
} from "@/lib/queue/queue-adapter";
import { formatDateTimeInIST, nowIso } from "@/lib/utils/date-time";
import type {
  DispensePrescriptionData,
  PharmacyBatchAuditEntry,
} from "@/types/pharmacy.types";

type PrescriptionRow = {
  id: string;
  patientName: string;
  doctorName: string;
  prescribedAt: string;
  status: "PENDING" | "PARTIAL" | "FILLED" | "CANCELLED";
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  canDispense: boolean;
  queueCategory?: string;
  queueStatus?: "PENDING" | "DISPENSED" | "CANCELLED";
  queuePosition?: number | null;
  medicines: Array<{
    prescriptionItemId: string;
    medicineId: string;
    name: string;
    dosage: string;
    prescribedQuantity: number;
    availableStock: number;
    available: boolean;
    batchNumber?: string;
    expiryDate?: string;
    dispenseBatchHistory?: Array<{
      quantity: number;
      batchNumber?: string | null;
      expiryDate?: string | null;
      dispensedAt: string;
      eventType?: string;
    }>;
    substituteMedicineId?: string;
    substitutionReason?: string;
  }>;
};

type DispenseBatchRow = {
  id: string;
  quantity: string;
  batchNumber: string;
  expiryDate: string;
};

type DispenseLineState = {
  prescriptionItemId: string;
  medicineId: string;
  name: string;
  prescribedQuantity: number;
  availableStock: number;
  substituteMedicineId: string;
  substitutionReason: string;
  batches: DispenseBatchRow[];
  dispenseBatchHistory?: Array<{
    quantity: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    dispensedAt: string;
    eventType?: string;
  }>;
};

function createBatchRow(
  quantity = "",
  batchNumber = "",
  expiryDate = "",
): DispenseBatchRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    quantity,
    batchNumber,
    expiryDate,
  };
}

function createDispenseLine(
  medicine: PrescriptionRow["medicines"][number],
): DispenseLineState {
  return {
    prescriptionItemId: medicine.prescriptionItemId,
    medicineId: medicine.medicineId,
    name: medicine.name,
    prescribedQuantity: medicine.prescribedQuantity,
    availableStock: medicine.availableStock,
    substituteMedicineId: "",
    substitutionReason: "",
    batches: [createBatchRow(String(Math.max(0, medicine.prescribedQuantity)))],
    ...(medicine.dispenseBatchHistory
      ? { dispenseBatchHistory: medicine.dispenseBatchHistory }
      : {}),
  };
}

function getTotalBatchQuantity(line: DispenseLineState): number {
  return line.batches.reduce(
    (total, batch) => total + (Number(batch.quantity) || 0),
    0,
  );
}

function normalizePrescription(raw: any): PrescriptionRow {
  const items = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.medicines)
      ? raw.medicines
      : [];
  const queueEntry = normalizeQueueEntry(raw);

  return {
    id: raw.id,
    patientName:
      raw.patient?.user?.name ||
      raw.patient?.name ||
      raw.patientName ||
      "Unknown Patient",
    doctorName:
      raw.doctor?.user?.name ||
      raw.doctor?.name ||
      raw.doctorName ||
      "Unknown Doctor",
    prescribedAt: raw.date || raw.createdAt || nowIso(),
    status: String(raw.status || "PENDING").toUpperCase() as
      | "PENDING"
      | "PARTIAL"
      | "FILLED"
      | "CANCELLED",
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
      prescriptionItemId: String(
        item.id ||
          item.prescriptionItemId ||
          item.medicineId ||
          item.name ||
          "item",
      ),
      medicineId:
        item.medicine?.id ||
        item.medicineId ||
        item.id ||
        item.name ||
        "medicine",
      name: item.medicine?.name || item.name || "Medicine",
      dosage: item.dosage || "As prescribed",
      prescribedQuantity: Number(item.quantity || 0),
      availableStock: Number(
        item.medicine?.stockQuantity ||
          item.medicine?.stock ||
          item.currentStock ||
          item.stock ||
          0,
      ),
      available:
        Number(
          item.medicine?.stockQuantity ||
            item.medicine?.stock ||
            item.currentStock ||
            item.stock ||
            0,
        ) >= Number(item.quantity || 0),
      ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
      ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
      ...(Array.isArray(item.dispenseBatchHistory)
        ? {
            dispenseBatchHistory: item.dispenseBatchHistory
              .map((history: any) => ({
                quantity: Number(history.quantity || 0),
                ...(history.batchNumber
                  ? { batchNumber: history.batchNumber }
                  : {}),
                ...(history.expiryDate
                  ? { expiryDate: history.expiryDate }
                  : {}),
                dispensedAt: String(history.dispensedAt || nowIso()),
              }))
              .filter((history: { quantity: number }) => history.quantity > 0),
          }
        : {}),
    })),
  };
}

function getPrescriptionState(prescription: PrescriptionRow) {
  if (prescription.status === "PARTIAL") {
    return {
      key: "partial",
      label: "Partially dispensed",
      badgeClass: "bg-orange-100 text-orange-800",
      icon: Package,
    };
  }

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
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionRow | null>(null);
  const [dispenseLines, setDispenseLines] = useState<DispenseLineState[]>([]);
  const [dispenseNotes, setDispenseNotes] = useState("");
  const [dispenseFormError, setDispenseFormError] = useState<string | null>(
    null,
  );
  const [selectedReversalPrescription, setSelectedReversalPrescription] =
    useState<PrescriptionRow | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversalError, setReversalError] = useState<string | null>(null);
  const { data: prescriptionsData = [], isPending } = usePrescriptions(
    clinicId || "",
    {
      limit: 100,
    },
  );
  const { data: medicinesData = [] } = useMedicines(clinicId || "", {
    limit: 200,
  });
  const batchAuditFilters = useMemo(
    () => ({
      ...(auditStartDate ? { startDate: auditStartDate } : {}),
      ...(auditEndDate ? { endDate: auditEndDate } : {}),
      enabled: Boolean(clinicId),
    }),
    [auditEndDate, auditStartDate, clinicId],
  );
  const { data: batchAuditData = [] } = usePharmacyBatchAudit(
    clinicId || "",
    batchAuditFilters,
  );
  const dispensePrescription = useDispensePrescription();
  const reversePrescription = useReversePrescriptionDispense();

  const prescriptions = useMemo(
    () =>
      (Array.isArray(prescriptionsData) ? prescriptionsData : []).map(
        normalizePrescription,
      ),
    [prescriptionsData],
  );
  const medicineCatalog = useMemo(
    () =>
      (Array.isArray(medicinesData) ? medicinesData : []) as Array<
        Record<string, unknown>
      >,
    [medicinesData],
  );
  const medicineById = useMemo(() => {
    return new Map(
      medicineCatalog.map(
        (medicine) => [String(medicine.id), medicine] as const,
      ),
    );
  }, [medicineCatalog]);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) => {
      const state = getPrescriptionState(prescription);
      const matchesSearch =
        !searchTerm ||
        prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.patientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.doctorName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some((medicine) =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "all" || state.key === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const activePrescriptions = filteredPrescriptions.filter(
    (prescription) =>
      prescription.status !== "FILLED" && prescription.status !== "CANCELLED",
  );
  const historyPrescriptions = filteredPrescriptions.filter(
    (prescription) =>
      prescription.status === "FILLED" || prescription.status === "CANCELLED",
  );
  const selectedPrescriptionTotal = selectedPrescription
    ? selectedPrescription.medicines.reduce(
        (total, medicine) => total + medicine.prescribedQuantity,
        0,
      )
    : 0;
  const selectedDispenseTotal = dispenseLines.reduce(
    (total, line) => total + getTotalBatchQuantity(line),
    0,
  );

  const openDispenseDialog = (prescription: PrescriptionRow) => {
    setSelectedPrescription(prescription);
    setDispenseLines(prescription.medicines.map(createDispenseLine));
    setDispenseNotes("");
    setDispenseFormError(null);
  };

  const closeDispenseDialog = () => {
    setSelectedPrescription(null);
    setDispenseLines([]);
    setDispenseNotes("");
    setDispenseFormError(null);
  };

  const updateBatchRow = (
    medicineIndex: number,
    batchIndex: number,
    field: keyof DispenseBatchRow,
    value: string,
  ) => {
    setDispenseLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex !== medicineIndex
          ? line
          : {
              ...line,
              batches: line.batches.map((batch, currentBatchIndex) =>
                currentBatchIndex !== batchIndex
                  ? batch
                  : { ...batch, [field]: value },
              ),
            },
      ),
    );
  };

  const addBatchRow = (medicineIndex: number) => {
    setDispenseLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex !== medicineIndex
          ? line
          : {
              ...line,
              batches: [...line.batches, createBatchRow()],
            },
      ),
    );
  };

  const removeBatchRow = (medicineIndex: number, batchIndex: number) => {
    setDispenseLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== medicineIndex || line.batches.length === 1) {
          return line;
        }

        return {
          ...line,
          batches: line.batches.filter(
            (_, currentBatchIndex) => currentBatchIndex !== batchIndex,
          ),
        };
      }),
    );
  };

  const updateLineField = (
    medicineIndex: number,
    field: "substituteMedicineId" | "substitutionReason",
    value: string,
  ) => {
    setDispenseLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex !== medicineIndex ? line : { ...line, [field]: value },
      ),
    );
  };

  const openReverseDialog = (prescription: PrescriptionRow) => {
    setSelectedReversalPrescription(prescription);
    setReversalReason("");
    setReversalError(null);
  };

  const closeReverseDialog = () => {
    setSelectedReversalPrescription(null);
    setReversalReason("");
    setReversalError(null);
  };

  const handleDispense = async () => {
    if (!selectedPrescription) {
      return;
    }

    const dispensedMedications: DispensePrescriptionData["dispensedMedications"] =
      [];

    for (const line of dispenseLines) {
      const effectiveMedicineId = line.substituteMedicineId || line.medicineId;
      const effectiveMedicine = medicineById.get(effectiveMedicineId);
      const totalQuantity = getTotalBatchQuantity(line);

      if (!Number.isFinite(totalQuantity) || totalQuantity < 0) {
        setDispenseFormError(`Enter a valid quantity for ${line.name}.`);
        return;
      }

      if (totalQuantity > line.prescribedQuantity) {
        setDispenseFormError(
          `${line.name} exceeds the prescribed quantity of ${line.prescribedQuantity}.`,
        );
        return;
      }

      const effectiveStock = Number(
        effectiveMedicine?.stockQuantity ??
          effectiveMedicine?.stock ??
          effectiveMedicine?.currentStock ??
          line.availableStock,
      );

      if (totalQuantity > effectiveStock) {
        setDispenseFormError(
          `${line.name} exceeds the available stock of ${effectiveStock}.`,
        );
        return;
      }

      if (line.substituteMedicineId && !line.substitutionReason.trim()) {
        setDispenseFormError(`Add a substitution reason for ${line.name}.`);
        return;
      }

      for (const batch of line.batches) {
        const batchQuantity = Number(batch.quantity);
        const hasBatchDetails =
          batch.batchNumber.trim().length > 0 ||
          batch.expiryDate.trim().length > 0 ||
          batchQuantity > 0;

        if (!hasBatchDetails) {
          continue;
        }

        if (!Number.isInteger(batchQuantity) || batchQuantity <= 0) {
          setDispenseFormError(
            `Enter a valid batch quantity for ${line.name}.`,
          );
          return;
        }

        if (!batch.batchNumber.trim()) {
          setDispenseFormError(`Enter a batch number for ${line.name}.`);
          return;
        }

        if (!batch.expiryDate.trim()) {
          setDispenseFormError(`Enter an expiry date for ${line.name}.`);
          return;
        }

        dispensedMedications.push({
          medicineId: line.medicineId,
          prescriptionItemId: line.prescriptionItemId,
          quantityDispensed: batchQuantity,
          batchNumber: batch.batchNumber.trim(),
          expiryDate: batch.expiryDate,
          ...(line.substituteMedicineId
            ? { substituteMedicineId: line.substituteMedicineId }
            : {}),
          ...(line.substitutionReason.trim()
            ? { substitutionReason: line.substitutionReason.trim() }
            : {}),
        });
      }
    }

    if (dispensedMedications.length === 0) {
      setDispenseFormError("Add at least one medication quantity to dispense.");
      return;
    }

    await dispensePrescription.mutateAsync({
      prescriptionId: selectedPrescription.id,
      dispensingData: {
        dispensedMedications,
        notes: dispenseNotes.trim() || undefined,
      },
    });

    closeDispenseDialog();
  };

  const handleReverseDispense = async () => {
    if (!selectedReversalPrescription) {
      return;
    }

    if (!reversalReason.trim()) {
      setReversalError("Enter a reversal reason.");
      return;
    }

    await reversePrescription.mutateAsync({
      prescriptionId: selectedReversalPrescription.id,
      reversalData: {
        reason: reversalReason.trim(),
      },
    });

    closeReverseDialog();
  };

  const activeColumns = useMemo<ColumnDef<PrescriptionRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.patientName}
            </span>
            <span className="text-xs text-muted-foreground">
              ID: {row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.doctorName}
          </span>
        ),
      },
      {
        accessorKey: "prescribedAt",
        header: "Prescribed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTimeInIST(row.original.prescribedAt)}
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
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.paymentStatus}</Badge>
        ),
      },
      {
        accessorKey: "queuePosition",
        header: "Queue",
        cell: ({ row }) =>
          row.original.queuePosition ? (
            <Badge variant="outline">
              {getQueuePositionLabel({
                position: row.original.queuePosition ?? 0,
              })}
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
            {row.original.medicines
              .map(
                (medicine) =>
                  `${medicine.name} x ${medicine.prescribedQuantity}`,
              )
              .join(", ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => openDispenseDialog(row.original)}
              disabled={
                !row.original.canDispense || dispensePrescription.isPending
              }
            >
              <Package className="mr-2 h-4 w-4" />
              Review Dispense
            </Button>
          </div>
        ),
      },
    ],
    [dispensePrescription.isPending, openDispenseDialog],
  );

  const historyColumns = useMemo<ColumnDef<PrescriptionRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.patientName}
            </span>
            <span className="text-xs text-muted-foreground">
              ID: {row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.doctorName}
          </span>
        ),
      },
      {
        accessorKey: "prescribedAt",
        header: "Prescribed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTimeInIST(row.original.prescribedAt)}
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
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.paymentStatus}</Badge>
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
        cell: ({ row }) => {
          const canReverse =
            row.original.status === "PARTIAL" ||
            row.original.status === "FILLED";

          return canReverse ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openReverseDialog(row.original)}
            >
              Reverse dispense
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
      },
    ],
    [openReverseDialog],
  );

  const batchAuditEntries = useMemo(
    () =>
      (Array.isArray(batchAuditData) ? batchAuditData : []).filter(
        (entry: PharmacyBatchAuditEntry) => {
          const search = auditSearchTerm.trim().toLowerCase();
          if (!search) {
            return true;
          }

          return [
            entry.prescriptionId,
            entry.prescriptionItemId,
            entry.patientName,
            entry.doctorName,
            entry.medicineName,
            entry.originalMedicineName,
            entry.substituteMedicineName,
            entry.batchNumber,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
        },
      ),
    [auditSearchTerm, batchAuditData],
  );

  const batchAuditColumns = useMemo<ColumnDef<PharmacyBatchAuditEntry>[]>(
    () => [
      {
        accessorKey: "eventAt",
        header: "Event",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {formatDateTimeInIST(row.original.eventAt)}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.eventType}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.patientName}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.prescriptionId}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "medicineName",
        header: "Medicine",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.medicineName}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.originalMedicineName}
              {row.original.substituteMedicineName
                ? ` → ${row.original.substituteMedicineName}`
                : ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "batchNumber",
        header: "Batch",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.batchNumber || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.expiryDate
                ? `Expiry ${row.original.expiryDate}`
                : "No expiry"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.quantity}</Badge>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.reason || row.original.reversalReason || "—"}
          </span>
        ),
      },
      {
        accessorKey: "eventType",
        header: "State",
        cell: ({ row }) => {
          const isReversal =
            String(row.original.eventType || "").toUpperCase() === "REVERSAL";
          return (
            <Badge variant={isReversal ? "destructive" : "secondary"}>
              {String(row.original.eventType || "DISPENSE")}
            </Badge>
          );
        },
      },
    ],
    [],
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
              <option value="partial">Partially dispensed</option>
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
          <TabsTrigger value="audit">Batch audit</TabsTrigger>
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
                  <h3 className="text-lg font-semibold">
                    No active prescriptions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Active prescriptions awaiting payment or dispense will
                    appear here.
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

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Batch audit trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="audit-search">Search audit</Label>
                  <Input
                    id="audit-search"
                    placeholder="Prescription, patient, doctor, medicine, batch..."
                    value={auditSearchTerm}
                    onChange={(event) => setAuditSearchTerm(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audit-start-date">Start date</Label>
                  <Input
                    id="audit-start-date"
                    type="date"
                    value={auditStartDate}
                    onChange={(event) => setAuditStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audit-end-date">End date</Label>
                  <Input
                    id="audit-end-date"
                    type="date"
                    value={auditEndDate}
                    onChange={(event) => setAuditEndDate(event.target.value)}
                  />
                </div>
              </div>

              <DataTable
                columns={batchAuditColumns}
                data={batchAuditEntries}
                pageSize={10}
                emptyMessage="No batch audit entries found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedPrescription)}
        onOpenChange={(open) => {
          if (!open) {
            closeDispenseDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          {selectedPrescription ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Review dispense for prescription #{selectedPrescription.id}
                </DialogTitle>
                <DialogDescription>
                  Enter the quantity for each medicine and add extra batch rows
                  when the dispensed stock comes from multiple lots.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Patient
                  </p>
                  <p className="font-semibold">
                    {selectedPrescription.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Doctor
                  </p>
                  <p className="font-semibold">
                    {selectedPrescription.doctorName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Prescription total
                  </p>
                  <p className="font-semibold">
                    {selectedDispenseTotal} / {selectedPrescriptionTotal} units
                    entered
                  </p>
                </div>
              </div>

              {dispenseFormError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {dispenseFormError}
                </div>
              ) : null}

              <div className="space-y-4">
                {dispenseLines.map((line, medicineIndex) => {
                  const enteredQuantity = getTotalBatchQuantity(line);
                  const remainingQuantity = Math.max(
                    line.prescribedQuantity - enteredQuantity,
                    0,
                  );
                  const effectiveMedicineId =
                    line.substituteMedicineId || line.medicineId;
                  const effectiveMedicine =
                    medicineById.get(effectiveMedicineId);
                  const effectiveStock = Number(
                    effectiveMedicine?.stockQuantity ??
                      effectiveMedicine?.stock ??
                      effectiveMedicine?.currentStock ??
                      line.availableStock,
                  );

                  return (
                    <Card
                      key={`${line.medicineId}-${medicineIndex}`}
                      className="border-border/70"
                    >
                      <CardContent className="space-y-4 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-base font-semibold">
                              {line.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {
                                selectedPrescription.medicines[medicineIndex]
                                  ?.dosage
                              }
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">
                              Prescribed: {line.prescribedQuantity}
                            </Badge>
                            <Badge variant="outline">
                              Available: {effectiveStock}
                            </Badge>
                            {line.substituteMedicineId ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                Substitute:{" "}
                                {String(
                                  medicineById.get(line.substituteMedicineId)
                                    ?.name || line.substituteMedicineId,
                                )}
                              </Badge>
                            ) : null}
                            <Badge
                              variant={
                                remainingQuantity > 0 ? "secondary" : "default"
                              }
                              className={
                                remainingQuantity > 0
                                  ? ""
                                  : "bg-emerald-100 text-emerald-800"
                              }
                            >
                              Entered: {enteredQuantity}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`substitute-${medicineIndex}`}>
                              Substitute medicine
                            </Label>
                            <select
                              id={`substitute-${medicineIndex}`}
                              value={line.substituteMedicineId}
                              onChange={(event) =>
                                updateLineField(
                                  medicineIndex,
                                  "substituteMedicineId",
                                  event.target.value,
                                )
                              }
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                              <option value="">Use original medicine</option>
                              {medicineCatalog
                                .filter(
                                  (medicine) =>
                                    String(medicine.id || "") !==
                                    line.medicineId,
                                )
                                .map((medicine) => (
                                  <option
                                    key={String(medicine.id)}
                                    value={String(medicine.id)}
                                  >
                                    {String(medicine.name || "Medicine")} (
                                    {String(
                                      medicine.stockQuantity ??
                                        medicine.stock ??
                                        0,
                                    )}{" "}
                                    in stock)
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor={`substitution-reason-${medicineIndex}`}
                            >
                              Substitution reason
                            </Label>
                            <Textarea
                              id={`substitution-reason-${medicineIndex}`}
                              value={line.substitutionReason}
                              onChange={(event) =>
                                updateLineField(
                                  medicineIndex,
                                  "substitutionReason",
                                  event.target.value,
                                )
                              }
                              placeholder="Optional when using the original medicine; required for substitution"
                              className="min-h-[96px]"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {line.batches.map((batch, batchIndex) => (
                            <div
                              key={batch.id}
                              className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[minmax(0,1.2fr)_160px_180px_140px]"
                            >
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`batch-number-${medicineIndex}-${batchIndex}`}
                                >
                                  Batch number
                                </Label>
                                <Input
                                  id={`batch-number-${medicineIndex}-${batchIndex}`}
                                  value={batch.batchNumber}
                                  onChange={(event) =>
                                    updateBatchRow(
                                      medicineIndex,
                                      batchIndex,
                                      "batchNumber",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Enter batch number"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`batch-quantity-${medicineIndex}-${batchIndex}`}
                                >
                                  Quantity
                                </Label>
                                <Input
                                  id={`batch-quantity-${medicineIndex}-${batchIndex}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  max={String(line.prescribedQuantity)}
                                  value={batch.quantity}
                                  onChange={(event) =>
                                    updateBatchRow(
                                      medicineIndex,
                                      batchIndex,
                                      "quantity",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="0"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`batch-expiry-${medicineIndex}-${batchIndex}`}
                                >
                                  Expiry date
                                </Label>
                                <Input
                                  id={`batch-expiry-${medicineIndex}-${batchIndex}`}
                                  type="date"
                                  value={batch.expiryDate}
                                  onChange={(event) =>
                                    updateBatchRow(
                                      medicineIndex,
                                      batchIndex,
                                      "expiryDate",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="flex items-end justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => addBatchRow(medicineIndex)}
                                >
                                  Add batch
                                </Button>
                                {line.batches.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      removeBatchRow(medicineIndex, batchIndex)
                                    }
                                  >
                                    Remove
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>

                        {line.dispenseBatchHistory &&
                        line.dispenseBatchHistory.length > 0 ? (
                          <div className="rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
                            <p className="mb-2 font-medium text-foreground">
                              Dispense history
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {line.dispenseBatchHistory.map(
                                (entry, entryIndex) => (
                                  <Badge
                                    key={`${line.prescriptionItemId}-${entryIndex}`}
                                    variant="outline"
                                  >
                                    {entry.batchNumber || "Batch"} x{" "}
                                    {entry.quantity}
                                    {entry.expiryDate
                                      ? ` • ${entry.expiryDate}`
                                      : ""}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge
                            variant={
                              remainingQuantity === 0 ? "default" : "secondary"
                            }
                          >
                            Remaining after dispense: {remainingQuantity}
                          </Badge>
                          <span className="text-muted-foreground">
                            Use multiple batch rows when a medicine is picked
                            from more than one stock lot.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispense-notes">Pharmacist notes</Label>
                <Textarea
                  id="dispense-notes"
                  value={dispenseNotes}
                  onChange={(event) => setDispenseNotes(event.target.value)}
                  placeholder="Optional notes for the dispense record"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDispenseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDispense}
                  disabled={dispensePrescription.isPending}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {dispensePrescription.isPending
                    ? "Dispensing..."
                    : "Confirm dispense"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedReversalPrescription)}
        onOpenChange={(open) => {
          if (!open) {
            closeReverseDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedReversalPrescription ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Reverse dispense for prescription #
                  {selectedReversalPrescription.id}
                </DialogTitle>
                <DialogDescription>
                  This restores the dispensed stock entries and preserves the
                  audit trail.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {selectedReversalPrescription.patientName}
                </p>
                <p>{selectedReversalPrescription.doctorName}</p>
                <p className="mt-2">
                  Status: {selectedReversalPrescription.status} • Payment:{" "}
                  {selectedReversalPrescription.paymentStatus}
                </p>
              </div>

              {reversalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reversalError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="reversal-reason">Reversal reason</Label>
                <Textarea
                  id="reversal-reason"
                  value={reversalReason}
                  onChange={(event) => setReversalReason(event.target.value)}
                  placeholder="Explain why this dispense is being reversed"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeReverseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReverseDispense}
                  disabled={reversePrescription.isPending}
                >
                  {reversePrescription.isPending
                    ? "Reversing..."
                    : "Confirm reversal"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
