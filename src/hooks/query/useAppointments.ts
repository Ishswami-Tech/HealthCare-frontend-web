// ✅ Appointments Hooks - Backend Integration
// This file provides hooks that integrate with the backend appointments system

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useCurrentClinicId } from './useClinics';
import { useRBAC } from '../utils/useRBAC';
import { useToast, TOAST_IDS } from '../utils/use-toast';
import { Permission } from '@/types/rbac.types';
import { logger } from '@/lib/utils/logger';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { useOptimisticMutation } from '../core/useOptimisticMutation';
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
  getQueueStats,
  getDoctorAvailability,
  getUserUpcomingAppointments,
  getMyAppointments,
  testAppointmentContext
} from '@/lib/actions/enhanced-appointments.server';
import type { 
  CreateAppointmentData, 
  UpdateAppointmentData,
  AppointmentFilters,
  Appointment
} from '@/types/appointment.types';

// ✅ Appointment Management Hooks

/**
 * Hook for fetching appointments with filters (Optimized for 100K users)
 */
export const useAppointments = (clinicIdOrFilters?: string | AppointmentFilters) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  // Memoize query key for performance
  const queryKey = useMemo(
    () => ['appointments', clinicId, clinicIdOrFilters], 
    [clinicId, clinicIdOrFilters]
  );
  
  // Memoize query function
  const queryFn = useCallback(async () => {
    if (!clinicId) {
      throw new Error('No clinic ID available');
    }
    
    // ✅ Consolidated: Use filters parameter only (removed legacy clinicId parameter)
    const filters: AppointmentFilters = typeof clinicIdOrFilters === 'string' 
      ? { clinicId: clinicIdOrFilters }
      : { ...clinicIdOrFilters, clinicId };
    const result = await getAppointments(filters);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }, [clinicId, clinicIdOrFilters]);
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
    staleTime: 5 * 60 * 1000, // 5 minutes for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 2; // Reduce retry attempts
    },
  });
};

// ✅ Removed duplicate useAppointmentsOriginal - useAppointments above handles all cases

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
 * Hook for creating a new appointment with React 19 useOptimistic
 * Provides optimistic UI updates for better UX
 */
export const useCreateAppointment = (clinicId?: string) => {
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  // Memoize mutation function
  const mutationFn = useCallback(async (data: CreateAppointmentData) => {
    if (!hasPermission(Permission.CREATE_APPOINTMENTS)) {
      throw new Error('Insufficient permissions to create appointment');
    }
    
    const result = await createAppointment(data);
    if (!result.success || !result.appointment) {
      throw new Error(result.error || 'Failed to create appointment');
    }
    return result.appointment;
  }, [hasPermission]);
  
  // Use optimistic mutation hook
  const { optimisticData, addOptimistic, mutation, isPending } = useOptimisticMutation({
    queryKey: ['appointments', clinicId],
    mutationFn,
    optimisticUpdate: (current, variables) => {
      // Create optimistic appointment
      const optimisticAppointment = {
        ...variables,
        id: `temp-${Date.now()}`,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId: true,
      } as Appointment & { tempId: boolean };
      return [...current, optimisticAppointment];
    },
    mutationOptions: {
      onSuccess: (appointment: Appointment) => {
        if (appointment) {
          toast({
            title: 'Success',
            description: `Appointment scheduled for ${appointment.date} at ${appointment.time}`,
            id: TOAST_IDS.APPOINTMENT.CREATE, // ✅ Prevent duplicates
          });
        }
      },
      onError: (error: Error) => {
        logger.error('Failed to create appointment', error, { component: 'useAppointments' });
        // ✅ Use centralized error handler
        toast({
          title: 'Error',
          description: sanitizeErrorMessage(error) || 'Failed to create appointment',
          variant: 'destructive',
          id: TOAST_IDS.APPOINTMENT.CREATE, // ✅ Prevent duplicates
        });
      },
      mutationKey: ['createAppointment'],
    },
  });
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    optimisticData,
    addOptimistic,
    isPending,
    data: mutation.data,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    isIdle: mutation.isIdle,
    reset: mutation.reset,
    status: mutation.status,
    variables: mutation.variables,
  };
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
        logger.error('Failed to update appointment', error, { component: 'useAppointments' });
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
        logger.error('Failed to cancel appointment', error, { component: 'useAppointments' });
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
        logger.error('Failed to confirm appointment', error, { component: 'useAppointments' });
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
        logger.error('Failed to check in appointment', error, { component: 'useAppointments' });
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
        logger.error('Failed to start appointment', error, { component: 'useAppointments' });
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
 * Hook for fetching queue (Optimized for 100K users with smart polling)
 */
