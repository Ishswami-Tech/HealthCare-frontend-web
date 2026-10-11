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
  getPatientAppointments,
  addPatientMedicalHistory,
  addPatientVitalSigns,
  addPatientLabResult,
  searchPatients,
} from '@/lib/actions/patients.server';
import { createUser } from '@/lib/actions/users.server';
import { usePatientStore } from '@/stores';

// ===== PATIENTS QUERY HOOKS =====
//
// Ids: `/patients/:id` and every `/ehr/<section>/:userId` route are keyed on the patient's USER id
// (User.id). Appointments, visits and prescriptions carry the Patient-record id (Patient.id).
// A patient list row has both: `id` (Patient.id) and `userId` / `user.id` (User.id).

/** Result of a read the backend has no route for: nothing to show, and no request is sent. */
function notAvailable(feature: string) {
  return {
    available: false as const,
    items: [] as unknown[],
    message: `${feature} is not available yet: the server has no service for it.`,
  };
}

/**
 * GET /patients/:userId answers with the User row and nests the Patient record under `patient`.
 * Re-shape it to the form the patient lists return (`id` = Patient.id, `userId`, `user`), so a screen
 * reads one patient the same way wherever it came from. Null when the user has no patient record.
 */
function toPatientWithUser(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const user: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  const patient = user.patient;
  if (!patient || typeof patient !== 'object' || Array.isArray(patient)) return null;
  delete user.patient;
  return { ...(patient as Record<string, unknown>), userId: user.id, user };
}

/**
 * Hook to get all patients for a clinic.
 * Backend: GET /clinics/:clinicId/patients — SUPER_ADMIN, CLINIC_ADMIN, RECEPTIONIST, DOCTOR,
 * ASSISTANT_DOCTOR, NURSE. The server reads `search`, `page` and `limit` only, so `offset` is sent
 * as the matching `page`. With `limit` or `search` it answers `{ patients, total, page, totalPages }`,
 * otherwise a plain list.
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
      ...(typeof filters?.limit === 'number' && filters.limit > 0 && typeof filters?.offset === 'number'
        ? { page: Math.floor(filters.offset / filters.limit) + 1 }
        : {}),
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
 * Hook to get one patient.
 * Backend: GET /patients/:id — `:id` is the patient's USER id (User.id). A Patient-record id is
 * answered with 403 "Patient does not belong to your clinic", and the backend has no route that
 * finds one patient by Patient-record id.
 * Roles: DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 * Returns the patient in the list shape (`id` = Patient.id, `userId`, `user`), or null.
 *
 * @param patientUserId the patient's USER id; pass '' (or `enabled: false`) until it is known.
 */
