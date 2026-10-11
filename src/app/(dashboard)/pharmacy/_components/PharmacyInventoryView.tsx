"use client";

import { BarChart3, Plus } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/tbd";
import { PharmacyBatchAlerts } from "./PharmacyBatchAlerts";
import { PharmacyBatchesDialog } from "./PharmacyBatchesDialog";
import { PharmacyInventoryStockTab } from "./PharmacyInventoryStockTab";
import {
  PharmacyAnalyticsTab,
  PharmacyOrdersTab,
  PharmacyPartnersTab,
  PharmacySettingsTab,
  type PharmacySettingsInfo,
} from "./PharmacyInventoryTabs";
import { PharmacyMedicineDetailsDialog, PharmacyRemoveMedicineDialog } from "./PharmacyMedicineDetailsDialog";
import { PharmacyAddMedicineDialog, PharmacyEditMedicineDialog } from "./PharmacyMedicineFormDialogs";
import { PharmacyExportDialog } from "./PharmacyExportDialog";
import { PharmacyReceiveOrderDialog } from "./PharmacyReceiveOrderDialog";
import type { PharmacySalesPanelProps } from "./PharmacySalesPanel";
import { PharmacySupplierFormDialog } from "./PharmacySupplierFormDialog";
import {
  PharmacyNewOrderDialog,
  PharmacyOrderDetailsDialog,
  PharmacySupplierDetailsDialog,
} from "./PharmacyOrderDialogs";
import {
  findMedicine,
  type AnalyticsSummary,
  type InventoryFilters,
  type InventoryOverview,
  type MedicineRow,
  type OrderRow,
  type StatsPeriod,
  type SupplierCard,
} from "./pharmacy-inventory.logic";
import type {
  AddMedicineValues,
  AdjustBatchValues,
  EditMedicineValues,
  ExportValues,
  NewOrderValues,
  ReceiveBatchValues,
  ReceiveOrderValues,
  SupplierValues,
} from "./pharmacy-inventory.schemas";
import type { BatchAlert, BatchRow } from "./pharmacy-stock.logic";

export const INVENTORY_TABS = ["inventory", "orders", "pharmacies", "analytics", "settings"] as const;
export type InventoryTab = (typeof INVENTORY_TABS)[number];

const TAB_LABELS: Record<InventoryTab, string> = {
  inventory: "Medicine Inventory",
  orders: "Orders",
  pharmacies: "Partner Pharmacies",
  analytics: "Analytics",
  settings: "Settings",
};

/** The one dialog that is open. `medicineKey` is a medicine id (or, from a dashboard link, its name). */
export type InventoryDialog =
  | { kind: "add"; name?: string }
  | { kind: "details" | "edit" | "remove" | "batches"; medicineKey: string }
  /** Receive stock (opens the batches dialog on its receive form). `fromLink`: opened by `?action=add&item=…`; falls back to Add medicine when the item is unknown. */
  | { kind: "restock"; medicineKey: string; fromLink?: boolean }
  | { kind: "export" }
  | { kind: "order"; supplierId?: string; medicineKey?: string }
  | { kind: "orderDetails"; orderId: string }
  | { kind: "receiveOrder"; orderId: string }
  | { kind: "supplier"; supplierId: string }
  /** Add a supplier, or edit `supplierId`. */
  | { kind: "supplierForm"; supplierId?: string };

/**
 * Deep links other screens send: `?action=add` opens Add medicine, `?action=add&item=<id or name>`
 * opens Restock for that medicine.
 */
export function dialogFromQuery(params: { get: (name: string) => string | null }): InventoryDialog | null {
  if ((params.get("action") || "").toLowerCase() !== "add") return null;
  const item = (params.get("item") || "").trim();
  return item ? { kind: "restock", medicineKey: item, fromLink: true } : { kind: "add" };
}

export interface PharmacyInventoryViewProps {
  tab: InventoryTab;
  onTabChange: (tab: string) => void;

  overview: InventoryOverview;
  inventoryLoading?: boolean;
  inventoryError?: string | null;
  onRetryInventory?: () => void;
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  page: number;
  onPageChange: (page: number) => void;

