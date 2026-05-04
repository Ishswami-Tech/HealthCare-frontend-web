// âœ… Video Appointment Hooks - OpenVidu Integration with WebSocket
// This file provides hooks for video appointment management with OpenVidu integration and real-time WebSocket updates

import { useEffect, useCallback, useState } from 'react';
import { useQueryData, useMutationOperation, useQueryClient } from '@/hooks/core';
import { useCurrentClinicId } from './useClinics';
import { useRBAC } from '../utils/useRBAC';
import { useToast } from '../utils/use-toast';
import { useVideoAppointmentWebSocket } from '../realtime/useVideoAppointmentSocketIO';
import { useAuth } from '../auth/useAuth';
import { Permission } from '@/types/rbac.types';
import { Role } from '@/types/auth.types';
import {
  videoAppointmentService,
  normalizeOpenViduServerUrl,
  resolveVideoDisplayName,
  type OpenViduAPI,
} from '@/lib/video/openvidu';
import { APP_CONFIG } from '@/lib/config/config';
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

function getOpenViduRole(role?: string | null): Role | 'admin' {
  const videoRole = getVideoTokenRole(role);
  switch (videoRole) {
    case 'doctor':
      return Role.DOCTOR;
    case 'receptionist':
      return Role.RECEPTIONIST;
    case 'clinic_admin':
      return 'admin';
    case 'patient':
    default:
      return Role.PATIENT;
  }
}

// âœ… Video Appointment Types
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

// âœ… Video Appointments Query Hook with WebSocket Integration
export function useVideoAppointments(filters?: VideoAppointmentFilters) {
  const { session } = useAuth();
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
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
      refetchInterval: false, // Disable auto-refetch - rely on WebSocket for real-time updates
      refetchOnWindowFocus: false,
    }
  );

  // âœ… Subscribe to real-time updates
  // âš ï¸ OPTIMIZED: Only subscribe when connected (not dependent on query.data to avoid re-subscriptions)
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

// âœ… Video Appointment by ID Query Hook with WebSocket Integration
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
      staleTime: 1 * 60 * 1000, // 1 minute - WebSocket handles real-time updates
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false, // Disable polling - WebSocket handles updates
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  // âœ… Subscribe to real-time updates for this specific appointment
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

// âœ… Create Video Appointment Mutation Hook with WebSocket Integration
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
      const tokenResult = await generateVideoToken({
        appointmentId: data.appointmentId,
        userId: data.doctorId,
        userRole: currentUserRole,
        userInfo,
        ...(resolvedClinicId && { clinicId: resolvedClinicId }),
      });

      const consultationResult = await startVideoConsultation({
        appointmentId: data.appointmentId,
        userId: data.doctorId,
        userRole: currentUserRole,
        ...(resolvedClinicId && { clinicId: resolvedClinicId }),
      });

      return { success: true, data: consultationResult, token: tokenResult };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Creating video appointment...',
      successMessage: 'Video appointment created successfully',
      invalidateQueries: [['video-appointments'], ['appointments'], ['myAppointments']],
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

// âœ… Update Video Appointment Mutation Hook with WebSocket Integration
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
      invalidateQueries: [['video-appointments'], ['video-appointment'], ['appointments'], ['myAppointments']],
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

// âœ… End Video Appointment Mutation Hook with WebSocket Integration
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
      invalidateQueries: [['video-appointments'], ['video-appointment'], ['appointments'], ['myAppointments']],
      onSuccess: (_, appointmentId) => {
        // Send WebSocket events
        sendVideoAppointmentEvent('ended', {
          appointmentId,
        });
      },
    }
  );
}

// âœ… Delete Video Appointment Mutation Hook
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
      invalidateQueries: [['video-appointments'], ['appointments'], ['myAppointments']],
      onSuccess: (_, appointmentId) => {
        queryClient.removeQueries({ queryKey: ['video-appointment', appointmentId] });
      },
    }
  );
}

// âœ… Reschedule Video Appointment Mutation Hook
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
      invalidateQueries: [['video-appointments'], ['video-appointment'], ['appointments'], ['myAppointments']],
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

// âœ… Reject Video Proposal Mutation Hook
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
      invalidateQueries: [['video-appointments'], ['video-appointment'], ['appointments'], ['myAppointments']],
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

