"use client";

import { useEffect, useMemo } from 'react';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { TOAST_IDS } from '../utils/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import { usePatientStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentClinicId } from './useClinics';

const useDoctorQueryScope = () => {
  const sessionId = useAuthStore((state) => state.session?.session_id?.trim() || '');
  const userId = useAuthStore((state) => state.session?.user?.id?.trim() || '');
  return sessionId || userId || 'guest';
};

// ===== DOCTORS QUERY HOOKS =====

/**
 * Hook to get all doctors for a clinic
 */
export const useDoctors = (clinicId: string, filters?: {
  search?: string;
  specialization?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  locationId?: string;
}, options?: {
  enabled?: boolean;
}) => {
  const { isConnected } = useWebSocketStatus();
  const authScope = useDoctorQueryScope();

  console.log('[useDoctors] Hook called with clinicId:', clinicId, 'filters:', filters, 'enabled:', !!clinicId && (options?.enabled ?? true));

  return useQueryData(['doctors', clinicId, authScope, filters], async () => {
    console.log('[useDoctors] Fetching doctors for clinicId:', clinicId, 'filters:', filters);
    const result = await clinicApiClient.get(API_ENDPOINTS.DOCTORS.GET_CLINIC_DOCTORS(clinicId), filters);
    const doctors = Array.isArray(result.data) ? result.data : [];
    console.log('[useDoctors] Received doctors:', doctors.length, 'doctors');
    return doctors;
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get doctor by ID
 */
export const useDoctor = (doctorId: string) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctor', doctorId], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId));
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get doctor schedule
 */
export const useDoctorSchedule = (clinicId: string, doctorId: string, date?: string) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorSchedule', clinicId, doctorId, date], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.SCHEDULE.GET(clinicId, doctorId), date ? { date } : undefined);
  }, {
    enabled: !!clinicId && !!doctorId,
    refetchInterval: isConnected ? false : 30_000,
  });
};

/**
 * Hook to get doctor availability
 */
export const useDoctorAvailabilityLegacy = (doctorId: string, date: string, locationId?: string) => {
  const clinicId = useCurrentClinicId();
  const { isConnected } = useWebSocketStatus();
  const authScope = useDoctorQueryScope();

  return useQueryData(['doctorAvailability', clinicId, doctorId, date, locationId || 'all', authScope], async () => {
    if (!clinicId) {
      throw new Error('No clinic ID available');
    }
    const res = await clinicApiClient.get(API_ENDPOINTS.DOCTORS.AVAILABILITY.GET(doctorId), {
      clinicId,
      date,
      locationId,
    });
    return (res as any).availability ?? res;
  }, {
    enabled: !!clinicId && !!doctorId && !!date,
    refetchInterval: isConnected ? false : 30_000,
  });
};

/**
 * Hook to get doctor appointments
 */
export const useDoctorAppointments = (doctorId: string, filters?: {
  date?: string;
  status?: string;
  limit?: number;
}) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorAppointments', doctorId, filters], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.APPOINTMENTS(doctorId), filters);
  }, {
    enabled: !!doctorId,
    staleTime: 0,
    gcTime: 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: isConnected ? false : 30_000,
  });
};

/**
 * Hook to get patients for the active authenticated doctor in a clinic
 */
export const useDoctorPatients = (clinicId: string, filters?: {
  search?: string;
  gender?: string;
  ageRange?: string;
  limit?: number;
  offset?: number;
}, options?: {
  enabled?: boolean;
}) => {
  const { isConnected } = useWebSocketStatus();
  const setCollection = usePatientStore((state) => state.setCollection);

  const query = useQueryData(['doctorPatients', clinicId, filters], async () => {
    const doctorId = useAuthStore.getState().session?.user?.id || '';
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.PATIENTS(clinicId, doctorId), filters);
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
    refetchInterval: isConnected ? false : 60_000,
  });

  useEffect(() => {
    if (!clinicId) {
      setCollection('doctor', []);
      return;
    }

    const normalizedPatients = Array.isArray(query.data)
      ? query.data
      : (query.data as any)?.patients || (query.data as any)?.data || [];

    setCollection('doctor', Array.isArray(normalizedPatients) ? normalizedPatients : []);
  }, [clinicId, query.data, setCollection]);

  return query;
};

/**
 * Hook to get doctor statistics
 */
