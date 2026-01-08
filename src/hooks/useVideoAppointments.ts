// ✅ Video Appointment Hooks - OpenVidu Integration with WebSocket
// This file provides hooks for video appointment management with OpenVidu integration and real-time WebSocket updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useCurrentClinicId } from './useClinic';
import { useRBAC } from './useRBAC';
import { useToast } from './use-toast';
import { useVideoAppointmentWebSocket } from './useVideoAppointmentSocketIO';
import { useAuth } from './useAuth';
import { Permission } from '@/types/rbac.types';
import { videoAppointmentService, type OpenViduAPI } from '@/lib/video/openvidu';
import { APP_CONFIG } from '@/lib/config/config';
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

  const query = useQuery({
    queryKey: ['video-appointments', clinicId, filters],
    queryFn: async () => {
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
    enabled: !!clinicId && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
    staleTime: 2 * 60 * 1000, // 2 minutes (optimized for 10M users)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Disable auto-refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
  });

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

  const query = useQuery({
    queryKey: ['video-appointment', id],
    queryFn: async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await getConsultationStatus(id);
      
      return { success: true, data: result, appointment: result };
    },
    enabled: !!id && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
    staleTime: 1 * 60 * 1000, // 1 minute - WebSocket handles real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Disable polling - WebSocket handles updates
    refetchOnWindowFocus: false,
  });

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutation({
    mutationFn: async (data: CreateVideoAppointmentData) => {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      
      // Send WebSocket event
      sendVideoAppointmentEvent('created', {
        appointmentId: variables.appointmentId,
        doctorId: variables.doctorId,
        patientId: variables.patientId,
      });
      
      toast({
        title: 'Success',
        description: 'Video appointment created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ✅ Update Video Appointment Mutation Hook with WebSocket Integration
export function useUpdateVideoAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutation({
    mutationFn: async (data: UpdateVideoAppointmentData) => {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['video-appointment', variables.appointmentId] });
      
      // Send WebSocket event
      sendVideoAppointmentEvent('updated', {
        appointmentId: variables.appointmentId,
        status: variables.status,
        updatedFields: Object.keys(variables),
      });
      
      toast({
        title: 'Success',
        description: 'Video appointment updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ✅ Join Video Appointment Mutation Hook with WebSocket Integration
export function useJoinVideoAppointment() {
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const { sendParticipantJoined } = useVideoAppointmentWebSocket();

  return useMutation({
    mutationFn: async (data: { appointmentId: string; userId: string; role: 'doctor' | 'patient' | 'admin' }) => {
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
    onSuccess: (_, variables) => {
      // Send WebSocket event for participant joined
      sendParticipantJoined(variables.appointmentId, {
        userId: variables.userId,
        displayName: variables.role,
        role: variables.role,
      });
      
      toast({
        title: 'Success',
        description: 'Joining video appointment...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ✅ End Video Appointment Mutation Hook with WebSocket Integration
export function useEndVideoAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const { sendVideoAppointmentEvent } = useVideoAppointmentWebSocket();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const hasAccess = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await endVideoConsultation({
        appointmentId,
        userId: '', // Will be set from session
        userRole: 'doctor',
      });
      
      return { success: true, data: result };
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['video-appointment', appointmentId] });
      
      // Send WebSocket events
      sendVideoAppointmentEvent('ended', {
        appointmentId,
      });
      
      toast({
        title: 'Success',
        description: 'Video appointment ended successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ✅ Delete Video Appointment Mutation Hook
export function useDeleteVideoAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
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
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.removeQueries({ queryKey: ['video-appointment', appointmentId] });
      toast({
        title: 'Success',
        description: 'Video appointment deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ✅ Get Video Recording Query Hook
export function useVideoRecording(appointmentId: string) {
  const { hasPermission } = useRBAC();

  return useQuery({
    queryKey: ['video-recording', appointmentId],
    queryFn: async () => {
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await getRecording(appointmentId);
      
      return { success: true, data: result, recording: result };
    },
    enabled: !!appointmentId && hasPermission(Permission.VIEW_VIDEO_RECORDINGS),
  });
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
          displayName: userInfo.displayName,
          email: userInfo.email,
        },
      }) as { token: string; roomName: string; roomId: string; meetingUrl: string };

      // Get OpenVidu server URL from config or environment
      const openviduServerUrl = APP_CONFIG.VIDEO.OPENVIDU_URL;

      // Start video appointment with token
      const call = await videoAppointmentService.startVideoAppointment(
        appointmentData,
        userInfo,
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
        userId: userInfo.userId,
        displayName: userInfo.displayName,
        role: userInfo.role,
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
          call.toggleRecording();
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
          call.raiseHand();
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