// âœ… Cancel Video Appointment Mutation Hook
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
      invalidateQueries: [['video-appointments'], ['video-appointment'], ['appointments'], ['myAppointments']],
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

// âœ… Get Video Recording Query Hook
// âœ… Video Call Management Hook with WebSocket Integration
export function useVideoCall() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendVideoAppointmentEvent, sendParticipantJoined, sendParticipantLeft, sendRecordingStarted, sendRecordingStopped } = useVideoAppointmentWebSocket();
  
  // State for video streams
  const [publisher, setPublisher] = useState<any>(null); // Type: Publisher
  const [subscribers, setSubscribers] = useState<any[]>([]); // Type: Subscriber[]

  // âœ… State Management Effects
  useEffect(() => {
    // Listen for OpenVidu stream events
    const handleStreamCreated = (_event: any) => {
      // In a real app we might want to debate if we update state here or wait for manual getSubscribers()
      // But for reactive UI, we should update state
      if (videoAppointmentService.isInCall()) {
        const currentCall = videoAppointmentService.getCurrentCall();
        if (currentCall) {
          setSubscribers([...currentCall.getSubscribers()]);
        }
      }
    };

    const handleStreamDestroyed = (_event: any) => {
      if (videoAppointmentService.isInCall()) {
        const currentCall = videoAppointmentService.getCurrentCall();
        if (currentCall) {
          setSubscribers([...currentCall.getSubscribers()]);
        }
      }
    };

    // Re-sync publisher so control-bar icons update after audio/video toggles
    const handlePublisherPropertyChanged = (_event: any) => {
      if (videoAppointmentService.isInCall()) {
        const currentCall = videoAppointmentService.getCurrentCall();
        if (currentCall) {
          setPublisher((prev: any) => currentCall.getPublisher() ?? prev);
        }
      }
    };

    // Re-sync publisher when the object instance itself is replaced (e.g. screen share start/stop)
    const handlePublisherChanged = (e: any) => {
      if (e.detail?.publisher) {
        setPublisher(e.detail.publisher);
      }
    };

    window.addEventListener('openvidu-stream-created', handleStreamCreated);
    window.addEventListener('openvidu-stream-destroyed', handleStreamDestroyed);
    window.addEventListener('openvidu-publisher-property-changed', handlePublisherPropertyChanged);
    window.addEventListener('openvidu-publisher-changed', handlePublisherChanged);

    return () => {
      window.removeEventListener('openvidu-stream-created', handleStreamCreated);
      window.removeEventListener('openvidu-stream-destroyed', handleStreamDestroyed);
      window.removeEventListener('openvidu-publisher-property-changed', handlePublisherPropertyChanged);
      window.removeEventListener('openvidu-publisher-changed', handlePublisherChanged);
    };
  }, []);

  // âœ… Start Video Call
  const startCall = useCallback(async (
    appointmentData: VideoAppointment,
    userInfo: { userId?: string; role?: string; displayName?: string; email?: string },
    mediaOptions?: {
      videoSource?: string | MediaStreamTrack | boolean;
      audioSource?: string | MediaStreamTrack | boolean;
      publishAudio?: boolean;
      publishVideo?: boolean;
    }
  ) => {
    try {
      const sessionDecision = getVideoSessionDecision(appointmentData);
      if (sessionDecision.blockedReason) {
        throw new Error(sessionDecision.blockedReason);
      }

      if (appointmentData.paymentCompleted === false) {
        throw new Error('Payment is required to join this appointment.');
      }
        const resolvedUserId = userInfo.userId || user?.id;

        if (!resolvedUserId) {
          throw new Error("Unable to start OpenVidu call without a user id");
        }

        const videoRole = getVideoTokenRole(userInfo.role || user?.role);
      const openViduRole = getOpenViduRole(userInfo.role || user?.role);

      // First, generate token from backend
      const tokenResult = await generateVideoToken({
        appointmentId: appointmentData.appointmentId,
        userId: resolvedUserId,
        userRole: videoRole,
        userInfo: {
          displayName: userInfo.displayName || resolveVideoDisplayName(user),
          email: userInfo.email || user?.email || '',
        },
      }) as { token: string; roomName: string; roomId: string; meetingUrl: string };

      // Only ask the backend to start a consultation when this is a not-yet-started session.
      // In-progress sessions already have an active consultation and should join directly.
      if (sessionDecision.shouldCallConsultationStart) {
        await startVideoConsultation({
          appointmentId: appointmentData.appointmentId,
          userId: resolvedUserId,
          userRole: videoRole,
        });
      }

      // Get OpenVidu server URL from config or environment
      const openviduServerUrl = APP_CONFIG.VIDEO.OPENVIDU_URL;
      const normalizedOpenViduServerUrl = normalizeOpenViduServerUrl(openviduServerUrl);
      console.warn('[VIDEO][OpenVidu] Browser host configured for this session:', {
        appointmentId: appointmentData.appointmentId,
        openviduServerUrl,
        normalizedOpenViduServerUrl,
      });

      // Start video appointment with token
      const call = await videoAppointmentService.startVideoAppointment(
        appointmentData as any,
        {
          userId: resolvedUserId,
          displayName: userInfo.displayName || resolveVideoDisplayName(user),
          email: userInfo.email || user?.email || '',
          role: openViduRole,
        },
        tokenResult.token,
        normalizedOpenViduServerUrl
      );

      // Initialize without container - React will handle rendering
      await call.initialize(mediaOptions);
      
      // Update local state
      setPublisher(call.getPublisher());
      setSubscribers(call.getSubscribers());
      
      // Send WebSocket events
      sendVideoAppointmentEvent('started', {
        appointmentId: appointmentData.appointmentId,
      });
      
      sendParticipantJoined(appointmentData.appointmentId, {
        userId: resolvedUserId,
        displayName: userInfo.displayName || resolveVideoDisplayName(user),
        role: videoRole,
      });
      
      toast({
        title: 'Video Call Started',
        description: 'Connecting to video appointment...',
      });

      return call;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start video call',
        variant: 'destructive',
      });
      throw error;
    }
  }, [sendVideoAppointmentEvent, sendParticipantJoined, toast, user]);

  // âœ… End Video Call
  const endCall = useCallback(async (appointmentId: string) => {
    try {
      const resolvedUserId = user?.id;

      if (!resolvedUserId) {
        throw new Error("Unable to end OpenVidu call without a user id");
      }

      let consultationEndError: unknown = null;
      try {
        await endVideoConsultation({
          appointmentId,
          userId: resolvedUserId,
          userRole: getVideoTokenRole(user?.role),
        });
      } catch (error) {
        consultationEndError = error;
      }

      await videoAppointmentService.endVideoAppointment();
      
      setPublisher(null);
      setSubscribers([]);

      // Send WebSocket events
      sendVideoAppointmentEvent('ended', {
        appointmentId,
      });
      
      toast({
        title: 'Video Call Ended',
        description: 'Video appointment has been ended',
      });

      if (consultationEndError) {
        const consultationMessage =
          consultationEndError instanceof Error
            ? consultationEndError.message
            : 'Failed to end video consultation on the server';
        toast({
          title: 'Call ended locally',
          description: consultationMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to end video call',
        variant: 'destructive',
      });
      throw error;
    }
  }, [sendVideoAppointmentEvent, toast, user?.id, user?.role]);

  // âœ… Get Current Call
  const getCurrentCall = useCallback(() => {
    return videoAppointmentService.getCurrentCall();
  }, []);

  // âœ… Check if in call
  const isInCall = useCallback(() => {
    return videoAppointmentService.isInCall();
  }, []);

  // âœ… Leave call (participant left)
  const leaveCall = useCallback((appointmentId: string, userInfo: { userId: string; displayName: string; role: string }) => {
    sendParticipantLeft(appointmentId, {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      role: userInfo.role,
    });
    
    // Also clear state locally
    setPublisher(null);
    setSubscribers([]);
  }, [sendParticipantLeft]);

  // âœ… Start recording
  const startRecording = useCallback((appointmentId: string, recordingData?: { recordingId: string; status: string }) => {
    sendRecordingStarted(appointmentId, recordingData);
  }, [sendRecordingStarted]);

  // âœ… Stop recording
  const stopRecording = useCallback((appointmentId: string, recordingData?: { recordingId: string; status: string }) => {
    sendRecordingStopped(appointmentId, recordingData);
  }, [sendRecordingStopped]);

  return {
    startCall,
    endCall,
    getCurrentCall,
    isInCall,
    leaveCall,
    startRecording,
    stopRecording,
    publisher,
    subscribers
  };
}

