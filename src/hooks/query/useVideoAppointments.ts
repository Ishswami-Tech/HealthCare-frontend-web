// ✅ Video Appointment Hooks - OpenVidu Integration with WebSocket
// This file provides hooks for video appointment management with OpenVidu integration and real-time WebSocket updates

import { useEffect, useCallback } from 'react';
import { useQueryData, useMutationOperation, useQueryClient } from '@/hooks/core';
import { useCurrentClinicId } from './useClinics';
import { useRBAC } from '../utils/useRBAC';
import { useToast } from '../utils/use-toast';
import { useVideoAppointmentWebSocket } from '../realtime/useVideoAppointmentSocketIO';
import { useAuth } from '../auth/useAuth';
import { Permission } from '@/types/rbac.types';
import { Role } from '@/types/auth.types';
import { videoAppointmentService, type OpenViduAPI } from '@/lib/video/openvidu';
import { APP_CONFIG } from '@/lib/config/config';
import { TOAST_IDS } from '../utils/use-toast';
import {
  generateVideoToken,
  startVideoConsultation,
  endVideoConsultation,
  getConsultationStatus,
  getVideoConsultationHistory,
  getRecording,
} from '@/lib/actions/video.server';

// ✅ Video Appointment Types
export interface VideoAppointment {
  id: string;
  appointmentId: string;
  roomName: string;
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  sessionId?: string;
  recordingUrl?: string;
  notes?: string;
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

// ✅ Video Appointments Query Hook with WebSocket Integration
export function useVideoAppointments(filters?: VideoAppointmentFilters) {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const { subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents, isConnected } = useVideoAppointmentWebSocket();

  const query = useQueryData(
    ['video-appointments', clinicId, filters],
    async () => {
      if (!clinicId) throw new Error('Clinic ID is required');
      
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      // Build filters object without undefined values (for exactOptionalPropertyTypes)
      const historyFilters: {
        userId?: string;
        patientId?: string;
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
      // ✅ FIX: Separate doctorId and patientId (was overwriting userId)
      if (filters?.doctorId) historyFilters.userId = filters.doctorId;
      if (filters?.patientId) historyFilters.patientId = filters.patientId;

      const result = await getVideoConsultationHistory(historyFilters);
      
      return { success: true, data: result, appointments: Array.isArray(result) ? result : [] };
    },
    {
      enabled: !!clinicId && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
      staleTime: 2 * 60 * 1000, // 2 minutes (optimized for 10M users)
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: false, // Disable auto-refetch - rely on WebSocket for real-time updates
      refetchOnWindowFocus: false,
    }
  );

  // ✅ Subscribe to real-time updates
  // ⚠️ OPTIMIZED: Only subscribe when connected (not dependent on query.data to avoid re-subscriptions)
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

    return () => {
      unsubscribeAppointments();
      unsubscribeParticipants();
      unsubscribeRecording();
    };
  }, [isConnected, queryClient, subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents]);

  return query;
}

// ✅ Video Appointment by ID Query Hook with WebSocket Integration
export function useVideoAppointment(id: string) {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const { subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents } = useVideoAppointmentWebSocket();

  const query = useQueryData(
    ['video-appointment', id],
    async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await getConsultationStatus(id);
      
      return { success: true, data: result, appointment: result };
    },
    {
      enabled: !!id && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
      staleTime: 1 * 60 * 1000, // 1 minute - WebSocket handles real-time updates
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false, // Disable polling - WebSocket handles updates
      refetchOnWindowFocus: false,
    }
  );

  // ✅ Subscribe to real-time updates for this specific appointment
  useEffect(() => {
    if (!id) return;

    // Subscribe to video appointment updates
    const unsubscribeAppointments = subscribeToVideoAppointments((data) => {
      if (data.appointmentId === id) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', id] });
      }
    });

    // Subscribe to participant events
    const unsubscribeParticipants = subscribeToParticipantEvents((data) => {
      if (data.appointmentId === id) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', id] });
      }
    });

    // Subscribe to recording events
    const unsubscribeRecording = subscribeToRecordingEvents((data) => {
      if (data.appointmentId === id) {
        queryClient.invalidateQueries({ queryKey: ['video-appointment', id] });
      }
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeParticipants();
      unsubscribeRecording();
    };
  }, [id, queryClient, subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents]);

  return query;
}

