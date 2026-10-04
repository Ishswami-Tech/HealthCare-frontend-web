"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useRecordCashPrescriptionPayment } from "@/hooks/query/usePatientVisits";
import {
  useDispensePrescription,
  useMedicines,
  usePharmacyBatchAudit,
  usePrescriptions,
  useReversePrescriptionDispense,
} from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import type { PharmacyBatchAuditEntry } from "@/types/pharmacy.types";
import { buildDeskQueue, type DeskQueueItem } from "../../dashboard/_components/pharmacist-dashboard.logic";
import { PharmacistPrescriptionsView } from "./PharmacistPrescriptionsView";
import {
  PRESCRIPTION_TABS,
  STATE_FILTERS,
  buildDispensePayload,
  buildMedicineCatalog,
  filterBatchAudit,
  filterPrescriptions,
  isHistoryPrescription,
  normalizePrescription,
  sortNewestFirst,
  type PrescriptionRow,
  type PrescriptionsTab,
} from "./pharmacist-prescriptions.logic";
import { usePharmacistPrescriptionsState } from "./usePharmacistPrescriptionsState";

function errorText(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error && error.message) return error.message;
  return typeof error === "string" && error ? error : "Please try again.";
}

/**
 * Data container of the pharmacy prescriptions screen: reads the pharmacy hooks, runs the
 * dispense / reverse / cash-payment mutations and hands plain props to
 * `PharmacistPrescriptionsView`.
 *
 * Deep links: `?prescriptionId=<id>` marks that prescription (and opens "Review dispense"
 * when it is paid for); `#history` / `?tab=history` and `#audit` open the other tabs.
 */