// âœ… Video Call Controls Hook
export function useVideoCallControls() {
  const { toast } = useToast();

  const getCallControls = (call: OpenViduAPI | null) => {
    if (!call) return null;

    return {
      // Toggle audio â€” publisher-property-changed window event drives icon state in UI
      toggleAudio: () => {
        try {
          call.toggleAudio();
        } catch {
          toast({ title: 'Microphone error', description: 'Could not toggle microphone', variant: 'destructive' });
        }
      },

      // Toggle video â€” returns true when camera is now OFF (muted)
      toggleVideo: (): boolean => {
        try {
          return call.toggleVideo();
        } catch {
          toast({ title: 'Camera error', description: 'Could not toggle camera', variant: 'destructive' });
          return false;
        }
      },

      // Share screen — async, caller must await and handle isScreenSharing state
      shareScreen: async (): Promise<void> => {
        try {
          await call.shareScreen();
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to start screen share';
          toast({ title: 'Screen share error', description: msg, variant: 'destructive' });
          throw error;
        }
      },

      // Device management
      getDevices: async () => {
        try {
          return await call.getDevices();
        } catch (error) {
          console.error('[VIDEO] Failed to get devices:', error);
          return [];
        }
      },

      changeAudioSource: async (deviceId: string) => {
        try {
          await call.changeAudioSource(deviceId);
          toast({ title: 'Microphone Updated', description: 'Microphone source changed successfully' });
        } catch (error) {
          toast({ title: 'Microphone error', description: 'Could not change microphone', variant: 'destructive' });
        }
      },

      changeVideoSource: async (deviceId: string) => {
        try {
          await call.changeVideoSource(deviceId);
          toast({ title: 'Camera Updated', description: 'Camera source changed successfully' });
        } catch (error) {
          toast({ title: 'Camera error', description: 'Could not change camera', variant: 'destructive' });
        }
      },

      toggleRecording: () => {
        // This is handled by the parent component usually but we can expose it here if needed
        // For now, we'll assume the parent component's onToggleRecording handles the state
        window.dispatchEvent(new CustomEvent('video-toggle-recording'));
      },

      // Stop screen share â€” async, restores camera publisher
      stopScreenShare: async (): Promise<void> => {
        try {
          await call.stopScreenShare();
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to stop screen share';
          toast({ title: 'Screen share error', description: msg, variant: 'destructive' });
          throw error;
        }
      },

      getParticipants: () => {
        try { return call.getParticipants(); } catch { return []; }
      },

      getCurrentParticipant: () => {
        try { return call.getCurrentParticipant(); } catch { return null; }
      },

      getSession: () => {
        try { return call.getSession(); } catch { return null; }
      },

      getActiveAudioDeviceId: () => {
        try { return call.getActiveAudioDeviceId(); } catch { return null; }
      },

      getActiveVideoDeviceId: () => {
        try { return call.getActiveVideoDeviceId(); } catch { return null; }
      },

    };
  };

  return { getCallControls };
}

