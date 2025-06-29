import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import { 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  AppointmentWithRelations,
  DoctorAvailability,
  ProcessCheckInData,
  QueuePosition,
  ReorderQueueData,
  AppointmentQueue,
  StartConsultationData,
} from '@/types/appointment.types';
import { useAuth } from './useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';

function getAuthHeaders(token?: string, sessionId?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['X-Session-ID'] = sessionId;
  return headers;
}

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

// ===== UTILITY HOOKS =====

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

// Check-in hooks
export const useProcessCheckIn = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useMutationData<AppointmentWithRelations, ProcessCheckInData>(
    ['processCheckIn'],
    async (data) => {
      return apiCall<AppointmentWithRelations>('/check-in/process', {
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

export const usePatientQueuePosition = (appointmentId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useQueryData<QueuePosition>(
    ['patientQueuePosition', appointmentId],
    async () => {
      const response = await apiCall<QueuePosition>(`/check-in/patient-position/${appointmentId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    { enabled: !!appointmentId }
  );
};

export const useReorderQueue = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useMutationData<AppointmentWithRelations[], ReorderQueueData>(
    ['reorderQueue'],
    async (data) => {
      return apiCall<AppointmentWithRelations[]>('/check-in/reorder-queue', {
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

// Queue hooks
export const useDoctorQueue = (doctorId: string, date: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useQueryData<AppointmentQueue>(
    ['doctorQueue', doctorId, date],
    async () => {
      const response = await apiCall<AppointmentQueue>(`/appointments/queue/doctor/${doctorId}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify({ date }),
      });
      return response.data;
    },
    { enabled: !!doctorId && !!date }
  );
};

export const useQueuePosition = (appointmentId: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useQueryData<QueuePosition>(
    ['queuePosition', appointmentId],
    async () => {
      const response = await apiCall<QueuePosition>(`/appointments/queue/position/${appointmentId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    { enabled: !!appointmentId }
  );
};

export const useConfirmAppointment = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useMutationData<AppointmentWithRelations, string>(
    ['confirmAppointment'],
    async (appointmentId) => {
      return apiCall<AppointmentWithRelations>(`/appointments/queue/confirm/${appointmentId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
    },
    'appointments'
  );
};

export const useStartConsultation = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  return useMutationData<AppointmentWithRelations, { appointmentId: string; data: StartConsultationData }>(
    ['startConsultation'],
    async ({ appointmentId, data }) => {
      return apiCall<AppointmentWithRelations>(`/appointments/queue/start/${appointmentId}`, {
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