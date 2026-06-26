import { useEffect } from 'react';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import {
  createPatient,
  updatePatient,
  deletePatient,
  addPatientMedicalHistory,
  addPatientVitalSigns,
  addPatientLabResult,
  searchPatients,
  exportPatientData,
  updatePatientCarePlan
} from '@/lib/actions/patients.server';
import { createUser } from '@/lib/actions/users.server';
import { usePatientStore } from '@/stores';

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
}, options?: {
  enabled?: boolean;
}) => {
  const { isConnected } = useWebSocketStatus();
  const setCollection = usePatientStore((state) => state.setCollection);

  const query = useQueryData(['patients', clinicId, filters], async () => {
    const params = {
      ...(filters?.search ? { search: filters.search } : {}),
      ...(filters?.gender ? { gender: filters.gender } : {}),
      ...(filters?.ageRange ? { ageRange: filters.ageRange } : {}),
      ...(filters?.bloodGroup ? { bloodGroup: filters.bloodGroup } : {}),
      ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(typeof filters?.isActive === 'boolean' ? { isActive: filters.isActive } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
      ...(typeof filters?.offset === 'number' ? { offset: filters.offset } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.GET_CLINIC_PATIENTS(clinicId), params)).data;
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
    refetchInterval: isConnected ? false : 120_000,
  });

  useEffect(() => {
    if (!clinicId) {
      setCollection('clinic', []);
      return;
    }

    const normalizedPatients = Array.isArray(query.data)
      ? query.data
      : (query.data as any)?.patients || (query.data as any)?.data || [];

    setCollection('clinic', Array.isArray(normalizedPatients) ? normalizedPatients : []);
  }, [clinicId, query.data, setCollection]);

  return query;
};

/**
 * Hook to get patient by ID
 */
export const usePatient = (clinicId: string, patientId: string) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patient', clinicId, patientId], async () => {
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.GET_BY_ID(clinicId, patientId))).data;
  }, {
    enabled: !!clinicId && !!patientId,
    refetchInterval: isConnected ? false : 120_000,
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
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientAppointments', patientId, filters], async () => {
    const params = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.startDate ? { startDate: filters.startDate } : {}),
      ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.APPOINTMENTS(patientId), params)).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 30_000,
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
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientMedicalHistory', patientId, filters], async () => {
    const params = {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.startDate ? { startDate: filters.startDate } : {}),
      ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.EHR.MEDICAL_HISTORY.GET_BY_USER(patientId), params)).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get patient medical records (alias for medical history)
 */
export const usePatientMedicalRecords = (clinicId: string, patientId: string, options?: {
  enabled?: boolean;
}) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientMedicalRecords', clinicId, patientId], async () => {
    return (await clinicApiClient.get(API_ENDPOINTS.EHR.MEDICAL_HISTORY.GET_BY_USER(patientId))).data;
  }, {
    enabled: !!clinicId && !!patientId && (options?.enabled !== false),
    refetchInterval: isConnected ? false : 120_000,
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
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientVitalSigns', patientId, filters], async () => {
    const params = {
      ...(filters?.startDate ? { startDate: filters.startDate } : {}),
      ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.EHR.VITALS.GET_BY_USER(patientId), params)).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 30_000,
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
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientLabResults', patientId, filters], async () => {
    const params = {
      ...(filters?.testType ? { testType: filters.testType } : {}),
      ...(filters?.startDate ? { startDate: filters.startDate } : {}),
      ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.EHR.LAB_REPORTS.GET_BY_USER(patientId), params)).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 60_000,
  });
};

/**
 * Hook to get patient statistics
 */
export const usePatientStats = (patientId: string) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientStats', patientId], async () => {
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.STATS(patientId))).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 60_000,
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
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientTimeline', patientId, filters], async () => {
    const params = {
      ...(filters?.startDate ? { startDate: filters.startDate } : {}),
      ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      ...(filters?.eventTypes ? { eventTypes: filters.eventTypes.join(',') } : {}),
      ...(typeof filters?.limit === 'number' ? { limit: filters.limit } : {}),
    };
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.TIMELINE(patientId), params)).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 60_000,
  });
};

