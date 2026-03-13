"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/loading";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { getPrescriptions } from "@/lib/actions/pharmacy.server";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { theme } from "@/lib/utils/theme-utils";
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

function normalizePrescriptionStatus(status?: string) {
  const value = String(status || "PENDING").toUpperCase();
  if (value === "FILLED" || value === "DISPENSED") {
    return "DISPENSED";
  }
  if (value === "CANCELLED") return "CANCELLED";
  if (value === "COMPLETED") return "COMPLETED";
  return "PENDING";
}

function normalizePrescription(raw: any): DisplayPrescription {
  const medicationItems = Array.isArray(raw.medications)
    ? raw.medications
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  const queueEntry = normalizeQueueEntry(raw);

  const medications = medicationItems.map((item: any) => ({
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
    instructions: item.instructions,
    category: item.medicine?.category || item.medicine?.type || "Prescription",
    description: item.medicine?.description || item.medicine?.properties,
  }));

  const doctorName =
    raw.doctor?.user?.name ||
    raw.doctor?.name ||
    `${raw.doctor?.firstName || ""} ${raw.doctor?.lastName || ""}`.trim() ||
    "Assigned Doctor";

  return {
    id: raw.prescriptionNumber || raw.id,
    date: raw.date || raw.createdAt || raw.updatedAt || new Date().toISOString(),
    doctor: doctorName,
    status: normalizePrescriptionStatus(raw.status),
    queueCategory: queueEntry.queueCategory,
    queueStatus: raw.queueStatus,
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
    notes: raw.notes,
    validUntil: raw.validUntil || null,
  };
}

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "DISPENSED":
      return theme.badges.green;
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user?.clinicId || !user?.id) return;

      try {
        setIsLoading(true);
        setHasError(false);
        const data = await getPrescriptions(user.clinicId, { patientId: user.id });
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.prescriptions)
            ? (data as any).prescriptions
            : [];
        setPrescriptions(list);
      } catch (error) {
        console.error("Failed to fetch prescriptions:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPrescriptions();
  }, [user?.clinicId, user?.id]);

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

  if (hasError) {
    return (
      <ErrorState
        title="Unable to load prescriptions"
        message="We couldn't fetch your prescriptions. Please try again."
        onRetry={() => setHasError(false)}
      />
    );
  }

  if (isLoading) {
    return <PageLoading text="Loading your prescriptions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Prescriptions</h1>
          <p className={`text-sm ${theme.textColors.secondary}`}>
            Real prescriptions issued by your doctor
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Bell className="w-4 h-4" />
            Refill Unavailable
          </Button>
          <Button className="flex items-center gap-2" disabled>
            <ShoppingCart className="w-4 h-4" />
            Ordering Unavailable
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prescriptions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prescriptions">Current Prescriptions</TabsTrigger>
          <TabsTrigger value="plan">Medication Plan</TabsTrigger>
          <TabsTrigger value="pharmacy">Medicine Queue</TabsTrigger>
          <TabsTrigger value="history">Prescription History</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textColors.muted}`} />
                  <Input
                    placeholder="Search prescriptions or medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                  aria-label="Filter prescriptions by status"
                >
                  <option value="all">All Status</option>
                  <option value="dispensed">Dispensed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
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
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Prescription #{prescription.id}</h3>
                        <p className={`text-sm ${theme.textColors.secondary}`}>
                          Prescribed by {prescription.doctor} • {new Date(prescription.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                        <Button variant="outline" size="sm" disabled>
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
                            className={`p-4 ${theme.containers.featureGreen} rounded-lg border ${theme.borders.green}`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex items-start gap-3">
                                <Leaf className={`w-5 h-5 ${theme.iconColors.green} mt-1`} />
                                <div className="space-y-1">
                                  <h5 className={`font-semibold ${theme.textColors.success}`}>{medication.name}</h5>
                                  <p className={`text-sm ${theme.textColors.success}`}>
                                    {medication.dosage} • {medication.duration}
                                  </p>
                                  {medication.instructions ? (
                                    <p className={`text-xs ${theme.iconColors.green}`}>
                                      {medication.instructions}
                                    </p>
                                  ) : null}
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="outline" className={theme.badges.green}>
                                      {medication.category}
                                    </Badge>
                                    {medication.description ? (
                                      <span className={theme.iconColors.green}>{medication.description}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-medium lg:text-right">
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

                    <div className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 ${theme.backgrounds.secondary} rounded-lg`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={theme.textColors.secondary}>Total Cost:</span>
                          <span className={`font-semibold ml-2 ${theme.textColors.heading}`}>
                            ₹{prescription.totalCost}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Payment:</span>
                          <span className={`font-semibold ml-2 ${theme.textColors.heading}`}>
                            {prescription.paymentStatus}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Valid Until:</span>
                          <span className={`font-semibold ml-2 ${theme.textColors.heading}`}>
                            {prescription.validUntil
                              ? new Date(prescription.validUntil).toLocaleDateString()
                              : "Not specified"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" disabled>
                          <Bell className="w-4 h-4 mr-1" />
                          Refill N/A
                        </Button>
                        {prescription.pendingAmount > 0 ? (
                          <PaymentButton
                            prescriptionId={prescription.id}
                            amount={prescription.pendingAmount}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Pay â‚¹{prescription.pendingAmount.toLocaleString()}
                          </PaymentButton>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Package className="w-4 h-4 mr-1" />
                            Ready For Dispense
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
          <Card>
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
                    <div key={entry.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${theme.containers.featureBlue} rounded-full flex items-center justify-center`}>
                          <Clock className={`w-6 h-6 ${theme.iconColors.blue}`} />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${theme.textColors.heading}`}>{entry.name}</h4>
                          <p className={`text-sm ${theme.textColors.secondary}`}>{entry.dosage}</p>
                          <p className={`text-xs ${theme.textColors.tertiary}`}>{entry.duration}</p>
                          <p className={`text-xs ${theme.textColors.tertiary}`}>{entry.instructions || "Follow doctor instructions"}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
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
          <Card>
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
                    <div key={prescription.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold">Prescription #{prescription.id}</h3>
                          <p className={`text-sm ${theme.textColors.secondary}`}>
                            {prescription.doctor} • {new Date(prescription.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getStatusColor(prescription.status)}>
                            {prescription.pendingAmount > 0
                              ? "Awaiting Payment"
                              : "Pending Handover"}
                          </Badge>
                          {prescription.queuePosition ? (
                            <Badge variant="outline">
                              {getQueuePositionLabel({ position: prescription.queuePosition ?? 0 })}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <span className={theme.textColors.secondary}>Lane:</span>
                          <span className="ml-2 font-medium">
                            {prescription.queueCategory || "MEDICINE_DESK"}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Pending:</span>
                          <span className="ml-2 font-medium">
                            ₹{prescription.pendingAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className={theme.textColors.secondary}>Payment:</span>
                          <span className="ml-2 font-medium">{prescription.paymentStatus}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {prescription.pendingAmount > 0 ? (
                          <PaymentButton
                            prescriptionId={prescription.id}
                            amount={prescription.pendingAmount}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" />
                            Pay ₹{prescription.pendingAmount.toLocaleString()}
                          </PaymentButton>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Prescription History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayPrescriptions.length === 0 ? (
                <EmptyState
                  title="No prescription history"
                  description="Past and current prescriptions will appear here once they are created by your doctor."
                  icon={FileText}
                />
              ) : (
                <div className="space-y-4">
                  {displayPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Prescription #{prescription.id}</h3>
                          <p className={`text-sm ${theme.textColors.secondary}`}>
                            {prescription.doctor} • {new Date(prescription.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
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
                              ? new Date(prescription.validUntil).toLocaleDateString()
                              : "Not specified"}
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
    </div>
  );
}
