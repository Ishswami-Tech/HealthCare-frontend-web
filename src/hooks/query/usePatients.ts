import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientAppointments,
  getPatientMedicalHistory,
  addPatientMedicalHistory,
  getPatientVitalSigns,
  addPatientVitalSigns,
  getPatientLabResults,
  addPatientLabResult,
  getPatientStats,
  searchPatients,
  getPatientTimeline,
  exportPatientData,
  getPatientCarePlan,
  updatePatientCarePlan
} from '@/lib/actions/patients.server';

// ===== PATIENTS QUERY HOOKS =====

/**
 * Hook to get all patients for a clinic
 */
export const usePatients = (clinicId: string, filters?: {
  search?: string;
  gender?: string;
  ageRange?: string;
  bloodGroup?: string;
  doctorId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(['patients', clinicId, filters], async () => {
    return await getPatients(clinicId, filters);
  }, {
    enabled: !!clinicId,
  });
};

/**
 * Hook to get patient by ID
 */
export const usePatient = (clinicId: string, patientId: string) => {
  return useQueryData(['patient', clinicId, patientId], async () => {
    return await getPatientById(clinicId, patientId);
  }, {
    enabled: !!clinicId && !!patientId,
  });
};

/**
 * Hook to get patient appointments
 */
export const usePatientAppointments = (patientId: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  limit?: number;
}) => {
  return useQueryData(['patientAppointments', patientId, filters], async () => {
    return await getPatientAppointments(patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient medical history
 */
export const usePatientMedicalHistory = (patientId: string, filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(['patientMedicalHistory', patientId, filters], async () => {
    return await getPatientMedicalHistory('', patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient medical records (alias for medical history)
 */
export const usePatientMedicalRecords = (clinicId: string, patientId: string, options?: {
  enabled?: boolean;
}) => {
  return useQueryData(['patientMedicalRecords', clinicId, patientId], async () => {
    return await getPatientMedicalHistory(clinicId, patientId);
  }, {
    enabled: !!clinicId && !!patientId && (options?.enabled !== false),
  });
};

/**
 * Hook to get patient vital signs
 */
export const usePatientVitalSigns = (patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(['patientVitalSigns', patientId, filters], async () => {
    return await getPatientVitalSigns(patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient lab results
 */
export const usePatientLabResults = (patientId: string, filters?: {
  testType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(['patientLabResults', patientId, filters], async () => {
    return await getPatientLabResults(patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient statistics
 */
export const usePatientStats = (patientId: string) => {
  return useQueryData(['patientStats', patientId], async () => {
    return await getPatientStats(patientId);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient timeline
 */
export const usePatientTimeline = (patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  limit?: number;
}) => {
  return useQueryData(['patientTimeline', patientId, filters], async () => {
    return await getPatientTimeline(patientId, filters);
  }, {
    enabled: !!patientId,
  });
};

/**
 * Hook to get patient care plan
 */
export const usePatientCarePlan = (patientId: string) => {
  return useQueryData(['patientCarePlan', patientId], async () => {
    return await getPatientCarePlan(patientId);
  }, {
    enabled: !!patientId,
  });
};

// ===== PATIENTS MUTATION HOOKS =====

/**
 * Hook to create patient
 */
export const useCreatePatient = () => {
  return useMutationOperation(
    async (patientData: {
    userId: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies?: string[];
    medicalHistory?: string[];
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
    };
  }) => {
      return await createPatient(patientData);
    },
    {
      toastId: TOAST_IDS.PATIENT.CREATE,
      loadingMessage: 'Creating patient...',
      successMessage: 'Patient created successfully',
      invalidateQueries: [['patients']],
    }
  );
};

/**
 * Hook to update patient
 */
export const useUpdatePatient = () => {
  return useMutationOperation(
    async ({ patientId, updates }: {
    patientId: string;
    updates: {
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      bloodGroup?: string;
      height?: number;
      weight?: number;
      allergies?: string[];
      medicalHistory?: string[];
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      insurance?: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
      };
      isActive?: boolean;
    };
  }) => {
      return await updatePatient(patientId, updates);
    },
    {
      toastId: TOAST_IDS.PATIENT.UPDATE,
      loadingMessage: 'Updating patient...',
      successMessage: 'Patient updated successfully',
      invalidateQueries: [['patients']],
    }
  );
};

/**
 * Hook to delete patient
 */
export const useDeletePatient = () => {
  return useMutationOperation(
    async (patientId: string) => {
      return await deletePatient(patientId);
    },
    {
      toastId: TOAST_IDS.PATIENT.DELETE,
      loadingMessage: 'Deleting patient...',
      successMessage: 'Patient deleted successfully',
      invalidateQueries: [['patients']],
    }
  );
};

/**
 * Hook to add patient medical history
 */
export const useAddPatientMedicalHistory = () => {
  return useMutationOperation(
    async ({ clinicId, patientId, historyData }: {
    clinicId: string;
    patientId: string;
    historyData: {
      type: 'DIAGNOSIS' | 'TREATMENT' | 'SURGERY' | 'ALLERGY' | 'MEDICATION' | 'FAMILY_HISTORY';
      title: string;
      description: string;
      date: string;
      doctorId?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
  }) => {
      return await addPatientMedicalHistory(clinicId, patientId, historyData);
    },
    {
      toastId: TOAST_IDS.EHR.HISTORY_CREATE,
      loadingMessage: 'Adding medical history...',
      successMessage: 'Medical history added successfully',
      invalidateQueries: [['patientMedicalHistory']],
    }
  );
};

/**
 * Hook to add patient vital signs
 */
export const useAddPatientVitalSigns = () => {
  return useMutationOperation(
    async ({ patientId, vitalsData }: {
    patientId: string;
    vitalsData: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
      recordedAt: string;
      recordedBy: string;
      notes?: string;
    };
  }) => {
      return await addPatientVitalSigns(patientId, vitalsData);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_CREATE,
      loadingMessage: 'Adding vital signs...',
      successMessage: 'Vital signs added successfully',
      invalidateQueries: [['patientVitalSigns']],
    }
  );
};

/**
 * Hook to add patient lab result
 */
export const useAddPatientLabResult = () => {
  return useMutationOperation(
    async ({ patientId, labData }: {
    patientId: string;
    labData: {
      testType: string;
      testName: string;
      result: string;
      normalRange?: string;
      unit?: string;
      status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
      testDate: string;
      reportedDate: string;
      labName?: string;
      doctorId?: string;
      notes?: string;
    };
  }) => {
      return await addPatientLabResult(patientId, labData);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_CREATE,
      loadingMessage: 'Adding lab result...',
      successMessage: 'Lab result added successfully',
      invalidateQueries: [['patientLabResults']],
    }
  );
};

/**
 * Hook to search patients
 */
export const useSearchPatients = () => {
  return useMutationOperation(
    async ({ query, filters }: {
    query: string;
    filters?: {
      gender?: string;
      ageRange?: string;
      bloodGroup?: string;
      clinicId?: string;
      limit?: number;
    };
  }) => {
      return await searchPatients(query, filters);
    },
    {
      toastId: TOAST_IDS.PATIENT.UPDATE,
      loadingMessage: 'Searching patients...',
      successMessage: 'Search completed',
      showToast: false,
    }
  );
};

/**
 * Hook to export patient data
 */
export const useExportPatientData = () => {
  return useMutationOperation(
    async (filters: {
    format: 'csv' | 'excel' | 'pdf';
    patientIds?: string[];
    includeHistory?: boolean;
    includeVitals?: boolean;
    includeLabs?: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
      return await exportPatientData(filters);
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting patient data...',
      successMessage: 'Patient data exported successfully',
    }
  );
};

/**
 * Hook to update patient care plan
 */
export const useUpdatePatientCarePlan = () => {
  return useMutationOperation(
    async ({ patientId, carePlanData }: {
    patientId: string;
    carePlanData: {
      goals?: string[];
      interventions?: string[];
      medications?: {
        name: string;
        dosage: string;
        frequency: string;
        startDate: string;
        endDate?: string;
      }[];
      followUpInstructions?: string;
      nextAppointment?: string;
      doctorId: string;
    };
  }) => {
      return await updatePatientCarePlan(patientId, carePlanData);
    },
    {
      toastId: TOAST_IDS.PATIENT.UPDATE,
      loadingMessage: 'Updating patient care plan...',
      successMessage: 'Patient care plan updated successfully',
      invalidateQueries: [['patientCarePlan']],
    }
  );
};