export const useDoctorStats = (doctorId: string, period?: 'day' | 'week' | 'month' | 'year') => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorStats', doctorId, period], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.STATS(doctorId), period ? { period } : undefined);
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 120_000,
  });
};

/**
 * Hook to get doctor reviews
 */
export const useDoctorReviews = (doctorId: string, limit: number = 10) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorReviews', doctorId, limit], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.REVIEWS.GET(doctorId), { limit });
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 300_000,
  });
};

/**
 * Hook to get doctor specializations
 */
export const useDoctorSpecializations = () => {
  return useQueryData(['doctorSpecializations'], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.SPECIALIZATIONS);
  });
};

/**
 * Hook to get doctor performance metrics
 */
export const useDoctorPerformanceMetrics = (doctorId: string, filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorPerformanceMetrics', doctorId, filters], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.PERFORMANCE(doctorId), filters);
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 300_000,
  });
};

/**
 * Hook to get doctor earnings
 */
export const useDoctorEarnings = (doctorId: string, filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorEarnings', doctorId, filters], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.EARNINGS(doctorId), filters);
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 300_000,
  });
};

// ===== DOCTORS MUTATION HOOKS =====

/**
 * Hook to create doctor
 */
export const useCreateDoctor = () => {
  return useMutationOperation(
    async (doctorData: {
      userId: string;
      specialization?: string;
      licenseNumber?: string;
      experience?: number;
      qualification?: string;
      consultationFee?: number;
      clinicId?: string;
      schedule?: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }[];
    }) => {
      return await clinicApiClient.post(API_ENDPOINTS.DOCTORS.CREATE, doctorData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.CREATE,
      loadingMessage: 'Creating doctor...',
      successMessage: 'Doctor created successfully',
      invalidateQueries: [
        ['doctors'],
        ['doctor'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['doctorAppointments'],
        ['doctorStats'],
        ['doctorReviews'],
        ['doctorPerformanceMetrics'],
        ['doctorEarnings'],
        ['clinicDoctors'],
        ['clinicUsersByRole'],
        ['users'],
      ],
    }
  );
};

/**
 * Hook to update doctor
 */
export const useUpdateDoctor = () => {
  return useMutationOperation(
    async ({ doctorId, updates }: {
      doctorId: string;
      updates: {
        specialization?: string;
        licenseNumber?: string;
        experience?: number;
        qualification?: string;
        consultationFee?: number;
        isActive?: boolean;
        clinicId?: string;
      };
    }) => {
      return await clinicApiClient.put(API_ENDPOINTS.DOCTORS.UPDATE(doctorId), updates);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor...',
      successMessage: 'Doctor updated successfully',
      invalidateQueries: [
        ['doctors'],
        ['doctor'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['doctorAppointments'],
        ['doctorStats'],
        ['doctorReviews'],
        ['doctorPerformanceMetrics'],
        ['doctorEarnings'],
        ['clinicDoctors'],
        ['clinicUsersByRole'],
        ['users'],
      ],
    }
  );
};

/**
 * Hook to delete doctor
 */
export const useDeleteDoctor = () => {
  return useMutationOperation(
    async (doctorId: string) => {
      return await clinicApiClient.delete(API_ENDPOINTS.DOCTORS.DELETE(doctorId));
    },
    {
      toastId: TOAST_IDS.DOCTOR.DELETE,
      loadingMessage: 'Deleting doctor...',
      successMessage: 'Doctor deleted successfully',
      invalidateQueries: [
        ['doctors'],
        ['doctor'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['doctorAppointments'],
        ['doctorStats'],
        ['doctorReviews'],
        ['doctorPerformanceMetrics'],
        ['doctorEarnings'],
        ['clinicDoctors'],
        ['clinicUsersByRole'],
        ['users'],
      ],
    }
  );
};

/**
 * Hook to update doctor schedule
 */
export const useUpdateDoctorSchedule = () => {
  return useMutationOperation(
    async ({ doctorId, clinicId, schedule }: {
      doctorId: string;
      clinicId?: string;
      schedule: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }[];
    }) => {
      return await clinicApiClient.put(API_ENDPOINTS.DOCTORS.SCHEDULE.UPDATE(doctorId), { schedule, clinicId });
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor schedule...',
      successMessage: 'Doctor schedule updated successfully',
      invalidateQueries: [
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['doctorAppointments'],
        ['doctorStats'],
        ['doctorPerformanceMetrics'],
        ['clinicDoctors'],
      ],
    }
  );
};

/**
 * Hook to update doctor availability
 */
export const useUpdateDoctorAvailability = () => {
  return useMutationOperation(
    async ({ doctorId, availabilityData }: {
      doctorId: string;
      availabilityData: {
        date: string;
        timeSlots: {
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }[];
      };
    }) => {
      return await clinicApiClient.put(API_ENDPOINTS.DOCTORS.AVAILABILITY.UPDATE(doctorId), availabilityData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor availability...',
      successMessage: 'Doctor availability updated successfully',
      invalidateQueries: [
        ['doctorAvailability'],
        ['doctorSchedule'],
        ['doctorAppointments'],
        ['doctorStats'],
        ['doctorPerformanceMetrics'],
        ['clinicDoctors'],
      ],
    }
  );
};

/**
 * Hook to add doctor review
 */
export const useAddDoctorReview = () => {
  return useMutationOperation(
    async ({ doctorId, reviewData }: {
      doctorId: string;
      reviewData: {
        patientId: string;
        rating: number;
        comment?: string;
        appointmentId?: string;
      };
    }) => {
      return await clinicApiClient.post(API_ENDPOINTS.DOCTORS.REVIEWS.CREATE(doctorId), reviewData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Adding doctor review...',
      successMessage: 'Doctor review added successfully',
      invalidateQueries: [['doctorReviews'], ['doctor'], ['doctorStats']],
    }
  );
};

/**
 * Hook to search doctors
 */
export const useSearchDoctors = () => {
  return useMutationOperation(
    async ({ query, filters }: {
      query: string;
      filters?: {
        specialization?: string;
        clinicId?: string;
        location?: string;
        availability?: string;
        limit?: number;
      };
    }) => {
      return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.SEARCH, { query, ...filters });
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Searching doctors...',
      successMessage: 'Search completed',
      showToast: false,
    }
  );
};

/**
 * Hook to update doctor profile
 */
export const useUpdateDoctorProfile = () => {
  return useMutationOperation(
    async ({ doctorId, profileData }: {
      doctorId: string;
      profileData: {
        bio?: string;
        education?: string[];
        certifications?: string[];
        languages?: string[];
        profilePicture?: string;
      };
    }) => {
      return await clinicApiClient.put(API_ENDPOINTS.DOCTORS.PROFILE.UPDATE(doctorId), profileData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor profile...',
      successMessage: 'Doctor profile updated successfully',
      invalidateQueries: [['doctor'], ['doctors'], ['clinicDoctors'], ['doctorStats']],
    }
  );
};

/**
 * Hook to export doctor data
 */
export const useExportDoctorData = () => {
  return useMutationOperation(
    async (filters: {
      format: 'csv' | 'excel' | 'pdf';
      doctorIds?: string[];
      includeStats?: boolean;
      startDate?: string;
      endDate?: string;
    }) => {
      return await clinicApiClient.post(API_ENDPOINTS.DOCTORS.EXPORT, filters);
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting doctor data...',
      successMessage: 'Doctor data exported successfully',
    }
  );
};

export const useCurrentDoctorEntityId = (clinicId?: string) => {
  const { session } = useAuth() as { session?: { user?: { id?: string; email?: string } } };
  const authenticatedUserId = session?.user?.id || '';
  const authenticatedEmail = session?.user?.email?.toLowerCase() || '';
  const clinicDoctors = useQueryData(
    ['clinicDoctors', clinicId],
    async () => {
      if (!clinicId) return [];
      return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.GET_CLINIC_DOCTORS(clinicId));
    },
    { enabled: !!clinicId }
  );

  const doctorId = useMemo(() => {
    const doctors: any[] = Array.isArray(clinicDoctors.data) ? (clinicDoctors.data as any[]) : [];
    const matchedDoctor = doctors.find((doctor: any) => {
      const doctorUserId = doctor.userId || doctor.user?.id || '';
      const doctorEmail = doctor.user?.email?.toLowerCase() || '';
      return doctorUserId === authenticatedUserId || (authenticatedEmail && doctorEmail === authenticatedEmail);
    });

    return matchedDoctor?.id || '';
  }, [authenticatedEmail, authenticatedUserId, clinicDoctors.data]);

  return {
    doctorId,
    doctorUserId: authenticatedUserId,
    isResolvingDoctorId: Boolean(clinicId) && clinicDoctors.isPending && !doctorId,
  };
};