export default function PharmacistPrescriptionsContent() {
  useAuth();
  useWebSocketQuerySync();

  const { clinicId } = useClinicContext();
  const { tab, setTab } = useHashTab<PrescriptionsTab>({ tabs: PRESCRIPTION_TABS, defaultValue: "active" });
  const { state, actions, openDispenseDialog, openReverseDialog } = usePharmacistPrescriptionsState();
  const {
    searchTerm,
    statusFilter,
    auditStartDate,
    auditEndDate,
    auditSearchTerm,
    selectedPrescription,
    dispenseLines,
    dispenseNotes,
    dispenseFormError,
    selectedReversalPrescription,
    reversalReason,
    reversalError,
  } = state;

  const [cashPaymentTarget, setCashPaymentTarget] = useState<DeskQueueItem | null>(null);
  const [cashPaymentError, setCashPaymentError] = useState<string | null>(null);

  const {
    data: prescriptionsData = [],
    isPending: prescriptionsPending,
    error: prescriptionsError,
    refetch: refetchPrescriptions,
  } = usePrescriptions(clinicId || "", { limit: 100 });
  const { data: medicinesData = [] } = useMedicines(clinicId || "", { limit: 200 });
  const batchAuditFilters = useMemo(
    () => ({
      ...(auditStartDate ? { startDate: auditStartDate } : {}),
      ...(auditEndDate ? { endDate: auditEndDate } : {}),
      enabled: Boolean(clinicId),
    }),
    [auditEndDate, auditStartDate, clinicId],
  );
  const {
    data: batchAuditData = [],
    isPending: batchAuditPending,
    error: batchAuditError,
    refetch: refetchBatchAudit,
  } = usePharmacyBatchAudit(clinicId || "", batchAuditFilters);

  const dispensePrescription = useDispensePrescription();
  const reversePrescription = useReversePrescriptionDispense();
  const recordCashPayment = useRecordCashPrescriptionPayment();

  const prescriptions = useMemo(
    () => sortNewestFirst((Array.isArray(prescriptionsData) ? prescriptionsData : []).map(normalizePrescription)),
    [prescriptionsData],
  );
  const medicineCatalog = useMemo(() => buildMedicineCatalog(medicinesData), [medicinesData]);
  const catalogById = useMemo(
    () => new Map(medicineCatalog.map((medicine) => [medicine.id, medicine] as const)),
    [medicineCatalog],
  );

  const allActive = useMemo(
    () => prescriptions.filter((prescription) => !isHistoryPrescription(prescription)),
    [prescriptions],
  );
  const allHistory = useMemo(() => prescriptions.filter(isHistoryPrescription), [prescriptions]);

  // The state filter offers different states on each tab; an option of the other tab counts as "all".
  const listTab = tab === "audit" ? "active" : tab;
  const effectiveStatusFilter = STATE_FILTERS[listTab].some((option) => option.value === statusFilter)
    ? statusFilter
    : "all";
  const activePrescriptions = useMemo(
    () => filterPrescriptions(allActive, searchTerm, listTab === "active" ? effectiveStatusFilter : "all"),
    [allActive, effectiveStatusFilter, listTab, searchTerm],
  );
  const historyPrescriptions = useMemo(
    () => filterPrescriptions(allHistory, searchTerm, listTab === "history" ? effectiveStatusFilter : "all"),
    [allHistory, effectiveStatusFilter, listTab, searchTerm],
  );

  const batchAuditEntries = useMemo(
    () =>
      filterBatchAudit(
        (Array.isArray(batchAuditData) ? batchAuditData : []) as PharmacyBatchAuditEntry[],
        auditSearchTerm,
      ),
    [auditSearchTerm, batchAuditData],
  );

  // ── Deep link from the dashboard: /pharmacist/prescriptions?prescriptionId=<id> ──
  const deepLinkId = useSearchParams().get("prescriptionId");
  const [handledDeepLink, setHandledDeepLink] = useState<string | null>(null);
  const deepLinkTarget = useMemo(
    () => (deepLinkId ? (prescriptions.find((prescription) => prescription.id === deepLinkId) ?? null) : null),
    [deepLinkId, prescriptions],
  );
  useEffect(() => {
    if (!deepLinkTarget || handledDeepLink === deepLinkTarget.id) return;
    setHandledDeepLink(deepLinkTarget.id);
    if (isHistoryPrescription(deepLinkTarget)) {
      setTab("history");
      return;
    }
    setTab("active");
    // Paid for: go straight to the dispense form. Not paid: the row is marked and offers "Collect payment".
    openDispenseDialog(deepLinkTarget);
  }, [deepLinkTarget, handledDeepLink, openDispenseDialog, setTab]);

  const handleTabChange = useCallback(
    (next: PrescriptionsTab) => {
      setTab(next);
      actions.setStatusFilter("all");
    },
    [actions, setTab],
  );

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    const payload = buildDispensePayload(dispenseLines, catalogById);
    if (!payload.medications) {
      actions.setDispenseFormError(payload.error);
      return;
    }

    try {
      await dispensePrescription.mutateAsync({
        prescriptionId: selectedPrescription.id,
        dispensingData: {
          dispensedMedications: payload.medications,
          notes: dispenseNotes.trim() || undefined,
        },
      });
      actions.closeDispenseDialog();
    } catch (error) {
      actions.setDispenseFormError(errorText(error));
    }
  };

  const handleReverseDispense = async () => {
    if (!selectedReversalPrescription) return;

    if (!reversalReason.trim()) {
      actions.setReversalError("Enter a reversal reason.");
      return;
    }

    try {
      await reversePrescription.mutateAsync({
        prescriptionId: selectedReversalPrescription.id,
        reversalData: { reason: reversalReason.trim() },
      });
      actions.closeReverseDialog();
    } catch (error) {
      actions.setReversalError(errorText(error));
    }
  };

  // "Collect payment": the same cash dialog as the dashboard, for a prescription that is not paid for.
  const handleCollectPayment = useCallback((prescription: PrescriptionRow) => {
    const item = buildDeskQueue([prescription.raw])[0] ?? null;
    setCashPaymentError(null);
    setCashPaymentTarget(item);
  }, []);

  const handleCloseCashPayment = useCallback(() => {
    setCashPaymentTarget(null);
    setCashPaymentError(null);
  }, []);

  const handleConfirmCashPayment = async (item: DeskQueueItem) => {
    if (!clinicId) {
      setCashPaymentError("No clinic is selected for your account.");
      return;
    }
    setCashPaymentError(null);
    try {
      await recordCashPayment.mutateAsync({ clinicId, prescriptionId: item.id });
      setCashPaymentTarget(null);
    } catch (error) {
      setCashPaymentError(errorText(error));
    }
  };

  return (
    <PharmacistPrescriptionsView
      tab={tab}
      onTabChange={handleTabChange}
      activePrescriptions={activePrescriptions}
      historyPrescriptions={historyPrescriptions}
      activeCount={allActive.length}
      historyCount={allHistory.length}
      listLoading={Boolean(clinicId) && prescriptionsPending && prescriptions.length === 0}
      listError={errorText(prescriptionsError)}
      onRetryList={() => void refetchPrescriptions()}
      searchTerm={searchTerm}
      onSearchTermChange={actions.setSearchTerm}
      statusFilter={effectiveStatusFilter}
      onStatusFilterChange={actions.setStatusFilter}
      highlightId={deepLinkTarget?.id ?? null}
      onReviewDispense={openDispenseDialog}
      onCollectPayment={handleCollectPayment}
      onReverse={openReverseDialog}
      auditEntries={batchAuditEntries}
      auditLoading={Boolean(clinicId) && batchAuditPending && batchAuditEntries.length === 0}
      auditError={errorText(batchAuditError)}
      onRetryAudit={() => void refetchBatchAudit()}
      auditSearchTerm={auditSearchTerm}
      onAuditSearchTermChange={actions.setAuditSearchTerm}
      auditStartDate={auditStartDate}
      onAuditStartDateChange={actions.setAuditStartDate}
      auditEndDate={auditEndDate}
      onAuditEndDateChange={actions.setAuditEndDate}
      dispense={{
        prescription: selectedPrescription,
        lines: dispenseLines,
        notes: dispenseNotes,
        errorMessage: dispenseFormError,
        isDispensing: dispensePrescription.isPending,
        catalog: medicineCatalog,
        onBatchChange: actions.updateBatchRow,
        onAddBatch: actions.addBatchRow,
        onRemoveBatch: actions.removeBatchRow,
        onLineFieldChange: actions.updateLineField,
        onClearSubstitute: actions.clearSubstitute,
        onNotesChange: actions.setDispenseNotes,
        onConfirm: () => void handleDispense(),
        onClose: actions.closeDispenseDialog,
      }}
      reverse={{
        prescription: selectedReversalPrescription,
        reason: reversalReason,
        errorMessage: reversalError,
        isReversing: reversePrescription.isPending,
        onReasonChange: actions.setReversalReason,
        onConfirm: () => void handleReverseDispense(),
        onClose: actions.closeReverseDialog,
      }}
      cashPaymentTarget={cashPaymentTarget}
      isRecordingCashPayment={recordCashPayment.isPending}
      cashPaymentError={cashPaymentError}
      onConfirmCashPayment={(item) => void handleConfirmCashPayment(item)}
      onCloseCashPayment={handleCloseCashPayment}
    />
  );
}
