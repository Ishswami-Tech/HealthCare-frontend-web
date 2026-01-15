import { useQueryData } from '../core/useQueryData';
import { useMutationData } from '../core/useMutationData';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorAvailability,
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
}) => {
  return useQueryData(['doctors', clinicId, filters], async () => {
    return await getDoctors(clinicId, filters);
  }, {
    enabled: !!clinicId,
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
export const useDoctorSchedule = (doctorId: string, date?: string) => {
  return useQueryData(['doctorSchedule', doctorId, date], async () => {
    return await getDoctorSchedule(doctorId, date || '');
  }, {
    enabled: !!doctorId,
  });
};

/**
 * Hook to get doctor availability
 */
export const useDoctorAvailability = (doctorId: string, date: string) => {
  return useQueryData(['doctorAvailability', doctorId, date], async () => {
    return await getDoctorAvailability(doctorId, date);
  }, {
    enabled: !!doctorId && !!date,
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
 * Hook to get doctor patients
 */
export const useDoctorPatients = (doctorId: string, filters?: {
  search?: string;
  limit?: number;
}) => {
  return useQueryData(['doctorPatients', doctorId, filters], async () => {
    return await getDoctorPatients(doctorId, JSON.stringify(filters || {}));
  }, {
    enabled: !!doctorId,
  });
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
  return useMutationData(['createDoctor'], async (doctorData: {
    userId: string;
    specialization?: string;
    licenseNumber?: string;
    experience?: number;
    qualifications?: string[];
    consultationFee?: number;
    clinicId?: string;
    schedule?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }[];
  }) => {
    const result = await createDoctor(doctorData);
    return { status: 200, data: result };
  }, 'doctors');
};

/**
 * Hook to update doctor
 */
export const useUpdateDoctor = () => {
  return useMutationData(['updateDoctor'], async ({ doctorId, updates }: {
    doctorId: string;
    updates: {
      specialization?: string;
      licenseNumber?: string;
      experience?: number;
      qualifications?: string[];
      consultationFee?: number;
      isActive?: boolean;
      clinicId?: string;
    };
  }) => {
    const result = await updateDoctor(doctorId, updates);
    return { status: 200, data: result };
  }, 'doctors');
};

/**
 * Hook to delete doctor
 */
export const useDeleteDoctor = () => {
  return useMutationData(['deleteDoctor'], async (doctorId: string) => {
    const result = await deleteDoctor(doctorId);
    return { status: 200, data: result };
  }, 'doctors');
};

/**
 * Hook to update doctor schedule
 */
export const useUpdateDoctorSchedule = () => {
  return useMutationData(['updateDoctorSchedule'], async ({ doctorId, schedule }: {
    doctorId: string;
    schedule: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }[];
  }) => {
    const result = await updateDoctorSchedule(doctorId, schedule);
    return { status: 200, data: result };
  }, 'doctorSchedule');
};

/**
 * Hook to update doctor availability
 */
export const useUpdateDoctorAvailability = () => {
  return useMutationData(['updateDoctorAvailability'], async ({ doctorId, availabilityData }: {
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
    const result = await updateDoctorAvailability(doctorId, availabilityData);
    return { status: 200, data: result };
  }, 'doctorAvailability');
};

/**
 * Hook to add doctor review
 */
export const useAddDoctorReview = () => {
  return useMutationData(['addDoctorReview'], async ({ doctorId, reviewData }: {
    doctorId: string;
    reviewData: {
      patientId: string;
      rating: number;
      comment?: string;
      appointmentId?: string;
    };
  }) => {
    const result = await addDoctorReview(doctorId, reviewData);
    return { status: 200, data: result };
  }, 'doctorReviews');
};

/**
 * Hook to search doctors
 */
export const useSearchDoctors = () => {
  return useMutationData(['searchDoctors'], async ({ query, filters }: {
    query: string;
    filters?: {
      specialization?: string;
      clinicId?: string;
      location?: string;
      availability?: string;
      limit?: number;
    };
  }) => {
    const result = await searchDoctors(query, filters);
    return { status: 200, data: result };
  });
};

/**
 * Hook to update doctor profile
 */
export const useUpdateDoctorProfile = () => {
  return useMutationData(['updateDoctorProfile'], async ({ doctorId, profileData }: {
    doctorId: string;
    profileData: {
      bio?: string;
      education?: string[];
      certifications?: string[];
      languages?: string[];
      profilePicture?: string;
    };
  }) => {
    const result = await updateDoctorProfile(doctorId, profileData);
    return { status: 200, data: result };
  }, 'doctor');
};

/**
 * Hook to export doctor data
 */
export const useExportDoctorData = () => {
  return useMutationData(['exportDoctorData'], async (filters: {
    format: 'csv' | 'excel' | 'pdf';
    doctorIds?: string[];
    includeStats?: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
    const result = await exportDoctorData(filters);
    return { status: 200, data: result };
  });
};