export const useQueue = (queueType: string) => {
  const { hasPermission } = useRBAC();
  
  // Memoize query key
  const queryKey = useMemo(() => ['queue', queueType], [queueType]);
  
  // Memoize query function
  const queryFn = useCallback(async () => {
    const result = await getQueue(queueType);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.queue;
  }, [queueType]);
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!queueType && hasPermission(Permission.VIEW_QUEUE),
    staleTime: 15 * 1000, // 15 seconds for real-time feel
    gcTime: 2 * 60 * 1000, // 2 minutes GC for queue data
    refetchInterval: (query) => {
      // Smart polling: faster when queue is active, slower when empty
      const data = query.state.data as any[] | undefined;
      const queueLength = data?.length || 0;
      if (queueLength === 0) return 2 * 60 * 1000; // 2 minutes when empty
      if (queueLength > 10) return 30 * 1000; // 30 seconds when busy
      return 45 * 1000; // 45 seconds default
    },
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 2;
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
    onSuccess: (_, { queueType }) => {
      // Invalidate queue
      queryClient.invalidateQueries({ queryKey: ['queue', queueType] });
      
      toast({
        title: 'Success',
        description: 'Patient added to queue successfully',
      });
    },
    onError: (error: Error) => {
        logger.error('Failed to add to queue', error, { component: 'useAppointments' });
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
        logger.error('Failed to call next patient', error, { component: 'useAppointments' });
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

// ✅ Additional Hooks for New Functionality

/**
 * Hook for fetching my appointments
 */
export const useMyAppointments = (filters?: {
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['myAppointments', filters],
    queryFn: async () => {
      const result = await getMyAppointments(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: hasPermission(Permission.VIEW_APPOINTMENTS),
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
 * Hook for fetching doctor availability
 */
export const useDoctorAvailability = (doctorId: string, date: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['doctorAvailability', doctorId, date],
    queryFn: async () => {
      const result = await getDoctorAvailability(doctorId, date);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.availability;
    },
    enabled: !!doctorId && !!date && hasPermission(Permission.VIEW_APPOINTMENTS),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching user upcoming appointments
 */
export const useUserUpcomingAppointments = (userId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['userUpcomingAppointments', userId],
    queryFn: async () => {
      const result = await getUserUpcomingAppointments(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointments;
    },
    enabled: !!userId && hasPermission(Permission.VIEW_APPOINTMENTS),
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
 * Hook for testing appointment context (debugging)
 */
export const useTestAppointmentContext = () => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['testAppointmentContext'],
    queryFn: async () => {
      const result = await testAppointmentContext();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.context;
    },
    enabled: hasPermission(Permission.VIEW_APPOINTMENTS) && process.env.NODE_ENV === 'development',
    staleTime: 0, // Always fresh for debugging
    retry: false,
  });
};

/**
 * Enhanced hook for appointments with better error handling (Optimized for 100K users)
 */
export const useAppointmentsWithErrorHandling = (filters?: AppointmentFilters) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  // Memoize query configuration
  const queryConfig = useMemo(() => {
    const queryKey = ['appointments-enhanced', clinicId, filters];
    
    const queryFn = async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      
      // ✅ Consolidated: Use filters parameter only (removed legacy clinicId parameter)
    const result = await getAppointments({ ...filters, clinicId });
      if (!result.success) {
        // ✅ Use centralized error handler
        const { ERROR_MESSAGES: MSGS } = await import('@/lib/config/config');
        
        // Handle specific error cases with better UX
        if (result.error?.includes('Access denied') || result.error?.includes('permission')) {
          throw new Error(MSGS.FORBIDDEN);
        }
        if (result.error?.includes('Network')) {
          throw new Error(MSGS.NETWORK_ERROR);
        }
        if (result.error?.includes('timeout')) {
          throw new Error(MSGS.TIMEOUT_ERROR);
        }
        
        // Sanitize and use centralized error messages
        const { sanitizeErrorMessage } = await import('@/lib/utils/error-handler');
        const errorMessage = sanitizeErrorMessage(result.error || MSGS.UNKNOWN_ERROR);
        throw new Error(errorMessage);
      }
      return result;
    };
    
    return {
      queryKey,
      queryFn,
      enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 3 * 60 * 1000, // 3 minutes for better caching
      gcTime: 5 * 60 * 1000, // 5 minutes GC time
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount: number, error: Error) => {
        // Don't retry on permission errors
        if (error.message.includes('permission') || error.message.includes('Access denied')) {
          return false;
        }
        // Retry network errors with exponential backoff
        if (error.message.includes('Network') || error.message.includes('timeout')) {
          return failureCount < 3;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    };
  }, [clinicId, filters, hasPermission]);
  
  return useQuery(queryConfig);
};

/**
 * Hook for bulk appointment operations (Optimized for 100K users)
 */
export const useBulkAppointmentOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  // Memoize bulk update function for better performance
  const bulkUpdateFn = useCallback(async (data: { 
    appointmentIds: string[]; 
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' 
  }) => {
    if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
      throw new Error('Insufficient permissions for bulk operations');
    }
    
    // Process in batches of 10 for better server handling
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < data.appointmentIds.length; i += BATCH_SIZE) {
      const batch = data.appointmentIds.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }
    
    let successful = 0;
    let failed = 0;
    
    // Process batches sequentially to avoid overwhelming the server
    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(id => updateAppointment(id, { status: data.status }))
      );
      
      successful += results.filter(r => r.status === 'fulfilled').length;
      failed += results.filter(r => r.status === 'rejected').length;
      
      // Small delay between batches to prevent server overload
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { successful, failed, total: data.appointmentIds.length };
  }, [hasPermission]);
  
  // Optimized success handler
  const onSuccess = useCallback((result: { successful: number; failed: number; total: number }) => {
    // More targeted cache invalidation
    queryClient.invalidateQueries({ 
      queryKey: ['appointments'],
      refetchType: 'inactive'
    });
    
    if (result.failed > 0) {
      toast({
        title: 'Partial Success',
        description: `Updated ${result.successful} appointments. ${result.failed} failed.`,
        variant: 'default',
        id: TOAST_IDS.APPOINTMENT.BULK_UPDATE, // ✅ Prevent duplicates
      });
    } else {
      toast({
        title: 'Success',
        description: `Successfully updated ${result.successful} appointments.`,
        id: TOAST_IDS.APPOINTMENT.BULK_UPDATE, // ✅ Prevent duplicates
      });
    }
  }, [queryClient, toast]);
  
  // Memoized error handler
  const onError = useCallback((error: Error) => {
    logger.error('Bulk operation failed', error, { component: 'useAppointments' });
    // ✅ Use centralized error handler
    toast({
      title: 'Error',
      description: sanitizeErrorMessage(error) || 'Bulk operation failed',
      variant: 'destructive',
      id: TOAST_IDS.APPOINTMENT.BULK_UPDATE, // ✅ Prevent duplicates
    });
  }, [toast]);
  
  const bulkUpdateStatus = useMutation({
    mutationFn: bulkUpdateFn,
    onSuccess,
    onError,
    mutationKey: ['bulkUpdateAppointments'],
  });
  
  return useMemo(() => ({
    bulkUpdateStatus,
    isLoading: bulkUpdateStatus.isPending,
  }), [bulkUpdateStatus]);
};

// ✅ Missing hooks that components are trying to import

/**
 * Hook for appointment statistics
 */
export const useAppointmentStats = () => {
  const { hasPermission } = useRBAC();
  const clinicId = useCurrentClinicId();
  
  return useQuery({
    queryKey: ['appointmentStats', clinicId],
    queryFn: async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      // ✅ Consolidated: Use filters parameter only (removed legacy clinicId parameter)
      const result = await getAppointments({ clinicId });
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const appointments = result.appointments || [];
      const today = new Date().toDateString();
      
      return {
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(apt => 
          new Date(apt.date).toDateString() === today
        ).length,
        completedAppointments: appointments.filter(apt => 
          apt.status === 'COMPLETED'
        ).length,
        cancelledAppointments: appointments.filter(apt => 
          apt.status === 'CANCELLED'
        ).length,
      };
    },
    enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for processing check-in
 */
export const useProcessCheckIn = () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      
      toast({
        title: 'Success',
        description: 'Patient checked in successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for patient queue position
 */
export const usePatientQueuePosition = (patientId: string, queueType: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['patientQueuePosition', patientId, queueType],
    queryFn: async () => {
      const result = await getQueue(queueType);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const queue = result.queue || [];
      const position = queue.findIndex(entry => entry.patientId === patientId);
      
      return {
        position: position >= 0 ? position + 1 : null,
        estimatedWaitTime: position >= 0 ? queue[position]?.estimatedWaitTime : null,
        totalInQueue: queue.length,
      };
    },
    enabled: !!patientId && !!queueType && hasPermission(Permission.VIEW_QUEUE),
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for doctor queue
 */
export const useDoctorQueue = (doctorId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['doctorQueue', doctorId],
    queryFn: async () => {
      const result = await getQueue('doctor');
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const queue = result.queue || [];
      return queue.filter(entry => {
        // Assuming queue entries have doctor information
        return entry.appointmentId; // Filter logic can be enhanced
      });
    },
    enabled: !!doctorId && hasPermission(Permission.VIEW_QUEUE),
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for starting consultation
 */
export const useStartConsultation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to start consultation');
      }
      
      const result = await startAppointment(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Success',
        description: 'Consultation started successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start consultation',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to check if appointment can be cancelled
 */
export const useCanCancelAppointment = (appointmentId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['canCancelAppointment', appointmentId],
    queryFn: async () => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        return { canCancel: false, reason: 'Insufficient permissions' };
      }
      
      const result = await getAppointmentById(appointmentId);
      if (!result.success || !result.appointment) {
        return { canCancel: false, reason: 'Appointment not found' };
      }
      
      const appointment = result.appointment;
      const now = new Date();
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      const hoursDifference = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Can cancel if appointment is more than 2 hours away and not already completed/cancelled
      const canCancel = hoursDifference > 2 && 
                       !['COMPLETED', 'CANCELLED'].includes(appointment.status);
      
      return {
        canCancel,
        reason: canCancel ? null : 
                hoursDifference <= 2 ? 'Cannot cancel within 2 hours of appointment' :
                'Appointment is already completed or cancelled'
      };
    },
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};