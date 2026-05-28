// Video appointment hooks with WebSocket-backed mutations and query syncing.

import { useEffect } from 'react';
import { useQueryData, useMutationOperation, useQueryClient } from '@/hooks/core';
import { useCurrentClinicId } from './useClinics';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useRBAC } from '../utils/useRBAC';
import { useVideoAppointmentWebSocket } from '../realtime/useVideoAppointmentSocketIO';
import { useAuth } from '../auth/useAuth';
import { Permission } from '@/types/rbac.types';
import { Role } from '@/types/auth.types';
import {
  getVideoSessionDecision,
} from '@/lib/utils/appointmentUtils';
import { isApiError } from '@/lib/utils/error-handler';
import { normalizeVideoSessionAppointmentId } from '@/lib/utils/video-session-route';
import { TOAST_IDS } from '../utils/use-toast';
import {
  generateVideoToken,
  startVideoConsultation,
  endVideoConsultation,
  getConsultationStatus,
  getVideoConsultationHistory,
  listAllVideoSessions,
  terminateVideoSession,
  joinWaitingRoom,
  leaveWaitingRoom,
  getWaitingRoomQueue,
  admitFromWaitingRoom,
  sendChatMessage,
  getChatMessages,
  updateTypingIndicator,
  createMedicalNote,
  getMedicalNotes,
  deleteMedicalNote,
  createAnnotation,
  getAnnotations,
  deleteAnnotation,
  updateMedicalNote,
  updateVirtualBackground,
  getVirtualBackgroundPresets,
  getVirtualBackgroundSettings,
  manageParticipantEnhanced,
  getTranscription,
  getCallQuality,
  updateQualityMetrics,
  type WaitingRoomParticipant,
  type ChatMessage,
  type MedicalNote,
  type Annotation,
  type TranscriptionSegment,
  type CallQualityMetrics,
} from '@/lib/actions/video.server';
import type {
  VirtualBackgroundSettings,
  BackgroundPreset,
} from '@/types/video.types';
export type {
  WaitingRoomParticipant,
  ChatMessage,
  MedicalNote,
  Annotation,
  TranscriptionSegment,
  CallQualityMetrics,
} from '@/lib/actions/video.server';
import {
  rescheduleAppointment,
  rejectVideoProposal,
  updateAppointmentStatus,
} from '@/lib/actions/appointments.server';

export type VideoTokenRole = 'patient' | 'doctor' | 'receptionist' | 'clinic_admin';

function normalizeVideoRole(role?: string | null): string {
  return String(role || '').trim().toUpperCase().replace(/\s+/g, '_');
}

export function getVideoTokenRole(role?: string | null): VideoTokenRole {
  switch (normalizeVideoRole(role)) {
    case 'DOCTOR':
    case 'ASSISTANT_DOCTOR':
    case 'THERAPIST':
    case 'COUNSELOR':
      return 'doctor';
    case 'NURSE':
    case 'RECEPTIONIST':
      return 'receptionist';
    case 'CLINIC_ADMIN':
    case 'CLINIC_LOCATION_HEAD':
    case 'SUPER_ADMIN':
      return 'clinic_admin';
    case 'PATIENT':
    default:
      return 'patient';
  }
}


//… Video Appointment Types
export interface VideoAppointment {
  id: string;
  appointmentId: string;
  roomName: string;
  doctorId: string;
  patientId: string;
  treatmentType?: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'proposed';
  sessionId?: string;
  recordingUrl?: string;
  notes?: string;
  paymentCompleted?: boolean;
  paymentRequired?: boolean;
  canJoin?: boolean;
  joinBlockedReason?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  joinWindowStart?: string;
  joinWindowEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoAppointmentData {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  sessionId?: string;
  clinicId?: string;
  locationId?: string;
}

export interface UpdateVideoAppointmentData {
  appointmentId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  recordingUrl?: string;
  notes?: string;
}

export interface VideoAppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

//… Video Appointments Query Hook with WebSocket Integration
export function useVideoAppointments(filters?: VideoAppointmentFilters) {
  const { session } = useAuth();
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const { isConnected: socketConnected } = useWebSocketStatus();
  const {
    subscribeToVideoAppointments,
    subscribeToConsultationEvents,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    isConnected,
  } = useVideoAppointmentWebSocket();

  const clinicId = useCurrentClinicId();
  const isPatient = (session?.user?.role as string) === Role.PATIENT;
  // PATIENT can fetch video history without clinicId; staff need clinicId
  const canFetch = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS) && (!!clinicId || isPatient);