export function useAdminVideoSessions() {
  return useQueryData(
    ['admin-video-sessions'],
    async () => await listAllVideoSessions(),
    {
      refetchInterval: 30_000,
    }
  );
}

export function useTerminateVideoSession() {
  return useMutationOperation(
    async (sessionId: string) => {
      const result = await terminateVideoSession(sessionId, 'Terminated by Super Admin');
      if (!result.success) {
        throw new Error(result.message || 'Failed to terminate session');
      }
      return result;
    },
    {
      toastId: 'admin-terminate-session',
      loadingMessage: 'Terminating session...',
      successMessage: 'Session terminated successfully',
      invalidateQueries: [['admin-video-sessions']],
    }
  );
}

export function useWaitingRoomQueue(appointmentId: string, enabled: boolean = true) {
  return useQueryData(
    ['waiting-room-queue', appointmentId],
    async () => {
      const result = await getWaitingRoomQueue(appointmentId);
      return result.queue || [];
    },
    {
      enabled: enabled && !!appointmentId,
    }
  );
}

export function useJoinWaitingRoom() {
  return useMutationOperation(
    async (appointmentId: string) => await joinWaitingRoom(appointmentId),
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Joining waiting room...',
      successMessage: 'Joined waiting room',
      invalidateQueries: [['waiting-room-queue']],
      showToast: false,
    }
  );
}

