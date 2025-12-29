'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== PHARMACY MANAGEMENT ACTIONS =====

/**
 * Get all medicines for a clinic
 */
export async function getMedicines(clinicId: string, filters?: {
  search?: string;
  category?: string;
  manufacturer?: string;
  inStock?: boolean;
  prescriptionRequired?: boolean;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const endpoint = `${API_ENDPOINTS.PHARMACY.MEDICINES.GET_CLINIC_INVENTORY(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get medicine by ID
 */
export async function getMedicineById(medicineId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.MEDICINES.GET_BY_ID(medicineId));
  return data;
}

/**
 * Create medicine for a clinic
 */
export async function createMedicine(clinicId: string, medicineData: {
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
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.MEDICINES.CREATE(clinicId), {
    method: 'POST',
    body: JSON.stringify(medicineData),
  });
  return data;
}

/**
 * Update medicine
 */
export async function updateMedicine(clinicId: string, medicineId: string, updates: {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  packSize?: number;
  unitPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  expiryDate?: string;
  batchNumber?: string;
  prescriptionRequired?: boolean;
  description?: string;
  sideEffects?: string[];
  contraindications?: string[];
  storageConditions?: string;
  isActive?: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.MEDICINES.UPDATE(clinicId, medicineId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete medicine
 */
export async function deleteMedicine(clinicId: string, medicineId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.MEDICINES.DELETE(clinicId, medicineId), {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get prescriptions for a clinic
 */
export async function getPrescriptions(clinicId: string, filters?: {
  patientId?: string;
  doctorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const endpoint = `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(prescriptionId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET(prescriptionId));
  return data;
}

/**
 * Create prescription for a clinic
 */
export async function createPrescription(clinicId: string, prescriptionData: {
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
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE(clinicId), {
    method: 'POST',
    body: JSON.stringify(prescriptionData),
  });
  return data;
}

/**
 * Update prescription status
 */
export async function updatePrescriptionStatus(prescriptionId: string, status: string, notes?: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.UPDATE_STATUS(prescriptionId), {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
  return data;
}

/**
 * Dispense prescription
 */
export async function dispensePrescription(prescriptionId: string, dispensingData: {
  pharmacistId: string;
  dispensedMedications: {
    medicineId: string;
    quantityDispensed: number;
    batchNumber: string;
    expiryDate: string;
  }[];
  totalAmount: number;
  paymentMethod?: string;
  insuranceClaim?: {
    insuranceProvider: string;
    claimNumber: string;
    approvedAmount: number;
  };
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.DISPENSE(prescriptionId), {
    method: 'POST',
    body: JSON.stringify(dispensingData),
  });
  return data;
}

/**
 * Get inventory for a clinic
 */
export async function getInventory(clinicId: string, filters?: {
  lowStock?: boolean;
  expiringSoon?: boolean;
  category?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const endpoint = `${API_ENDPOINTS.PHARMACY.INVENTORY.UPDATE(clinicId, '')}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint.replace('/inventory/', '/inventory'));
  return data;
}

/**
 * Update inventory
 */
export async function updateInventory(clinicId: string, medicineId: string, inventoryData: {
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  lastRestocked?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.INVENTORY.UPDATE(clinicId, medicineId), {
    method: 'PATCH',
    body: JSON.stringify(inventoryData),
  });
  return data;
}

/**
 * Get pharmacy orders for a clinic
 */
export async function getPharmacyOrders(clinicId: string, filters?: {
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const endpoint = `${API_ENDPOINTS.PHARMACY.ORDERS.CREATE(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Create pharmacy order for a clinic
 */
export async function createPharmacyOrder(clinicId: string, orderData: {
  supplierId: string;
  items: {
    medicineId: string;
    quantity: number;
    unitPrice: number;
  }[];
  expectedDeliveryDate?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.ORDERS.CREATE(clinicId), {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return data;
}

/**
 * Get pharmacy sales for a clinic
 */
export async function getPharmacySales(clinicId: string, filters?: {
  startDate?: string;
  endDate?: string;
  pharmacistId?: string;
  paymentMethod?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const endpoint = `/clinics/${clinicId}/pharmacy/sales${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get pharmacy statistics for a clinic
 */
export async function getPharmacyStats(clinicId: string, period?: 'day' | 'week' | 'month' | 'year') {
  const params = period ? `?period=${period}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.PHARMACY.STATS(clinicId)}${params}`);
  return data;
}

/**
 * Search medicines for a clinic
 */
export async function searchMedicines(clinicId: string, query: string, filters?: {
  category?: string;
  prescriptionRequired?: boolean;
  inStock?: boolean;
  limit?: number;
}) {
  const params = new URLSearchParams({ q: query });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const { data } = await authenticatedApi(`${API_ENDPOINTS.PHARMACY.SEARCH(clinicId)}?${params.toString()}`);
  return data;
}

/**
 * Get medicine categories
 */
export async function getMedicineCategories() {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.CATEGORIES);
  return data;
}

/**
 * Get suppliers
 */
export async function getSuppliers() {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.SUPPLIERS);
  return data;
}

/**
 * Export pharmacy data for a clinic
 */
export async function exportPharmacyData(clinicId: string, filters: {
  type: 'medicines' | 'prescriptions' | 'sales' | 'inventory';
  format: 'csv' | 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.EXPORT(clinicId), {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}
