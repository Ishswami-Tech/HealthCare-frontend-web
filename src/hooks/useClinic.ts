import { useAuth } from './useAuth';
import { useQueryData } from './useQueryData';
import { getClinicById, getMyClinic } from '@/lib/actions/clinic.server';

/**
 * Hook to get current user's clinic ID
 */
export const useCurrentClinicId = () => {
  const { session } = useAuth();
  
  // Try to get clinic ID from user session
  const clinicId = session?.user?.clinicId || session?.user?.clinic?.id;
  
  return clinicId;
};

/**
 * Hook to get current user's clinic details
 */
export const useCurrentClinic = () => {
  const { session } = useAuth();
  const clinicId = useCurrentClinicId();
  
  return useQueryData(['currentClinic', clinicId], async () => {
    if (clinicId) {
      return await getClinicById(clinicId);
    } else {
      // Fallback to get clinic from user context
      return await getMyClinic();
    }
  }, {
    enabled: !!session?.user,
  });
};

/**
 * Hook to check if user has clinic access
 */
export const useHasClinicAccess = () => {
  const clinicId = useCurrentClinicId();
  const { session } = useAuth();
  
  return {
    hasAccess: !!clinicId && !!session?.user,
    clinicId,
    isLoading: !session,
  };
};

/**
 * Higher-order hook that provides clinic-aware data fetching
 */
export const useClinicAwareQuery = <T>(
  queryKey: string[],
  queryFn: (clinicId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const clinicId = useCurrentClinicId();
  
  return useQueryData(
    ['clinic', clinicId, ...queryKey],
    async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      return await queryFn(clinicId);
    },
    {
      enabled: !!clinicId && (options?.enabled !== false),
      refetchInterval: options?.refetchInterval,
    }
  );
};

/**
 * Wrapper hooks for clinic-aware data fetching
 */

// Patients
export const useClinicPatients = (filters?: any) => {
  const clinicId = useCurrentClinicId();
  const { usePatients } = require('./usePatients');
  return usePatients(clinicId, filters);
};

// Doctors
export const useClinicDoctors = (filters?: any) => {
  const clinicId = useCurrentClinicId();
  const { useDoctors } = require('./useDoctors');
  return useDoctors(clinicId, filters);
};

// Medicines
export const useClinicMedicines = (filters?: any) => {
  const clinicId = useCurrentClinicId();
  const { useMedicines } = require('./usePharmacy');
  return useMedicines(clinicId, filters);
};

// Appointments
export const useClinicAppointments = (filters?: any) => {
  const clinicId = useCurrentClinicId();
  const { useAppointments } = require('./useAppointments');
  return useAppointments(clinicId, filters);
};

/**
 * Hook to provide clinic context to components
 */
export const useClinicContext = () => {
  const clinicId = useCurrentClinicId();
  const { data: clinic, isPending: isLoading } = useCurrentClinic();
  const { hasAccess } = useHasClinicAccess();
  
  return {
    clinicId,
    clinic,
    isLoading,
    hasAccess,
    // Helper functions
    withClinicId: <T extends any[]>(fn: (clinicId: string, ...args: T) => any) => 
      (...args: T) => {
        if (!clinicId) {
          throw new Error('No clinic context available');
        }
        return fn(clinicId, ...args);
      },
  };
};
