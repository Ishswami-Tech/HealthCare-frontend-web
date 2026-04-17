"use client";

import { useEffect } from 'react';
import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSchedule,
  updateDoctorSchedule,
  updateDoctorAvailability,
  getDoctorAppointments,
  getDoctorPatients,
  getDoctorStats,
  getDoctorReviews,
  addDoctorReview,
  getDoctorSpecializations,
  searchDoctors,
  getDoctorPerformanceMetrics,
  updateDoctorProfile,
  getDoctorEarnings,
  exportDoctorData
} from '@/lib/actions/doctors.server';
import { getDoctorAvailability } from '@/lib/actions/appointments.server';
import { usePatientStore } from '@/stores';
import { useCurrentClinicId } from './useClinics';

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
  return useQueryData(['doctors', clinicId, filters], async () => {
    return await getDoctors(clinicId, filters);
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
  });
};

/**
 * Hook to get doctor by ID
 */
export const useDoctor = (doctorId: string) => {
  return useQueryData(['doctor', doctorId], async () => {
    return await getDoctorById(doctorId);
  }, {
    enabled: !!doctorId,
  });
};

/**
 * Hook to get doctor schedule
 */
export const useDoctorSchedule = (clinicId: string, doctorId: string, date?: string) => {
  return useQueryData(['doctorSchedule', clinicId, doctorId, date], async () => {
    return await getDoctorSchedule(clinicId, doctorId, date);
  }, {
    enabled: !!clinicId && !!doctorId,
  });
};

/**
 * Hook to get doctor availability
 */
export const useDoctorAvailabilityLegacy = (doctorId: string, date: string, locationId?: string) => {
  const clinicId = useCurrentClinicId();

  return useQueryData(['doctorAvailability', doctorId, date, locationId || 'all'], async () => {
    if (!clinicId) {
      throw new Error('No clinic ID available');
    }
    const res = await getDoctorAvailability(clinicId, doctorId, date, locationId);
    return res.availability;
  }, {
    enabled: !!clinicId && !!doctorId && !!date,
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
  return useQueryData(['doctorAppointments', doctorId, filters], async () => {
    return await getDoctorAppointments(doctorId, filters);
  }, {
    enabled: !!doctorId,
  });
};

/**
 * Hook to get patients for the active authenticated doctor in a clinic
 */
export const useDoctorPatients = (clinicId: string, filters?: {
  search?: string;
  gender?: string;
  limit?: number;
}, options?: {
  enabled?: boolean;
}) => {
  const setCollection = usePatientStore((state) => state.setCollection);

  const query = useQueryData(['doctorPatients', clinicId, filters], async () => {
    return await getDoctorPatients(clinicId, filters);
  }, {
    enabled: !!clinicId && (options?.enabled ?? true),
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
  return useQueryData(['doctorStats', doctorId, period], async () => {
    return await getDoctorStats(doctorId, period);
  }, {
    enabled: !!doctorId,
  });
};

/**
 * Hook to get doctor reviews
 */
export const useDoctorReviews = (doctorId: string, limit: number = 10) => {
  return useQueryData(['doctorReviews', doctorId, limit], async () => {
    return await getDoctorReviews(doctorId, limit);
  }, {
    enabled: !!doctorId,
  });
};

/**
 * Hook to get doctor specializations
 */
export const useDoctorSpecializations = () => {
  return useQueryData(['doctorSpecializations'], async () => {
    return await getDoctorSpecializations();
  });
};

/**
 * Hook to get doctor performance metrics
 */
export const useDoctorPerformanceMetrics = (doctorId: string, filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQueryData(['doctorPerformanceMetrics', doctorId, filters], async () => {
    return await getDoctorPerformanceMetrics(doctorId, filters);
  }, {
    enabled: !!doctorId,
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
  return useQueryData(['doctorEarnings', doctorId, filters], async () => {
    return await getDoctorEarnings(doctorId, filters);
  }, {
    enabled: !!doctorId,
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
      return await createDoctor(doctorData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.CREATE,
      loadingMessage: 'Creating doctor...',
      successMessage: 'Doctor created successfully',
      invalidateQueries: [['doctors']],
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
      return await updateDoctor(doctorId, updates);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor...',
      successMessage: 'Doctor updated successfully',
      invalidateQueries: [['doctors']],
    }
  );
};

/**
 * Hook to delete doctor
 */
export const useDeleteDoctor = () => {
  return useMutationOperation(
    async (doctorId: string) => {
      return await deleteDoctor(doctorId);
    },
    {
      toastId: TOAST_IDS.DOCTOR.DELETE,
      loadingMessage: 'Deleting doctor...',
      successMessage: 'Doctor deleted successfully',
      invalidateQueries: [['doctors']],
    }
  );
};

/**
 * Hook to update doctor schedule
 */
export const useUpdateDoctorSchedule = () => {
  return useMutationOperation(
    async ({ doctorId, schedule }: {
      doctorId: string;
      schedule: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }[];
    }) => {
      return await updateDoctorSchedule(doctorId, schedule);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor schedule...',
      successMessage: 'Doctor schedule updated successfully',
      invalidateQueries: [['doctorSchedule']],
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
      return await updateDoctorAvailability(doctorId, availabilityData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor availability...',
      successMessage: 'Doctor availability updated successfully',
      invalidateQueries: [['doctorAvailability']],
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
      return await addDoctorReview(doctorId, reviewData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Adding doctor review...',
      successMessage: 'Doctor review added successfully',
      invalidateQueries: [['doctorReviews']],
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
      return await searchDoctors(query, filters);
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
      return await updateDoctorProfile(doctorId, profileData);
    },
    {
      toastId: TOAST_IDS.DOCTOR.UPDATE,
      loadingMessage: 'Updating doctor profile...',
      successMessage: 'Doctor profile updated successfully',
      invalidateQueries: [['doctor']],
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
      return await exportDoctorData(filters);
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting doctor data...',
      successMessage: 'Doctor data exported successfully',
    }
  );
};