  /** True with the `MANAGE_INVENTORY` permission; false hides every write action. */
  canManage: boolean;
  /** True when the backend can remove a medicine (shows Remove in the details dialog). */
  canRemove?: boolean;

  suppliers: SupplierCard[];
  suppliersLoading?: boolean;
  suppliersError?: string | null;
  onRetrySuppliers?: () => void;

  /** Null until the purchase order list has been read. */
  orders: OrderRow[] | null;
  ordersLoading?: boolean;
  ordersError?: string | null;
  onRetryOrders?: () => void;
  /** The order of the open order dialog: the fresh record when it has arrived, else the list row. */
  dialogOrder?: OrderRow | null;
  dialogOrderRefreshing?: boolean;

  /** Open stock alerts from the server, most urgent first. */
  alerts: BatchAlert[];
  /** Batches of the medicine in the batches dialog. */
  batches: BatchRow[];
  batchesLoading?: boolean;
  batchesError?: string | null;
  onRetryBatches?: () => void;

  analytics: AnalyticsSummary;
  analyticsLoading?: boolean;
  statsPeriod: StatsPeriod;
  onStatsPeriodChange: (period: StatsPeriod) => void;
  sales: PharmacySalesPanelProps;
  settingsInfo: PharmacySettingsInfo;

  dialog: InventoryDialog | null;
  onDialogChange: (dialog: InventoryDialog | null) => void;
  /** Fresh record of the medicine in the details dialog (`useMedicine`), when it has arrived. */
  detailsMedicine?: MedicineRow | null;
  detailsRefreshing?: boolean;
  /** A request of the open dialog is running. */
  dialogBusy?: boolean;
  /** Message of the failed request of the open dialog. */
  dialogError?: string | null;

  onAddMedicine: (values: AddMedicineValues) => void;
  onEditMedicine: (medicine: MedicineRow, values: EditMedicineValues) => void;
  /** Resolve true when the change was saved. */
  onReceiveBatch: (medicine: MedicineRow, values: ReceiveBatchValues) => Promise<boolean>;
  onAdjustBatch: (medicine: MedicineRow, batch: BatchRow, values: AdjustBatchValues) => Promise<boolean>;
  onRemoveMedicine: (medicine: MedicineRow) => void;
  onPlaceOrder: (values: NewOrderValues) => void;
  onSendOrder: (order: OrderRow) => void;
  onReceiveOrder: (order: OrderRow, values: ReceiveOrderValues) => void;
  /** `supplierId` set = edit that supplier. */
  onSaveSupplier: (values: SupplierValues, supplierId?: string) => void;
  onExport: (values: ExportValues) => void;
}

