import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  getPatientMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordById,
  uploadMedicalRecordFile,
  getMedicalRecordTemplates,
  createMedicalRecordTemplate,
  getPatientPrescriptions,
  createPrescription,
  updatePrescription,
  getPrescriptionById,
  generatePrescriptionPDF,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicineInteractions,
  getMedicineInventory,
  updateMedicineInventory
} from '@/lib/actions/medical-records.server';

// ===== MEDICAL RECORDS HOOKS =====

/**
 * Hook to get patient medical records
 */
export const usePatientMedicalRecords = (patientId: string, filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(['medicalRecords', 'patient', patientId], async () => {
    return await getPatientMedicalRecords(patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get medical record by ID
 */
export const useMedicalRecord = (recordId: string) => {
  return useQueryData(['medicalRecord', recordId], async () => {
    return await getMedicalRecordById(recordId);
  }, {
    enabled: !!recordId,
  });
};

/**
 * Hook to create medical record
 */
export const useCreateMedicalRecord = () => {
  return useMutationData(['createMedicalRecord'], async (recordData: {
    patientId: string;
    type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS';
    title: string;
    content: string;
    fileUrl?: string;
    doctorId?: string;
    appointmentId?: string;
  }) => {
    const result = await createMedicalRecord(recordData);
    return { status: 200, data: result };
  }, 'medicalRecords');
};

/**
 * Hook to update medical record
 */
export const useUpdateMedicalRecord = () => {
  return useMutationData(['updateMedicalRecord'], async ({ recordId, updates }: {
    recordId: string;
    updates: {
      title?: string;
      content?: string;
      fileUrl?: string;
    };
  }) => {
    const result = await updateMedicalRecord(recordId, updates);
    return { status: 200, data: result };
  }, 'medicalRecords');
};

/**
 * Hook to delete medical record
 */
export const useDeleteMedicalRecord = () => {
  return useMutationData(['deleteMedicalRecord'], async (recordId: string) => {
    const result = await deleteMedicalRecord(recordId);
    return { status: 200, data: result };
  }, 'medicalRecords');
};

/**
 * Hook to upload medical record file
 */
export const useUploadMedicalRecordFile = () => {
  return useMutationData(['uploadMedicalRecordFile'], async ({ recordId, file }: {
    recordId: string;
    file: File;
  }) => {
    const result = await uploadMedicalRecordFile(recordId, file);
    return { status: 200, data: result };
  }, 'medicalRecords');
};

/**
 * Hook to get medical record templates
 */
export const useMedicalRecordTemplates = (type?: string) => {
  return useQueryData(['medicalRecordTemplates', type], async () => {
    return await getMedicalRecordTemplates(type);
  });
};

/**
 * Hook to create medical record template
 */
export const useCreateMedicalRecordTemplate = () => {
  return useMutationData(['createMedicalRecordTemplate'], async (templateData: {
    name: string;
    type: string;
    content: string;
    fields: Array<{
      name: string;
      type: 'text' | 'number' | 'date' | 'select';
      required: boolean;
      options?: string[];
    }>;
  }) => {
    const result = await createMedicalRecordTemplate(templateData);
    return { status: 200, data: result };
  }, 'medicalRecordTemplates');
};

// ===== PRESCRIPTIONS HOOKS =====

/**
 * Hook to get patient prescriptions
 */
export const usePatientPrescriptions = (patientId: string, status?: 'active' | 'completed' | 'cancelled') => {
  return useQueryData(['prescriptions', 'patient', patientId, status], async () => {
    return await getPatientPrescriptions(patientId, status);
  }, {
    enabled: !!patientId,
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

/**
 * Hook to create prescription
 */
export const useCreatePrescription = () => {
  return useMutationData(['createPrescription'], async (prescriptionData: {
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
  }) => {
    const result = await createPrescription(prescriptionData);
    return { status: 200, data: result };
  }, 'prescriptions');
};

/**
 * Hook to update prescription
 */
export const useUpdatePrescription = () => {
  return useMutationData(['updatePrescription'], async ({ prescriptionId, updates }: {
    prescriptionId: string;
    updates: {
      medicines?: Array<{
        medicineId: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
      notes?: string;
      status?: 'active' | 'completed' | 'cancelled';
    };
  }) => {
    const result = await updatePrescription(prescriptionId, updates);
    return { status: 200, data: result };
  }, 'prescriptions');
};

/**
 * Hook to generate prescription PDF
 */
export const useGeneratePrescriptionPDF = () => {
  return useMutationData(['generatePrescriptionPDF'], async (prescriptionId: string) => {
    const result = await generatePrescriptionPDF(prescriptionId);
    return { status: 200, data: result };
  });
};

// ===== MEDICINES HOOKS =====

/**
 * Hook to get medicines
 */
export const useMedicines = (filters?: {
  search?: string;
  type?: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL';
  category?: string;
}) => {
  return useQueryData(['medicines', filters], async () => {
    return await getMedicines(filters);
  });
};

/**
 * Hook to search medicines
 */
export const useSearchMedicines = () => {
  return useMutationData(['searchMedicines'], async ({ query, limit }: {
    query: string;
    limit?: number;
  }) => {
    const result = await searchMedicines(query, limit);
    return { status: 200, data: result };
  });
};

/**
 * Hook to create medicine
 */
export const useCreateMedicine = () => {
  return useMutationData(['createMedicine'], async (medicineData: {
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
  }) => {
    const result = await createMedicine(medicineData);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to update medicine
 */
export const useUpdateMedicine = () => {
  return useMutationData(['updateMedicine'], async ({ medicineId, updates }: {
    medicineId: string;
    updates: Partial<{
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
    }>;
  }) => {
    const result = await updateMedicine(medicineId, updates);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to delete medicine
 */
export const useDeleteMedicine = () => {
  return useMutationData(['deleteMedicine'], async (medicineId: string) => {
    const result = await deleteMedicine(medicineId);
    return { status: 200, data: result };
  }, 'medicines');
};

/**
 * Hook to get medicine interactions
 */
export const useMedicineInteractions = () => {
  return useMutationData(['medicineInteractions'], async (medicineIds: string[]) => {
    const result = await getMedicineInteractions(medicineIds);
    return { status: 200, data: result };
  });
};

/**
 * Hook to get medicine inventory
 */
export const useMedicineInventory = (clinicId?: string) => {
  return useQueryData(['medicineInventory', clinicId], async () => {
    return await getMedicineInventory(clinicId);
  });
};

/**
 * Hook to update medicine inventory
 */
export const useUpdateMedicineInventory = () => {
  return useMutationData(['updateMedicineInventory'], async ({ medicineId, inventoryData }: {
    medicineId: string;
    inventoryData: {
      quantity: number;
      expiryDate?: string;
      batchNumber?: string;
      cost?: number;
    };
  }) => {
    const result = await updateMedicineInventory(medicineId, inventoryData);
    return { status: 200, data: result };
  }, 'medicineInventory');
};
