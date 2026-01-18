import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import { useAuth } from '../auth/useAuth';
import { useRBAC } from '../utils/useRBAC';
import { Permission } from '@/types/rbac.types';
import { APP_CONFIG } from '@/lib/config/config';
import { 
  CreateClinicData,
  UpdateClinicData,
  CreateClinicLocationData,
  UpdateClinicLocationData,
  AssignClinicAdminData,
  RegisterPatientData,
  ClinicWithRelations,
  ClinicLocation,
  ClinicUser,
  ClinicStats,
  ClinicSettings
} from '@/types/clinic.types';
import {
  createClinic,
  getAllClinics,
  getClinicById,
  getHealthStatus,
  getHealthReady,
  getHealthLive
} from '@/lib/actions/clinic.server';
import type { ClinicCommunicationConfig } from '@/lib/actions/clinic-communication.server';
import {
  getClinicCommunicationConfig,
  createClinicCommunicationConfig,
  updateClinicCommunicationConfig,
  deleteClinicCommunicationConfig,
  testClinicCommunication,
} from '@/lib/actions/clinic-communication.server';

// API URL configuration - use centralized config
const API_URL = APP_CONFIG.API.BASE_URL;

// ✅ Get clinic ID from centralized config (not directly from env)
// This ensures proper fallback and type safety
const CLINIC_ID = APP_CONFIG.CLINIC.ID;

/**
 * Helper to get auth headers
 */
function getAuthHeaders(token?: string, sessionId?: string, clinicId?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['X-Session-ID'] = sessionId;
  if (clinicId) headers['X-Clinic-ID'] = clinicId;
  headers['Content-Type'] = 'application/json';
  return headers;
}