  const query = useQueryData(
    ['video-appointments', clinicId, filters],
    async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      // Staff roles require clinicId; PATIENT can fetch across clinics
      if (!isPatient && !clinicId) throw new Error('Clinic ID is required');

      // Build filters object without undefined values (for exactOptionalPropertyTypes)
      const historyFilters: {
        userId?: string;
        patientId?: string;
        clinicId?: string;
        appointmentId?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        page?: number;
        limit?: number;
      } = {};
      
      if (filters?.startDate) historyFilters.startDate = filters.startDate;
      if (filters?.endDate) historyFilters.endDate = filters.endDate;
      if (filters?.status) historyFilters.status = filters.status;
      if (filters?.page) historyFilters.page = filters.page;
      if (filters?.limit) historyFilters.limit = filters.limit;
      if (clinicId) historyFilters.clinicId = clinicId;
      // Video history endpoint accepts userId/clinicId-based access.
      // Do not send patientId here; backend validation rejects it for /video/history.
      if (filters?.doctorId) historyFilters.userId = filters.doctorId;
      if (isPatient && session?.user?.id) {
        historyFilters.userId = session.user.id;
      }

      const result = await getVideoConsultationHistory(historyFilters);
      const calls = (result as { calls?: unknown[] })?.calls;
      return {
        success: true,
        data: result,
        appointments: Array.isArray(calls) ? calls : [],
      };
    },
    {
      enabled: canFetch,
      staleTime: 2 * 60 * 1000, // 2 minutes (optimized for 10M users)
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: socketConnected ? false : 30_000, // Poll when websocket is unavailable
      refetchOnWindowFocus: false,
    }
  );

  //… Subscribe to real-time updates
  //š ï¸ OPTIMIZED: Only subscribe when connected (not dependent on query.data to avoid re-subscriptions)
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to video appointment updates
    const unsubscribeAppointments = subscribeToVideoAppointments(() => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
    });

    // Subscribe to participant events
    const unsubscribeParticipants = subscribeToParticipantEvents((data) => {
      // Update specific appointment if needed
      if (data.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', data.appointmentId] });
      }
    });

    // Subscribe to recording events
    const unsubscribeRecording = subscribeToRecordingEvents((data) => {
      // Update specific appointment if needed
      if (data.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', data.appointmentId] });
      }
    });

    const unsubscribeConsultation = subscribeToConsultationEvents((data) => {
      if (data.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', data.appointmentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingAppointments'], exact: false });
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeParticipants();
      unsubscribeRecording();
      unsubscribeConsultation();
    };
  }, [
    isConnected,
    queryClient,
    subscribeToVideoAppointments,
    subscribeToConsultationEvents,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
  ]);

  return query;
}

//… Video Appointment by ID Query Hook with WebSocket Integration
export function useVideoAppointment(id: string) {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const resolvedAppointmentId = normalizeVideoSessionAppointmentId(id);
  const {
    subscribeToVideoAppointments,
    subscribeToConsultationEvents,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
  } = useVideoAppointmentWebSocket();

  const query = useQueryData(
    ['video-appointment', resolvedAppointmentId],
    async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      try {
        const result = await getConsultationStatus(resolvedAppointmentId);
        return { success: true, data: result, appointment: result };
      } catch (error) {
        if (
          isApiError(error) &&
          (error.statusCode === 404 || error.code === 'DATABASE_RECORD_NOT_FOUND')
        ) {
          return { success: true, data: null, appointment: null };
        }

        throw error;
      }
    },
    {
      enabled: !!resolvedAppointmentId && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
      staleTime: 0,
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: false,
    }
  );

  //… Subscribe to real-time updates for this specific appointment
  useEffect(() => {
    if (!resolvedAppointmentId) return;

    // Subscribe to video appointment updates
    const unsubscribeAppointments = subscribeToVideoAppointments((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', resolvedAppointmentId] });
      }
    });

    // Subscribe to participant events
    const unsubscribeParticipants = subscribeToParticipantEvents((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', resolvedAppointmentId] });
      }
    });

    // Subscribe to recording events
    const unsubscribeRecording = subscribeToRecordingEvents((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', resolvedAppointmentId] });
      }
    });

    const unsubscribeConsultation = subscribeToConsultationEvents((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', resolvedAppointmentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingAppointments'], exact: false });
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeParticipants();
      unsubscribeRecording();
      unsubscribeConsultation();
    };
  }, [
    resolvedAppointmentId,
    queryClient,
    subscribeToVideoAppointments,
    subscribeToConsultationEvents,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
  ]);

  return query;
}

