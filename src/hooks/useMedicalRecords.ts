import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  getComprehensiveHealthRecord,
  createMedicalHistory,
  getMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  createLabReport,
  getLabReports,
  updateLabReport,
  deleteLabReport,
  createRadiologyReport,
  getRadiologyReports,
  updateRadiologyReport,
  deleteRadiologyReport,
  createSurgicalRecord,
  getSurgicalRecords,
  updateSurgicalRecord,
  deleteSurgicalRecord,
  createVital,
  getVitals,
  updateVital,
  deleteVital,
  createAllergy,
  getAllergies,
  updateAllergy,
  deleteAllergy,
  createMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  createImmunization,
  getImmunizations,
  updateImmunization,
  deleteImmunization,
  getHealthTrends,
  getMedicationAdherence,
} from '@/lib/actions/ehr.server';
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
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  generatePrescriptionPDF,
  getMedicines,
  searchMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicineInteractions,
  getMedicineInventory,
  updateMedicineInventory,
} from '@/lib/actions/medical-records.server';

// ===== COMPREHENSIVE HEALTH RECORD HOOKS =====

/**
 * Hook to get comprehensive health record for a user
 */
export const useComprehensiveHealthRecord = (userId: string) => {
  return useQueryData(['ehr', 'comprehensive', userId], async () => {
    return await getComprehensiveHealthRecord(userId);
  }, {
    enabled: !!userId,
  });
};

// ===== MEDICAL HISTORY HOOKS =====

/**
 * Hook to get medical history for a user
 */
export const useMedicalHistory = (userId: string) => {
  return useQueryData(['ehr', 'medical-history', userId], async () => {
    return await getMedicalHistory(userId);
  }, {
    enabled: !!userId,
  });
};

/**
 * Hook to create medical history
 */
export const useCreateMedicalHistory = () => {
  return useMutationData(['createMedicalHistory'], async (data: {
    userId: string;
    condition: string;
    diagnosis?: string;
    treatment?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    notes?: string;
  }) => {
    const result = await createMedicalHistory(data);
    return { status: 200, data: result };
  }, ['ehr', 'medical-history']);
};

/**
 * Hook to update medical history
 */
