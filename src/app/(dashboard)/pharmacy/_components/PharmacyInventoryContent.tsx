"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAuth } from "@/hooks/auth/useAuth";
import { Role } from "@/types/auth.types";
import {
  useAdjustBatchStock,
  useCreateMedicine,
  useCreatePharmacyOrder,
  useCreateSupplier,
  useDeleteMedicine,
  useExportPharmacyData,
  useInventoryAlerts,
  useMedicine,
  useMedicines,
  usePharmacyOrder,
  usePharmacyOrders,
  usePharmacySales,
  usePharmacyStats,
  usePrescriptions,
  useReceivePharmacyOrder,
  useReceiveStockBatch,
  useSendPharmacyOrder,
  useStockBatches,
  useSuppliers,
  useUpdateMedicine,
  useUpdateSupplier,
} from "@/hooks/query/usePharmacy";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { usePharmacyPermissions } from "@/hooks/utils/useRBAC";
import { APP_CONFIG } from "@/lib/config/config";
import {
  INVENTORY_TABS,
  PharmacyInventoryView,
  dialogFromQuery,
  type InventoryDialog,
} from "./PharmacyInventoryView";
import {
  CAN_REMOVE_MEDICINE,
  EMPTY_FILTERS,
  buildAnalytics,
  buildInventoryOverview,
  buildOrders,
  buildSuppliers,
  findMedicine,
  stockFilterFromQuery,
  supplierNameMap,
  todayKey,
  type InventoryFilters,
  type MedicineRow,
  type OrderRow,
  type StatsPeriod,
} from "./pharmacy-inventory.logic";
import {
  toCreateMedicinePayload,
  toCreateOrderPayload,
  toCreateSupplierPayload,
  toExportPayload,
  toReceiveBatchPayload,
  toReceiveOrderPayload,
  toUpdateMedicinePayload,
  toUpdateSupplierPayload,
  type AddMedicineValues,
  type AdjustBatchValues,
  type EditMedicineValues,
  type ExportValues,
  type NewOrderValues,
  type ReceiveBatchValues,
  type ReceiveOrderValues,
  type SupplierValues,
} from "./pharmacy-inventory.schemas";
import type { SalesRange } from "./PharmacySalesPanel";
import {
  buildBatchAlerts,
  buildBatchRows,
  firstOfMonthKey,
  salesRangeProblem,
  type BatchRow,
} from "./pharmacy-stock.logic";

const NO_CLINIC = "No clinic is selected for your account.";
/** The purchase-order and stats routes are for pharmacists and clinic admins; a super admin gets 403 from them. */
const NOT_FOR_ROLE = "Purchase orders are not available for your role. A clinic admin or pharmacist can manage them.";

function errorText(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error && error.message) return error.message;
  return typeof error === "string" && error ? error : "Please try again.";
}