//… Create Video Appointment Mutation Hook with WebSocket Integration
export function useCreateVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();
  const clinicId = useCurrentClinicId();
  const { session } = useAuth();

  const currentUserRole = getVideoTokenRole(session?.user?.role);
  const userInfo = {
    displayName: session?.user?.name || 'Doctor',
    email: session?.user?.email || `${currentUserRole}@example.com`,
  };

  return useMutationOperation<{ success: boolean; data: any; token: any }, CreateVideoAppointmentData>(
    async (data: CreateVideoAppointmentData) => {
      const hasAccess = hasPermission(Permission.CREATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const resolvedClinicId = data.clinicId || clinicId;

      // Generate token first, then start consultation
      // Run both operations in parallel since they're independent
      const [tokenResult, consultationResult] = await Promise.all([
        generateVideoToken({
          appointmentId: data.appointmentId,
          userId: data.doctorId,
          userRole: currentUserRole,
          userInfo,
          ...(resolvedClinicId && { clinicId: resolvedClinicId }),
        }),
        startVideoConsultation({
          appointmentId: data.appointmentId,
          userId: data.doctorId,
          userRole: currentUserRole,
          ...(resolvedClinicId && { clinicId: resolvedClinicId }),
        }),
      ]);

      return { success: true, data: consultationResult, token: tokenResult };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Creating video appointment...',
      successMessage: 'Video appointment created successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
        ['queue'],
        ['queue-status'],
      ],
      onSuccess: (_, variables) => {
        // Send WebSocket event
        sendVideoAppointmentEvent('created', {
          appointmentId: variables.appointmentId,
          doctorId: variables.doctorId,
          patientId: variables.patientId,
        });
      },
    }
  );
}

//… Update Video Appointment Mutation Hook with WebSocket Integration
export function useUpdateVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();
  const { user } = useAuth();

  return useMutationOperation<{ success: boolean; data: any }, UpdateVideoAppointmentData>(
    async (data: UpdateVideoAppointmentData) => {
      const hasAccess = hasPermission(Permission.UPDATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      const resolvedUserId = user?.id;
      if (!resolvedUserId) {
        throw new Error('User not authenticated');
      }

      // Update consultation status by ending or starting it
      if (data.status === 'completed' || data.status === 'cancelled') {
        const result = await endVideoConsultation({
          appointmentId: data.appointmentId,
          userId: resolvedUserId,
          userRole: 'doctor',
          endReason: data.status === 'cancelled' ? 'Cancelled by user' : 'Completed',
        });
        return { success: true, data: result };
      }
      
      // For other status updates, we might need to start consultation
      const result = await startVideoConsultation({
        appointmentId: data.appointmentId,
        userId: resolvedUserId,
        userRole: 'doctor',
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Updating video appointment...',
      successMessage: 'Video appointment updated successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
      ],
      onSuccess: (_, variables) => {
        // Send WebSocket event
        sendVideoAppointmentEvent('updated', {
          appointmentId: variables.appointmentId,
          status: variables.status,
          updatedFields: Object.keys(variables),
        });
      },
    }
  );
}

//… End Video Appointment Mutation Hook with WebSocket Integration
export function useEndVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();
  const { user } = useAuth();

  return useMutationOperation<{ success: boolean; data: any }, string>(
    async (appointmentId: string) => {
      const hasAccess = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      const resolvedUserId = user?.id;
      if (!resolvedUserId) {
        throw new Error('User not authenticated');
      }

      const result = await endVideoConsultation({
        appointmentId,
        userId: resolvedUserId,
        userRole: getVideoTokenRole(user?.role),
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Ending video appointment...',
      successMessage: 'Video appointment ended successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
        ['queue'],
        ['queue-status'],
      ],
      onSuccess: (_, appointmentId) => {
        // Send WebSocket events
        sendVideoAppointmentEvent('ended', {
          appointmentId,
        });
      },
    }
  );
}

//… Delete Video Appointment Mutation Hook
export function useDeleteVideoAppointment() {
  const queryClient = useQueryClient();
  const { hasPermission } = useRBAC();
  const { user } = useAuth();

  return useMutationOperation<{ success: boolean; data: any }, string>(
    async (appointmentId: string) => {
      const hasAccess = hasPermission(Permission.DELETE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      const resolvedUserId = user?.id;
      if (!resolvedUserId) {
        throw new Error('User not authenticated');
      }

      // End consultation to effectively "delete" it
      const result = await endVideoConsultation({
        appointmentId,
        userId: resolvedUserId,
        userRole: 'doctor',
        endReason: 'Deleted by user',
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Deleting video appointment...',
      successMessage: 'Video appointment deleted successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
      ],
      onSuccess: (_, appointmentId) => {
        queryClient.removeQueries({ queryKey: ['video-appointment', appointmentId] });
      },
    }
  );
}

//… Reschedule Video Appointment Mutation Hook
export function useRescheduleVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();
  const { user } = useAuth();

  return useMutationOperation<{ success: boolean; data: any }, { appointmentId: string; date: string; time: string; reason: string }>(
    async (data: { appointmentId: string; date: string; time: string; reason: string }) => {
      const isPatient = String(user?.role || '').toUpperCase() === Role.PATIENT;
      const hasAccess = isPatient || hasPermission(Permission.UPDATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      if (!data.appointmentId) throw new Error('Appointment ID is required');

      const result = await rescheduleAppointment(data.appointmentId, {
        date: data.date,
        time: data.time,
        reason: data.reason
      });
      
      if (!result.success) throw new Error(result.error || 'Failed to reschedule appointment');
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Rescheduling appointment...',
      successMessage: 'Appointment rescheduled successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
      ],
      onSuccess: (_, variables) => {
        sendVideoAppointmentEvent('updated', {
          appointmentId: variables.appointmentId,
          status: 'rescheduled',
          rescheduledTo: { date: variables.date, time: variables.time }
        });
      },
    }
  );
}

//… Reject Video Proposal Mutation Hook
export function useRejectVideoProposal() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutationOperation<{ success: boolean; data: any }, { appointmentId: string; reason: string }>(
    async (data: { appointmentId: string; reason: string }) => {
      // Assuming same permission as update
      const hasAccess = hasPermission(Permission.UPDATE_VIDEO_APPOINTMENTS); 
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await rejectVideoProposal(data.appointmentId, data.reason);
      
      if (!result.success) throw new Error(result.error);
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CANCEL, // Using cancel toast ID as it's a rejection
      loadingMessage: 'Rejecting proposal...',
      successMessage: 'Proposal rejected successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
      ],
      onSuccess: (_, variables) => {
        sendVideoAppointmentEvent('updated', {
          appointmentId: variables.appointmentId,
          status: 'cancelled',
          reason: variables.reason
        });
      },
    }
  );
}

