import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  dispensePrescription,
  getInventory,
  updateInventory,
  getPharmacyOrders,
  createPharmacyOrder,
  getPharmacySales,
  getPharmacyStats,
  searchMedicines,
  getMedicineCategories,
  getSuppliers,
  exportPharmacyData
} from '@/lib/actions/pharmacy.server';

// ===== MEDICINES HOOKS =====

/**
 * Hook to get all medicines for a clinic
 */
export const useMedicines = (clinicId: string, filters?: {
  search?: string;
  category?: string;
  manufacturer?: string;
  inStock?: boolean;
  prescriptionRequired?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(['medicines', clinicId, filters], async () => {
    return await getMedicines(clinicId, filters);
  }, {
    enabled: !!clinicId,
  });
};

/**
 * Hook to get medicine by ID
 */
export const useMedicine = (medicineId: string) => {
  return useQueryData(['medicine', medicineId], async () => {
    return await getMedicineById(medicineId);
  }, {
    enabled: !!medicineId,
  });
};

/**
 * Hook to get medicine categories
 */
export const useMedicineCategories = () => {
  return useQueryData(['medicineCategories'], async () => {
    return await getMedicineCategories();
  });
};

/**
 * Hook to search medicines for a clinic
 */
export const useSearchMedicines = () => {
  return useMutationOperation(
    async ({ clinicId, query, filters }: {
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
      loadingMessage: 'Searching medicines...',
      successMessage: 'Search completed',
      showToast: false,
    }
  );
};

// ===== PRESCRIPTIONS HOOKS =====

/**
 * Hook to get prescriptions for a clinic
 */
export const usePrescriptions = (clinicId: string, filters?: {
  patientId?: string;
  doctorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQueryData(['prescriptions', clinicId, filters], async () => {
    return await getPrescriptions(clinicId, filters);
  }, {
    enabled: !!clinicId && (filters?.enabled !== false),
  });
};

/**
 * Hook to get prescription by ID
 */
export const usePrescription = (prescriptionId: string) => {
  return useQueryData(['prescription', prescriptionId], async () => {
    return await getPrescriptionById(prescriptionId);
  }, {
    enabled: !!prescriptionId,
  });
};

// ===== INVENTORY HOOKS =====

/**
 * Hook to get inventory for a clinic
 */
export const useInventory = (clinicId: string, filters?: {
  lowStock?: boolean;
  expiringSoon?: boolean;
  category?: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQueryData(['inventory', clinicId, filters], async () => {
    return await getInventory(clinicId, filters);
  }, {
    enabled: !!clinicId && (filters?.enabled !== false),
  });
};

// ===== ORDERS HOOKS =====

/**
 * Hook to get pharmacy orders for a clinic
 */
export const usePharmacyOrders = (clinicId: string, filters?: {
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQueryData(['pharmacyOrders', clinicId, filters], async () => {
    return await getPharmacyOrders(clinicId, filters);
  }, {
    enabled: !!clinicId && (filters?.enabled !== false),
  });
};

// ===== SALES HOOKS =====

/**
 * Hook to get pharmacy sales for a clinic
 */
export const usePharmacySales = (clinicId: string, filters?: {
  startDate?: string;
  endDate?: string;
  pharmacistId?: string;
  paymentMethod?: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQueryData(['pharmacySales', clinicId, filters], async () => {
    return await getPharmacySales(clinicId, filters);
  }, {
    enabled: !!clinicId && (filters?.enabled !== false),
  });
};

// ===== STATISTICS HOOKS =====

/**
 * Hook to get pharmacy statistics for a clinic
 */
export const usePharmacyStats = (clinicId: string, period?: 'day' | 'week' | 'month' | 'year') => {
  return useQueryData(['pharmacyStats', clinicId, period], async () => {
    return await getPharmacyStats(clinicId, period);
  }, {
    enabled: !!clinicId,
  });
};

// ===== SUPPLIERS HOOKS =====

/**
 * Hook to get suppliers
 */
export const useSuppliers = () => {
  return useQueryData(['suppliers'], async () => {
    return await getSuppliers();
  });
};

// ===== MUTATION HOOKS =====

/**
 * Hook to create medicine for a clinic
 */
export const useCreateMedicine = () => {
  return useMutationOperation(
    async ({ clinicId, ...medicineData }: {
      clinicId: string;
      name: string;
      genericName?: string;
      manufacturer: string;
      category: string;
      dosageForm: string;
      strength: string;
      packSize: number;
      unitPrice: number;
      stockQuantity: number;
      minStockLevel: number;
      maxStockLevel: number;
      expiryDate: string;
      batchNumber: string;
      prescriptionRequired: boolean;
      description?: string;
      sideEffects?: string[];
      contraindications?: string[];
      storageConditions?: string;
    }) => {
      return await createMedicine(clinicId, medicineData);
    },
    {
      toastId: TOAST_IDS.MEDICINE.CREATE,
      loadingMessage: 'Creating medicine...',
      successMessage: 'Medicine created successfully',
      invalidateQueries: [['medicines']],
    }
  );
};

/**
 * Hook to update medicine
 */
export const useUpdateMedicine = () => {
  return useMutationOperation(
    async ({ clinicId, medicineId, updates }: {
      clinicId: string;
      medicineId: string;
      updates: any;
    }) => {
      return await updateMedicine(clinicId, medicineId, updates);
    },
    {
      toastId: TOAST_IDS.MEDICINE.UPDATE,
      loadingMessage: 'Updating medicine...',
      successMessage: 'Medicine updated successfully',
      invalidateQueries: [['medicines']],
    }
  );
};

/**
 * Hook to delete medicine
 */
export const useDeleteMedicine = () => {
  return useMutationOperation(
    async ({ clinicId, medicineId }: {
      clinicId: string;
      medicineId: string;
    }) => {
      return await deleteMedicine(clinicId, medicineId);
    },
    {
      toastId: TOAST_IDS.MEDICINE.DELETE,
      loadingMessage: 'Deleting medicine...',
      successMessage: 'Medicine deleted successfully',
      invalidateQueries: [['medicines']],
    }
  );
};

/**
 * Hook to create prescription for a clinic
 */
export const useCreatePrescription = () => {
  return useMutationOperation(
    async ({ clinicId, ...prescriptionData }: {
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
      loadingMessage: 'Creating prescription...',
      successMessage: 'Prescription created successfully',
      invalidateQueries: [['prescriptions']],
    }
  );
};

/**
 * Hook to update prescription status
 */
export const useUpdatePrescriptionStatus = () => {
  return useMutationOperation(
    async ({ prescriptionId, status, notes }: {
      prescriptionId: string;
      status: string;
      notes?: string;
    }) => {
      return await updatePrescriptionStatus(prescriptionId, status, notes);
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: 'Updating prescription status...',
      successMessage: 'Prescription status updated successfully',
      invalidateQueries: [['prescriptions']],
    }
  );
};

/**
 * Hook to dispense prescription
 */
export const useDispensePrescription = () => {
  return useMutationOperation(
    async ({ prescriptionId, dispensingData }: {
      prescriptionId: string;
      dispensingData: any;
    }) => {
      return await dispensePrescription(prescriptionId, dispensingData);
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: 'Dispensing prescription...',
      successMessage: 'Prescription dispensed successfully',
      invalidateQueries: [['prescriptions']],
    }
  );
};

/**
 * Hook to update inventory
 */
export const useUpdateInventory = () => {
  return useMutationOperation(
    async ({ clinicId, medicineId, inventoryData }: {
      clinicId: string;
      medicineId: string;
      inventoryData: any;
    }) => {
      return await updateInventory(clinicId, medicineId, inventoryData);
    },
    {
      toastId: TOAST_IDS.PHARMACY.INVENTORY_UPDATE,
      loadingMessage: 'Updating inventory...',
      successMessage: 'Inventory updated successfully',
      invalidateQueries: [['inventory']],
    }
  );
};

/**
 * Hook to create pharmacy order for a clinic
 */
export const useCreatePharmacyOrder = () => {
  return useMutationOperation(
    async ({ clinicId, medicines, ...orderData }: {
      clinicId: string;
      supplierId: string;
      medicines: {
        medicineId: string;
        quantity: number;
        unitPrice: number;
      }[];
      expectedDeliveryDate?: string;
      notes?: string;
    }) => {
      return await createPharmacyOrder(clinicId, { ...orderData, items: medicines });
    },
    {
      toastId: TOAST_IDS.PHARMACY.ORDER_CREATE,
      loadingMessage: 'Creating pharmacy order...',
      successMessage: 'Pharmacy order created successfully',
      invalidateQueries: [['pharmacyOrders']],
    }
  );
};

/**
 * Hook to export pharmacy data for a clinic
 */
export const useExportPharmacyData = () => {
  return useMutationOperation(
    async ({ clinicId, ...filters }: {
      clinicId: string;
      type: 'medicines' | 'prescriptions' | 'sales' | 'inventory';
      format: 'csv' | 'excel' | 'pdf';
      startDate?: string;
      endDate?: string;
    }) => {
      return await exportPharmacyData(clinicId, filters);
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting pharmacy data...',
      successMessage: 'Pharmacy data exported successfully',
    }
  );
};
