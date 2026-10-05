"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useCreateMedicine,
  useCreatePharmacyOrder,
  useDeleteMedicine,
  useExportPharmacyData,
  useMedicine,
  useMedicines,
  usePharmacyOrders,
  usePharmacySales,
  usePharmacyStats,
  usePrescriptions,
  useSuppliers,
  useUpdateInventory,
  useUpdateMedicine,
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
  type InventoryFilters,
  type MedicineRow,
} from "./pharmacy-inventory.logic";
import {
  toCreateMedicinePayload,
  toCreateOrderPayload,
  toExportPayload,
  toUpdateMedicinePayload,
  type AddMedicineValues,
  type EditMedicineValues,
  type ExportValues,
  type NewOrderValues,
} from "./pharmacy-inventory.schemas";

const NO_CLINIC = "No clinic is selected for your account.";

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
  } = usePharmacyOrders(scopedClinicId, { limit: 50 });
  const { data: salesData } = usePharmacySales(scopedClinicId, { limit: 500 });
  const { data: prescriptionsData, isPending: prescriptionsPending } = usePrescriptions(scopedClinicId, {
    limit: 100,
    enabled: !!clinicId && permissions.canManagePrescriptions,
  });
  const { data: pharmacyStats } = usePharmacyStats(scopedClinicId, "month");

  const supplierNames = useMemo(() => supplierNameMap(suppliersData), [suppliersData]);
  const overview = useMemo(() => buildInventoryOverview(medicinesData, supplierNames), [medicinesData, supplierNames]);
  const suppliers = useMemo(() => buildSuppliers(suppliersData, overview.rows), [suppliersData, overview.rows]);
  const orders = useMemo(
    () => buildOrders(ordersData, overview.rows, supplierNames),
    [ordersData, overview.rows, supplierNames],
  );
  const analytics = useMemo(
    () =>
      buildAnalytics(
        permissions.canManagePrescriptions ? prescriptionsData : null,
        salesData,
        orders,
        pharmacyStats,
      ),
    [orders, permissions.canManagePrescriptions, pharmacyStats, prescriptionsData, salesData],
  );

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
  const updateInventory = useUpdateInventory();
  const createOrder = useCreatePharmacyOrder();
  const exportData = useExportPharmacyData();

  const changeDialog = useCallback((next: InventoryDialog | null) => {
    setDialogError(null);
    setDialog(next);
  }, []);

  /** Runs a mutation of the open dialog: closes it on success, keeps it open with the message on failure. */
  const submit = useCallback(
    async (request: (clinic: string) => Promise<unknown>, needsManage = true) => {
      if (needsManage && !canManage) {
        setDialogError("You do not have permission to change the inventory.");
        return;
      }
      if (!clinicId) {
        setDialogError(NO_CLINIC);
        return;
      }
      setDialogError(null);
      try {
        await request(clinicId);
        setDialog(null);
      } catch (error) {
        setDialogError(errorText(error));
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

  const handleRestock = (medicine: MedicineRow, quantity: number) =>
    void submit((clinic) =>
      updateInventory.mutateAsync({
        clinicId: clinic,
        medicineId: medicine.id,
        inventoryData: { quantityChange: quantity },
      }),
    );

  const handleRemoveMedicine = (medicine: MedicineRow) =>
    void submit((clinic) => deleteMedicine.mutateAsync({ clinicId: clinic, medicineId: medicine.id }));

  const handlePlaceOrder = (values: NewOrderValues) =>
    void submit((clinic) => createOrder.mutateAsync({ clinicId: clinic, ...toCreateOrderPayload(values) }));

  const handleExport = (values: ExportValues) =>
    void submit(async (clinic) => {
      const file = await exportData.mutateAsync({ clinicId: clinic, ...toExportPayload(values) });
      downloadFile(file);
    }, false);

  const dialogBusy =
    createMedicine.isPending ||
    updateMedicine.isPending ||
    deleteMedicine.isPending ||
    updateInventory.isPending ||
    createOrder.isPending ||
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
      ordersLoading={!!clinicId && ordersPending}
      ordersError={errorText(ordersError)}
      analytics={analytics}
      analyticsLoading={!!clinicId && permissions.canManagePrescriptions && prescriptionsPending}
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
      onRestock={handleRestock}
      onRemoveMedicine={handleRemoveMedicine}
      onPlaceOrder={handlePlaceOrder}
      onExport={handleExport}
    />
  );
}