export function useLeaveWaitingRoom() {
  return useMutationOperation(
    async (appointmentId: string) => {
      const result = await leaveWaitingRoom(appointmentId);
      if (!result.success) {
        throw new Error('Failed to leave waiting room');
      }
      return result;
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Leaving waiting room...',
      successMessage: 'Left waiting room',
      invalidateQueries: [['waiting-room-queue']],
      showToast: false,
    }
  );
}

export function useAdmitFromWaitingRoom() {
  return useMutationOperation(
    async ({ appointmentId, userId }: { appointmentId: string; userId: string }) =>
      await admitFromWaitingRoom(appointmentId, userId),
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Admitting participant...',
      successMessage: 'Participant admitted',
      invalidateQueries: [['waiting-room-queue']],
      showToast: false,
    }
  );
}

export function useVideoChatMessages(appointmentId: string) {
  return useQueryData(
    ['video-chat-messages', appointmentId],
    async () => {
      const result = await getChatMessages(appointmentId, { limit: 50 });
      return result.messages || [];
    },
    {
      enabled: !!appointmentId,
    }
  );
}

export function useSendVideoChatMessage() {
  return useMutationOperation(
    async ({
      appointmentId,
      message,
    }: {
      appointmentId: string;
      message: string;
    }) =>
      await sendChatMessage(appointmentId, {
        message,
        messageType: 'TEXT',
      }),
    {
      toastId: TOAST_IDS.VIDEO.ERROR,
      loadingMessage: 'Sending message...',
      successMessage: 'Message sent',
      invalidateQueries: [['video-chat-messages']],
      showToast: false,
    }
  );
}

export function useUpdateVideoTypingIndicator() {
  return useMutationOperation(
    async ({
      appointmentId,
      isTyping,
    }: {
      appointmentId: string;
      isTyping: boolean;
    }) => await updateTypingIndicator(appointmentId, isTyping),
    {
      toastId: 'video-typing-indicator',
      loadingMessage: 'Updating typing status...',
      successMessage: 'Typing status updated',
      showToast: false,
      showLoading: false,
    }
  );
}

export function useMedicalNotes(appointmentId: string) {
  return useQueryData(
    ['video-medical-notes', appointmentId],
    async () => {
      const result = await getMedicalNotes(appointmentId);
      return result.notes || [];
    },
    {
      enabled: !!appointmentId,
    }
  );
}

export function useCreateMedicalNote() {
  return useMutationOperation(
    async ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: {
        content: string;
        noteType: 'GENERAL' | 'SYMPTOM' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'TREATMENT';
        title?: string;
      };
    }) => await createMedicalNote(appointmentId, data),
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Saving note...',
      successMessage: 'Medical note saved',
      invalidateQueries: [['video-medical-notes']],
      showToast: false,
    }
  );
}

export function useDeleteMedicalNote() {
  return useMutationOperation(
    async ({
      appointmentId,
      noteId,
    }: {
      appointmentId: string;
      noteId: string;
    }) => {
      const result = await deleteMedicalNote(appointmentId, noteId);
      if (!result.success) {
        throw new Error('Failed to delete note');
      }
      return result;
    },
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Deleting note...',
      successMessage: 'Medical note deleted',
      invalidateQueries: [['video-medical-notes']],
      showToast: false,
    }
  );
}

export function useUpdateMedicalNote() {
  return useMutationOperation(
    async ({
      noteId,
      data,
    }: {
      noteId: string;
      data: {
        userId: string;
        content?: string;
        title?: string;
        prescription?: unknown;
        symptoms?: unknown[];
        treatmentPlan?: unknown;
      };
    }) => await updateMedicalNote(noteId, data),
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Updating note...',
      successMessage: 'Medical note updated',
      invalidateQueries: [['video-medical-notes']],
      showToast: false,
    }
  );
}

export function useAnnotations(appointmentId: string) {
  return useQueryData(
    ['video-annotations', appointmentId],
    async () => {
      const result = await getAnnotations(appointmentId);
      return result.annotations || [];
    },
    {
      enabled: !!appointmentId,
    }
  );
}

