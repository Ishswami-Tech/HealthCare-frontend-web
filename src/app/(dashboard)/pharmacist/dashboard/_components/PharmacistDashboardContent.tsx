"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Pill, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePrescriptions, useInventory, usePharmacyStats, useMedicineDeskQueue } from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { SkeletonList } from "@/components/ui/loading";
import { StatCardSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { PharmacistDashboardHeader } from "./PharmacistDashboardHeader";
import { PharmacistDashboardStatsGrid } from "./PharmacistDashboardStatsGrid";
import { PharmacistDashboardQueueCard } from "./PharmacistDashboardQueueCard";
import { PharmacistDashboardInventoryAlerts } from "./PharmacistDashboardInventoryAlerts";
import { PharmacistDashboardOperations } from "./PharmacistDashboardOperations";

type PrescriptionData = {
  id: string;
  status?: string;
  paymentStatus?: string;
};

type InventoryData = {
  id?: string;
  name?: string;
  medicineName?: string;
  currentStock?: number;
  quantity?: number;
  minStock?: number;
  minThreshold?: number;
  unit?: string;
};

type QueueItem = {
  id: string;
  patientName: string;
  medicines: unknown[];
  priority: string;
  status: string;
};

export default function PharmacistDashboardContent() {
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;
  const [searchTerm, setSearchTerm] = useState("");

  useWebSocketQuerySync();

  const { data: prescriptionsData = [], isPending: prescriptionsPending } = usePrescriptions(clinicId || "", {
    limit: 100,
  });
  const { data: inventoryData = [], isPending: inventoryPending } = useInventory(clinicId || "", {
    limit: 100,
  });
  const { data: pharmacyStats } = usePharmacyStats(clinicId || "");
  const { data: medicineDeskQueue = [] } = useMedicineDeskQueue(clinicId || "", !!clinicId);

  const prescriptions = useMemo(
    () => (Array.isArray(prescriptionsData) ? prescriptionsData : (prescriptionsData as any)?.prescriptions || []),
    [prescriptionsData]
  );
  const inventory = useMemo(
    () => (Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.inventory || []),
    [inventoryData]
  );

  const stats = useMemo(() => {
    const pendingStatuses = new Set(["PENDING"]);
    const dispensedStatuses = new Set(["FILLED", "DISPENSED", "COMPLETED"]);

    let pendingPrescriptions = 0;
    let awaitingPayment = 0;
    let dispensedToday = 0;

    for (const prescription of prescriptions as PrescriptionData[]) {
      const status = String(prescription.status || "").toUpperCase();
      const paymentStatus = String(prescription.paymentStatus || "PENDING").toUpperCase();

      if (pendingStatuses.has(status)) {
        pendingPrescriptions += 1;
        if (paymentStatus !== "PAID") {
          awaitingPayment += 1;
        }
      }

      if (dispensedStatuses.has(status)) {
        dispensedToday += 1;
      }
    }

    const lowStockItems = (inventory as InventoryData[]).reduce((count, item) => {
      return (item.currentStock || item.quantity || 0) < (item.minStock || item.minThreshold || 0)
        ? count + 1
        : count;
    }, 0);

    return {
      pendingPrescriptions,
      awaitingPayment,
      dispensedToday,
      lowStockItems,
      monthlyDispensed: (pharmacyStats as any)?.monthlyDispensed || 0,
    };
  }, [inventory, pharmacyStats, prescriptions]);

  const processedQueue = useMemo<QueueItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return (Array.isArray(medicineDeskQueue) ? medicineDeskQueue : []).reduce<QueueItem[]>((items, prescription: any) => {
      if (!prescription?.id) return items;

      const entry = normalizeQueueEntry(prescription);
      const item = {
        id: entry.entryId,
        patientName: entry.patientName || "Unknown Patient",
        medicines: prescription.medicines || prescription.medicineNames || [],
        priority: prescription.priority || "normal",
        status:
          Boolean(entry.readyForHandover) || String(entry.paymentStatus).toUpperCase() === "PAID"
            ? "ready_to_dispense"
            : "awaiting_payment",
      };

      if (!normalizedSearch || item.patientName.toLowerCase().includes(normalizedSearch)) {
        items.push(item);
      }

      return items;
    }, []);
  }, [medicineDeskQueue, searchTerm]);

  const handleOpenPrescription = useCallback(
    (prescriptionId: string) => {
      if (prescriptionId === "all") {
        push("/pharmacist/prescriptions");
        return;
      }
      push(`/pharmacist/prescriptions?prescriptionId=${prescriptionId}`);
    },
    [push]
  );

  const handleDispensePrescription = useCallback(
    (prescriptionId: string) => {
      push(`/pharmacist/prescriptions?prescriptionId=${prescriptionId}`);
    },
    [push]
  );

  const isInitialLoading = (prescriptionsPending || inventoryPending) && prescriptions.length === 0 && inventory.length === 0;

  return (
    <div className="gap-y-4 p-4 sm:gap-y-5 sm:p-6">
      <PharmacistDashboardHeader
        onFindMedicine={() => push("/pharmacist/inventory")}
        onAddStock={() => push("/pharmacist/inventory?action=add")}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCardSkeleton icon={<Pill className="size-4" />} label="Pending" />
          <StatCardSkeleton icon={<Clock className="size-4" />} label="Payment Due" />
          <StatCardSkeleton icon={<CheckCircle className="size-4" />} label="Dispensed" />
          <StatCardSkeleton icon={<AlertTriangle className="size-4" />} label="Low Stock" />
          <StatCardSkeleton icon={<TrendingUp className="size-4" />} label="Monthly" />
        </div>
      ) : (
        <PharmacistDashboardStatsGrid
          pendingPrescriptions={stats.pendingPrescriptions}
          awaitingPayment={stats.awaitingPayment}
          dispensedToday={stats.dispensedToday}
          lowStockItems={stats.lowStockItems}
          monthlyDispensed={stats.monthlyDispensed}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isInitialLoading ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-tight text-slate-500">
                Today&apos;s Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-y-3">
              <SkeletonList items={4} />
            </CardContent>
          </Card>
        ) : (
          <PharmacistDashboardQueueCard
            queueItems={processedQueue}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onOpenPrescription={handleOpenPrescription}
            onDispensePrescription={handleDispensePrescription}
          />
        )}

        <div className="gap-y-6">
          {isInitialLoading ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-tight text-slate-500">
                  Inventory Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-y-3">
                <SkeletonList items={3} />
              </CardContent>
            </Card>
          ) : (
            <PharmacistDashboardInventoryAlerts
              inventoryItems={inventory as InventoryData[]}
              lowStockCount={stats.lowStockItems}
              onRestock={(itemId, itemName) =>
                push(`/pharmacist/inventory?action=add&item=${encodeURIComponent(itemId || itemName)}`)
              }
            />
          )}

          <PharmacistDashboardOperations
            onOpenInventory={() => push("/pharmacist/inventory")}
            onOpenAnalytics={() => push("/pharmacist/inventory")}
            onOpenHistory={() => push("/pharmacist/prescriptions")}
            onOpenExpiry={() => push("/pharmacist/inventory?filter=expiring")}
          />
        </div>
      </div>
    </div>
  );
}