export const usePatient = (clinicId: string, patientUserId: string, options?: {
  enabled?: boolean;
}) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(['patient', clinicId, patientUserId], async () => {
    const response = await clinicApiClient.get(API_ENDPOINTS.PATIENTS.GET_BY_ID(clinicId, patientUserId));
    return toPatientWithUser(response.data);
  }, {
    enabled: !!clinicId && !!patientUserId && (options?.enabled ?? true),
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get one patient's appointments (a list of appointment rows, newest first).
 * Backend: GET /appointments. It has no patient filter that works, so the rows the caller may see
 * (a doctor: their own appointments) are read and narrowed to this patient — see
 * `getPatientAppointments`. There is no /patients/:id/appointments route.
 *
 * @param patientId Patient-record id (Appointment.patientId); the patient's user id matches too.
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
    return await getPatientAppointments(patientId, filters);
  }, {
    enabled: !!patientId,
    // One lookup can read several pages of the appointment list, so it is polled sparingly.
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get patient medical history.
 * Backend: GET /ehr/medical-history/:userId — `patientId` must be the patient's USER id.
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
 * Hook to get patient medical records (alias for medical history).
 * Backend: GET /ehr/medical-history/:userId — `patientId` must be the patient's USER id
 * (a Patient-record id returns an empty list).
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
 * Hook to get patient vital signs.
 * Backend: GET /ehr/vitals/:userId — `patientId` must be the patient's USER id.
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
 * Hook to get patient lab results.
 * Backend: GET /ehr/lab-reports/:userId — `patientId` must be the patient's USER id.
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
 * Hook to get patient statistics.
 * The backend has no route for it: the result is `{ available: false, items: [], message }`
 * and no request is sent.
 */
export const usePatientStats = (patientId: string) => {
  return useQueryData(['patientStats', patientId], async () => notAvailable('Patient statistics'), {
    enabled: !!patientId,
    staleTime: Infinity,
  });
};

/**
 * Hook to get patient timeline.
 * The backend has no route for it: the result is `{ available: false, items: [], message }`
 * and no request is sent.
 */
export const usePatientTimeline = (patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  limit?: number;
}) => {
  return useQueryData(['patientTimeline', patientId, filters], async () => notAvailable('The patient timeline'), {
    enabled: !!patientId,
    staleTime: Infinity,
  });
};

/**
 * Hook to get patient care plan.
 * The backend has no care plan (see `getPatientCarePlan` in patients.server.ts): the result is
 * `{ available: false, items: [], message }` and no request is sent.
 */
export const usePatientCarePlan = (patientId: string) => {
  return useQueryData(['patientCarePlan', patientId], async () => notAvailable('The care plan'), {
    enabled: !!patientId,
    staleTime: Infinity,
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
      area?: string;
      district?: string;
      occupation?: string;
      organization?: string;
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
        ...(patientData.area ? { area: patientData.area } : {}),
        ...(patientData.district ? { district: patientData.district } : {}),
        ...(patientData.occupation ? { occupation: patientData.occupation } : {}),
        ...(patientData.organization ? { organization: patientData.organization } : {}),
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
        ['doctorPatients'],
        ['users'],
        ['patientStats'],
        ['patientTimeline'],
        ['patientCarePlan'],
      ],
    }
  );
};

/**
 * Hook to update patient.
 * Backend: PUT /patients/:id — `patientId` is the patient's USER id.
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
      address?: string;
      area?: string;
      district?: string;
      occupation?: string;
      organization?: string;
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
 * Hook to deactivate a patient.
 * Backend: DELETE /patients/:id — `patientId` is the patient's USER id; CLINIC_ADMIN, SUPER_ADMIN only.
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
 * Hook to add patient medical history (POST /ehr/medical-history; `patientId` = patient's USER id).
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
 * Hook to add patient vital signs (POST /ehr/vitals, one row per reading; `patientId` = patient's USER id).
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
 * Hook to add patient lab result (POST /ehr/lab-reports; `patientId` = patient's USER id).
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
 * Hook to search the clinic's patients by name, email or phone.
 * Backend: GET /patients?search= — CLINIC_ADMIN, SUPER_ADMIN, DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * RECEPTIONIST. Answers `{ patients, total, page, totalPages }`.
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
 * Hook to export patient data.
 * The backend has no patient export route, so this fails with a readable message and sends nothing.
 */
export const useExportPatientData = () => {
  return useMutationOperation(
    async (_filters: {
    format: 'csv' | 'excel' | 'pdf';
    patientIds?: string[];
    includeHistory?: boolean;
    includeVitals?: boolean;
    includeLabs?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<never> => {
      throw new Error('Patient data export is not available yet: the server has no export service.');
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting patient data...',
      successMessage: 'Patient data exported successfully',
      showLoading: false,
    }
  );
};

/**
 * Hook to update patient care plan.
 * The backend has no care plan route, so this fails with a readable message and sends nothing.
 */
export const useUpdatePatientCarePlan = () => {
  return useMutationOperation(
    async (_variables: {
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
  }): Promise<never> => {
      throw new Error('The care plan cannot be saved yet: the server has no care plan service.');
    },
    {
      toastId: TOAST_IDS.PATIENT.UPDATE,
      loadingMessage: 'Updating patient care plan...',
      successMessage: 'Patient care plan updated successfully',
      showLoading: false,
    }
  );
};
