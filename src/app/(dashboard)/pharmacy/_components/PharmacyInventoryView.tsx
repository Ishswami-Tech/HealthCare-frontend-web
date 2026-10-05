"use client";

import { BarChart3, Plus } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/tbd";
import { PharmacyInventoryStockTab } from "./PharmacyInventoryStockTab";
import {
  PharmacyAnalyticsTab,
  PharmacyOrdersTab,
  PharmacyPartnersTab,
  PharmacySettingsTab,
  type PharmacySettingsInfo,
} from "./PharmacyInventoryTabs";
import { PharmacyMedicineDetailsDialog, PharmacyRemoveMedicineDialog } from "./PharmacyMedicineDetailsDialog";
import {
  PharmacyAddMedicineDialog,
  PharmacyEditMedicineDialog,
  PharmacyRestockDialog,
} from "./PharmacyMedicineFormDialogs";
import { PharmacyExportDialog } from "./PharmacyExportDialog";
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
  type SupplierCard,
} from "./pharmacy-inventory.logic";
import type {
  AddMedicineValues,
  EditMedicineValues,
  ExportValues,
  NewOrderValues,
} from "./pharmacy-inventory.schemas";

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
  | { kind: "details" | "edit" | "remove"; medicineKey: string }
  /** `fromLink`: opened by `?action=add&item=…`; falls back to Add medicine when the item is unknown. */
  | { kind: "restock"; medicineKey: string; fromLink?: boolean }
  | { kind: "export" }
  | { kind: "order"; supplierId?: string; medicineKey?: string }
  | { kind: "orderDetails"; orderId: string }
  | { kind: "supplier"; supplierId: string };

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

  /** Null = the API has no order list yet. */
  orders: OrderRow[] | null;
  ordersLoading?: boolean;
  ordersError?: string | null;

  analytics: AnalyticsSummary;
  analyticsLoading?: boolean;
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
  onRestock: (medicine: MedicineRow, quantity: number) => void;
  onRemoveMedicine: (medicine: MedicineRow) => void;
  onPlaceOrder: (values: NewOrderValues) => void;
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
  analytics,
  analyticsLoading = false,
  settingsInfo,
  dialog,
  onDialogChange,
  detailsMedicine = null,
  detailsRefreshing = false,
  dialogBusy = false,
  dialogError = null,
  onAddMedicine,
  onEditMedicine,
  onRestock,
  onRemoveMedicine,
  onPlaceOrder,
  onExport,
}: PharmacyInventoryViewProps) {
  const close = () => onDialogChange(null);
  const medicineOf = (kind: "details" | "edit" | "restock" | "remove") =>
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

        <TabsContent value="inventory">
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
            canManage={canManage}
            onViewOrder={(order) => onDialogChange({ kind: "orderDetails", orderId: order.id })}
            onNewOrder={() => openOrder({})}
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
          />
        </TabsContent>

        <TabsContent value="analytics">
          <PharmacyAnalyticsTab analytics={analytics} loading={analyticsLoading} />
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
      <PharmacyRestockDialog
        medicine={canManage ? restockTarget : null}
        isSaving={dialogBusy}
        errorMessage={dialogError}
        onSubmit={onRestock}
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
        onClose={close}
      />
      <PharmacyOrderDetailsDialog
        order={dialog?.kind === "orderDetails" ? (orders?.find((order) => order.id === dialog.orderId) ?? null) : null}
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
        onClose={close}
      />
    </DashboardPageShell>
  );
}