export function useCreateAnnotation() {
  return useMutationOperation(
    async ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: {
        annotationType: 'DRAWING' | 'TEXT' | 'ARROW' | 'HIGHLIGHT' | 'SHAPE';
        data: Record<string, unknown>;
        position?: { x: number; y: number; width: number; height: number };
        color?: string;
        thickness?: number;
      };
    }) => await createAnnotation(appointmentId, data),
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Saving annotation...',
      successMessage: 'Annotation saved',
      invalidateQueries: [['video-annotations']],
      showToast: false,
    }
  );
}

export function useDeleteAnnotation() {
  return useMutationOperation(
    async ({
      appointmentId,
      annotationId,
    }: {
      appointmentId: string;
      annotationId: string;
    }) => {
      const result = await deleteAnnotation(appointmentId, annotationId);
      if (!result.success) {
        throw new Error('Failed to delete annotation');
      }
      return result;
    },
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Deleting annotation...',
      successMessage: 'Annotation deleted',
      invalidateQueries: [['video-annotations']],
      showToast: false,
    }
  );
}

export function useManageVideoParticipantEnhanced() {
  return useMutationOperation(
    async ({
      appointmentId,
      participantId,
      action,
    }: {
      appointmentId: string;
      participantId: string;
      action:
        | 'mute'
        | 'unmute'
        | 'remove'
        | 'promote'
        | 'demote'
        | 'disable_video'
        | 'enable_video'
        | 'grant_screen_share'
        | 'revoke_screen_share';
    }) => {
      const result = await manageParticipantEnhanced(appointmentId, {
        participantId,
        action,
      });
      if (!result.success) {
        throw new Error(`Failed to ${action} participant`);
      }
      return result;
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Updating participant...',
      successMessage: 'Participant action completed',
      showToast: false,
    }
  );
}

export function useCallTranscription(appointmentId: string) {
  return useQueryData(
    ['video-transcription', appointmentId],
    async () => {
      const result = await getTranscription(appointmentId);
      return 'segments' in result ? result.segments : [];
    },
    {
      enabled: !!appointmentId,
    }
  );
}

export function useCallQuality(appointmentId: string, userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.id;

  return useQueryData(
    ['video-call-quality', appointmentId, resolvedUserId ?? 'current'],
    async () => {
      try {
        if (!resolvedUserId) {
          throw new Error('User not authenticated');
        }
        return await getCallQuality(appointmentId, resolvedUserId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('service is currently unavailable') ||
          message.includes('Service is currently unavailable') ||
          message.includes('503')
        ) {
          console.warn('[VIDEO][CallQuality] Backend unavailable, falling back to empty state:', {
            appointmentId,
            message,
          });
          return null;
        }
        throw error;
      }
    },
    {
      enabled: Boolean(appointmentId && resolvedUserId),
      retry: false,
    }
  );
}

export function useUpdateCallQualityMetrics() {
  return useMutationOperation(
    async ({
      appointmentId,
      metrics,
    }: {
      appointmentId: string;
      metrics: CallQualityMetrics;
    }) => await updateQualityMetrics(appointmentId, metrics),
    {
      toastId: TOAST_IDS.VIDEO.ERROR,
      loadingMessage: 'Reporting quality issue...',
      successMessage: 'Issue reported',
      showToast: false,
    }
  );
}

export function useVirtualBackgroundSettings(appointmentId: string) {
  return useQueryData(
    ['video-virtual-background', appointmentId],
    async () => {
      const result = await getVirtualBackgroundSettings(appointmentId);
      return result;
    },
    {
      enabled: !!appointmentId,
    }
  );
}

export function useVirtualBackgroundPresets() {
  return useQueryData(
    ['video-virtual-background-presets'],
    async () => getVirtualBackgroundPresets(),
    {
      staleTime: 10 * 60 * 1000,
    }
  );
}

export function useUpdateVirtualBackground() {
  return useMutationOperation(
    async ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: {
        enabled: boolean;
        type: 'blur' | 'image' | 'video' | 'none';
        blurIntensity?: number;
        imageUrl?: string;
        videoUrl?: string;
        customBackgroundId?: string;
      };
    }) => await updateVirtualBackground(appointmentId, data),
    {
      toastId: TOAST_IDS.GLOBAL.SUCCESS,
      loadingMessage: 'Applying background...',
      successMessage: 'Background updated',
      invalidateQueries: [['video-virtual-background']],
      showToast: false,
    }
  );
}