/** Saves the exported file from the browser. */
function downloadFile(file: { fileName: string; mimeType: string; content: string }) {
  // The byte-order mark lets Excel read rupee signs and other non-ASCII text in a CSV.
  const url = URL.createObjectURL(new Blob(["﻿", file.content], { type: file.mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Data container of `/pharmacy`: reads the pharmacy hooks and hands plain props to `PharmacyInventoryView`. */
export default function PharmacyInventoryContent() {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const permissions = usePharmacyPermissions();
  const { session } = useAuth();
  const ordersAllowed = String(session?.user?.role ?? "").toUpperCase() !== Role.SUPER_ADMIN;
  const canManage = permissions.canManageInventory;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { tab, setTab } = useHashTab({ tabs: INVENTORY_TABS, defaultValue: "inventory" });
  const [filters, setFilters] = useState<InventoryFilters>(() => ({
    ...EMPTY_FILTERS,
    stock: stockFilterFromQuery(searchParams.get("filter")),
  }));
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<InventoryDialog | null>(() => dialogFromQuery(searchParams));
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [salesRange, setSalesRange] = useState<SalesRange>(() => ({
    from: firstOfMonthKey(),
    to: todayKey(),
    groupBy: "day",
  }));
  const rangeProblem = salesRangeProblem(salesRange.from, salesRange.to);

  useWebSocketQuerySync();

  // Drop `action` / `item` from the address once read, so a refresh does not reopen the dialog.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("action") && !url.searchParams.has("item")) return;
    url.searchParams.delete("action");
    url.searchParams.delete("item");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    data: medicinesData,
    isPending: medicinesPending,
    error: medicinesError,
    refetch: refetchMedicines,
  } = useMedicines(scopedClinicId);
  const {
    data: suppliersData,
    isPending: suppliersPending,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useSuppliers();
  const {
    data: ordersData,
    isPending: ordersPending,
    error: ordersError,
    refetch: refetchOrders,
  } = usePharmacyOrders(scopedClinicId, { limit: 50, enabled: ordersAllowed });
  const {
    data: salesReport,
    isPending: salesPending,
    error: salesError,
    refetch: refetchSales,
  } = usePharmacySales(scopedClinicId, { ...salesRange, enabled: rangeProblem === null });
  const { data: alertsData } = useInventoryAlerts(scopedClinicId);
  const { data: prescriptionsData, isPending: prescriptionsPending } = usePrescriptions(scopedClinicId, {
    limit: 100,
    enabled: !!clinicId && permissions.canManagePrescriptions,
  });
  const { data: pharmacyStats } = usePharmacyStats(scopedClinicId, statsPeriod, { enabled: ordersAllowed });

  const supplierNames = useMemo(() => supplierNameMap(suppliersData), [suppliersData]);
  const overview = useMemo(() => buildInventoryOverview(medicinesData, supplierNames), [medicinesData, supplierNames]);
  const suppliers = useMemo(() => buildSuppliers(suppliersData, overview.rows), [suppliersData, overview.rows]);
  const orders = useMemo(
    () => buildOrders(ordersData, overview.rows, supplierNames),
    [ordersData, overview.rows, supplierNames],
  );
  const analytics = useMemo(
    () => buildAnalytics(permissions.canManagePrescriptions ? prescriptionsData : null, orders, pharmacyStats),
    [orders, permissions.canManagePrescriptions, pharmacyStats, prescriptionsData],
  );
  const alerts = useMemo(() => buildBatchAlerts(alertsData, overview.rows), [alertsData, overview.rows]);

  // The order dialogs show the list row at once and the fresh record when it arrives: the receive
  // form needs the quantities still outstanding as the server holds them now.
  const dialogOrderId =
    dialog?.kind === "orderDetails" || dialog?.kind === "receiveOrder" ? dialog.orderId : "";
  const { data: orderDetail, isFetching: orderFetching } = usePharmacyOrder(scopedClinicId, dialogOrderId);
  const dialogOrder = useMemo<OrderRow | null>(() => {
    if (!dialogOrderId) return null;
    const fresh = orderDetail ? (buildOrders([orderDetail], overview.rows, supplierNames)?.[0] ?? null) : null;
    return fresh ?? orders?.find((order) => order.id === dialogOrderId) ?? null;
  }, [dialogOrderId, orderDetail, orders, overview.rows, supplierNames]);

  // Batches of the medicine in the batches / receive-stock dialog.
  const batchesMedicineId =
    dialog?.kind === "batches" || dialog?.kind === "restock"
      ? (findMedicine(overview.rows, dialog.medicineKey)?.id ?? "")
      : "";
  const {
    data: batchData,
    isPending: batchesPending,
    error: batchesError,
    refetch: refetchBatches,
  } = useStockBatches(scopedClinicId, { productId: batchesMedicineId, enabled: !!batchesMedicineId });
  const batches = useMemo(() => buildBatchRows(batchData), [batchData]);

  // The details dialog shows the list row at once and the fresh record when it arrives.
  const detailsId =
    dialog?.kind === "details" ? (findMedicine(overview.rows, dialog.medicineKey)?.id ?? "") : "";
  const { data: medicineData, isFetching: medicineFetching } = useMedicine(detailsId);
  const detailsMedicine = useMemo(() => {
    if (!detailsId || !medicineData) return null;
    return buildInventoryOverview([medicineData], supplierNames).rows.find((row) => row.id === detailsId) ?? null;
  }, [detailsId, medicineData, supplierNames]);

  const lastSyncedAt = queryClient.getQueryState(["medicines", scopedClinicId, undefined])?.dataUpdatedAt;

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const deleteMedicine = useDeleteMedicine();
  const createOrder = useCreatePharmacyOrder();
  const sendOrder = useSendPharmacyOrder();
  const receiveOrder = useReceivePharmacyOrder();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const receiveBatch = useReceiveStockBatch();
  const adjustBatch = useAdjustBatchStock();
  const exportData = useExportPharmacyData();

  const changeDialog = useCallback((next: InventoryDialog | null) => {
    setDialogError(null);
    setDialog(next);
  }, []);

  /**
   * Runs a mutation of the open dialog: closes it on success (unless `keepOpen`), keeps it open with
   * the message on failure. Resolves true when the request succeeded.
   */
  const submit = useCallback(
    async (
      request: (clinic: string) => Promise<unknown>,
      options: { needsManage?: boolean; keepOpen?: boolean } = {},
    ): Promise<boolean> => {
      const { needsManage = true, keepOpen = false } = options;
      if (needsManage && !canManage) {
        setDialogError("You do not have permission to change the inventory.");
        return false;
      }
      if (!clinicId) {
        setDialogError(NO_CLINIC);
        return false;
      }
      setDialogError(null);
      try {
        await request(clinicId);
        if (!keepOpen) setDialog(null);
        return true;
      } catch (error) {
        setDialogError(errorText(error));
        return false;
      }
    },
    [canManage, clinicId],
  );

  const handleAddMedicine = (values: AddMedicineValues) =>
    void submit((clinic) => createMedicine.mutateAsync({ clinicId: clinic, ...toCreateMedicinePayload(values) }));

  const handleEditMedicine = (medicine: MedicineRow, values: EditMedicineValues) => {
    const updates = toUpdateMedicinePayload(values, medicine);
    if (!updates) {
      changeDialog(null);
      return;
    }
    void submit((clinic) => updateMedicine.mutateAsync({ clinicId: clinic, medicineId: medicine.id, updates }));
  };

  const handleReceiveBatch = (medicine: MedicineRow, values: ReceiveBatchValues) =>
    submit(
      (clinic) => receiveBatch.mutateAsync({ clinicId: clinic, ...toReceiveBatchPayload(medicine, values) }),
      { keepOpen: true },
    );

  const handleAdjustBatch = (medicine: MedicineRow, batch: BatchRow, values: AdjustBatchValues) =>
    submit(
      (clinic) =>
        adjustBatch.mutateAsync({
          clinicId: clinic,
          productId: medicine.id,
          batchId: batch.id,
          quantity: Number(values.change),
          reason: values.reason.trim(),
        }),
      { keepOpen: true },
    );

  const handleSendOrder = (order: OrderRow) =>
    void submit((clinic) => sendOrder.mutateAsync({ clinicId: clinic, orderId: order.id }), { keepOpen: true });

  const handleReceiveOrder = (order: OrderRow, values: ReceiveOrderValues) =>
    void submit((clinic) =>
      receiveOrder.mutateAsync({ clinicId: clinic, orderId: order.id, batches: toReceiveOrderPayload(values) }),
    );

  const handleSaveSupplier = (values: SupplierValues, supplierId?: string) =>
    void submit((clinic) =>
      supplierId
        ? updateSupplier.mutateAsync({ clinicId: clinic, supplierId, updates: toUpdateSupplierPayload(values) })
        : createSupplier.mutateAsync({ clinicId: clinic, ...toCreateSupplierPayload(values) }),
    );

  const handleRemoveMedicine = (medicine: MedicineRow) =>
    void submit((clinic) => deleteMedicine.mutateAsync({ clinicId: clinic, medicineId: medicine.id }));

  const handlePlaceOrder = (values: NewOrderValues) =>
    void submit((clinic) => createOrder.mutateAsync({ clinicId: clinic, ...toCreateOrderPayload(values) }));

  const handleExport = (values: ExportValues) =>
    void submit(async (clinic) => {
      const file = await exportData.mutateAsync({ clinicId: clinic, ...toExportPayload(values) });
      downloadFile(file);
    }, { needsManage: false });

  const dialogBusy =
    createMedicine.isPending ||
    updateMedicine.isPending ||
    deleteMedicine.isPending ||
    createOrder.isPending ||
    sendOrder.isPending ||
    receiveOrder.isPending ||
    createSupplier.isPending ||
    updateSupplier.isPending ||
    receiveBatch.isPending ||
    adjustBatch.isPending ||
    exportData.isPending;

  const inventoryLoading = !!clinicId && medicinesPending && overview.rows.length === 0;

  return (
    <PharmacyInventoryView
      tab={tab}
      onTabChange={setTab}
      overview={overview}
      inventoryLoading={inventoryLoading}
      inventoryError={clinicId ? errorText(medicinesError) : NO_CLINIC}
      onRetryInventory={() => void refetchMedicines()}
      filters={filters}
      onFiltersChange={setFilters}
      page={page}
      onPageChange={setPage}
      canManage={canManage}
      canRemove={CAN_REMOVE_MEDICINE}
      suppliers={suppliers}
      suppliersLoading={suppliersPending && suppliers.length === 0}
      suppliersError={errorText(suppliersError)}
      onRetrySuppliers={() => void refetchSuppliers()}
      orders={orders}
      ordersLoading={ordersAllowed && !!clinicId && ordersPending}
      ordersError={ordersAllowed ? errorText(ordersError) : NOT_FOR_ROLE}
      onRetryOrders={() => void refetchOrders()}
      dialogOrder={dialogOrder}
      dialogOrderRefreshing={orderFetching}
      alerts={alerts}
      batches={batches}
      batchesLoading={!!batchesMedicineId && batchesPending}
      batchesError={errorText(batchesError)}
      onRetryBatches={() => void refetchBatches()}
      analytics={analytics}
      analyticsLoading={!!clinicId && permissions.canManagePrescriptions && prescriptionsPending}
      statsPeriod={statsPeriod}
      onStatsPeriodChange={setStatsPeriod}
      sales={{
        range: salesRange,
        onRangeChange: setSalesRange,
        rangeProblem,
        report: salesReport,
        loading: rangeProblem === null && !!clinicId && salesPending,
        errorMessage: errorText(salesError),
        onRetry: () => void refetchSales(),
      }}
      settingsInfo={{
        appVersion: APP_CONFIG.APP.VERSION,
        partnerCount: suppliersPending || suppliersError ? null : suppliers.length,
        medicineCount: inventoryLoading || medicinesError || !clinicId ? null : overview.rows.length,
        lastSyncedAt: lastSyncedAt ? new Date(lastSyncedAt).toISOString() : null,
      }}
      dialog={dialog}
      onDialogChange={changeDialog}
      detailsMedicine={detailsMedicine}
      detailsRefreshing={medicineFetching}
      dialogBusy={dialogBusy}
      dialogError={dialogError}
      onAddMedicine={handleAddMedicine}
      onEditMedicine={handleEditMedicine}
      onReceiveBatch={handleReceiveBatch}
      onAdjustBatch={handleAdjustBatch}
      onRemoveMedicine={handleRemoveMedicine}
      onPlaceOrder={handlePlaceOrder}
      onSendOrder={handleSendOrder}
      onReceiveOrder={handleReceiveOrder}
      onSaveSupplier={handleSaveSupplier}
      onExport={handleExport}
    />
  );
}
