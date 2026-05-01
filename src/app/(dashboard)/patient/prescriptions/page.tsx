"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DashboardPageHeader as PatientPageHeader, DashboardPageShell as PatientPageShell, } from "@/components/dashboard/DashboardPageShell";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/loading";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { theme } from "@/lib/utils/theme-utils";
import { formatDateInIST, nowIso } from '@/lib/utils/date-time';
import type {
  Prescription as PharmacyPrescription,
  PrescriptionMedication,
} from "@/types/pharmacy.types";
import {
  Bell,
  Clock,
  Download,
  FileText,
  Filter,
  Leaf,
  MapPin,
  Package,
  Pill,
  Search,
  ShoppingCart,
} from "lucide-react";

type DisplayMedication = {
  name: string;
  dosage: string;
  duration: string;
  remaining: string;
  instructions?: string;
  category: string;
  description?: string;
  dispenseBatchHistory?: Array<{
    quantity: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    dispensedAt: string;
  }>;
};

type DisplayPrescription = {
  id: string;
  date: string;
  doctor: string;
  status: string;
  queueCategory?: string;
  queueStatus?: "PENDING" | "DISPENSED" | "CANCELLED";
  queuePosition?: number | null;
  activeQueueEntry?: boolean;
  medications: DisplayMedication[];
  totalCost: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  notes?: string;
  validUntil?: string | null;
};

type PrescriptionMedicationResponse = PrescriptionMedication & {
  medicineName?: string;
  medicine?: (PrescriptionMedication["medicine"] & { properties?: string }) | undefined;
};

type PrescriptionResponseItem = PharmacyPrescription & {
  items?: PrescriptionMedicationResponse[];
  medications: PrescriptionMedicationResponse[];
};

function normalizePrescriptionStatus(status?: string) {
  const value = String(status || "PENDING").toUpperCase();
  if (value === "FILLED" || value === "DISPENSED") {
    return "DISPENSED";
  }
  if (value === "PARTIAL") return "PARTIAL";
  if (value === "CANCELLED") return "CANCELLED";
  if (value === "COMPLETED") return "COMPLETED";
  return "PENDING";
}

function normalizePrescription(raw: PrescriptionResponseItem): DisplayPrescription {
  const medicationItems = Array.isArray(raw.medications)
    ? raw.medications
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  const queueEntry = normalizeQueueEntry(raw);

  const medications: DisplayMedication[] = medicationItems.map((item: PrescriptionMedicationResponse) => ({
    name: item.medicine?.name || item.medicineName || "Medicine",
    dosage: item.dosage || "As prescribed",
    duration: item.duration || "Follow doctor instructions",
    remaining:
      item.isDispensed === false
        ? "Pending dispense"
        : item.dispensedQuantity
          ? `${item.dispensedQuantity}/${item.quantity || item.dispensedQuantity} dispensed`
          : item.quantity
            ? `${item.quantity} units`
            : "As prescribed",
    category: item.medicine?.category || item.medicine?.type || "Prescription",
    ...(item.instructions ? { instructions: item.instructions } : {}),
    ...(item.medicine?.description || item.medicine?.properties
      ? { description: item.medicine?.description || item.medicine?.properties }
      : {}),
    ...(Array.isArray(item.dispenseBatchHistory)
      ? {
          dispenseBatchHistory: item.dispenseBatchHistory
            .map((history) => ({
              quantity: Number(history.quantity || 0),
              ...(history.batchNumber ? { batchNumber: history.batchNumber } : {}),
              ...(history.expiryDate ? { expiryDate: history.expiryDate } : {}),
              dispensedAt: String(history.dispensedAt || nowIso()),
            }))
            .filter((history) => history.quantity > 0),
        }
      : {}),
  }));

  const doctorName =
    `${raw.doctor?.firstName || ""} ${raw.doctor?.lastName || ""}`.trim() ||
    raw.doctorName ||
    "Assigned Doctor";

  return {
    id: raw.prescriptionNumber || raw.id,
    date: raw.prescribedAt || raw.createdAt || raw.updatedAt || nowIso(),
    doctor: doctorName,
    status: normalizePrescriptionStatus(raw.status),
    queueCategory: queueEntry.queueCategory,
    ...(raw.queueStatus ? { queueStatus: raw.queueStatus } : {}),
    queuePosition: queueEntry.position > 0 ? queueEntry.position : null,
    activeQueueEntry: Boolean(raw.activeQueueEntry ?? queueEntry.position > 0),
    medications,
    totalCost: Number(raw.totalAmount || 0),
    paidAmount: Number(raw.paidAmount || 0),
    pendingAmount: Number(raw.pendingAmount || 0),
    paymentStatus: String(raw.paymentStatus || "PENDING").toUpperCase() as
      | "PENDING"
      | "PARTIAL"
      | "PAID",
    ...(raw.notes ? { notes: raw.notes } : {}),
    validUntil: raw.validUntil || null,
  };
}

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "DISPENSED":
      return theme.badges.green;
    case "PARTIAL":
      return theme.badges.orange;
    case "PENDING":
      return theme.badges.yellow;
    case "COMPLETED":
      return theme.badges.gray;
    case "CANCELLED":
      return theme.badges.red;
    default:
      return theme.badges.gray;
  }
}

