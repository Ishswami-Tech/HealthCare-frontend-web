import { useQueryClient } from "@tanstack/react-query";
import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { TOAST_IDS } from "../utils/use-toast";
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getPrescriptions,
  getMedicineDeskQueue,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  dispensePrescription,
  getInventory,
  getPharmacyOrders,
  getPharmacyOrderById,
  createPharmacyOrder,
  sendPharmacyOrder,
  receivePharmacyOrder,
  getPharmacySales,
  getPharmacyStats,
  searchMedicines,
  getSuppliers,
  createSupplier,
  updateSupplier,
  getStockBatches,
  receiveStockBatch,
  adjustBatchStock,
  getInventoryAlerts,
  exportPharmacyData,
  reversePrescriptionDispense,
  getPharmacyBatchAudit,
} from "@/lib/actions/pharmacy.server";
import type {
  AdjustBatchStockInput,
  DispensePrescriptionData,
  PharmacySalesGroupBy,
  ReceiveOrderBatch,
  ReceiveStockBatchInput,
  ReversePrescriptionDispenseData,
  SupplierInput,
} from "@/types/pharmacy.types";

// ===== MEDICINES HOOKS =====

/**
 * Hook to get all medicines for a clinic
 */
export const useMedicines = (
  clinicId: string,
  filters?: {
    search?: string;
    category?: string;
    manufacturer?: string;
    inStock?: boolean;
    lowStock?: boolean;
    expiringSoon?: boolean;
    prescriptionRequired?: boolean;
    expiringDays?: number;
    limit?: number;
    offset?: number;
  },
) => {
  return useQueryData(
    ["medicines", clinicId, filters],
    async () => {
      return await getMedicines(clinicId, filters);
    },
    {
      enabled: !!clinicId,
    },
  );
};

/**
 * Hook to get medicine by ID
 */
export const useMedicine = (medicineId: string) => {
  return useQueryData(
    ["medicine", medicineId],
    async () => {
      return await getMedicineById(medicineId);
    },
    {
      enabled: !!medicineId,
    },
  );
};

/**
 * Hook to search medicines for a clinic
 */
export const useSearchMedicines = () => {
  return useMutationOperation(
    async ({
      clinicId,
      query,
      filters,
    }: {
      clinicId: string;
      query: string;
      filters?: {
        category?: string;
        prescriptionRequired?: boolean;
        inStock?: boolean;
        limit?: number;
      };
    }) => {
      return await searchMedicines(clinicId, query, filters);
    },
    {
      toastId: TOAST_IDS.MEDICINE.SEARCH,
      loadingMessage: "Searching medicines...",
      successMessage: "Search completed",
      showToast: false,
    },
  );
};

// ===== PRESCRIPTIONS HOOKS =====

/**
 * Hook to get prescriptions for a clinic
 */
