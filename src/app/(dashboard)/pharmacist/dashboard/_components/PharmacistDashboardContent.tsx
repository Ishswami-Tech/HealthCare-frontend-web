"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePrescriptions, useInventory, usePharmacyStats, useMedicineDeskQueue } from "@/hooks/query/usePharmacy";
import { useRecordCashPrescriptionPayment } from "@/hooks/query/usePatientVisits";
import { API_ENDPOINTS } from "@/lib/config/config";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { resolveDisplayNameAndInitials } from "@/lib/utils/display-name";
import { PharmacistDashboardView } from "./PharmacistDashboardView";
import {
  buildCashRecordedNotice,
  buildDeskQueue,
  buildInventorySummary,
  buildPharmacyStats,
  todayLabel,
  unwrapList,
  type CashRecordedNotice,
  type DeskQueueItem,
} from "./pharmacist-dashboard.logic";

function errorText(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error && error.message) return error.message;
  return typeof error === "string" && error ? error : "Please try again.";
}

/** Data container: reads the pharmacy hooks and hands plain props to `PharmacistDashboardView`. */
export default function PharmacistDashboardContent() {
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;
  const [searchTerm, setSearchTerm] = useState("");
  const [cashPaymentTarget, setCashPaymentTarget] = useState<DeskQueueItem | null>(null);
  const [cashPaymentError, setCashPaymentError] = useState<string | null>(null);
  const [cashRecorded, setCashRecorded] = useState<CashRecordedNotice | null>(null);

  useWebSocketQuerySync();

  const { data: prescriptionsData, isPending: prescriptionsPending } = usePrescriptions(clinicId || "", {
    limit: 100,
  });
  const {
    data: inventoryData,
    isPending: inventoryPending,
    error: inventoryError,
  } = useInventory(clinicId || "", {
    limit: 100,
  });
  const { data: pharmacyStats } = usePharmacyStats(clinicId || "", "month");
  const {
    data: medicineDeskQueue,
    isPending: queuePending,
    error: queueError,
    refetch: refetchQueue,
  } = useMedicineDeskQueue(clinicId || "", !!clinicId);

  const queue = useMemo(() => buildDeskQueue(medicineDeskQueue), [medicineDeskQueue]);
  const inventory = useMemo(() => buildInventorySummary(inventoryData), [inventoryData]);
  const stats = useMemo(
    () => buildPharmacyStats(prescriptionsData, inventory, pharmacyStats),
    [inventory, pharmacyStats, prescriptionsData],
  );

  const recordCashPayment = useRecordCashPrescriptionPayment();
  const recordedBy = user ? resolveDisplayNameAndInitials(user).displayName : "";

  const handleOpenCashPayment = useCallback((item: DeskQueueItem) => {
    setCashPaymentError(null);
    setCashPaymentTarget(item);
  }, []);

  const handleCloseCashPayment = useCallback(() => {
    setCashPaymentTarget(null);
    setCashPaymentError(null);
  }, []);

  // Runs only when the pharmacist presses "Mark paid — cash" in the confirm dialog.
  const handleConfirmCashPayment = useCallback(
    async (item: DeskQueueItem) => {
      if (!clinicId) {
        setCashPaymentError("No clinic is selected for your account.");
        return;
      }
      setCashPaymentError(null);
      try {
        const result = await recordCashPayment.mutateAsync({ clinicId, prescriptionId: item.id });
        setCashRecorded(buildCashRecordedNotice(item, result, recordedBy));
        setCashPaymentTarget(null);
      } catch (error) {
        setCashPaymentError(errorText(error));
      }
    },
    [clinicId, recordCashPayment, recordedBy],
  );

  const handlePrintInvoice = useCallback((invoiceId: string) => {
    window.open(API_ENDPOINTS.BILLING.INVOICES.DOWNLOAD(invoiceId), "_blank", "noopener,noreferrer");
  }, []);

  const hasPrescriptions = unwrapList(prescriptionsData, "prescriptions").length > 0;
  const isInitialLoading =
    (prescriptionsPending || inventoryPending) && !hasPrescriptions && inventory.totalMedicines === 0;

  return (
    <PharmacistDashboardView
      dateLabel={todayLabel()}
      stats={stats}
      statsLoading={isInitialLoading}
      queue={queue}
      queueLoading={queuePending && queue.length === 0}
      queueError={errorText(queueError)}
      onRetryQueue={() => void refetchQueue()}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      inventory={inventory}
      inventoryLoading={inventoryPending && inventory.totalMedicines === 0}
      inventoryError={errorText(inventoryError)}
      onPrintInvoice={handlePrintInvoice}
      onRecordCashPayment={handleOpenCashPayment}
      cashPaymentTarget={cashPaymentTarget}
      isRecordingCashPayment={recordCashPayment.isPending}
      cashPaymentError={cashPaymentError}
      onConfirmCashPayment={(item) => void handleConfirmCashPayment(item)}
      onCloseCashPayment={handleCloseCashPayment}
      cashRecorded={cashRecorded}
      onDismissCashRecorded={() => setCashRecorded(null)}
    />
  );
}