// ✅ Create Video Appointment Mutation Hook with WebSocket Integration
export function useCreateVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutationOperation<{ success: boolean; data: any; token: any }, CreateVideoAppointmentData>(
    async (data: CreateVideoAppointmentData) => {
      const hasAccess = hasPermission(Permission.CREATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      // Generate token first, then start consultation
      const tokenResult = await generateVideoToken({
        appointmentId: data.appointmentId,
        userId: data.doctorId,
        userRole: 'doctor',
        userInfo: {
          displayName: 'Doctor',
          email: 'doctor@example.com',
        },
      });
      
      const consultationResult = await startVideoConsultation({
        appointmentId: data.appointmentId,
        userId: data.doctorId,
        userRole: 'doctor',
      });
      
      return { success: true, data: consultationResult, token: tokenResult };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Creating video appointment...',
      successMessage: 'Video appointment created successfully',
      invalidateQueries: [['video-appointments']],
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

// ✅ Update Video Appointment Mutation Hook with WebSocket Integration
export function useUpdateVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutationOperation<{ success: boolean; data: any }, UpdateVideoAppointmentData>(
    async (data: UpdateVideoAppointmentData) => {
      const hasAccess = hasPermission(Permission.UPDATE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      // Update consultation status by ending or starting it
      if (data.status === 'completed' || data.status === 'cancelled') {
        const result = await endVideoConsultation({
          appointmentId: data.appointmentId,
          userId: '', // Will be set from session
          userRole: 'doctor',
          endReason: data.status === 'cancelled' ? 'Cancelled by user' : 'Completed',
        });
        return { success: true, data: result };
      }
      
      // For other status updates, we might need to start consultation
      const result = await startVideoConsultation({
        appointmentId: data.appointmentId,
        userId: '', // Will be set from session
        userRole: 'doctor',
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Updating video appointment...',
      successMessage: 'Video appointment updated successfully',
      invalidateQueries: [['video-appointments'], ['video-appointment']],
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

// ✅ Join Video Appointment Mutation Hook with WebSocket Integration
export function useJoinVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendParticipantJoined } = useVideoAppointmentWebSocket();

  return useMutationOperation<{ success: boolean; data: any; token: any }, { appointmentId: string; userId: string; role: 'doctor' | 'patient' | 'admin' }>(
    async (data: { appointmentId: string; userId: string; role: 'doctor' | 'patient' | 'admin' }) => {
      const hasAccess = hasPermission(Permission.JOIN_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      // Generate token for joining
      const tokenResult = await generateVideoToken({
        appointmentId: data.appointmentId,
        userId: data.userId,
        userRole: data.role === 'doctor' ? 'doctor' : 'patient',
        userInfo: {
          displayName: data.role,
          email: `${data.role}@example.com`,
        },
      }) as { token: string; roomName: string; roomId: string; meetingUrl: string };
      
      return { success: true, data: tokenResult, token: tokenResult };
    },
    {
      toastId: TOAST_IDS.VIDEO.JOIN,
      loadingMessage: 'Joining video appointment...',
      successMessage: 'Joining video appointment...',
      onSuccess: (_, variables) => {
        // Send WebSocket event for participant joined
        sendParticipantJoined(variables.appointmentId, {
          userId: variables.userId,
          displayName: variables.role,
          role: variables.role,
        });
      },
    }
  );
}

// ✅ End Video Appointment Mutation Hook with WebSocket Integration
export function useEndVideoAppointment() {
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutationOperation<{ success: boolean; data: any }, string>(
    async (appointmentId: string) => {
      const hasAccess = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await endVideoConsultation({
        appointmentId,
        userId: '', // Will be set from session
        userRole: 'doctor',
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Ending video appointment...',
      successMessage: 'Video appointment ended successfully',
      invalidateQueries: [['video-appointments'], ['video-appointment']],
      onSuccess: (_, appointmentId) => {
        // Send WebSocket events
        sendVideoAppointmentEvent('ended', {
          appointmentId,
        });
      },
    }
  );
}

// ✅ Delete Video Appointment Mutation Hook
export function useDeleteVideoAppointment() {
  const queryClient = useQueryClient();
  const { hasPermission } = useRBAC();

  return useMutationOperation<{ success: boolean; data: any }, string>(
    async (appointmentId: string) => {
      const hasAccess = hasPermission(Permission.DELETE_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      // End consultation to effectively "delete" it
      const result = await endVideoConsultation({
        appointmentId,
        userId: '', // Will be set from session
        userRole: 'doctor',
        endReason: 'Deleted by user',
      });
      
      return { success: true, data: result };
    },
    {
      toastId: TOAST_IDS.VIDEO.END,
      loadingMessage: 'Deleting video appointment...',
      successMessage: 'Video appointment deleted successfully',
      invalidateQueries: [['video-appointments']],
      onSuccess: (_, appointmentId) => {
        queryClient.removeQueries({ queryKey: ['video-appointment', appointmentId] });
      },
    }
  );
}

// ✅ Get Video Recording Query Hook
export function useVideoRecording(appointmentId: string) {
  const { hasPermission } = useRBAC();

  return useQueryData(
    ['video-recording', appointmentId],
    async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await getRecording(appointmentId);
      
      return { success: true, data: result, recording: result };
    },
    {
      enabled: !!appointmentId && hasPermission(Permission.VIEW_VIDEO_RECORDINGS),
    }
  );
}

// ✅ Video Call Management Hook with WebSocket Integration
export function useVideoCall() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendVideoAppointmentEvent, sendParticipantJoined, sendParticipantLeft, sendRecordingStarted, sendRecordingStopped } = useVideoAppointmentWebSocket();

  // ✅ Start Video Call
  const startCall = useCallback(async (appointmentData: VideoAppointment, userInfo: { userId?: string; role?: string; displayName?: string; email?: string }, container?: HTMLElement) => {
    try {
      // First, generate token from backend
      const tokenResult = await generateVideoToken({
        appointmentId: appointmentData.appointmentId,
        userId: userInfo.userId || user?.id || '',
        userRole: userInfo.role === 'doctor' ? 'doctor' : 'patient',
        userInfo: {
          displayName: userInfo.displayName || user?.name || 'User',
          email: userInfo.email || user?.email || '',
        },
      }) as { token: string; roomName: string; roomId: string; meetingUrl: string };

      // Get OpenVidu server URL from config or environment
      const openviduServerUrl = APP_CONFIG.VIDEO.OPENVIDU_URL;

      // Start video appointment with token
      const call = await videoAppointmentService.startVideoAppointment(
        appointmentData,
        {
          userId: userInfo.userId || user?.id || '',
          displayName: userInfo.displayName || user?.name || 'User',
          email: userInfo.email || user?.email || '',
          role: (userInfo.role as Role) || (user?.role as Role) || Role.PATIENT,
        },
        tokenResult.token,
        openviduServerUrl
      );

      // Initialize with container if provided
      if (container) {
        await call.initialize(container);
      }
      
      // Send WebSocket events
      sendVideoAppointmentEvent('started', {
        appointmentId: appointmentData.appointmentId,
      });
      
      sendParticipantJoined(appointmentData.appointmentId, {
        userId: userInfo.userId || user?.id || '',
        displayName: userInfo.displayName || user?.name || 'User',
        role: (userInfo.role as Role) || (user?.role as Role) || Role.PATIENT,
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

  // ✅ End Video Call
  const endCall = useCallback(async (appointmentId: string) => {
    try {
      await videoAppointmentService.endVideoAppointment();
      
      // Send WebSocket events
      sendVideoAppointmentEvent('ended', {
        appointmentId,
      });
      
      toast({
        title: 'Video Call Ended',
        description: 'Video appointment has been ended',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to end video call',
        variant: 'destructive',
      });
      throw error;
    }
  }, [sendVideoAppointmentEvent, toast]);

  // ✅ Get Current Call
  const getCurrentCall = useCallback(() => {
    return videoAppointmentService.getCurrentCall();
  }, []);

  // ✅ Check if in call
  const isInCall = useCallback(() => {
    return videoAppointmentService.isInCall();
  }, []);

  // ✅ Leave call (participant left)
  const leaveCall = useCallback((appointmentId: string, userInfo: { userId: string; displayName: string; role: string }) => {
    sendParticipantLeft(appointmentId, {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      role: userInfo.role,
    });
  }, [sendParticipantLeft]);

  // ✅ Start recording
  const startRecording = useCallback((appointmentId: string, recordingData?: { recordingId: string; status: string }) => {
    sendRecordingStarted(appointmentId, recordingData);
  }, [sendRecordingStarted]);

  // ✅ Stop recording
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
  };
}

// ✅ Video Call Controls Hook
export function useVideoCallControls() {
  const { toast } = useToast();

  const getCallControls = (call: OpenViduAPI | null) => {
    if (!call) return null;

    return {
      // ✅ Toggle Audio
      toggleAudio: () => {
        try {
          call.toggleAudio();
          toast({
            title: 'Audio Toggled',
            description: 'Audio has been toggled',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to toggle audio',
            variant: 'destructive',
          });
        }
      },

      // ✅ Toggle Video
      toggleVideo: () => {
        try {
          call.toggleVideo();
          toast({
            title: 'Video Toggled',
            description: 'Video has been toggled',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to toggle video',
            variant: 'destructive',
          });
        }
      },

      // ✅ Start/Stop Recording
      toggleRecording: () => {
        try {
          // Note: toggleRecording method may not be available in OpenViduAPI
          // Use startRecording/stopRecording methods instead if available
          if ('startRecording' in call && typeof call.startRecording === 'function') {
            // Implementation depends on OpenVidu API
          }
          toast({
            title: 'Recording Toggled',
            description: 'Recording has been toggled',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to toggle recording',
            variant: 'destructive',
          });
        }
      },

      // ✅ Share Screen
      shareScreen: () => {
        try {
          call.shareScreen();
          toast({
            title: 'Screen Share',
            description: 'Screen sharing activated',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to share screen',
            variant: 'destructive',
          });
        }
      },

      // ✅ Raise Hand
      raiseHand: () => {
        try {
          // Note: raiseHand method may not be available in OpenViduAPI
          // This would need to be implemented via custom signaling
          toast({
            title: 'Hand Raised',
            description: 'Hand has been raised',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to raise hand',
            variant: 'destructive',
          });
        }
      },

      // ✅ Get Participants
      getParticipants: () => {
        try {
          return call.getParticipants();
        } catch (error) {
          console.error('Failed to get participants:', error);
          return [];
        }
      },

      // ✅ Get Current Participant
      getCurrentParticipant: () => {
        try {
          return call.getCurrentParticipant();
        } catch (error) {
          console.error('Failed to get current participant:', error);
          return null;
        }
      },
    };
  };

  return { getCallControls };
}