/** Pharmacy inventory layout. Props only — data and mutations live in `PharmacyInventoryContent`. */
export function PharmacyInventoryView({
  tab,
  onTabChange,
  overview,
  inventoryLoading = false,
  inventoryError = null,
  onRetryInventory,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  canManage,
  canRemove = false,
  suppliers,
  suppliersLoading = false,
  suppliersError = null,
  onRetrySuppliers,
  orders,
  ordersLoading = false,
  ordersError = null,
  onRetryOrders,
  dialogOrder = null,
  dialogOrderRefreshing = false,
  alerts,
  batches,
  batchesLoading = false,
  batchesError = null,
  onRetryBatches,
  analytics,
  analyticsLoading = false,
  statsPeriod,
  onStatsPeriodChange,
  sales,
  settingsInfo,
  dialog,
  onDialogChange,
  detailsMedicine = null,
  detailsRefreshing = false,
  dialogBusy = false,
  dialogError = null,
  onAddMedicine,
  onEditMedicine,
  onReceiveBatch,
  onAdjustBatch,
  onRemoveMedicine,
  onPlaceOrder,
  onSendOrder,
  onReceiveOrder,
  onSaveSupplier,
  onExport,
}: PharmacyInventoryViewProps) {
  const close = () => onDialogChange(null);
  const medicineOf = (kind: "details" | "edit" | "restock" | "remove" | "batches") =>
    dialog && dialog.kind === kind && "medicineKey" in dialog ? findMedicine(overview.rows, dialog.medicineKey) : null;

  const restockTarget = medicineOf("restock");
  // A dashboard restock link whose medicine is not in the list opens "Add medicine" with the name filled in.
  const unknownRestockItem =
    dialog?.kind === "restock" && dialog.fromLink === true && !inventoryLoading && !restockTarget
      ? dialog.medicineKey
      : null;
  const addOpen = canManage && (dialog?.kind === "add" || unknownRestockItem !== null);
  const addName = dialog?.kind === "add" ? (dialog.name ?? "") : (unknownRestockItem ?? "");
  const detailsTarget = medicineOf("details");
  const batchesTarget = dialog?.kind === "batches" ? medicineOf("batches") : canManage ? restockTarget : null;
  const editingSupplier =
    dialog?.kind === "supplierForm" && dialog.supplierId
      ? (suppliers.find((supplier) => supplier.id === dialog.supplierId) ?? null)
      : null;

  const openOrder = (target: { supplierId?: string; medicineKey?: string }) =>
    onDialogChange({ kind: "order", ...target });

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Pharmacy"
        title="Inventory"
        description="Monitor and manage the medicine stock the doctor prescribes from."
        actions={
          <>
            <Button size="md" variant="outline" onClick={() => onDialogChange({ kind: "export" })}>
              <BarChart3 aria-hidden="true" />
              Reports
            </Button>
            {canManage ? (
              <Button size="md" onClick={() => onDialogChange({ kind: "add" })}>
                <Plus aria-hidden="true" />
                Add Medicine
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={tab} onValueChange={onTabChange} className="gap-5">
        <TabsList aria-label="Inventory sections">
          {INVENTORY_TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {TAB_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="inventory" className="flex flex-col gap-5">
          <PharmacyBatchAlerts
            alerts={alerts}
            onOpenBatches={(medicineId) => onDialogChange({ kind: "batches", medicineKey: medicineId })}
          />
          <PharmacyInventoryStockTab
            overview={overview}
            loading={inventoryLoading}
            errorMessage={inventoryError}
            onRetry={onRetryInventory}
            filters={filters}
            onFiltersChange={onFiltersChange}
            page={page}
            onPageChange={onPageChange}
            canManage={canManage}
            onView={(medicine) => onDialogChange({ kind: "details", medicineKey: medicine.id })}
            onRestock={(medicine) => onDialogChange({ kind: "restock", medicineKey: medicine.id })}
            onAddMedicine={() => onDialogChange({ kind: "add" })}
          />
        </TabsContent>

        <TabsContent value="orders">
          <PharmacyOrdersTab
            orders={orders}
            loading={ordersLoading}
            errorMessage={ordersError}
            onRetry={onRetryOrders}
            canManage={canManage}
            onViewOrder={(order) => onDialogChange({ kind: "orderDetails", orderId: order.id })}
            onNewOrder={() => openOrder({})}
            onSendOrder={onSendOrder}
            onReceiveOrder={(order) => onDialogChange({ kind: "receiveOrder", orderId: order.id })}
          />
        </TabsContent>

        <TabsContent value="pharmacies">
          <PharmacyPartnersTab
            suppliers={suppliers}
            loading={suppliersLoading}
            errorMessage={suppliersError}
            onRetry={onRetrySuppliers}
            canManage={canManage}
            onOrder={(supplier) => openOrder({ supplierId: supplier.id })}
            onDetails={(supplier) => onDialogChange({ kind: "supplier", supplierId: supplier.id })}
            onAddSupplier={() => onDialogChange({ kind: "supplierForm" })}
            onEditSupplier={(supplier) => onDialogChange({ kind: "supplierForm", supplierId: supplier.id })}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <PharmacyAnalyticsTab
            analytics={analytics}
            loading={analyticsLoading}
            period={statsPeriod}
            onPeriodChange={onStatsPeriodChange}
            sales={sales}
          />
        </TabsContent>

        <TabsContent value="settings">
          <PharmacySettingsTab info={settingsInfo} />
        </TabsContent>
      </Tabs>

      <PharmacyMedicineDetailsDialog
        medicine={detailsTarget ? (detailsMedicine ?? detailsTarget) : null}
        refreshing={detailsRefreshing}
        canManage={canManage}
        onClose={close}
        onRestock={(medicine) => onDialogChange({ kind: "restock", medicineKey: medicine.id })}
        onBatches={(medicine) => onDialogChange({ kind: "batches", medicineKey: medicine.id })}
        onEdit={(medicine) => onDialogChange({ kind: "edit", medicineKey: medicine.id })}
        onOrder={(medicine) => openOrder({ medicineKey: medicine.id })}
        onRemove={canRemove ? (medicine) => onDialogChange({ kind: "remove", medicineKey: medicine.id }) : undefined}
      />
      <PharmacyRemoveMedicineDialog
        medicine={canManage && canRemove ? medicineOf("remove") : null}
        isRemoving={dialogBusy}
        errorMessage={dialogError}
        onConfirm={onRemoveMedicine}
        onClose={close}
      />
      <PharmacyAddMedicineDialog
        open={addOpen}
        suppliers={suppliers}
        initialName={addName}
        isSaving={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onAddMedicine}
        onClose={close}
      />
      <PharmacyEditMedicineDialog
        medicine={canManage ? medicineOf("edit") : null}
        isSaving={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onEditMedicine}
        onClose={close}
      />
      <PharmacyBatchesDialog
        medicine={batchesTarget}
        startWithReceive={dialog?.kind === "restock"}
        batches={batches}
        loading={batchesLoading}
        loadError={batchesError}
        onRetry={onRetryBatches}
        canManage={canManage}
        busy={dialogBusy}
        errorMessage={dialogError}
        onReceive={onReceiveBatch}
        onAdjust={onAdjustBatch}
        onClose={close}
      />
      <PharmacyExportDialog
        open={dialog?.kind === "export"}
        isExporting={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onExport}
        onClose={close}
      />
      <PharmacyNewOrderDialog
        open={canManage && dialog?.kind === "order"}
        suppliers={suppliers}
        medicines={overview.rows}
        initialSupplierId={dialog?.kind === "order" ? dialog.supplierId : undefined}
        initialMedicineId={
          dialog?.kind === "order" ? (findMedicine(overview.rows, dialog.medicineKey)?.id ?? undefined) : undefined
        }
        isPlacing={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onPlaceOrder}
        onAddSupplier={() => onDialogChange({ kind: "supplierForm" })}
        onClose={close}
      />
      <PharmacyOrderDetailsDialog
        order={dialog?.kind === "orderDetails" ? dialogOrder : null}
        canManage={canManage}
        refreshing={dialogOrderRefreshing}
        busy={dialogBusy}
        errorMessage={dialogError}
        onSend={onSendOrder}
        onReceive={(order) => onDialogChange({ kind: "receiveOrder", orderId: order.id })}
        onClose={close}
      />
      <PharmacyReceiveOrderDialog
        order={canManage && dialog?.kind === "receiveOrder" ? dialogOrder : null}
        isSaving={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onReceiveOrder}
        onClose={close}
      />
      <PharmacySupplierFormDialog
        open={canManage && dialog?.kind === "supplierForm"}
        supplier={editingSupplier}
        isSaving={dialogBusy}
        errorMessage={dialogError}
        onSubmit={(values) =>
          onSaveSupplier(values, dialog?.kind === "supplierForm" ? dialog.supplierId : undefined)
        }
        onClose={close}
      />
      <PharmacySupplierDetailsDialog
        supplier={
          dialog?.kind === "supplier"
            ? (suppliers.find((supplier) => supplier.id === dialog.supplierId) ?? null)
            : null
        }
        canManage={canManage}
        onOrder={(supplier) => openOrder({ supplierId: supplier.id })}
        onEdit={(supplier) => onDialogChange({ kind: "supplierForm", supplierId: supplier.id })}
        onClose={close}
      />
    </DashboardPageShell>
  );
}
