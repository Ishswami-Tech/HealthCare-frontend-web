import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
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
  return useMutationOperation(
    async (data: {
      userId: string;
      condition: string;
      diagnosis?: string;
      treatment?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      notes?: string;
    }) => {
      return await createMedicalHistory(data);
    },
    {
      toastId: TOAST_IDS.EHR.HISTORY_CREATE,
      loadingMessage: 'Creating medical history...',
      successMessage: 'Medical history created successfully',
      invalidateQueries: [['ehr', 'medical-history']],
    }
  );
};

/**
 * Hook to update medical history
 */
export const useUpdateMedicalHistory = () => {
  return useMutationOperation(
    async ({ id, updates }: {
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
      return await updateMedicalHistory(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.HISTORY_UPDATE,
      loadingMessage: 'Updating medical history...',
      successMessage: 'Medical history updated successfully',
      invalidateQueries: [['ehr', 'medical-history']],
    }
  );
};

/**
 * Hook to delete medical history
 */
export const useDeleteMedicalHistory = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteMedicalHistory(id);
    },
    {
      toastId: TOAST_IDS.EHR.HISTORY_DELETE,
      loadingMessage: 'Deleting medical history...',
      successMessage: 'Medical history deleted successfully',
      invalidateQueries: [['ehr', 'medical-history']],
    }
  );
};

// ===== LAB REPORTS HOOKS =====

export const useLabReports = (userId: string) => {
  return useQueryData(['ehr', 'lab-reports', userId], async () => {
    return await getLabReports(userId);
  }, { enabled: !!userId });
};

export const useCreateLabReport = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createLabReport>[0]) => {
      return await createLabReport(data);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_CREATE,
      loadingMessage: 'Creating lab report...',
      successMessage: 'Lab report created successfully',
      invalidateQueries: [['ehr', 'lab-reports']],
    }
  );
};

export const useUpdateLabReport = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateLabReport>[1] }) => {
      return await updateLabReport(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_UPDATE,
      loadingMessage: 'Updating lab report...',
      successMessage: 'Lab report updated successfully',
      invalidateQueries: [['ehr', 'lab-reports']],
    }
  );
};

export const useDeleteLabReport = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteLabReport(id);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_DELETE,
      loadingMessage: 'Deleting lab report...',
      successMessage: 'Lab report deleted successfully',
      invalidateQueries: [['ehr', 'lab-reports']],
    }
  );
};

// ===== RADIOLOGY REPORTS HOOKS =====

export const useRadiologyReports = (userId: string) => {
  return useQueryData(['ehr', 'radiology-reports', userId], async () => {
    return await getRadiologyReports(userId);
  }, { enabled: !!userId });
};

export const useCreateRadiologyReport = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createRadiologyReport>[0]) => {
      return await createRadiologyReport(data);
    },
    {
      toastId: TOAST_IDS.EHR.RADIOLOGY_CREATE,
      loadingMessage: 'Creating radiology report...',
      successMessage: 'Radiology report created successfully',
      invalidateQueries: [['ehr', 'radiology-reports']],
    }
  );
};

export const useUpdateRadiologyReport = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateRadiologyReport>[1] }) => {
      return await updateRadiologyReport(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.RADIOLOGY_UPDATE,
      loadingMessage: 'Updating radiology report...',
      successMessage: 'Radiology report updated successfully',
      invalidateQueries: [['ehr', 'radiology-reports']],
    }
  );
};

export const useDeleteRadiologyReport = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteRadiologyReport(id);
    },
    {
      toastId: TOAST_IDS.EHR.RADIOLOGY_DELETE,
      loadingMessage: 'Deleting radiology report...',
      successMessage: 'Radiology report deleted successfully',
      invalidateQueries: [['ehr', 'radiology-reports']],
    }
  );
};

// ===== SURGICAL RECORDS HOOKS =====

export const useSurgicalRecords = (userId: string) => {
  return useQueryData(['ehr', 'surgical-records', userId], async () => {
    return await getSurgicalRecords(userId);
  }, { enabled: !!userId });
};

export const useCreateSurgicalRecord = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createSurgicalRecord>[0]) => {
      return await createSurgicalRecord(data);
    },
    {
      toastId: TOAST_IDS.EHR.SURGICAL_CREATE,
      loadingMessage: 'Creating surgical record...',
      successMessage: 'Surgical record created successfully',
      invalidateQueries: [['ehr', 'surgical-records']],
    }
  );
};

export const useUpdateSurgicalRecord = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateSurgicalRecord>[1] }) => {
      return await updateSurgicalRecord(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.SURGICAL_UPDATE,
      loadingMessage: 'Updating surgical record...',
      successMessage: 'Surgical record updated successfully',
      invalidateQueries: [['ehr', 'surgical-records']],
    }
  );
};

export const useDeleteSurgicalRecord = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteSurgicalRecord(id);
    },
    {
      toastId: TOAST_IDS.EHR.SURGICAL_DELETE,
      loadingMessage: 'Deleting surgical record...',
      successMessage: 'Surgical record deleted successfully',
      invalidateQueries: [['ehr', 'surgical-records']],
    }
  );
};

