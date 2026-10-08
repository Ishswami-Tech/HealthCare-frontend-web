"use client";

import { useEffect, useMemo } from 'react';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { TOAST_IDS } from '../utils/use-toast';
import { CACHE_TIMES, GC_TIMES } from './config';
import { useAuth } from '@/hooks/auth/useAuth';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS, APP_CONFIG } from '@/lib/config/config';
import {
  addDoctorReview,
  getDoctorAppointments,
  getDoctorReviews,
  getDoctors as getDoctorsServerAction,
  updateDoctorProfile,
} from '@/lib/actions/doctors.server';
import { resolveDisplayNameAndInitials } from '@/lib/utils/display-name';
import { usePatientStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentClinicId } from './useClinics';
import { isSessionInvalidError } from '@/lib/utils/auth-recovery';

const useDoctorQueryScope = () => {
  const sessionId = useAuthStore((state) => state.session?.session_id?.trim() || '');
  const userId = useAuthStore((state) => state.session?.user?.id?.trim() || '');
  return sessionId || userId || 'guest';
};

const doctorQueryRetry = (failureCount: number, error: unknown) => {
  if (isSessionInvalidError(error)) {
    return false;
  }

  return failureCount < 2;
};

const normalizeDoctorRows = (payload: unknown): any[] => {
  const extractRows = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
      return value;
    }

    if (!value || typeof value !== "object") {
      return [];
    }

    const record = value as {
      doctor?: unknown;
      doctors?: unknown;
      data?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(record.doctors)) return record.doctors;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.results)) return record.results;
    if (Array.isArray(record.data)) return record.data;
    if (record.doctor && typeof record.doctor === "object") return [record.doctor];

    if (record.data && typeof record.data === "object") {
      const nested = record.data as {
        doctor?: unknown;
        doctors?: unknown;
        data?: unknown;
        items?: unknown;
        results?: unknown;
      };
      if (Array.isArray(nested.doctors)) return nested.doctors;
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.results)) return nested.results;
      if (Array.isArray(nested.data)) return nested.data;
      if (nested.doctor && typeof nested.doctor === "object") return [nested.doctor];
    }

    return [];
  };

  const rows = extractRows(payload);

  return rows.map((row: any) => {
    const doctor = row?.doctor ?? row;
    const user = doctor?.user ?? row?.user ?? {};
    const resolvedDoctorName = resolveDisplayNameAndInitials({
      firstName: doctor?.firstName ?? row?.firstName ?? user?.firstName,
      lastName: doctor?.lastName ?? row?.lastName ?? user?.lastName,
      name: user?.name ?? doctor?.name ?? row?.name,
      email: user?.email ?? doctor?.email ?? row?.email,
      role: 'DOCTOR',
    }).displayName;
    return {
      ...doctor,
      id: doctor?.id ?? row?.id ?? "",
      userId: user?.id ?? row?.userId ?? "",
      name: resolvedDoctorName === 'User' ? 'Doctor' : resolvedDoctorName,
      specialization: doctor?.specialization ?? "",
      image: user?.profilePicture ?? doctor?.profilePicture ?? row?.profilePicture ?? "",
    };
  });
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
  const { connectionStatus } = useWebSocketStatus();
  const shouldPoll = connectionStatus !== 'connected';
  const queryKey = useMemo(
    () => [
      'doctors',
      clinicId,
      filters?.search?.trim() || '',
      filters?.specialization?.trim() || '',
      typeof filters?.isActive === 'boolean' ? String(filters.isActive) : 'any',
      typeof filters?.limit === 'number' ? filters.limit : 'all',
      typeof filters?.offset === 'number' ? filters.offset : 0,
      filters?.locationId?.trim() || '',
    ],
    [
      clinicId,
      filters?.isActive,
      filters?.limit,
      filters?.locationId,
      filters?.offset,
      filters?.search,
      filters?.specialization,
    ]
  );

  // Build a stable query key from primitive values so fresh object literals
  // do not fragment the cache or trigger unnecessary refetches.

  return useQueryData(queryKey, async () => {
    try {
      const queryDoctors = async (params?: typeof filters) => {
        return normalizeDoctorRows(
          await getDoctorsServerAction(clinicId, params)
        );
      };

      const hasLocationOnlyFilter =
        !!filters?.locationId?.trim() &&
        !filters?.search?.trim() &&
        !filters?.specialization?.trim() &&
        typeof filters?.isActive === 'undefined';

      let doctors = await queryDoctors(filters);

      // When a location-scoped lookup comes back empty, fall back to the
      // clinic-wide doctor list. This prevents a stale or incomplete mobile
      // location context from hiding the only available doctor in clinics
      // that effectively operate with a single static provider.
      if (doctors.length === 0 && hasLocationOnlyFilter) {
        try {
          const fallbackFilters = { ...filters };
          delete (fallbackFilters as { locationId?: string }).locationId;
          const fallbackDoctors = await queryDoctors(fallbackFilters);
          if (fallbackDoctors.length > 0) {
            if (APP_CONFIG.ENVIRONMENT === "development") {
              console.log(
                '[useDoctors] Location fallback recovered clinic-wide doctors:',
                fallbackDoctors.length,
              );
            }
            doctors = fallbackDoctors;
          }
        } catch (fallbackError) {
          console.warn('[useDoctors] Location fallback failed:', fallbackError);
        }
      }

      if (APP_CONFIG.ENVIRONMENT === "development") {
        console.log('[useDoctors] Received doctors:', doctors.length, 'doctors');
      }
      return doctors;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
    staleTime: 0,
    gcTime: GC_TIMES.STATIC,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: shouldPoll ? 60_000 : false,
    retry: doctorQueryRetry,
  });
};