export const useUpdateMedicalHistory = () => {
  return useMutationData(['updateMedicalHistory'], async ({ id, updates }: {
    id: string;
    updates: {
      condition?: string;
      diagnosis?: string;
      treatment?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      notes?: string;
    };
  }) => {
    const result = await updateMedicalHistory(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'medical-history']);
};

/**
 * Hook to delete medical history
 */
export const useDeleteMedicalHistory = () => {
  return useMutationData(['deleteMedicalHistory'], async (id: string) => {
    const result = await deleteMedicalHistory(id);
    return { status: 200, data: result };
  }, ['ehr', 'medical-history']);
};

// ===== LAB REPORTS HOOKS =====

export const useLabReports = (userId: string) => {
  return useQueryData(['ehr', 'lab-reports', userId], async () => {
    return await getLabReports(userId);
  }, { enabled: !!userId });
};

export const useCreateLabReport = () => {
  return useMutationData(['createLabReport'], async (data: Parameters<typeof createLabReport>[0]) => {
    const result = await createLabReport(data);
    return { status: 200, data: result };
  }, ['ehr', 'lab-reports']);
};

export const useUpdateLabReport = () => {
  return useMutationData(['updateLabReport'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateLabReport>[1] }) => {
    const result = await updateLabReport(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'lab-reports']);
};

export const useDeleteLabReport = () => {
  return useMutationData(['deleteLabReport'], async (id: string) => {
    const result = await deleteLabReport(id);
    return { status: 200, data: result };
  }, ['ehr', 'lab-reports']);
};

// ===== RADIOLOGY REPORTS HOOKS =====

export const useRadiologyReports = (userId: string) => {
  return useQueryData(['ehr', 'radiology-reports', userId], async () => {
    return await getRadiologyReports(userId);
  }, { enabled: !!userId });
};

export const useCreateRadiologyReport = () => {
  return useMutationData(['createRadiologyReport'], async (data: Parameters<typeof createRadiologyReport>[0]) => {
    const result = await createRadiologyReport(data);
    return { status: 200, data: result };
  }, ['ehr', 'radiology-reports']);
};

export const useUpdateRadiologyReport = () => {
  return useMutationData(['updateRadiologyReport'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateRadiologyReport>[1] }) => {
    const result = await updateRadiologyReport(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'radiology-reports']);
};

export const useDeleteRadiologyReport = () => {
  return useMutationData(['deleteRadiologyReport'], async (id: string) => {
    const result = await deleteRadiologyReport(id);
    return { status: 200, data: result };
  }, ['ehr', 'radiology-reports']);
};

// ===== SURGICAL RECORDS HOOKS =====

export const useSurgicalRecords = (userId: string) => {
  return useQueryData(['ehr', 'surgical-records', userId], async () => {
    return await getSurgicalRecords(userId);
  }, { enabled: !!userId });
};

export const useCreateSurgicalRecord = () => {
  return useMutationData(['createSurgicalRecord'], async (data: Parameters<typeof createSurgicalRecord>[0]) => {
    const result = await createSurgicalRecord(data);
    return { status: 200, data: result };
  }, ['ehr', 'surgical-records']);
};

export const useUpdateSurgicalRecord = () => {
  return useMutationData(['updateSurgicalRecord'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateSurgicalRecord>[1] }) => {
    const result = await updateSurgicalRecord(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'surgical-records']);
};

export const useDeleteSurgicalRecord = () => {
  return useMutationData(['deleteSurgicalRecord'], async (id: string) => {
    const result = await deleteSurgicalRecord(id);
    return { status: 200, data: result };
  }, ['ehr', 'surgical-records']);
};

// ===== VITALS HOOKS =====

export const useVitals = (userId: string, type?: string) => {
  return useQueryData(['ehr', 'vitals', userId, type], async () => {
    return await getVitals(userId, type);
  }, { enabled: !!userId });
};

export const useCreateVital = () => {
  return useMutationData(['createVital'], async (data: Parameters<typeof createVital>[0]) => {
    const result = await createVital(data);
    return { status: 200, data: result };
  }, ['ehr', 'vitals']);
};

export const useUpdateVital = () => {
  return useMutationData(['updateVital'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateVital>[1] }) => {
    const result = await updateVital(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'vitals']);
};

export const useDeleteVital = () => {
  return useMutationData(['deleteVital'], async (id: string) => {
    const result = await deleteVital(id);
    return { status: 200, data: result };
  }, ['ehr', 'vitals']);
};

// ===== ALLERGIES HOOKS =====

export const useAllergies = (userId: string) => {
  return useQueryData(['ehr', 'allergies', userId], async () => {
    return await getAllergies(userId);
  }, { enabled: !!userId });
};

export const useCreateAllergy = () => {
  return useMutationData(['createAllergy'], async (data: Parameters<typeof createAllergy>[0]) => {
    const result = await createAllergy(data);
    return { status: 200, data: result };
  }, ['ehr', 'allergies']);
};

export const useUpdateAllergy = () => {
  return useMutationData(['updateAllergy'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateAllergy>[1] }) => {
    const result = await updateAllergy(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'allergies']);
};

export const useDeleteAllergy = () => {
  return useMutationData(['deleteAllergy'], async (id: string) => {
    const result = await deleteAllergy(id);
    return { status: 200, data: result };
  }, ['ehr', 'allergies']);
};

// ===== MEDICATIONS HOOKS =====

export const useMedications = (userId: string, activeOnly?: boolean) => {
  return useQueryData(['ehr', 'medications', userId, activeOnly], async () => {
    return await getMedications(userId, activeOnly);
  }, { enabled: !!userId });
};

export const useCreateMedication = () => {
  return useMutationData(['createMedication'], async (data: Parameters<typeof createMedication>[0]) => {
    const result = await createMedication(data);
    return { status: 200, data: result };
  }, ['ehr', 'medications']);
};

export const useUpdateMedication = () => {
  return useMutationData(['updateMedication'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateMedication>[1] }) => {
    const result = await updateMedication(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'medications']);
};

export const useDeleteMedication = () => {
  return useMutationData(['deleteMedication'], async (id: string) => {
    const result = await deleteMedication(id);
    return { status: 200, data: result };
  }, ['ehr', 'medications']);
};

// ===== IMMUNIZATIONS HOOKS =====

export const useImmunizations = (userId: string) => {
  return useQueryData(['ehr', 'immunizations', userId], async () => {
    return await getImmunizations(userId);
  }, { enabled: !!userId });
};

export const useCreateImmunization = () => {
  return useMutationData(['createImmunization'], async (data: Parameters<typeof createImmunization>[0]) => {
    const result = await createImmunization(data);
    return { status: 200, data: result };
  }, ['ehr', 'immunizations']);
};

export const useUpdateImmunization = () => {
  return useMutationData(['updateImmunization'], async ({ id, updates }: { id: string; updates: Parameters<typeof updateImmunization>[1] }) => {
    const result = await updateImmunization(id, updates);
    return { status: 200, data: result };
  }, ['ehr', 'immunizations']);
};

export const useDeleteImmunization = () => {
  return useMutationData(['deleteImmunization'], async (id: string) => {
    const result = await deleteImmunization(id);
    return { status: 200, data: result };
  }, ['ehr', 'immunizations']);
};

// ===== ANALYTICS HOOKS =====

export const useHealthTrends = (userId: string, vitalType: string, startDate?: string, endDate?: string) => {
  return useQueryData(['ehr', 'analytics', 'health-trends', userId, vitalType, startDate, endDate], async () => {
    return await getHealthTrends(userId, vitalType, startDate, endDate);
  }, { enabled: !!userId && !!vitalType });
};

export const useMedicationAdherence = (userId: string) => {
  return useQueryData(['ehr', 'analytics', 'medication-adherence', userId], async () => {
    return await getMedicationAdherence(userId);
  }, { enabled: !!userId });
};

// ===== PRESCRIPTIONS HOOKS (Legacy - kept for backward compatibility) =====

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

// ===== MEDICAL RECORDS HOOKS =====

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
  }, ['medicalRecords']);
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
  }, ['medicalRecords']);
};

/**
 * Hook to delete medical record
 */
export const useDeleteMedicalRecord = () => {
  return useMutationData(['deleteMedicalRecord'], async (recordId: string) => {
    const result = await deleteMedicalRecord(recordId);
    return { status: 200, data: result };
  }, ['medicalRecords']);
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
  }, ['medicalRecords']);
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
  }, ['medicalRecordTemplates']);
};