/**
 * Hook to get patient care plan
 */
export const usePatientCarePlan = (patientId: string) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patientCarePlan', patientId], async () => {
    return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.CARE_PLAN.GET(patientId))).data;
  }, {
    enabled: !!patientId,
    refetchInterval: isConnected ? false : 120_000,
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
      invalidateQueries: [
        ['patients'],
        ['users'],
        ['patientStats'],
        ['patientTimeline'],
        ['patientCarePlan'],
      ],
    }
  );
};

/**
 * Hook to quick register patient through the role-protected user endpoint.
 */
export const useQuickRegisterPatient = () => {
  return useMutationOperation(
    async (patientData: {
      email?: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
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
        primaryHolder?: string;
        coverageStartDate?: string;
        coverageEndDate?: string;
        coverageType?: string;
      };
    }) => {
      const generatedEmail =
        patientData.email?.trim() ||
        `patient.${patientData.phone.replace(/\D/g, '')}.${Date.now()}@clinic.local`;

      const createdUser = await createUser({
        email: generatedEmail,
        password: patientData.password,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: patientData.phone,
        role: 'PATIENT',
        ...(patientData.gender ? { gender: patientData.gender } : {}),
        ...(patientData.dateOfBirth ? { dateOfBirth: patientData.dateOfBirth } : {}),
        ...(patientData.address ? { address: patientData.address } : {}),
        ...(patientData.city ? { city: patientData.city } : {}),
        ...(patientData.state ? { state: patientData.state } : {}),
        ...(patientData.country ? { country: patientData.country } : {}),
        ...(patientData.zipCode ? { zipCode: patientData.zipCode } : {}),
        ...(patientData.allergies ? { allergies: patientData.allergies } : {}),
        ...(patientData.medicalHistory ? { medicalHistory: patientData.medicalHistory } : {}),
        ...(patientData.emergencyContact ? { emergencyContact: patientData.emergencyContact } : {}),
        ...(patientData.insurance
          ? {
              insurance: [
                {
                  provider: patientData.insurance.provider,
                  policyNumber: patientData.insurance.policyNumber,
                  policyHolder:
                    patientData.insurance.primaryHolder ||
                    `${patientData.firstName} ${patientData.lastName}`.trim(),
                  relationship: 'Self',
                  status: patientData.insurance.coverageType || 'ACTIVE',
                  ...(patientData.insurance.groupNumber
                    ? { groupNumber: patientData.insurance.groupNumber }
                    : {}),
                  ...(patientData.insurance.coverageType
                    ? { coverageDetails: patientData.insurance.coverageType }
                    : {}),
                  ...(patientData.insurance.coverageEndDate
                    ? { expiryDate: patientData.insurance.coverageEndDate }
                    : {}),
                },
              ],
            }
          : {}),
      });

      return {
        user: createdUser,
        generatedEmail,
      };
    },
    {
      toastId: TOAST_IDS.PATIENT.CREATE,
      loadingMessage: 'Registering patient...',
      successMessage: 'Patient registered successfully',
      invalidateQueries: [
        ['patients'],
        ['users'],
        ['patientStats'],
        ['patientTimeline'],
        ['patientCarePlan'],
      ],
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
      invalidateQueries: [
        ['patients'],
        ['users'],
        ['patientStats'],
        ['patientTimeline'],
        ['patientCarePlan'],
      ],
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
      invalidateQueries: [
        ['patients'],
        ['users'],
        ['patientStats'],
        ['patientTimeline'],
        ['patientCarePlan'],
      ],
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
      invalidateQueries: [['patientMedicalHistory'], ['patientMedicalRecords'], ['patientTimeline'], ['patientStats']],
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
      invalidateQueries: [['patientVitalSigns'], ['patientMedicalRecords'], ['patientTimeline'], ['patientStats']],
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
      invalidateQueries: [['patientLabResults'], ['patientMedicalRecords'], ['patientTimeline'], ['patientStats']],
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
      invalidateQueries: [['patientCarePlan'], ['patientTimeline'], ['patientStats']],
    }
  );
};