/**
 * Hook to get doctor by ID
 */
export const useDoctor = (doctorId: string) => {
  return useQueryData(['doctor', doctorId], async () => {
    try {
      return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId));
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  }, {
    enabled: !!doctorId,
    staleTime: 0,
    gcTime: GC_TIMES.STATIC,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
    retry: doctorQueryRetry,
  });
};

/**
 * Hook to get doctor schedule
 */
export const useDoctorSchedule = (clinicId: string, doctorId: string, date?: string) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorSchedule', clinicId, doctorId, date], async () => {
    try {
      return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.SCHEDULE.GET(clinicId, doctorId), date ? { date } : undefined);
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  }, {
    enabled: !!clinicId && !!doctorId,
    refetchInterval: isConnected ? false : 30_000,
    retry: doctorQueryRetry,
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
    try {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      const res = await clinicApiClient.get(API_ENDPOINTS.DOCTORS.AVAILABILITY.GET(doctorId), {
        clinicId,
        date,
        locationId,
      });
      return (res as any).availability ?? res;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: !!clinicId && !!doctorId && !!date,
    refetchInterval: isConnected ? false : 30_000,
    retry: doctorQueryRetry,
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
    try {
      // GET /appointments?doctorId= (there is no /doctors/:id/appointments route).
      return await getDoctorAppointments(doctorId, filters);
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: !!doctorId,
    staleTime: 0,
    gcTime: 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: isConnected ? false : 30_000,
    retry: doctorQueryRetry,
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
    try {
      const doctorId = useAuthStore.getState().session?.user?.id || '';
      return await clinicApiClient.get(API_ENDPOINTS.DOCTORS.PATIENTS(clinicId, doctorId), filters);
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
    refetchInterval: isConnected ? false : 60_000,
    retry: doctorQueryRetry,
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
 * Hook to get a doctor's reviews (GET /doctors/:id/reviews; the id is the doctor's User id).
 * Answers { items, averageRating, reviewCount, meta }.
 */
export const useDoctorReviews = (doctorId: string, limit: number = 10, page: number = 1) => {
  const { isConnected } = useWebSocketStatus();

  return useQueryData(['doctorReviews', doctorId, limit, page], async () => {
    try {
      return await getDoctorReviews(doctorId, { limit, page });
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: !!doctorId,
    refetchInterval: isConnected ? false : 300_000,
    retry: doctorQueryRetry,
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
 * Hook to update a doctor's profile (PATCH /doctors/:id; the id is the doctor's User id).
 */
export const useUpdateDoctor = () => {
  return useMutationOperation(
    async ({ doctorId, updates }: {
      doctorId: string;
      updates: Parameters<typeof updateDoctorProfile>[1];
    }) => {
      const result = await updateDoctorProfile(doctorId, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
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
 * Hook for a patient to rate a doctor after a completed visit (POST /doctors/:id/reviews).
 * `doctorId` is the doctor's User id; one review per appointment.
 */
export const useAddDoctorReview = () => {
  return useMutationOperation(
    async ({ doctorId, reviewData }: {
      doctorId: string;
      reviewData: {
        appointmentId: string;
        rating: number;
        comment?: string;
      };
    }) => {
      const result = await addDoctorReview(doctorId, reviewData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Sending your rating...',
      successMessage: 'Thanks for rating your visit',
      invalidateQueries: [['doctorReviews'], ['doctor']],
    }
  );
};

export const useCurrentDoctorEntityId = (clinicId?: string) => {
  const { session } = useAuth() as { session?: { user?: { id?: string; email?: string } } };
  const authenticatedUserId = session?.user?.id || '';
  const authenticatedEmail = session?.user?.email?.toLowerCase() || '';
  const clinicDoctors = useQueryData(
    ["clinicDoctors", clinicId],
    async () => {
      if (!clinicId) return [];
      const result = await clinicApiClient.get(API_ENDPOINTS.DOCTORS.GET_CLINIC_DOCTORS(clinicId));
      return normalizeDoctorRows(result);
    },
    { enabled: !!clinicId }
  );

  const doctorId = useMemo(() => {
    const doctors: any[] = Array.isArray(clinicDoctors.data) ? (clinicDoctors.data as any[]) : [];
    const matchedDoctor = doctors.find((doctor: any) => {
      const doctorUserId = doctor.userId || doctor.user?.id || doctor.doctor?.userId || doctor.doctor?.user?.id || '';
      const doctorEmail = doctor.user?.email?.toLowerCase() || doctor.doctor?.user?.email?.toLowerCase() || '';
      return doctorUserId === authenticatedUserId || (authenticatedEmail && doctorEmail === authenticatedEmail);
    });

    return matchedDoctor?.id || matchedDoctor?.doctor?.id || '';
  }, [authenticatedEmail, authenticatedUserId, clinicDoctors.data]);


  return {
    doctorId,
    doctorUserId: authenticatedUserId,
    isResolvingDoctorId: Boolean(clinicId) && clinicDoctors.isPending && !doctorId,
  };
};

