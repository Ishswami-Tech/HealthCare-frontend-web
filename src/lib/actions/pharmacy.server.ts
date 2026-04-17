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

  // Backend: GET /pharmacy/inventory (clinic-scoped via guard)
  const endpoint = `/pharmacy/inventory${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
  return data;
}

/**
 * Get medicine by ID
 */
export async function getMedicineById(medicineId: string) {
  // Backend: GET /pharmacy/inventory/:id
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`);
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
  // Backend: POST /pharmacy/inventory (clinic-scoped via guard)
  const { data } = await authenticatedApi('/pharmacy/inventory', {
    method: 'POST',
    body: JSON.stringify(medicineData),
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
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
  // Backend: PATCH /pharmacy/inventory/:id
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete medicine
 */
export async function deleteMedicine(_clinicId: string, medicineId: string) {
  // Backend: PATCH /pharmacy/inventory/:id with isActive:false (no DELETE endpoint)
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: false }),
  });
  return data;
}

/**
 * Get prescriptions - uses correct backend endpoints:
 * - Pharmacist: GET /pharmacy/prescriptions (clinicId from x-clinic-id header)
 * - Patient: GET /pharmacy/prescriptions/patient/:userId
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

  // Patient view: use /pharmacy/prescriptions/patient/:userId
  if (filters?.patientId) {
    const endpoint = `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET_BY_PATIENT(filters.patientId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(endpoint);
    return data;
  }

  // Pharmacist view: GET /pharmacy/prescriptions (clinicId from header)
  const endpoint = `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    headers: clinicId ? { 'X-Clinic-ID': clinicId } : {},
  });
  return data;
}

export async function getMedicineDeskQueue(clinicId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.QUEUE, {
    headers: clinicId ? { 'X-Clinic-ID': clinicId } : {},
  });
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
 * Create prescription - POST /pharmacy/prescriptions (clinicId from x-clinic-id header)
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
  const items = prescriptionData.medications.map((m) => ({
    medicineId: m.medicineId,
    dosage: m.dosage,
    quantity: m.quantity,
  }));
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify({
      patientId: prescriptionData.patientId,
      doctorId: prescriptionData.doctorId,
      items,
      notes: prescriptionData.notes,
    }),
    headers: clinicId ? { 'X-Clinic-ID': clinicId } : {},
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

export async function getPrescriptionPaymentSummary(prescriptionId: string) {
  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.PAYMENT_SUMMARY(prescriptionId)
  );
  return data;
}

/**
 * Dispense prescription - updates status to FILLED via backend PATCH /pharmacy/prescriptions/:id/status
 */
export async function dispensePrescription(prescriptionId: string, _dispensingData?: {
  pharmacistId?: string;
  dispensedMedications?: {
    medicineId: string;
    quantityDispensed: number;
    batchNumber: string;
    expiryDate: string;
  }[];
  totalAmount?: number;
  paymentMethod?: string;
  insuranceClaim?: {
    insuranceProvider: string;
    claimNumber: string;
    approvedAmount: number;
  };
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.UPDATE_STATUS(prescriptionId), {
    method: 'PATCH',
    body: JSON.stringify({ status: 'FILLED' }),
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

  // Backend: GET /pharmacy/inventory (clinic-scoped via guard)
  const endpoint = `/pharmacy/inventory${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
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
  // Backend: PATCH /pharmacy/inventory/:id
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: 'PATCH',
    body: JSON.stringify(inventoryData),
  });
  return data;
}

/**
 * Get pharmacy orders for a clinic
 * Backend: GET /pharmacy/suppliers (no dedicated orders endpoint)
 */
export async function getPharmacyOrders(_clinicId: string, _filters?: {
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  // No backend orders endpoint — return empty
  return null;
}

/**
 * Create pharmacy order for a clinic
 * Backend: No dedicated orders endpoint
 */
export async function createPharmacyOrder(_clinicId: string, _orderData: {
  supplierId: string;
  items: { medicineId: string; quantity: number; unitPrice: number }[];
  expectedDeliveryDate?: string;
  notes?: string;
}) {
  // No backend orders endpoint
  return null;
}

/**
 * Get pharmacy sales for a clinic
 * Backend: No dedicated sales endpoint
 */
export async function getPharmacySales(_clinicId: string, _filters?: {
  startDate?: string;
  endDate?: string;
  pharmacistId?: string;
  paymentMethod?: string;
  limit?: number;
}) {
  // No backend sales endpoint
  return null;
}

/**
 * Get pharmacy statistics for a clinic
 */
export async function getPharmacyStats(clinicId: string, period?: 'day' | 'week' | 'month' | 'year') {
  // Backend: GET /pharmacy/stats (clinic-scoped via guard)
  const params = period ? `?period=${period}` : '';
  const { data } = await authenticatedApi(`/pharmacy/stats${params}`, {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
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

  // Backend: GET /pharmacy/inventory with search query
  const { data } = await authenticatedApi(`/pharmacy/inventory?${params.toString()}`, {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
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
export async function exportPharmacyData(_clinicId: string, _filters: {
  type: 'medicines' | 'prescriptions' | 'sales' | 'inventory';
  format: 'csv' | 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
}) {
  // No backend export endpoint
  return null;
}
