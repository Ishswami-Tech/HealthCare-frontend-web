// ✅ Appointments Hooks - Backend Integration
// This file provides hooks that integrate with the backend appointments system

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentClinicId } from './useClinic';
import { useRBAC } from './useRBAC';
import { useToast } from './use-toast';
import { Permission } from '@/types/rbac.types';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  checkInAppointment,
  startAppointment,
  completeAppointment,
  getQueue,
  addToQueue,
  callNextPatient,
  getQueueStats
} from '@/lib/actions/appointments.server';
import type { 
  AppointmentWithRelations, 
  CreateAppointmentData, 
  UpdateAppointmentData,
  AppointmentFilters
} from '@/types/appointment.types';

// ✅ Queue Types (if not available in appointment.types)
export interface QueueEntry {
  id: string;
  patientId: string;
  appointmentId?: string;
  queueType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: string;
  position: number;
  estimatedWaitTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  totalInQueue: number;
  averageWaitTime: number;
  estimatedWaitTime: number;
  queueType: string;
  lastUpdated: string;
}

// ✅ Appointment Management Hooks

/**
 * Hook for fetching appointments with filters
 */
export const useAppointments = (filters?: AppointmentFilters) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['appointments', clinicId, filters],
    queryFn: async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      
      const result = await getAppointments(clinicId, filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a specific appointment by ID
 */
export const useAppointment = (appointmentId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const result = await getAppointmentById(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    enabled: !!appointmentId && hasPermission(Permission.VIEW_APPOINTMENTS),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied') || error.message.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a new appointment
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!hasPermission(Permission.CREATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to create appointment');
      }
      
      const result = await createAppointment(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Add the new appointment to the cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        toast({
          title: 'Success',
          description: `Appointment scheduled for ${appointment.date} at ${appointment.time}`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating an appointment
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentData }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to update appointment');
      }
      
      const result = await updateAppointment(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Appointment updated successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to update appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for cancelling an appointment
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to cancel appointment');
      }
      
      const result = await cancelAppointment(id, reason);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Appointment cancelled successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for confirming an appointment
 */
export const useConfirmAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to confirm appointment');
      }
      
      const result = await confirmAppointment(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Appointment confirmed successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to confirm appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for checking in an appointment
 */
export const useCheckInAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to check in appointment');
      }
      
      const result = await checkInAppointment(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Patient checked in successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to check in appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for starting an appointment
 */
export const useStartAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to start appointment');
      }
      
      const result = await startAppointment(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Appointment started successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to start appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start appointment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for completing an appointment
 */
export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: {
        diagnosis?: string;
        prescription?: string;
        notes?: string;
        followUpDate?: string;
        followUpNotes?: string;
      }
    }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to complete appointment');
      }
      
      const result = await completeAppointment(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: (appointment) => {
      // Update appointment in cache
      if (appointment) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
        
        // Invalidate appointments list
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        
        toast({
          title: 'Success',
          description: 'Appointment completed successfully',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to complete appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete appointment',
        variant: 'destructive',
      });
    },
  });
};

// ✅ Queue Management Hooks

/**
 * Hook for fetching queue
 */
export const useQueue = (queueType: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['queue', queueType],
    queryFn: async () => {
      const result = await getQueue(queueType);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.queue;
    },
    enabled: !!queueType && hasPermission(Permission.VIEW_QUEUE),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for adding patient to queue
 */
export const useAddToQueue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (data: {
      patientId: string;
      appointmentId?: string;
      queueType: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    }) => {
      if (!hasPermission(Permission.MANAGE_QUEUE)) {
        throw new Error('Insufficient permissions to add to queue');
      }
      
      const result = await addToQueue(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.queueEntry;
    },
    onSuccess: (queueEntry, { queueType }) => {
      // Invalidate queue
      queryClient.invalidateQueries({ queryKey: ['queue', queueType] });
      
      toast({
        title: 'Success',
        description: 'Patient added to queue successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to add to queue:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to queue',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for calling next patient from queue
 */
export const useCallNextPatient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (queueType: string) => {
      if (!hasPermission(Permission.MANAGE_QUEUE)) {
        throw new Error('Insufficient permissions to call next patient');
      }
      
      const result = await callNextPatient(queueType);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.patient;
    },
    onSuccess: (patient, queueType) => {
      // Invalidate queue
      queryClient.invalidateQueries({ queryKey: ['queue', queueType] });
      
      toast({
        title: 'Next Patient',
        description: `Calling ${patient.name || 'next patient'}`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to call next patient:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to call next patient',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for fetching queue statistics
 */
export const useQueueStats = () => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const result = await getQueueStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.stats;
    },
    enabled: hasPermission(Permission.VIEW_QUEUE),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// ✅ Utility Hooks

/**
 * Hook for appointment-aware queries
 */
export const useAppointmentAwareQuery = <T>(
  queryKey: string[],
  queryFn: (appointmentId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: [...queryKey],
    queryFn: () => queryFn(queryKey[queryKey.length - 1] as string),
    enabled: hasPermission(Permission.VIEW_APPOINTMENTS) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval || false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for checking appointment permissions
 */
export const useAppointmentPermissions = () => {
  const { hasPermission } = useRBAC();
  
  return {
    canRead: hasPermission(Permission.VIEW_APPOINTMENTS),
    canCreate: hasPermission(Permission.CREATE_APPOINTMENTS),
    canUpdate: hasPermission(Permission.UPDATE_APPOINTMENTS),
    canDelete: hasPermission(Permission.DELETE_APPOINTMENTS),
    canManageQueue: hasPermission(Permission.VIEW_QUEUE) && hasPermission(Permission.MANAGE_QUEUE),
  };
};

/**
 * Hook for appointment context
 */
export const useAppointmentContext = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    clinicId,
    hasPermission,
    isAuthenticated: !!clinicId,
    canManageAppointments: hasPermission(Permission.VIEW_APPOINTMENTS) && hasPermission(Permission.UPDATE_APPOINTMENTS),
    canManageQueue: hasPermission(Permission.VIEW_QUEUE) && hasPermission(Permission.MANAGE_QUEUE),
  };
};