//… Cancel Video Appointment Mutation Hook
export function useCancelVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();
  const { user } = useAuth();

  return useMutationOperation<{ success: boolean; data: any }, { appointmentId: string; reason: string }>(
    async (data: { appointmentId: string; reason: string }) => {
      const isPatient = String(user?.role || '').toUpperCase() === Role.PATIENT;
      const hasAccess = isPatient || hasPermission(Permission.UPDATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');
      if (!data.appointmentId) throw new Error('Appointment ID is required');

      const result = await updateAppointmentStatus(data.appointmentId, {
        status: 'CANCELLED',
        reason: data.reason,
      });
      
      if (!result.success) throw new Error(result.error || 'Failed to cancel appointment');
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CANCEL,
      loadingMessage: 'Cancelling appointment...',
      successMessage: 'Appointment cancelled successfully',
      invalidateQueries: [
        ['video-appointments'],
        ['video-appointment'],
        ['appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['appointmentStats'],
        ['waiting-room-queue'],
        ['admin-video-sessions'],
        ['queue'],
        ['queue-status'],
      ],
      onSuccess: (_, variables) => {
        sendVideoAppointmentEvent('updated', {
          appointmentId: variables.appointmentId,
          status: 'cancelled',
          reason: variables.reason
        });
      },
    }
  );
}

export function useAdminVideoSessions() {
  const { isConnected: socketConnected } = useWebSocketStatus();

  return useQueryData(
    ['admin-video-sessions'],
    async () => {
      const sessions = await listAllVideoSessions();
      return {
        success: true,
        data: sessions,
        sessions: Array.isArray((sessions as { sessions?: unknown }).sessions)
          ? (sessions as { sessions: unknown[] }).sessions
          : [],
      };
    },
    {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchInterval: socketConnected ? false : 30_000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useTerminateVideoSession() {
  return useMutationOperation<{ success: boolean; message?: string }, string>(
    async (sessionId: string) => {
      const response = await terminateVideoSession(sessionId);
      return response.message ? { success: true, message: response.message } : { success: true };
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Terminating video session...',
      successMessage: 'Video session terminated successfully',
      invalidateQueries: [['admin-video-sessions']],
    }
  );
}


