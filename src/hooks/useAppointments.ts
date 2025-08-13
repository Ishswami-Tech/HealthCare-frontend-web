import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  AppointmentFilters,
  AppointmentWithRelations,
  DoctorAvailability,
} from '@/types/appointment.types';
import {
  getAppointments,
  getUserUpcomingAppointments,
  getMyAppointments,
  createAppointment,
  cancelAppointment,
  getDoctorAvailability,
  updateAppointment,
  getAppointmentById,
  getAppointmentStats
} from '@/lib/actions/appointments.server';
import { useAuth } from './useAuth';

export const useAppointments = (clinicId: string, filters?: AppointmentFilters) => {
  return useQueryData<AppointmentWithRelations[]>(
    ['appointments', clinicId, filters],
    async () => {
      return await getAppointments(clinicId, filters);
    },
    {
      enabled: !!clinicId,
    }
  );
};

export const useUserUpcomingAppointments = (userId: string) => {
  return useQueryData<AppointmentWithRelations[]>(
    ['userUpcomingAppointments', userId],
    async () => {
      return await getUserUpcomingAppointments(userId);
    },
    {
      enabled: !!userId,
    }
  );
};

export const useMyAppointments = (filters?: AppointmentFilters) => {
  const { session } = useAuth();
  const role = session?.user?.role;

  return useQueryData<AppointmentWithRelations[]>(['myAppointments', filters], async () => {
    if (role === 'PATIENT') {
      return await getMyAppointments();
    } else {
      return await getAppointments(session?.user?.clinicId || '', filters);
    }
  });
};

// ===== APPOINTMENT CRUD HOOKS =====

export const useCreateAppointment = () => {
  return useMutationData(['createAppointment'], async (data) => {
    return await createAppointment(data);
  }, 'appointments');
};

export const useAppointment = (id: string) => {
  return useQueryData<AppointmentWithRelations>(
    ['appointment', id],
    async () => {
      return await getAppointmentById(id);
    },
    {
      enabled: !!id,
    }
  );
};

export const useUpdateAppointment = () => {
  return useMutationData(['updateAppointment'], async ({ id, data }) => {
    return await updateAppointment(id, data);
  }, 'appointments');
};

export const useCancelAppointment = () => {
  return useMutationData(['cancelAppointment'], async (id) => {
    return await cancelAppointment(id);
  }, 'appointments');
};

// ===== DOCTOR AVAILABILITY HOOKS =====

export const useDoctorAvailability = (doctorId?: string, date?: string) => {
  return useQueryData<DoctorAvailability>(
    ['doctorAvailability', doctorId, date],
    async () => {
      return await getDoctorAvailability(doctorId!, date!);
    },
    {
      enabled: !!doctorId && !!date,
    }
  );
};

// ===== UTILITY HOOKS =====

export const useCanCancelAppointment = (appointment?: AppointmentWithRelations) => {
  if (!appointment) return false;

  const appointmentDate = new Date(appointment.appointmentDate);
  const now = new Date();
  const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Can cancel if appointment is more than 2 hours away and not completed
  return hoursDiff > 2 && appointment.status !== 'COMPLETED';
};

export const useFormatAppointmentDateTime = (appointment?: AppointmentWithRelations) => {
  if (!appointment) return '';

  const date = new Date(appointment.appointmentDate);
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const useAppointmentStatusColor = (status?: string) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
    case 'CONFIRMED': return 'bg-green-100 text-green-800';
    case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-800';
    case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
    case 'COMPLETED': return 'bg-gray-100 text-gray-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ===== PLACEHOLDER HOOKS (TODO: Implement when server actions are ready) =====

export const useProcessCheckIn = () => {
  return useMutationData(['processCheckIn'], async (data) => {
    // TODO: Implement processCheckIn server action
    console.log('TODO: Implement processCheckIn', data);
    return data;
  }, 'appointments');
};

export const usePatientQueuePosition = (appointmentId?: string) => {
  return useQueryData(
    ['patientQueuePosition', appointmentId],
    async () => {
      // TODO: Implement getPatientQueuePosition server action
      console.log('TODO: Implement getPatientQueuePosition', appointmentId);
      return { position: 1, estimatedWaitTime: 15 };
    },
    {
      enabled: !!appointmentId,
    }
  );
};

export const useDoctorQueue = (doctorId?: string) => {
  return useQueryData(
    ['doctorQueue', doctorId],
    async () => {
      // TODO: Implement getDoctorQueue server action
      console.log('TODO: Implement getDoctorQueue', doctorId);
      return [];
    },
    {
      enabled: !!doctorId,
    }
  );
};

export const useConfirmAppointment = () => {
  return useMutationData(['confirmAppointment'], async (id) => {
    // TODO: Implement confirmAppointment server action
    console.log('TODO: Implement confirmAppointment', id);
    return { id, status: 'CONFIRMED' };
  }, 'appointments');
};

export const useStartConsultation = () => {
  return useMutationData(['startConsultation'], async (id) => {
    // TODO: Implement startConsultation server action
    console.log('TODO: Implement startConsultation', id);
    return { id, status: 'IN_PROGRESS' };
  }, 'appointments');
};

/**
 * Hook to get appointment statistics
 */
export const useAppointmentStats = (filters?: {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  clinicId?: string;
}) => {
  return useQueryData(['appointmentStats', filters], async () => {
    return await getAppointmentStats(filters);
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};