/**
 * Base API call function for client-side
 */
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const url = `${API_URL}${endpoint}`;
  
  // ✅ PERFORMANCE: Use fetch with AbortController
  const { fetchWithAbort } = await import('@/lib/utils/fetch-with-abort');
  const response = await fetchWithAbort(url, {
    timeout: 10000,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // ✅ Use centralized error handler
    const { handleApiError } = await import('@/lib/utils/error-handler');
    const errorMessage = await handleApiError(response, errorData);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return { status: response.status, data };
}

// ===== CLINIC CRUD HOOKS =====

/**
 * Hook to create a new clinic
 */
export const useCreateClinic = () => {
  return useMutationOperation<ClinicWithRelations, CreateClinicData>(
    async (data: CreateClinicData) => {
      const result = await createClinic(data);
      if (!result.success || !result.clinic) {
        throw new Error(result.error || 'Failed to create clinic');
      }
      return result.clinic as ClinicWithRelations;
    },
    {
      toastId: TOAST_IDS.CLINIC.CREATE,
      loadingMessage: 'Creating clinic...',
      successMessage: 'Clinic created successfully',
      invalidateQueries: [['clinics']],
    }
  );
};

/**
 * Hook to get all clinics
 */
export const useClinics = () => {
  return useQueryData(['clinics'], async () => {
    return await getAllClinics();
  });
};



/**
 * Hook to get clinic by ID
 */
export const useClinic = (clinicId?: string) => {
  const { session, isPending } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  const id = clinicId || CLINIC_ID;
  
  return useQueryData<ClinicWithRelations>(
    ['clinic', id],
    async () => {
      const headers = getAuthHeaders(token, sessionId, id);
      // ✅ PERFORMANCE: Use fetch with AbortController
      const { fetchWithAbort } = await import('@/lib/utils/fetch-with-abort');
      const response = await fetchWithAbort(`${API_URL}/clinics/${id}`, {
        headers,
        timeout: 10000,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // ✅ Use centralized error handler
        const { handleApiError } = await import('@/lib/utils/error-handler');
        const errorMessage = await handleApiError(response, error);
        throw new Error(errorMessage);
      }
      return response.json();
    },
    {
      enabled: !!token && !!sessionId && !!id && !isPending,
    }
  );
};

/**
 * Hook to get clinic by app name
 */
export const useClinicByAppName = (appName: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicWithRelations>(
    ['clinicByAppName', appName],
    async () => {
      const response = await apiCall<ClinicWithRelations>(`/clinics/app/${appName}`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!appName,
    }
  );
};

/**
 * Hook to get current user's clinic
 * Uses the new /my-clinic endpoint
 */
export const useMyClinic = () => {
  const { session, isPending } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicWithRelations>(
    ['myClinic'],
    async () => {
      const response = await apiCall<ClinicWithRelations>('/clinics/my-clinic', {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!token && !!sessionId && !isPending,
    }
  );
};

/**
 * Hook to update clinic
 */
export const useUpdateClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<ClinicWithRelations, { id: string; data: UpdateClinicData }>(
    async ({ id, data }) => {
      const response = await apiCall<ClinicWithRelations>(`/clinics/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
      return response.data;
    },
    {
      toastId: TOAST_IDS.CLINIC.UPDATE,
      loadingMessage: 'Updating clinic...',
      successMessage: 'Clinic updated successfully',
      invalidateQueries: [['clinics'], ['clinic']],
    }
  );
};

/**
 * Hook to delete clinic
 */
export const useDeleteClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ message: string }, string>(
    async (id) => {
      const response = await apiCall<{ message: string }>(`/clinics/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      toastId: TOAST_IDS.CLINIC.DELETE,
      loadingMessage: 'Deleting clinic...',
      successMessage: 'Clinic deleted successfully',
      invalidateQueries: [['clinics']],
    }
  );
};

// ===== CLINIC LOCATION HOOKS =====

/**
 * Hook to create a new clinic location
 */
export const useCreateClinicLocation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicLocation }, { clinicId: string; data: CreateClinicLocationData }>(
    async ({ clinicId, data }) => {
      return apiCall<ClinicLocation>(`/clinics/${clinicId}/locations`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    {
      toastId: TOAST_IDS.LOCATION.CREATE,
      loadingMessage: 'Creating clinic location...',
      successMessage: 'Clinic location created successfully',
      invalidateQueries: [['clinicLocations']],
    }
  );
};

/**
 * Hook to get all locations for a clinic
 */
export const useClinicLocations = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicLocation[]>(
    ['clinicLocations', clinicId],
    async () => {
      const response = await apiCall<ClinicLocation[]>(`/clinics/${clinicId}/locations`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to get clinic location by ID
 */
export const useClinicLocation = (clinicId: string, locationId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicLocation>(
    ['clinicLocation', clinicId, locationId],
    async () => {
      const response = await apiCall<ClinicLocation>(`/clinics/${clinicId}/locations/${locationId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId && !!locationId,
    }
  );
};

/**
 * Hook to update clinic location
 */
export const useUpdateClinicLocation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicLocation }, { clinicId: string; locationId: string; data: UpdateClinicLocationData }>(
    async ({ clinicId, locationId, data }) => {
      return apiCall<ClinicLocation>(`/clinics/${clinicId}/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    {
      toastId: TOAST_IDS.LOCATION.UPDATE,
      loadingMessage: 'Updating clinic location...',
      successMessage: 'Clinic location updated successfully',
      invalidateQueries: [['clinicLocations']],
    }
  );
};

/**
 * Hook to delete clinic location
 */
export const useDeleteClinicLocation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: { message: string } }, { clinicId: string; locationId: string }>(
    async ({ clinicId, locationId }) => {
      return apiCall<{ message: string }>(`/clinics/${clinicId}/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    {
      toastId: TOAST_IDS.LOCATION.DELETE,
      loadingMessage: 'Deleting clinic location...',
      successMessage: 'Clinic location deleted successfully',
      invalidateQueries: [['clinicLocations']],
    }
  );
};

/**
 * Hook to generate QR code for clinic location
 */
export const useGenerateLocationQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: { qrCode: string } }, { clinicId: string; locationId: string }>(
    async ({ clinicId, locationId }) => {
      return apiCall<{ qrCode: string }>(`/clinics/${clinicId}/locations/${locationId}/qr`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    {
      toastId: TOAST_IDS.LOCATION.UPDATE,
      loadingMessage: 'Generating QR code...',
      successMessage: 'QR code generated successfully',
      invalidateQueries: [['clinicLocations']],
    }
  );
};

/**
 * Hook to verify location QR code
 */
export const useVerifyLocationQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicLocation }, { qrData: string }>(
    async ({ qrData }) => {
      return apiCall<ClinicLocation>('/clinics/locations/verify-qr', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify({ qrData }),
      });
    },
    {
      toastId: TOAST_IDS.LOCATION.UPDATE,
      loadingMessage: 'Verifying QR code...',
      successMessage: 'QR code verified successfully',
      invalidateQueries: [['clinicLocations']],
      showToast: false,
    }
  );
};

// ===== CLINIC USER MANAGEMENT HOOKS =====

/**
 * Hook to assign clinic admin
 */
export const useAssignClinicAdmin = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicUser }, AssignClinicAdminData>(
    async (data) => {
      return apiCall<ClinicUser>('/clinics/assign-admin', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Assigning clinic admin...',
      successMessage: 'Clinic admin assigned successfully',
      invalidateQueries: [['clinicUsers']],
    }
  );
};

/**
 * Hook to get clinic doctors
 */
export const useClinicDoctors = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicUser[]>(
    ['clinicDoctors', clinicId],
    async () => {
      const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/doctors`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to get clinic patients
 */
export const useClinicPatients = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicUser[]>(
    ['clinicPatients', clinicId],
    async () => {
      const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/patients`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to register patient to clinic
 */
export const useRegisterPatientToClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicUser }, RegisterPatientData>(
    async (data) => {
      return apiCall<ClinicUser>('/clinics/register-patient', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    {
      toastId: TOAST_IDS.PATIENT.CREATE,
      loadingMessage: 'Registering patient to clinic...',
      successMessage: 'Patient registered to clinic successfully',
      invalidateQueries: [['clinicPatients']],
    }
  );
};

/**
 * Hook to get clinic users by role
 */
export const useClinicUsersByRole = (clinicId: string, role: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicUser[]>(
    ['clinicUsersByRole', clinicId, role],
    async () => {
      const response = await apiCall<ClinicUser[]>(`/clinics/${clinicId}/users?role=${role}`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId && !!role,
    }
  );
};

// ===== CLINIC UTILITY HOOKS =====

/**
 * Hook to validate app name
 */
export const useValidateAppName = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: { available: boolean; message?: string } }, string>(
    async (appName) => {
      return apiCall<{ available: boolean; message?: string }>(`/clinics/validate-app-name?appName=${appName}`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    {
      toastId: TOAST_IDS.CLINIC.UPDATE,
      loadingMessage: 'Validating app name...',
      successMessage: 'App name validated',
      showToast: false,
    }
  );
};

/**
 * Hook to associate user with clinic
 */
export const useAssociateUserWithClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: { message: string } }, string>(
    async (clinicId) => {
      return apiCall<{ message: string }>(`/clinics/${clinicId}/associate`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    {
      toastId: TOAST_IDS.CLINIC.UPDATE,
      loadingMessage: 'Associating user with clinic...',
      successMessage: 'User associated with clinic successfully',
      invalidateQueries: [['clinics']],
    }
  );
};

/**
 * Hook to get clinic stats
 */
export const useClinicStats = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicStats>(
    ['clinicStats', clinicId],
    async () => {
      const response = await apiCall<ClinicStats>(`/clinics/${clinicId}/stats`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to get clinic settings
 */
export const useClinicSettings = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicSettings>(
    ['clinicSettings', clinicId],
    async () => {
      const response = await apiCall<ClinicSettings>(`/clinics/${clinicId}/settings`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to update clinic settings
 */
export const useUpdateClinicSettings = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: ClinicSettings }, { clinicId: string; settings: Partial<ClinicSettings> }>(
    async ({ clinicId, settings }) => {
      return apiCall<ClinicSettings>(`/clinics/${clinicId}/settings`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(settings),
      });
    },
    {
      toastId: TOAST_IDS.CLINIC.UPDATE,
      loadingMessage: 'Updating clinic settings...',
      successMessage: 'Clinic settings updated successfully',
      invalidateQueries: [['clinicSettings']],
    }
  );
};

/**
 * Hook to get active locations
 */
export const useActiveLocations = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicLocation[]>(
    ['activeLocations', clinicId],
    async () => {
      const response = await apiCall<ClinicLocation[]>(`/clinics/${clinicId}/locations/active`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

/**
 * Hook to generate clinic token
 */
export const useGenerateClinicToken = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationOperation<{ status: number; data: { token: string } }, string>(
    async (clinicId: string) => {
      return apiCall<{ token: string }>(`/clinics/${clinicId}/token`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    {
      toastId: TOAST_IDS.CLINIC.UPDATE,
      loadingMessage: 'Generating clinic token...',
      successMessage: 'Clinic token generated successfully',
    }
  );
};

/**
 * Hook to check clinic permission
 */
export const useHasClinicPermission = (clinicId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<boolean>(
    ['hasClinicPermission', clinicId],
    async () => {
      const response = await apiCall<boolean>(`/clinics/${clinicId}/permission`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    },
    {
      enabled: !!clinicId,
    }
  );
};

// ===== UTILITY FUNCTIONS =====

/**
 * Hook to format clinic address
 */
export const useFormatClinicAddress = () => {
  return (clinic: ClinicWithRelations): string => {
    if (!clinic) return '';
    
    const parts = [];
    if (clinic.address) parts.push(clinic.address);
    if (clinic.city) parts.push(clinic.city);
    if (clinic.state) parts.push(clinic.state);
    if (clinic.zipCode) parts.push(clinic.zipCode);
    if (clinic.country) parts.push(clinic.country);
    
    return parts.join(', ');
  };
};

/**
 * Hook to get clinic status color
 */
export const useClinicStatusColor = () => {
  return (isActive: boolean): string => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };
};

/**
 * Hook to get clinic type display name
 */
export const useClinicTypeDisplayName = () => {
  return (type: string): string => {
    const typeMap: Record<string, string> = {
      'general': 'General Practice',
      'specialist': 'Specialist Clinic',
      'hospital': 'Hospital',
      'urgent_care': 'Urgent Care',
      'dental': 'Dental Clinic',
      'mental_health': 'Mental Health Clinic',
      'pediatric': 'Pediatric Clinic',
      'women_health': 'Women\'s Health Clinic',
      'cardiology': 'Cardiology Clinic',
      'orthopedic': 'Orthopedic Clinic',
      'dermatology': 'Dermatology Clinic',
      'ophthalmology': 'Ophthalmology Clinic',
      'neurology': 'Neurology Clinic',
      'oncology': 'Oncology Clinic',
      'rehabilitation': 'Rehabilitation Center',
      'diagnostic': 'Diagnostic Center',
      'laboratory': 'Laboratory',
      'imaging': 'Imaging Center',
      'pharmacy': 'Pharmacy',
      'other': 'Other',
    };
    
    return typeMap[type.toLowerCase()] || type;
  };
};

// ============================================================================
// ✅ CLINIC CONTEXT & UTILITY HOOKS (from useClinic.ts)
// ============================================================================

// ✅ Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// ✅ Current Clinic ID Hook (separate to avoid circular imports)
export const useCurrentClinicId = () => {
  const { session } = useAuth();
  
  // Try to get clinic ID from user session
  const clinicId = (session?.user as { clinicId?: string; clinic?: { id: string } })?.clinicId || 
                  (session?.user as { clinicId?: string; clinic?: { id: string } })?.clinic?.id;
  
  return clinicId;
};

// ✅ Current Clinic Hook
export const useCurrentClinic = () => {
  const clinicId = useCurrentClinicId();
  
  return useQueryData(
    ['current-clinic', clinicId],
    async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      
      const result = await getClinicById(clinicId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

// ✅ Health Check Hooks
export const useHealthStatus = () => {
  return useQueryData(
    ['health-status'],
    async () => {
      const result = await getHealthStatus();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
      retry: (failureCount) => {
        return failureCount < 3;
      },
    }
  );
};

export const useHealthReady = () => {
  return useQueryData(
    ['health-ready'],
    async () => {
      const result = await getHealthReady();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
      retry: (failureCount) => {
        return failureCount < 3;
      },
    }
  );
};

export const useHealthLive = () => {
  return useQueryData(
    ['health-live'],
    async () => {
      const result = await getHealthLive();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
      retry: (failureCount) => {
        return failureCount < 3;
      },
    }
  );
};

// ✅ Utility Hooks
export const useClinicAwareQuery = <T>(
  queryKey: string[],
  queryFn: (clinicId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    [...queryKey, clinicId],
    () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      return queryFn(clinicId);
    },
    {
      enabled: !!clinicId && hasPermission(Permission.VIEW_CLINICS) && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount) => {
        return failureCount < 3;
      },
    }
  );
};

export const useHasClinicAccess = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    hasAccess: !!clinicId && hasPermission(Permission.VIEW_CLINICS),
    clinicId,
    isLoading: false, // This could be enhanced with actual loading state
  };
};

export const useClinicContext = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    clinicId,
    hasPermission,
    isAuthenticated: !!clinicId,
    canRead: hasPermission(Permission.VIEW_CLINICS),
    canCreate: hasPermission(Permission.CREATE_CLINICS),
    canUpdate: hasPermission(Permission.UPDATE_CLINICS),
    canDelete: hasPermission(Permission.DELETE_CLINICS),
  };
};

// ============================================================================
// ✅ CLINIC COMMUNICATION HOOKS (from useClinicCommunication.ts)
// ============================================================================

export const useClinicCommunicationConfig = (clinicId: string) => {
  return useQueryData(
    ['clinicCommunication', clinicId],
    async () => {
      return await getClinicCommunicationConfig(clinicId);
    },
    { enabled: !!clinicId }
  );
};

export const useCreateClinicCommunicationConfig = () => {
  return useMutationOperation<ClinicCommunicationConfig, { clinicId: string; config: ClinicCommunicationConfig }>(
    async (data: { clinicId: string; config: ClinicCommunicationConfig }) => {
      const result = await createClinicCommunicationConfig(data.clinicId, data.config);
      return result as ClinicCommunicationConfig;
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.TEMPLATE_CREATE,
      loadingMessage: 'Creating clinic communication config...',
      successMessage: 'Clinic communication config created successfully',
      invalidateQueries: [['clinicCommunication']],
    }
  );
};

export const useUpdateClinicCommunicationConfig = () => {
  return useMutationOperation<ClinicCommunicationConfig, {
    clinicId: string;
    id: string;
    config: Partial<ClinicCommunicationConfig>;
  }>(
    async (data: {
      clinicId: string;
      id: string;
      config: Partial<ClinicCommunicationConfig>;
    }) => {
      const result = await updateClinicCommunicationConfig(data.clinicId, data.id, data.config);
      return result as ClinicCommunicationConfig;
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.TEMPLATE_UPDATE,
      loadingMessage: 'Updating clinic communication config...',
      successMessage: 'Clinic communication config updated successfully',
      invalidateQueries: [['clinicCommunication']],
    }
  );
};

export const useDeleteClinicCommunicationConfig = () => {
  return useMutationOperation<{ message?: string }, { clinicId: string; id: string }>(
    async (data: { clinicId: string; id: string }) => {
      const result = await deleteClinicCommunicationConfig(data.clinicId, data.id);
      return (result as { message?: string }) || { message: 'Deleted successfully' };
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.TEMPLATE_DELETE,
      loadingMessage: 'Deleting clinic communication config...',
      successMessage: 'Clinic communication config deleted successfully',
      invalidateQueries: [['clinicCommunication']],
    }
  );
};

export const useTestClinicCommunication = () => {
  return useMutationOperation<{ success: boolean; message?: string }, {
    clinicId: string;
    type: 'email' | 'sms' | 'whatsapp';
    to: string;
    message?: string;
  }>(
    async (data: {
      clinicId: string;
      type: 'email' | 'sms' | 'whatsapp';
      to: string;
      message?: string;
    }) => {
      const testData: { type: 'email' | 'sms' | 'whatsapp'; to: string; message?: string } = {
        type: data.type,
        to: data.to,
      };
      if (data.message) {
        testData.message = data.message;
      }
      const result = await testClinicCommunication(data.clinicId, testData);
      return result as { success: boolean; message?: string };
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.TEST,
      loadingMessage: 'Testing clinic communication...',
      successMessage: 'Communication test completed successfully',
    }
  );
};