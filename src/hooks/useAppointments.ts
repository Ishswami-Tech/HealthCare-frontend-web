import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import { 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  ProcessCheckInData,
  ReorderQueueData,
  VerifyAppointmentQRData,
  CompleteAppointmentData,
  StartConsultationData,
  AppointmentFilters,
  AppointmentWithRelations,
  DoctorAvailability,
  QueuePosition,
  AppointmentQueue,
  QRCodeResponse,
  AppointmentConfirmation,
  AppointmentLocation,
  AppointmentStats
} from '@/types/appointment.types';
import { useAuth } from './useAuth';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';

/**
 * Helper to get auth headers
 */
function getAuthHeaders(token?: string, sessionId?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['Session-ID'] = sessionId;
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

// ===== APPOINTMENT CRUD HOOKS =====

/**
 * Hook to create a new appointment
 */
export const useCreateAppointment = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, CreateAppointmentData>(
    ['createAppointment'],
    async (data) => {
      return apiCall<AppointmentWithRelations>('/appointments', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

/**
 * Hook to get all appointments
 */
export const useAppointments = (filters?: AppointmentFilters) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentWithRelations[]>(
    ['appointments', filters],
    async () => {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall<AppointmentWithRelations[]>(endpoint, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    }
  );
};

/**
 * Hook to get appointment by ID
 */
export const useAppointment = (id: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentWithRelations>(
    ['appointment', id],
    async () => {
      const response = await apiCall<AppointmentWithRelations>(`/appointments/${id}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!id,
    }
  );
};

/**
 * Hook to update an appointment
 */
export const useUpdateAppointment = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, { id: string; data: UpdateAppointmentData }>(
    ['updateAppointment'],
    async ({ id, data }) => {
      return apiCall<AppointmentWithRelations>(`/appointments/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

/**
 * Hook to cancel an appointment
 */
export const useCancelAppointment = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, string>(
    ['cancelAppointment'],
    async (id) => {
      return apiCall<AppointmentWithRelations>(`/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
    },
    'appointments'
  );
};

// ===== DOCTOR AVAILABILITY HOOKS =====

/**
 * Hook to get doctor availability
 */
export const useDoctorAvailability = (doctorId: string, date: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<DoctorAvailability>(
    ['doctorAvailability', doctorId, date],
    async () => {
      const response = await apiCall<DoctorAvailability>(`/appointments/doctor/${doctorId}/availability?date=${date}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!doctorId && !!date,
    }
  );
};

/**
 * Hook to get user's upcoming appointments
 */
export const useUserUpcomingAppointments = (userId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentWithRelations[]>(
    ['userUpcomingAppointments', userId],
    async () => {
      const response = await apiCall<AppointmentWithRelations[]>(`/appointments/user/${userId}/upcoming`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!userId,
    }
  );
};

// ===== LOCATION HOOKS =====

/**
 * Hook to get all locations
 */
export const useLocations = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentLocation[]>(
    ['locations'],
    async () => {
      const response = await apiCall<AppointmentLocation[]>('/api/appointments/locations', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    }
  );
};

/**
 * Hook to get location by ID
 */
export const useLocation = (locationId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentLocation>(
    ['location', locationId],
    async () => {
      const response = await apiCall<AppointmentLocation>(`/api/appointments/locations/${locationId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!locationId,
    }
  );
};

/**
 * Hook to get doctors by location
 */
export const useDoctorsByLocation = (locationId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<any[]>(
    ['doctorsByLocation', locationId],
    async () => {
      const response = await apiCall<any[]>(`/api/appointments/locations/${locationId}/doctors`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!locationId,
    }
  );
};

// ===== CHECK-IN HOOKS =====

/**
 * Hook to process check-in
 */
export const useProcessCheckIn = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, ProcessCheckInData>(
    ['processCheckIn'],
    async (data) => {
      return apiCall<AppointmentWithRelations>('/api/check-in/process', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

/**
 * Hook to get patient queue position
 */
export const usePatientQueuePosition = (appointmentId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<QueuePosition>(
    ['patientQueuePosition', appointmentId],
    async () => {
      const response = await apiCall<QueuePosition>(`/api/check-in/patient-position/${appointmentId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!appointmentId,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
};

/**
 * Hook to reorder queue
 */
export const useReorderQueue = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations[], ReorderQueueData>(
    ['reorderQueue'],
    async (data) => {
      return apiCall<AppointmentWithRelations[]>('/api/check-in/reorder-queue', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

// ===== QUEUE HOOKS =====

/**
 * Hook to get doctor queue
 * Note: Backend has an issue - uses @Body in GET request, but we'll work around it
 */
export const useDoctorQueue = (doctorId: string, date: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentQueue>(
    ['doctorQueue', doctorId, date],
    async () => {
      // Backend incorrectly uses @Body in GET request, so we need to send date in body
      const response = await apiCall<AppointmentQueue>(`/api/appointments/queue/doctor/${doctorId}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        // Note: This is a workaround for backend issue - GET with body
        body: JSON.stringify({ date }),
      });
      return response.data;
    },
    {
      enabled: !!doctorId && !!date,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
};

/**
 * Hook to get location queue
 */
export const useLocationQueue = (locationId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<any>(
    ['locationQueue', locationId],
    async () => {
      const response = await apiCall<any>(`/api/check-in/location-queue`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!locationId,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
};

/**
 * Hook to get doctor active queue
 */
export const useDoctorActiveQueue = (doctorId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<any>(
    ['doctorActiveQueue', doctorId],
    async () => {
      const response = await apiCall<any>(`/api/check-in/doctor-queue/${doctorId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!doctorId,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
};

/**
 * Hook to get queue position
 */
export const useQueuePosition = (appointmentId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<QueuePosition>(
    ['queuePosition', appointmentId],
    async () => {
      const response = await apiCall<QueuePosition>(`/api/appointments/queue/position/${appointmentId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!appointmentId,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
};

/**
 * Hook to confirm appointment
 */
export const useConfirmAppointment = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, string>(
    ['confirmAppointment'],
    async (appointmentId) => {
      return apiCall<AppointmentWithRelations>(`/api/appointments/queue/confirm/${appointmentId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
    },
    'appointments'
  );
};

/**
 * Hook to start consultation
 */
export const useStartConsultation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, { appointmentId: string; data: StartConsultationData }>(
    ['startConsultation'],
    async ({ appointmentId, data }) => {
      return apiCall<AppointmentWithRelations>(`/api/appointments/queue/start/${appointmentId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

// ===== CONFIRMATION HOOKS =====

/**
 * Hook to generate confirmation QR code
 */
export const useGenerateConfirmationQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<QRCodeResponse, string>(
    ['generateConfirmationQR'],
    async (appointmentId) => {
      return apiCall<QRCodeResponse>(`/api/appointments/confirmation/${appointmentId}/qr`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
    }
  );
};

/**
 * Hook to verify appointment QR code
 */
export const useVerifyAppointmentQR = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentConfirmation, VerifyAppointmentQRData>(
    ['verifyAppointmentQR'],
    async (data) => {
      return apiCall<AppointmentConfirmation>('/api/appointments/confirmation/verify', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    }
  );
};

/**
 * Hook to mark appointment as completed
 */
export const useMarkAppointmentCompleted = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<AppointmentWithRelations, { appointmentId: string; data: CompleteAppointmentData }>(
    ['markAppointmentCompleted'],
    async ({ appointmentId, data }) => {
      return apiCall<AppointmentWithRelations>(`/api/appointments/confirmation/${appointmentId}/complete`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'appointments'
  );
};

// ===== UTILITY HOOKS =====

/**
 * Hook to get appointment statistics
 */
export const useAppointmentStats = (filters?: AppointmentFilters) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<AppointmentStats>(
    ['appointmentStats', filters],
    async () => {
      const appointments = await useAppointments(filters).data || [];
      
      return {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
        confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
        inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
        checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
      };
    },
    {
      enabled: !!token,
    }
  );
};

/**
 * Hook to check if appointment can be cancelled
 */
export const useCanCancelAppointment = (appointment: AppointmentWithRelations | null) => {
  return {
    canCancel: appointment ? ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) : false,
    canReschedule: appointment ? ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) : false,
    canCheckIn: appointment ? appointment.status === 'SCHEDULED' : false,
    canStart: appointment ? appointment.status === 'CONFIRMED' : false,
    canComplete: appointment ? appointment.status === 'IN_PROGRESS' : false,
  };
};

/**
 * Hook to format appointment date and time
 */
export const useFormatAppointmentDateTime = () => {
  return {
    formatDateTime: (date: string, time: string) => {
      const appointmentDate = new Date(`${date}T${time}`);
      return appointmentDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    formatDate: (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    formatTime: (time: string) => {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  };
};

/**
 * Hook to get appointment status color for UI
 */
export const useAppointmentStatusColor = () => {
  return {
    getStatusColor: (status: string) => {
      const statusColors: Record<string, string> = {
        SCHEDULED: 'bg-blue-100 text-blue-800',
        CONFIRMED: 'bg-green-100 text-green-800',
        CHECKED_IN: 'bg-yellow-100 text-yellow-800',
        IN_PROGRESS: 'bg-purple-100 text-purple-800',
        COMPLETED: 'bg-gray-100 text-gray-800',
        CANCELLED: 'bg-red-100 text-red-800',
        NO_SHOW: 'bg-orange-100 text-orange-800',
      };
      
      return statusColors[status] || 'bg-gray-100 text-gray-800';
    },
  };
}; 