// ===== VITALS HOOKS =====

export const useVitals = (userId: string, type?: string) => {
  return useQueryData(['ehr', 'vitals', userId, type], async () => {
    return await getVitals(userId, type);
  }, { enabled: !!userId });
};

export const useCreateVital = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createVital>[0]) => {
      return await createVital(data);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_CREATE,
      loadingMessage: 'Creating vital...',
      successMessage: 'Vital created successfully',
      invalidateQueries: [['ehr', 'vitals']],
    }
  );
};

export const useUpdateVital = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateVital>[1] }) => {
      return await updateVital(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_UPDATE,
      loadingMessage: 'Updating vital...',
      successMessage: 'Vital updated successfully',
      invalidateQueries: [['ehr', 'vitals']],
    }
  );
};

export const useDeleteVital = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteVital(id);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_DELETE,
      loadingMessage: 'Deleting vital...',
      successMessage: 'Vital deleted successfully',
      invalidateQueries: [['ehr', 'vitals']],
    }
  );
};

// ===== ALLERGIES HOOKS =====

export const useAllergies = (userId: string) => {
  return useQueryData(['ehr', 'allergies', userId], async () => {
    return await getAllergies(userId);
  }, { enabled: !!userId });
};

export const useCreateAllergy = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createAllergy>[0]) => {
      return await createAllergy(data);
    },
    {
      toastId: TOAST_IDS.EHR.ALLERGY_CREATE,
      loadingMessage: 'Creating allergy...',
      successMessage: 'Allergy created successfully',
      invalidateQueries: [['ehr', 'allergies']],
    }
  );
};

export const useUpdateAllergy = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateAllergy>[1] }) => {
      return await updateAllergy(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.ALLERGY_UPDATE,
      loadingMessage: 'Updating allergy...',
      successMessage: 'Allergy updated successfully',
      invalidateQueries: [['ehr', 'allergies']],
    }
  );
};

export const useDeleteAllergy = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteAllergy(id);
    },
    {
      toastId: TOAST_IDS.EHR.ALLERGY_DELETE,
      loadingMessage: 'Deleting allergy...',
      successMessage: 'Allergy deleted successfully',
      invalidateQueries: [['ehr', 'allergies']],
    }
  );
};

// ===== MEDICATIONS HOOKS =====

export const useMedications = (userId: string, activeOnly?: boolean) => {
  return useQueryData(['ehr', 'medications', userId, activeOnly], async () => {
    return await getMedications(userId, activeOnly);
  }, { enabled: !!userId });
};

export const useCreateMedication = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createMedication>[0]) => {
      return await createMedication(data);
    },
    {
      toastId: TOAST_IDS.EHR.MEDICATION_CREATE,
      loadingMessage: 'Creating medication...',
      successMessage: 'Medication created successfully',
      invalidateQueries: [['ehr', 'medications']],
    }
  );
};

export const useUpdateMedication = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateMedication>[1] }) => {
      return await updateMedication(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.MEDICATION_UPDATE,
      loadingMessage: 'Updating medication...',
      successMessage: 'Medication updated successfully',
      invalidateQueries: [['ehr', 'medications']],
    }
  );
};

export const useDeleteMedication = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteMedication(id);
    },
    {
      toastId: TOAST_IDS.EHR.MEDICATION_DELETE,
      loadingMessage: 'Deleting medication...',
      successMessage: 'Medication deleted successfully',
      invalidateQueries: [['ehr', 'medications']],
    }
  );
};

// ===== IMMUNIZATIONS HOOKS =====

export const useImmunizations = (userId: string) => {
  return useQueryData(['ehr', 'immunizations', userId], async () => {
    return await getImmunizations(userId);
  }, { enabled: !!userId });
};

export const useCreateImmunization = () => {
  return useMutationOperation(
    async (data: Parameters<typeof createImmunization>[0]) => {
      return await createImmunization(data);
    },
    {
      toastId: TOAST_IDS.EHR.IMMUNIZATION_CREATE,
      loadingMessage: 'Creating immunization...',
      successMessage: 'Immunization created successfully',
      invalidateQueries: [['ehr', 'immunizations']],
    }
  );
};

export const useUpdateImmunization = () => {
  return useMutationOperation(
    async ({ id, updates }: { id: string; updates: Parameters<typeof updateImmunization>[1] }) => {
      return await updateImmunization(id, updates);
    },
    {
      toastId: TOAST_IDS.EHR.IMMUNIZATION_UPDATE,
      loadingMessage: 'Updating immunization...',
      successMessage: 'Immunization updated successfully',
      invalidateQueries: [['ehr', 'immunizations']],
    }
  );
};

