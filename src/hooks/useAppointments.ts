import { useQueryData } from './useQueryData';
import {
  AppointmentFilters,
  AppointmentWithRelations,
} from '@/types/appointment.types';
import { getAppointments, getUserUpcomingAppointments, getMyAppointments } from '@/lib/actions/appointments.server';
import { useAuth } from './useAuth';

export const useAppointments = (filters?: AppointmentFilters) => {
  return useQueryData<AppointmentWithRelations[]>(
    ['appointments', filters],
    async () => {
      return await getAppointments(filters);
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
      return await getAppointments(filters);
    }
  });
}; 