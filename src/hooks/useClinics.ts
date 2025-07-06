import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import { useAuth } from './useAuth';
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

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';

// In all API calls, pass clinicId from env
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID!;

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
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { status: response.status, data };
}

// ===== CLINIC CRUD HOOKS =====

/**
 * Hook to create a new clinic
 */
export const useCreateClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<ClinicWithRelations, CreateClinicData>(
    ['createClinic'],
    async (data) => {
      return apiCall<ClinicWithRelations>('/clinics', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinics'
  );
};

/**
 * Hook to get all clinics
 */
export const useClinics = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<ClinicWithRelations[]>(
    ['clinics'],
    async () => {
      const response = await apiCall<ClinicWithRelations[]>('/clinics', {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
      return response.data;
    }
  );
};

/**
 * Hook to get clinic by ID
 */
export const useClinic = (clinicId?: string) => {
  const { session, isLoading } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  const id = clinicId || CLINIC_ID;
  
  return useQueryData<ClinicWithRelations>(
    ['clinic', id],
    async () => {
      const headers = getAuthHeaders(token, sessionId, id);
      console.log('Clinic fetch headers:', headers);
      const response = await fetch(`${API_URL}/clinics/${id}`, {
        headers,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    {
      enabled: !!token && !!sessionId && !!id && !isLoading,
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
  const { session, isLoading } = useAuth();
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
      enabled: !!token && !!sessionId && !isLoading,
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
  
  return useMutationData<ClinicWithRelations, { id: string; data: UpdateClinicData }>(
    ['updateClinic'],
    async ({ id, data }) => {
      return apiCall<ClinicWithRelations>(`/clinics/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinics'
  );
};

/**
 * Hook to delete clinic
 */
export const useDeleteClinic = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<{ message: string }, string>(
    ['deleteClinic'],
    async (id) => {
      return apiCall<{ message: string }>(`/clinics/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    'clinics'
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
  
  return useMutationData<ClinicLocation, { clinicId: string; data: CreateClinicLocationData }>(
    ['createClinicLocation'],
    async ({ clinicId, data }) => {
      return apiCall<ClinicLocation>(`/clinics/${clinicId}/locations`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinicLocations'
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
  
  return useMutationData<ClinicLocation, { clinicId: string; locationId: string; data: UpdateClinicLocationData }>(
    ['updateClinicLocation'],
    async ({ clinicId, locationId, data }) => {
      return apiCall<ClinicLocation>(`/clinics/${clinicId}/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinicLocations'
  );
};

/**
 * Hook to delete clinic location
 */
export const useDeleteClinicLocation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<{ message: string }, { clinicId: string; locationId: string }>(
    ['deleteClinicLocation'],
    async ({ clinicId, locationId }) => {
      return apiCall<{ message: string }>(`/clinics/${clinicId}/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    'clinicLocations'
  );
};

/**
 * Hook to generate QR code for clinic location
 */
export const useGenerateLocationQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<{ qrCode: string }, { clinicId: string; locationId: string }>(
    ['generateLocationQR'],
    async ({ clinicId, locationId }) => {
      return apiCall<{ qrCode: string }>(`/clinics/${clinicId}/locations/${locationId}/qr`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    'clinicLocations'
  );
};

/**
 * Hook to verify location QR code
 */
export const useVerifyLocationQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<ClinicLocation, { qrData: string }>(
    ['verifyLocationQR'],
    async ({ qrData }) => {
      return apiCall<ClinicLocation>('/clinics/locations/verify-qr', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify({ qrData }),
      });
    },
    'clinicLocations'
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
  
  return useMutationData<ClinicUser, AssignClinicAdminData>(
    ['assignClinicAdmin'],
    async (data) => {
      return apiCall<ClinicUser>('/clinics/assign-admin', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinicUsers'
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
  
  return useMutationData<ClinicUser, RegisterPatientData>(
    ['registerPatientToClinic'],
    async (data) => {
      return apiCall<ClinicUser>('/clinics/register-patient', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(data),
      });
    },
    'clinicUsers'
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
  
  return useMutationData<{ available: boolean; message?: string }, string>(
    ['validateAppName'],
    async (appName) => {
      return apiCall<{ available: boolean; message?: string }>(`/clinics/validate-app-name?appName=${appName}`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
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
  
  return useMutationData<{ message: string }, string>(
    ['associateUserWithClinic'],
    async (clinicId) => {
      return apiCall<{ message: string }>(`/clinics/${clinicId}/associate`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
    },
    'clinics'
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
  
  return useMutationData<ClinicSettings, { clinicId: string; settings: Partial<ClinicSettings> }>(
    ['updateClinicSettings'],
    async ({ clinicId, settings }) => {
      return apiCall<ClinicSettings>(`/clinics/${clinicId}/settings`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
        body: JSON.stringify(settings),
      });
    },
    'clinicSettings'
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
  
  return useMutationData<{ token: string }, string>(
    ['generateClinicToken'],
    async (clinicId) => {
      return apiCall<{ token: string }>(`/clinics/${clinicId}/token`, {
        headers: {
          ...getAuthHeaders(token, sessionId, CLINIC_ID),
        },
      });
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