export const useDeleteImmunization = () => {
  return useMutationOperation(
    async (id: string) => {
      return await deleteImmunization(id);
    },
    {
      toastId: TOAST_IDS.EHR.IMMUNIZATION_DELETE,
      loadingMessage: 'Deleting immunization...',
      successMessage: 'Immunization deleted successfully',
      invalidateQueries: [['ehr', 'immunizations']],
    }
  );
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
  return useMutationOperation(
    async (prescriptionData: {
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
      return await createPrescription(prescriptionData);
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
 * Hook to update prescription
 */
export const useUpdatePrescription = () => {
  return useMutationOperation(
    async ({ prescriptionId, updates }: {
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
      return await updatePrescription(prescriptionId, updates);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.UPDATE,
      loadingMessage: 'Updating prescription...',
      successMessage: 'Prescription updated successfully',
      invalidateQueries: [['prescriptions']],
    }
  );
};

/**
 * Hook to generate prescription PDF
 */
export const useGeneratePrescriptionPDF = () => {
  return useMutationOperation(
    async (prescriptionId: string) => {
      return await generatePrescriptionPDF(prescriptionId);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.PDF,
      loadingMessage: 'Generating prescription PDF...',
      successMessage: 'Prescription PDF generated successfully',
    }
  );
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
  return useMutationOperation(
    async ({ query, limit }: {
      query: string;
      limit?: number;
    }) => {
      return await searchMedicines(query, limit);
    },
    {
      toastId: TOAST_IDS.MEDICINE.SEARCH,
      loadingMessage: 'Searching medicines...',
      successMessage: 'Search completed',
      showToast: false, // Search operations typically don't need success toast
    }
  );
};

/**
 * Hook to create medicine
 */
export const useCreateMedicine = () => {
  return useMutationOperation(
    async (medicineData: {
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
      return await createMedicine(medicineData);
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
    async ({ medicineId, updates }: {
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
      return await updateMedicine(medicineId, updates);
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
    async (medicineId: string) => {
      return await deleteMedicine(medicineId);
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
 * Hook to get medicine interactions
 */
export const useMedicineInteractions = () => {
  return useMutationOperation(
    async (medicineIds: string[]) => {
      return await getMedicineInteractions(medicineIds);
    },
    {
      toastId: TOAST_IDS.MEDICINE.INTERACTIONS,
      loadingMessage: 'Checking medicine interactions...',
      successMessage: 'Interaction check completed',
      showToast: false, // Query-like operation, no success toast needed
    }
  );
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
  return useMutationOperation(
    async ({ medicineId, inventoryData }: {
      medicineId: string;
      inventoryData: {
        quantity: number;
        expiryDate?: string;
        batchNumber?: string;
        cost?: number;
      };
    }) => {
      return await updateMedicineInventory(medicineId, inventoryData);
    },
    {
      toastId: TOAST_IDS.MEDICINE.INVENTORY_UPDATE,
      loadingMessage: 'Updating medicine inventory...',
      successMessage: 'Medicine inventory updated successfully',
      invalidateQueries: [['medicineInventory']],
    }
  );
};

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
  return useQueryData(['medicalRecords', 'patient', patientId, filters], async () => {
    const { getPatientMedicalRecords } = await import('@/lib/actions/medical-records.server');
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
  return useMutationOperation(
    async (recordData: {
      patientId: string;
      type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS';
      title: string;
      content: string;
      fileUrl?: string;
      doctorId?: string;
      appointmentId?: string;
    }) => {
      return await createMedicalRecord(recordData);
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.CREATE,
      loadingMessage: 'Creating medical record...',
      successMessage: 'Medical record created successfully',
      invalidateQueries: [['medicalRecords']],
    }
  );
};

/**
 * Hook to update medical record
 */
export const useUpdateMedicalRecord = () => {
  return useMutationOperation(
    async ({ recordId, updates }: {
      recordId: string;
      updates: {
        title?: string;
        content?: string;
        fileUrl?: string;
      };
    }) => {
      return await updateMedicalRecord(recordId, updates);
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.UPDATE,
      loadingMessage: 'Updating medical record...',
      successMessage: 'Medical record updated successfully',
      invalidateQueries: [['medicalRecords']],
    }
  );
};

/**
 * Hook to delete medical record
 */
export const useDeleteMedicalRecord = () => {
  return useMutationOperation(
    async (recordId: string) => {
      return await deleteMedicalRecord(recordId);
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.DELETE,
      loadingMessage: 'Deleting medical record...',
      successMessage: 'Medical record deleted successfully',
      invalidateQueries: [['medicalRecords']],
    }
  );
};

/**
 * Hook to upload medical record file
 */
export const useUploadMedicalRecordFile = () => {
  return useMutationOperation(
    async ({ recordId, file }: {
      recordId: string;
      file: File;
    }) => {
      return await uploadMedicalRecordFile(recordId, file);
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
      loadingMessage: 'Uploading medical record file...',
      successMessage: 'Medical record file uploaded successfully',
      invalidateQueries: [['medicalRecords']],
    }
  );
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
  return useMutationOperation(
    async (templateData: {
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
      return await createMedicalRecordTemplate(templateData);
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.TEMPLATE_CREATE,
      loadingMessage: 'Creating medical record template...',
      successMessage: 'Medical record template created successfully',
      invalidateQueries: [['medicalRecordTemplates']],
    }
  );
};
