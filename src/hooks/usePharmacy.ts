import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
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
  return useMutationData(['searchMedicines'], async ({ clinicId, query, filters }: {
    clinicId: string;
    query: string;
    filters?: {
      category?: string;
      prescriptionRequired?: boolean;
      inStock?: boolean;
      limit?: number;
    };
  }) => {
    const result = await searchMedicines(clinicId, query, filters);
    return { status: 200, data: result };
  });
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
  return useMutationData(['createMedicine'], async ({ clinicId, ...medicineData }: {
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
    const result = await createMedicine(clinicId, medicineData);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to update medicine
 */
export const useUpdateMedicine = () => {
  return useMutationData(['updateMedicine'], async ({ clinicId, medicineId, updates }: {
    clinicId: string;
    medicineId: string;
    updates: any;
  }) => {
    const result = await updateMedicine(clinicId, medicineId, updates);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to delete medicine
 */
export const useDeleteMedicine = () => {
  return useMutationData(['deleteMedicine'], async ({ clinicId, medicineId }: {
    clinicId: string;
    medicineId: string;
  }) => {
    const result = await deleteMedicine(clinicId, medicineId);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to create prescription for a clinic
 */
export const useCreatePrescription = () => {
  return useMutationData(['createPrescription'], async ({ clinicId, ...prescriptionData }: {
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
    const result = await createPrescription(clinicId, prescriptionData);
    return { status: 200, data: result };
  }, 'prescriptions');
};

/**
 * Hook to update prescription status
 */
export const useUpdatePrescriptionStatus = () => {
  return useMutationData(['updatePrescriptionStatus'], async ({ prescriptionId, status, notes }: {
    prescriptionId: string;
    status: string;
    notes?: string;
  }) => {
    const result = await updatePrescriptionStatus(prescriptionId, status, notes);
    return { status: 200, data: result };
  }, 'prescriptions');
};

/**
 * Hook to dispense prescription
 */
export const useDispensePrescription = () => {
  return useMutationData(['dispensePrescription'], async ({ prescriptionId, dispensingData }: {
    prescriptionId: string;
    dispensingData: any;
  }) => {
    const result = await dispensePrescription(prescriptionId, dispensingData);
    return { status: 200, data: result };
  }, 'prescriptions');
};

/**
 * Hook to update inventory
 */
export const useUpdateInventory = () => {
  return useMutationData(['updateInventory'], async ({ clinicId, medicineId, inventoryData }: {
    clinicId: string;
    medicineId: string;
    inventoryData: any;
  }) => {
    const result = await updateInventory(clinicId, medicineId, inventoryData);
    return { status: 200, data: result };
  }, 'inventory');
};

/**
 * Hook to create pharmacy order for a clinic
 */
export const useCreatePharmacyOrder = () => {
  return useMutationData(['createPharmacyOrder'], async ({ clinicId, ...orderData }: {
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
    const result = await createPharmacyOrder(clinicId, orderData);
    return { status: 200, data: result };
  }, 'pharmacyOrders');
};

/**
 * Hook to export pharmacy data for a clinic
 */
export const useExportPharmacyData = () => {
  return useMutationData(['exportPharmacyData'], async ({ clinicId, ...filters }: {
    clinicId: string;
    type: 'medicines' | 'prescriptions' | 'sales' | 'inventory';
    format: 'csv' | 'excel' | 'pdf';
    startDate?: string;
    endDate?: string;
  }) => {
    const result = await exportPharmacyData(clinicId, filters);
    return { status: 200, data: result };
  });
};
