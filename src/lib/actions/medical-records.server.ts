'use server';

import { authenticatedApi } from './auth.server';

// ===== MEDICAL RECORDS MANAGEMENT =====

/**
 * Get patient medical records
 */
export async function getPatientMedicalRecords(patientId: string, filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
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
  
  const endpoint = `/medical-records/patient/${patientId}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Create medical record
 */
export async function createMedicalRecord(recordData: {
  patientId: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS';
  title: string;
  content: string;
  fileUrl?: string;
  doctorId?: string;
  appointmentId?: string;
}) {
  const { data } = await authenticatedApi('/medical-records', {
    method: 'POST',
    body: JSON.stringify(recordData),
  });
  return data;
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(recordId: string, updates: {
  title?: string;
  content?: string;
  fileUrl?: string;
}) {
  const { data } = await authenticatedApi(`/medical-records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete medical record
 */
export async function deleteMedicalRecord(recordId: string) {
  const { data } = await authenticatedApi(`/medical-records/${recordId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get medical record by ID
 */
export async function getMedicalRecordById(recordId: string) {
  const { data } = await authenticatedApi(`/medical-records/${recordId}`);
  return data;
}

/**
 * Upload medical record file
 */
export async function uploadMedicalRecordFile(recordId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await authenticatedApi(`/medical-records/${recordId}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type for FormData
    },
  });
  return data;
}

/**
 * Get medical record templates
 */
export async function getMedicalRecordTemplates(type?: string) {
  const params = type ? `?type=${type}` : '';
  const { data } = await authenticatedApi(`/medical-records/templates${params}`);
  return data;
}

/**
 * Create medical record template
 */
export async function createMedicalRecordTemplate(templateData: {
  name: string;
  type: string;
  content: string;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}) {
  const { data } = await authenticatedApi('/medical-records/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
  return data;
}

// ===== PRESCRIPTIONS MANAGEMENT =====

/**
 * Get patient prescriptions
 */
export async function getPatientPrescriptions(patientId: string, status?: 'active' | 'completed' | 'cancelled') {
  const params = status ? `?status=${status}` : '';
  const { data } = await authenticatedApi(`/prescriptions/patient/${patientId}${params}`);
  return data;
}

/**
 * Create prescription
 */
export async function createPrescription(prescriptionData: {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicines: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
}) {
  const { data } = await authenticatedApi('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(prescriptionData),
  });
  return data;
}

/**
 * Update prescription
 */
export async function updatePrescription(prescriptionId: string, updates: {
  medicines?: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled';
}) {
  const { data } = await authenticatedApi(`/prescriptions/${prescriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(prescriptionId: string) {
  const { data } = await authenticatedApi(`/prescriptions/${prescriptionId}`);
  return data;
}

/**
 * Generate prescription PDF
 */
export async function generatePrescriptionPDF(prescriptionId: string) {
  const { data } = await authenticatedApi(`/prescriptions/${prescriptionId}/pdf`);
  return data;
}

// ===== MEDICINES MANAGEMENT =====

/**
 * Get medicines
 */
export async function getMedicines(filters?: {
  search?: string;
  type?: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL';
  category?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `/medicines${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Create medicine
 */
export async function createMedicine(medicineData: {
  name: string;
  type: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL';
  category?: string;
  manufacturer?: string;
  composition?: string;
  indications?: string;
  contraindications?: string;
  sideEffects?: string;
  dosageForm?: string;
  strength?: string;
}) {
  const { data } = await authenticatedApi('/medicines', {
    method: 'POST',
    body: JSON.stringify(medicineData),
  });
  return data;
}

/**
 * Update medicine
 */
export async function updateMedicine(medicineId: string, updates: Partial<{
  name: string;
  type: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL';
  category: string;
  manufacturer: string;
  composition: string;
  indications: string;
  contraindications: string;
  sideEffects: string;
  dosageForm: string;
  strength: string;
}>) {
  const { data } = await authenticatedApi(`/medicines/${medicineId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete medicine
 */
export async function deleteMedicine(medicineId: string) {
  const { data } = await authenticatedApi(`/medicines/${medicineId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Search medicines
 */
export async function searchMedicines(query: string, limit: number = 20) {
  const { data } = await authenticatedApi(`/medicines/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return data;
}

/**
 * Get medicine interactions
 */
export async function getMedicineInteractions(medicineIds: string[]) {
  const { data } = await authenticatedApi('/medicines/interactions', {
    method: 'POST',
    body: JSON.stringify({ medicineIds }),
  });
  return data;
}

/**
 * Get medicine inventory
 */
export async function getMedicineInventory(clinicId?: string) {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await authenticatedApi(`/medicines/inventory${params}`);
  return data;
}

/**
 * Update medicine inventory
 */
export async function updateMedicineInventory(medicineId: string, inventoryData: {
  quantity: number;
  expiryDate?: string;
  batchNumber?: string;
  cost?: number;
}) {
  const { data } = await authenticatedApi(`/medicines/${medicineId}/inventory`, {
    method: 'PATCH',
    body: JSON.stringify(inventoryData),
  });
  return data;
}