export const usePrescriptions = (
  clinicId: string,
  filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    enabled?: boolean;
  },
) => {
  return useQueryData(
    ["prescriptions", clinicId, filters],
    async () => {
      return await getPrescriptions(clinicId, filters);
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

export const useMedicineDeskQueue = (
  clinicId: string,
  enabled: boolean = true,
) => {
  return useQueryData(
    ["medicineDeskQueue", clinicId],
    async () => {
      return await getMedicineDeskQueue(clinicId);
    },
    {
      enabled: !!clinicId && enabled,
    },
  );
};

/**
 * Hook to get prescription by ID
 */
export const usePrescription = (prescriptionId: string) => {
  return useQueryData(
    ["prescription", prescriptionId],
    async () => {
      return await getPrescriptionById(prescriptionId);
    },
    {
      enabled: !!prescriptionId,
    },
  );
};

// ===== INVENTORY HOOKS =====

/**
 * Hook to get inventory for a clinic
 */
export const useInventory = (
  clinicId: string,
  filters?: {
    lowStock?: boolean;
    expiringSoon?: boolean;
    expiringDays?: number;
    category?: string;
    limit?: number;
    enabled?: boolean;
  },
) => {
  return useQueryData(
    ["inventory", clinicId, filters],
    async () => {
      return await getInventory(clinicId, filters);
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

// ===== ORDERS HOOKS =====

/**
 * Hook to get pharmacy orders for a clinic
 */
export const usePharmacyOrders = (
  clinicId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  },
) => {
  return useQueryData(
    ["pharmacyOrders", clinicId, filters],
    async () => {
      return await getPharmacyOrders(clinicId, filters);
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

/**
 * Hook to get one purchase order with its lines
 */
export const usePharmacyOrder = (clinicId: string, orderId: string) => {
  return useQueryData(
    ["pharmacyOrder", clinicId, orderId],
    async () => {
      return await getPharmacyOrderById(clinicId, orderId);
    },
    {
      enabled: !!clinicId && !!orderId,
    },
  );
};

// ===== SALES HOOKS =====

/**
 * Hook to get pharmacy sales for a clinic
 */
export const usePharmacySales = (
  clinicId: string,
  filters?: {
    from?: string;
    to?: string;
    groupBy?: PharmacySalesGroupBy;
    enabled?: boolean;
  },
) => {
  return useQueryData(
    ["pharmacySales", clinicId, filters],
    async () => {
      return await getPharmacySales(clinicId, filters);
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

// ===== STATISTICS HOOKS =====

/**
 * Hook to get pharmacy statistics for a clinic
 */
export const usePharmacyStats = (
  clinicId: string,
  period?: "day" | "week" | "month" | "year",
  options?: { enabled?: boolean },
) => {
  return useQueryData(
    ["pharmacyStats", clinicId, period],
    async () => {
      return await getPharmacyStats(clinicId, period);
    },
    {
      enabled: !!clinicId && options?.enabled !== false,
    },
  );
};

/**
 * Hook to get pharmacy batch audit entries for a clinic
 */
export const usePharmacyBatchAudit = (
  clinicId: string,
  filters?: {
    prescriptionId?: string;
    medicineId?: string;
    batchNumber?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    enabled?: boolean;
  },
) => {
  return useQueryData(
    ["pharmacyBatchAudit", clinicId, filters],
    async () => {
      return await getPharmacyBatchAudit(clinicId, filters);
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

// ===== SUPPLIERS HOOKS =====

/**
 * Hook to get suppliers
 */
export const useSuppliers = () => {
  return useQueryData(["suppliers"], async () => {
    return await getSuppliers();
  });
};

// ===== BATCH / ALERT HOOKS =====

/**
 * Hook to list the stock batches (lots) of a clinic, optionally of one medicine
 */
export const useStockBatches = (
  clinicId: string,
  filters?: { productId?: string; enabled?: boolean },
) => {
  return useQueryData(
    ["stockBatches", clinicId, filters?.productId ?? "all"],
    async () => {
      return await getStockBatches(clinicId, { productId: filters?.productId });
    },
    {
      enabled: !!clinicId && filters?.enabled !== false,
    },
  );
};

/**
 * Hook to get the open stock alerts (expiry, low stock) of a clinic
 */
export const useInventoryAlerts = (clinicId: string, enabled: boolean = true) => {
  return useQueryData(
    ["inventoryAlerts", clinicId],
    async () => {
      return await getInventoryAlerts(clinicId);
    },
    {
      enabled: !!clinicId && enabled,
    },
  );
};

// ===== MUTATION HOOKS =====

/**
 * Hook to create medicine for a clinic
 */
export const useCreateMedicine = () => {
  return useMutationOperation(
    async ({
      clinicId,
      ...medicineData
    }: {
      clinicId: string;
      name: string;
      manufacturer: string;
      /** Sent to the backend as `type` (TABLET, SYRUP, CAPSULE, INJECTION, CREAM, DROPS, OTHER). */
      dosageForm: string;
      unitPrice: number;
      /** Ignored: a new medicine starts at 0 and receives stock as batches. */
      stockQuantity?: number;
      expiryDate: string;
      minStockLevel?: number;
      description?: string;
      /** Dosage instructions. */
      instructions?: string;
      supplierId?: string;
      // Not stored by the backend yet — optional, never sent.
      genericName?: string;
      category?: string;
      strength?: string;
      packSize?: number;
      maxStockLevel?: number;
      batchNumber?: string;
      prescriptionRequired?: boolean;
      sideEffects?: string[];
      contraindications?: string[];
      storageConditions?: string;
    }) => {
      return await createMedicine(clinicId, medicineData);
    },
    {
      toastId: TOAST_IDS.MEDICINE.CREATE,
      loadingMessage: "Creating medicine...",
      successMessage: "Medicine created successfully",
      invalidateQueries: [["medicines"], ["inventory"], ["pharmacyStats"], ["pharmacyBatchAudit"]],
    },
  );
};

/**
 * Hook to update medicine
 */
export const useUpdateMedicine = () => {
  return useMutationOperation(
    async ({
      clinicId,
      medicineId,
      updates,
    }: {
      clinicId: string;
      medicineId: string;
      updates: any;
    }) => {
      return await updateMedicine(clinicId, medicineId, updates);
    },
    {
      toastId: TOAST_IDS.MEDICINE.UPDATE,
      loadingMessage: "Updating medicine...",
      successMessage: "Medicine updated successfully",
      invalidateQueries: [["medicines"], ["inventory"], ["pharmacyStats"], ["pharmacyBatchAudit"], ["medicine"]],
    },
  );
};

/**
 * Hook to delete medicine
 */
export const useDeleteMedicine = () => {
  return useMutationOperation(
    async ({
      clinicId,
      medicineId,
    }: {
      clinicId: string;
      medicineId: string;
    }) => {
      return await deleteMedicine(clinicId, medicineId);
    },
    {
      toastId: TOAST_IDS.MEDICINE.DELETE,
      loadingMessage: "Deleting medicine...",
      successMessage: "Medicine deleted successfully",
      invalidateQueries: [["medicines"], ["inventory"], ["pharmacyStats"], ["pharmacyBatchAudit"], ["medicine"]],
    },
  );
};

/**
 * Hook to create prescription for a clinic
 */
export const useCreatePrescription = () => {
  return useMutationOperation(
    async ({
      clinicId,
      ...prescriptionData
    }: {
      clinicId: string;
      patientId: string;
      doctorId: string;
      medications: {
        medicineId: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
        quantity: number;
      }[];
      diagnosis?: string;
      notes?: string;
      validUntil?: string;
    }) => {
      return await createPrescription(clinicId, prescriptionData);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.CREATE,
      loadingMessage: "Creating prescription...",
      successMessage: "Prescription created successfully",
      invalidateQueries: [["prescriptions"], ["medicineDeskQueue"], ["pharmacyStats"], ["pharmacyBatchAudit"]],
    },
  );
};

/**
 * Hook to update prescription status
 */
export const useUpdatePrescriptionStatus = () => {
  return useMutationOperation(
    async ({
      prescriptionId,
      status,
      notes,
    }: {
      prescriptionId: string;
      status: string;
      notes?: string;
    }) => {
      return await updatePrescriptionStatus(prescriptionId, status, notes);
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Updating prescription status...",
      successMessage: "Prescription status updated successfully",
      invalidateQueries: [
        ["prescriptions"],
        ["medicineDeskQueue"],
        ["pharmacyStats"],
        ["pharmacyBatchAudit"],
        ["medicalRecords"],
      ],
    },
  );
};

/**
 * Hook to dispense prescription
 */
export const useDispensePrescription = () => {
  return useMutationOperation(
    async ({
      prescriptionId,
      dispensingData,
    }: {
      prescriptionId: string;
      dispensingData: DispensePrescriptionData;
    }) => {
      return await dispensePrescription(prescriptionId, dispensingData);
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Dispensing prescription...",
      successMessage: "Prescription dispensed successfully",
      invalidateQueries: [
        ["prescriptions"],
        ["medicineDeskQueue"],
        ["pharmacyStats"],
        ["pharmacyBatchAudit"],
        ["medicalRecords"],
      ],
    },
  );
};

/**
 * Hook to reverse a dispense correction
 */
export const useReversePrescriptionDispense = () => {
  return useMutationOperation(
    async ({
      prescriptionId,
      reversalData,
    }: {
      prescriptionId: string;
      reversalData: ReversePrescriptionDispenseData;
    }) => {
      return await reversePrescriptionDispense(prescriptionId, reversalData);
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Reversing dispense...",
      successMessage: "Dispense reversed successfully",
      invalidateQueries: [
        ["prescriptions"],
        ["medicineDeskQueue"],
        ["pharmacyStats"],
        ["pharmacyBatchAudit"],
        ["medicalRecords"],
      ],
    },
  );
};

/** Every list that shows stock: it moves when a batch is received or corrected. */
const STOCK_QUERIES = [
  ["inventory"],
  ["medicines"],
  ["medicine"],
  ["stockBatches"],
  ["inventoryAlerts"],
  ["pharmacyStats"],
  ["pharmacySales"],
  ["pharmacyBatchAudit"],
];

/**
 * Hook to receive a batch that did not come through a purchase order
 */
export const useReceiveStockBatch = () => {
  return useMutationOperation(
    async ({ clinicId, ...batch }: { clinicId: string } & ReceiveStockBatchInput) => {
      return await receiveStockBatch(clinicId, batch);
    },
    {
      toastId: TOAST_IDS.PHARMACY.BATCH_RECEIVE,
      loadingMessage: "Receiving stock...",
      successMessage: "Stock received",
      invalidateQueries: STOCK_QUERIES,
    },
  );
};

/**
 * Hook to correct the quantity of one batch
 */
export const useAdjustBatchStock = () => {
  return useMutationOperation(
    async ({ clinicId, ...adjustment }: { clinicId: string } & AdjustBatchStockInput) => {
      return await adjustBatchStock(clinicId, adjustment);
    },
    {
      toastId: TOAST_IDS.PHARMACY.BATCH_ADJUST,
      loadingMessage: "Correcting stock...",
      successMessage: "Stock corrected",
      invalidateQueries: STOCK_QUERIES,
    },
  );
};

/**
 * Hook to send a draft purchase order to the supplier
 */
export const useSendPharmacyOrder = () => {
  return useMutationOperation(
    async ({ clinicId, orderId }: { clinicId: string; orderId: string }) => {
      return await sendPharmacyOrder(clinicId, orderId);
    },
    {
      toastId: TOAST_IDS.PHARMACY.ORDER_SEND,
      loadingMessage: "Sending order...",
      successMessage: "Order sent to the supplier",
      invalidateQueries: [["pharmacyOrders"], ["pharmacyOrder"]],
    },
  );
};

/**
 * Hook to receive goods against a purchase order (creates the batches and adds the stock)
 */
export const useReceivePharmacyOrder = () => {
  return useMutationOperation(
    async ({
      clinicId,
      orderId,
      batches,
    }: {
      clinicId: string;
      orderId: string;
      batches: ReceiveOrderBatch[];
    }) => {
      return await receivePharmacyOrder(clinicId, orderId, batches);
    },
    {
      toastId: TOAST_IDS.PHARMACY.ORDER_RECEIVE,
      loadingMessage: "Receiving goods...",
      successMessage: "Goods received and added to stock",
      invalidateQueries: [["pharmacyOrders"], ["pharmacyOrder"], ...STOCK_QUERIES],
    },
  );
};

/** Puts a saved supplier into the cached list (an array or `{ suppliers: [] }`). */
function withSupplier(list: unknown, saved: unknown): unknown {
  const record = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const body = record.id ? record : (record.data as Record<string, unknown> | undefined);
  if (!body || !body.id) return list;
  const merge = (items: unknown[]) =>
    items.some((item) => (item as { id?: unknown })?.id === body.id)
      ? items.map((item) => ((item as { id?: unknown })?.id === body.id ? { ...(item as object), ...body } : item))
      : [...items, body];
  if (Array.isArray(list)) return merge(list);
  const wrapped = list as { suppliers?: unknown[] } | undefined;
  return wrapped && Array.isArray(wrapped.suppliers) ? { ...wrapped, suppliers: merge(wrapped.suppliers) } : list;
}

/**
 * Hook to add a supplier. The server keeps the supplier list cached for an hour and does not
 * clear it on a write, so the saved supplier is also put into the cached list here.
 */
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutationOperation(
    async ({ clinicId, ...supplier }: { clinicId: string } & SupplierInput) => {
      return await createSupplier(clinicId, supplier);
    },
    {
      toastId: TOAST_IDS.PHARMACY.SUPPLIER_SAVE,
      loadingMessage: "Saving supplier...",
      successMessage: "Supplier saved",
      onSuccess: (saved) => {
        queryClient.setQueryData(["suppliers"], (list: unknown) => withSupplier(list, saved));
      },
    },
  );
};

/**
 * Hook to edit a supplier
 */
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutationOperation(
    async ({
      clinicId,
      supplierId,
      updates,
    }: {
      clinicId: string;
      supplierId: string;
      updates: Partial<SupplierInput> & { isActive?: boolean };
    }) => {
      return await updateSupplier(clinicId, supplierId, updates);
    },
    {
      toastId: TOAST_IDS.PHARMACY.SUPPLIER_SAVE,
      loadingMessage: "Saving supplier...",
      successMessage: "Supplier saved",
      onSuccess: (saved) => {
        queryClient.setQueryData(["suppliers"], (list: unknown) => withSupplier(list, saved));
      },
    },
  );
};

/**
 * Hook to create pharmacy order for a clinic
 */
export const useCreatePharmacyOrder = () => {
  return useMutationOperation(
    async ({
      clinicId,
      medicines,
      ...orderData
    }: {
      clinicId: string;
      supplierId: string;
      medicines: {
        medicineId: string;
        quantity: number;
        unitPrice?: number;
      }[];
      expectedDeliveryDate?: string;
      notes?: string;
    }) => {
      return await createPharmacyOrder(clinicId, {
        ...orderData,
        items: medicines,
      });
    },
    {
      toastId: TOAST_IDS.PHARMACY.ORDER_CREATE,
      loadingMessage: "Creating pharmacy order...",
      successMessage: "Pharmacy order created successfully",
      invalidateQueries: [["pharmacyOrders"], ["pharmacyStats"], ["inventory"]],
    },
  );
};

/**
 * Hook to export pharmacy data for a clinic
 */
export const useExportPharmacyData = () => {
  return useMutationOperation(
    async ({
      clinicId,
      ...filters
    }: {
      clinicId: string;
      type: "medicines" | "prescriptions" | "sales" | "inventory";
      format: "csv";
      startDate?: string;
      endDate?: string;
    }) => {
      return await exportPharmacyData(clinicId, filters);
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: "Exporting pharmacy data...",
      successMessage: "Pharmacy data exported successfully",
    },
  );
};