export default function PatientPrescriptions() {
  const { session } = useAuth();
  const user = session?.user;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    data: prescriptionsData = [],
    isPending: isLoading,
    error,
  } = usePrescriptions(user?.clinicId || "", {
    ...(user?.id ? { patientId: user.id } : {}),
    enabled: !!user?.clinicId && !!user?.id,
  });

  const prescriptions = Array.isArray(prescriptionsData)
    ? (prescriptionsData as PrescriptionResponseItem[])
    : Array.isArray((prescriptionsData as { prescriptions?: PrescriptionResponseItem[] })?.prescriptions)
      ? ((prescriptionsData as { prescriptions?: PrescriptionResponseItem[] }).prescriptions ?? [])
      : [];

  const displayPrescriptions = useMemo(
    () => prescriptions.map(normalizePrescription),
    [prescriptions]
  );

  const filteredPrescriptions = useMemo(
    () =>
      displayPrescriptions.filter((prescription) => {
        const matchesSearch =
          !searchTerm ||
          prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prescription.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prescription.medications.some((medication) =>
            medication.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesStatus =
          statusFilter === "all" || prescription.status.toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [displayPrescriptions, searchTerm, statusFilter]
  );

  const medicationPlan = useMemo(
    () =>
      displayPrescriptions.flatMap((prescription) =>
        prescription.medications.map((medication, index) => ({
          id: `${prescription.id}-${index}`,
          prescriptionId: prescription.id,
          doctor: prescription.doctor,
          status: prescription.status,
          date: prescription.date,
          ...medication,
        }))
      ),
    [displayPrescriptions]
  );

  const medicineDeskQueue = useMemo(
    () =>
      displayPrescriptions
        .filter((prescription) => prescription.activeQueueEntry)
        .sort(
          (left, right) => Number(left.queuePosition || 0) - Number(right.queuePosition || 0)
        ),
    [displayPrescriptions]
  );

  if (error) {
    return (
      <ErrorState
        title="Unable to load prescriptions"
        message="We couldn't fetch your prescriptions. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isLoading) {
    return <PageLoading text="Loading your prescriptions..." />;
  }

  return (
    <PatientPageShell>
      <PatientPageHeader
        eyebrow="Prescriptions & Billing"
        title="My prescriptions"
        description="Track active medicines, review doctor instructions, and complete prescription payments from one consistent patient-friendly surface."
        actions={[
          {
            label: "Refill unavailable",
            icon: <Bell className="h-4 w-4" />,
            variant: "outline",
            disabled: true,
          },
          {
            label: "Ordering unavailable",
            icon: <ShoppingCart className="h-4 w-4" />,
            disabled: true,
          },
        ]}
      />

      <Tabs defaultValue="prescriptions" className="space-y-6">
        <TabsList className="max-w-full overflow-x-auto h-auto p-1 justify-start scrollbar-hide">
          <TabsTrigger value="prescriptions" className="text-xs sm:text-sm px-3 sm:px-4">Current Prescriptions</TabsTrigger>
          <TabsTrigger value="plan" className="text-xs sm:text-sm px-3 sm:px-4">Medication Plan</TabsTrigger>
          <TabsTrigger value="pharmacy" className="text-xs sm:text-sm px-3 sm:px-4">Medicine Queue</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm px-3 sm:px-4">Prescription History</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textColors.muted}`} />
                  <Input
                    placeholder="Search prescriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="h-11 flex-1 sm:min-w-[180px] rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="dispensed">Dispensed</SelectItem>
                      <SelectItem value="partial">Partially dispensed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-11 rounded-xl px-3 sm:px-4">
                    <Filter className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredPrescriptions.length === 0 ? (
            <EmptyState
              title="No prescriptions found"
              description={
                searchTerm || statusFilter !== "all"
                  ? "No prescriptions match your current filters."
                  : "You don't have any prescriptions yet."
              }
              icon={Pill}
            />
          ) : (
            <div className="space-y-6">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-semibold">Prescription #{prescription.id}</h3>
                        <p className={`text-xs sm:text-sm ${theme.textColors.secondary}`}>
                          Prescribed by {prescription.doctor} • {formatDateInIST(prescription.date)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <Badge className={`${getStatusColor(prescription.status)} text-[10px] sm:text-xs`}>
                          {prescription.status}
                        </Badge>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg sm:h-9 sm:w-auto sm:px-3 sm:rounded-xl" disabled>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Medicines</h4>
                      <div className="grid gap-3">
                        {prescription.medications.map((medication, index) => (
                          <div
                            key={`${prescription.id}-${index}`}
                            className={`p-3 sm:p-4 ${theme.containers.featureGreen} rounded-lg border ${theme.borders.green}`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-start gap-3">
                                <Leaf className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.iconColors.green} mt-1`} />
                                <div className="space-y-1">
                                  <h5 className={`text-sm sm:text-base font-semibold ${theme.textColors.success}`}>{medication.name}</h5>
                                  <p className={`text-xs sm:text-sm ${theme.textColors.success}`}>
                                    {medication.dosage} • {medication.duration}
                                  </p>
                                  {medication.instructions ? (
                                    <p className={`text-[10px] sm:text-xs ${theme.iconColors.green}`}>
                                      {medication.instructions}
                                    </p>
                                  ) : null}
                                  {medication.dispenseBatchHistory && medication.dispenseBatchHistory.length > 0 ? (
                                    <p className={`text-[10px] sm:text-xs ${theme.textColors.tertiary}`}>
                                      Batches:{" "}
                                      {medication.dispenseBatchHistory
                                        .map((entry) =>
                                          `${entry.batchNumber || "Batch"} x ${entry.quantity}`
                                        )
                                        .join(", ")}
                                    </p>
                                  ) : null}
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs pt-1">
                                    <Badge variant="outline" className={`${theme.badges.green} px-1.5 py-0`}>
                                      {medication.category}
                                    </Badge>
                                    {medication.description ? (
                                      <span className={theme.iconColors.green}>{medication.description}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[10px] sm:text-sm font-medium sm:text-right">
                                <p className={theme.textColors.success}>{medication.remaining}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {prescription.notes ? (
                      <div className={`p-3 ${theme.containers.featureBlue} border ${theme.borders.blue} rounded-lg`}>
                        <h5 className={`font-medium ${theme.textColors.info} mb-1`}>
                          Doctor&apos;s Instructions
                        </h5>
                        <p className={`text-sm ${theme.textColors.info}`}>{prescription.notes}</p>
                      </div>
                    ) : null}

                    <div className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 ${theme.backgrounds.secondary} rounded-xl`}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className={theme.textColors.secondary}>Total Cost:</span>
                          <span className={`font-semibold ml-1 sm:ml-2 ${theme.textColors.heading}`}>
                            ₹{prescription.totalCost}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Payment:</span>
                          <span className={`font-semibold ml-1 sm:ml-2 ${theme.textColors.heading}`}>
                            {prescription.paymentStatus}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Valid Until:</span>
                          <span className={`font-semibold ml-1 sm:ml-2 ${theme.textColors.heading}`}>
                            {prescription.validUntil
                              ? formatDateInIST(prescription.validUntil)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9 sm:h-auto rounded-xl" disabled>
                          <Bell className="w-4 h-4 mr-1" />
                          <span className="text-xs sm:text-sm">Refill</span>
                        </Button>
                        {prescription.pendingAmount > 0 ? (
                          <PaymentButton
                            prescriptionId={prescription.id}
                            amount={prescription.pendingAmount}
                            className="flex-1 sm:flex-initial rounded-xl bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-auto"
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            <span className="text-xs sm:text-sm">Pay ₹{prescription.pendingAmount.toLocaleString()}</span>
                          </PaymentButton>
                        ) : (
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9 sm:h-auto rounded-xl" disabled>
                            <Package className="w-4 h-4 mr-1" />
                            <span className="text-xs sm:text-sm">Ready</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    {prescription.pendingAmount > 0 ? (
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Medicines will be handed over only after the prescription payment is received.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Current Medication Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicationPlan.length === 0 ? (
                <EmptyState
                  title="No medication plan available"
                  description="Your issued prescription medicines will appear here once a doctor prescribes them."
                  icon={Bell}
                />
              ) : (
                <div className="space-y-4">
                  {medicationPlan.map((entry) => (
                    <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border/60">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.containers.featureBlue} rounded-full flex items-center justify-center`}>
                          <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.iconColors.blue}`} />
                        </div>
                        <div>
                          <h4 className={`text-sm sm:text-base font-semibold ${theme.textColors.heading}`}>{entry.name}</h4>
                          <p className={`text-xs sm:text-sm ${theme.textColors.secondary}`}>{entry.dosage}</p>
                          <p className={`text-[10px] sm:text-xs ${theme.textColors.tertiary}`}>{entry.duration}</p>
                          <p className={`text-[10px] sm:text-xs ${theme.textColors.tertiary}`}>{entry.instructions || "Follow doctor instructions"}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(entry.status)} text-[10px] sm:text-xs w-fit`}>{entry.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
            <CardHeader>
              <CardTitle>Reminder Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Medication Reminders</p>
                  <p className={`text-sm ${theme.textColors.secondary}`}>
                    Automated reminder delivery is not configured for this clinic yet.
                  </p>
                </div>
                <input type="checkbox" disabled className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className={`text-sm ${theme.textColors.secondary}`}>
                    SMS refill or reminder alerts are not connected yet.
                  </p>
                </div>
                <input type="checkbox" disabled className="rounded" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy">
          <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Medicine Desk Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicineDeskQueue.length === 0 ? (
                <EmptyState
                  title="No active medicine desk queue"
                  description="When a prescription needs payment or handover, it will appear here with live medicine desk status."
                  icon={ShoppingCart}
                />
              ) : (
                <div className="space-y-4">
                  {medicineDeskQueue.map((prescription) => (
                    <div key={prescription.id} className="rounded-2xl border border-border/70 p-3 sm:p-4 dark:border-border/60">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-semibold">Prescription #{prescription.id}</h3>
                          <p className={`text-xs sm:text-sm ${theme.textColors.secondary}`}>
                            {prescription.doctor} • {formatDateInIST(prescription.date)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                          <Badge className={`${getStatusColor(prescription.status)} text-[10px] sm:text-xs`}>
                            {prescription.pendingAmount > 0
                              ? "Payment pending"
                              : "Pending Handover"}
                          </Badge>
                          {prescription.queuePosition ? (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {getQueuePositionLabel({ position: prescription.queuePosition ?? 0 })}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div>
                          <span className={theme.textColors.secondary}>Lane:</span>
                          <span className="ml-1 sm:ml-2 font-medium">
                            {prescription.queueCategory || "MEDICINE_DESK"}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Pending:</span>
                          <span className="ml-1 sm:ml-2 font-medium">
                            ₹{prescription.pendingAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Payment:</span>
                          <span className="ml-1 sm:ml-2 font-medium">{prescription.paymentStatus}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {prescription.pendingAmount > 0 ? (
                          <PaymentButton
                            prescriptionId={prescription.id}
                            amount={prescription.pendingAmount}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 sm:h-auto"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" />
                            Pay ₹{prescription.pendingAmount.toLocaleString()}
                          </PaymentButton>
                        ) : (
                          <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto h-10 sm:h-auto" disabled>
                            <Package className="mr-1 h-4 w-4" />
                            Waiting for handover
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Prescription History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {displayPrescriptions.length === 0 ? (
                <EmptyState
                  title="No prescription history"
                  description="Past and current prescriptions will appear here once they are created by your doctor."
                  icon={FileText}
                />
              ) : (
                <div className="space-y-4">
                  {displayPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-3 sm:p-4 border rounded-xl">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-semibold">Prescription #{prescription.id}</h3>
                          <p className={`text-xs sm:text-sm ${theme.textColors.secondary}`}>
                            {prescription.doctor} • {formatDateInIST(prescription.date)}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(prescription.status)} text-[10px] sm:text-xs w-fit`}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div>
                          <span className={theme.textColors.secondary}>Medicines:</span>
                          <span className="ml-2">
                            {prescription.medications.map((medication) => medication.name).join(", ")}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Amount:</span>
                          <span className="ml-2 font-semibold">₹{prescription.totalCost}</span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Valid Until:</span>
                          <span className="ml-2">
                            {prescription.validUntil
                              ? formatDateInIST(prescription.validUntil)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PatientPageShell>
  );
}
