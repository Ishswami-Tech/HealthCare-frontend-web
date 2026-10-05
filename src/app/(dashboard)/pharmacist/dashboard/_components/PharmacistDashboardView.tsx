"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PharmacistDashboardHeader } from "./PharmacistDashboardHeader";
import { PharmacistDashboardNextCard } from "./PharmacistDashboardNextCard";
import { PharmacistDashboardQueueCard } from "./PharmacistDashboardQueueCard";
import { PharmacistDashboardInventoryAlerts } from "./PharmacistDashboardInventoryAlerts";
import { PharmacistDashboardOperations } from "./PharmacistDashboardOperations";
import { PharmacistCashPaymentDialog } from "./PharmacistCashPaymentDialog";
import { PharmacistCashRecordedBanner } from "./PharmacistCashRecordedBanner";
import {
  filterDeskQueue,
  pickNextPrescription,
  type CashRecordedNotice,
  type DeskQueueItem,
  type InventorySummary,
  type PharmacyDashboardStats,
  type StockAlert,
} from "./pharmacist-dashboard.logic";

/** Where the dashboard links to. Dispensing happens on the prescriptions screen; stock on `/pharmacy`. */
export const PHARMACY_LINKS = {
  prescriptions: "/pharmacist/prescriptions",
  /** The History tab of the prescriptions screen (dispensed and cancelled). */
  prescriptionHistory: "/pharmacist/prescriptions#history",
  prescription: (prescriptionId: string) =>
    `/pharmacist/prescriptions?prescriptionId=${encodeURIComponent(prescriptionId)}`,
  inventory: "/pharmacy",
  addStock: "/pharmacy?action=add",
  restock: (alert: StockAlert) => `/pharmacy?action=add&item=${encodeURIComponent(alert.restockKey)}`,
  lowStock: "/pharmacy?filter=low",
  expiring: "/pharmacy?filter=expiring",
} as const;

export interface PharmacistDashboardViewProps {
  /** Today's date for the banner ("Saturday, 3 October"). */
  dateLabel: string;
  stats: PharmacyDashboardStats;
  statsLoading?: boolean;

  /** The whole medicine-desk queue, in queue order. */
  queue: DeskQueueItem[];
  queueLoading?: boolean;
  queueError?: string | null;
  onRetryQueue?: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;

  inventory: InventorySummary;
  inventoryLoading?: boolean;
  inventoryError?: string | null;

  onPrintInvoice?: (invoiceId: string) => void;

  /** Opens the confirm dialog for a prescription that waits for payment. */
  onRecordCashPayment?: (item: DeskQueueItem) => void;
  /** The prescription shown in the "Record cash payment" dialog; null = closed. */
  cashPaymentTarget: DeskQueueItem | null;
  isRecordingCashPayment?: boolean;
  cashPaymentError?: string | null;
  onConfirmCashPayment: (item: DeskQueueItem) => void;
  onCloseCashPayment: () => void;

  /** Set right after a cash payment was recorded. */
  cashRecorded: CashRecordedNotice | null;
  onDismissCashRecorded: () => void;
}

/** Pharmacy dashboard layout. Props only — data and mutations live in `PharmacistDashboardContent`. */
export function PharmacistDashboardView({
  dateLabel,
  stats,
  statsLoading = false,
  queue,
  queueLoading = false,
  queueError = null,
  onRetryQueue,
  searchTerm,
  onSearchTermChange,
  inventory,
  inventoryLoading = false,
  inventoryError = null,
  onPrintInvoice,
  onRecordCashPayment,
  cashPaymentTarget,
  isRecordingCashPayment = false,
  cashPaymentError = null,
  onConfirmCashPayment,
  onCloseCashPayment,
  cashRecorded,
  onDismissCashRecorded,
}: PharmacistDashboardViewProps) {
  const nextPrescription = pickNextPrescription(queue);
  const visibleQueue = filterDeskQueue(queue, searchTerm);

  return (
    <DashboardPageShell>
      {cashRecorded ? <PharmacistCashRecordedBanner notice={cashRecorded} onDismiss={onDismissCashRecorded} /> : null}

      <PharmacistDashboardHeader dateLabel={dateLabel} stats={stats} statsLoading={statsLoading} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {queueError && !nextPrescription ? null : (
            <PharmacistDashboardNextCard
              item={nextPrescription}
              loading={queueLoading}
              prescriptionHref={PHARMACY_LINKS.prescription}
              onRecordCashPayment={onRecordCashPayment}
              isRecordingCashPayment={isRecordingCashPayment}
              onPrintInvoice={onPrintInvoice}
            />
          )}
          <PharmacistDashboardQueueCard
            queueItems={visibleQueue}
            totalCount={queue.length}
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            prescriptionHref={PHARMACY_LINKS.prescription}
            allPrescriptionsHref={PHARMACY_LINKS.prescriptions}
            onRecordCashPayment={onRecordCashPayment}
            isRecordingCashPayment={isRecordingCashPayment}
            onPrintInvoice={onPrintInvoice}
            loading={queueLoading}
            errorMessage={queue.length === 0 ? queueError : null}
            onRetry={onRetryQueue}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <PharmacistDashboardInventoryAlerts
            inventory={inventory}
            loading={inventoryLoading}
            errorMessage={inventory.totalMedicines === 0 ? inventoryError : null}
            addStockHref={PHARMACY_LINKS.addStock}
            restockHref={PHARMACY_LINKS.restock}
            lowStockHref={PHARMACY_LINKS.lowStock}
          />
          <PharmacistDashboardOperations
            inventory={inventory}
            inventoryLoading={inventoryLoading}
            inventoryHref={PHARMACY_LINKS.inventory}
            historyHref={PHARMACY_LINKS.prescriptionHistory}
            expiryHref={PHARMACY_LINKS.expiring}
          />
        </div>
      </div>

      <PharmacistCashPaymentDialog
        item={cashPaymentTarget}
        isRecording={isRecordingCashPayment}
        errorMessage={cashPaymentError}
        onConfirm={onConfirmCashPayment}
        onClose={onCloseCashPayment}
      />
    </DashboardPageShell>
  );
}
