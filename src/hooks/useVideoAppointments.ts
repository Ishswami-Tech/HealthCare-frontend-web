// ✅ Video Appointment Hooks - Jitsi Integration with WebSocket
// This file provides hooks for video appointment management with Jitsi Meet integration and real-time WebSocket updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useCurrentClinicId } from './useClinic';
import { useRBAC } from './useRBAC';
import { useToast } from './use-toast';
import { useVideoAppointmentWebSocket } from './useWebSocket';
import { Permission } from '@/types/rbac.types';
import { videoAppointmentService } from '@/lib/video/jitsi';
import {
  createVideoAppointment,
  getVideoAppointments,
  getVideoAppointmentById,
  updateVideoAppointment,
  joinVideoAppointment,
  endVideoAppointment,
  getVideoAppointmentRecording,
  deleteVideoAppointment,
} from '@/lib/actions/video-appointments.server';

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
  jitsiRoomId?: string;
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
  jitsiRoomId?: string;
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
  const { subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents } = useVideoAppointmentWebSocket();

  const query = useQuery({
    queryKey: ['video-appointments', clinicId, filters],
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID is required');
      
      const hasAccess = hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS);
      if (!hasAccess) throw new Error('Access denied: Insufficient permissions');

      const result = await getVideoAppointments(clinicId, filters);
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    enabled: !!clinicId && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // ✅ Subscribe to real-time updates
  useEffect(() => {
    if (!query.data) return;

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
  }, [query.data, queryClient, subscribeToVideoAppointments, subscribeToParticipantEvents, subscribeToRecordingEvents]);

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

      const result = await getVideoAppointmentById(id);
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    enabled: !!id && hasPermission(Permission.VIEW_VIDEO_APPOINTMENTS),
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

      const result = await createVideoAppointment(data);
      if (!result.success) throw new Error(result.error);
      
      return result;
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

      const result = await updateVideoAppointment(data);
      if (!result.success) throw new Error(result.error);
      
      return result;
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

      const result = await joinVideoAppointment(data);
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (_, variables) => {
      // Send WebSocket event for participant joined
      sendParticipantJoined(variables.appointmentId, {
        userId: variables.userId,
        role: variables.role,
        timestamp: new Date().toISOString(),
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

      const result = await endVideoAppointment(appointmentId);
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['video-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['video-appointment', appointmentId] });
      
      // Send WebSocket events
      sendVideoAppointmentEvent('ended', {
        appointmentId,
        timestamp: new Date().toISOString(),
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

      const result = await deleteVideoAppointment(appointmentId);
      if (!result.success) throw new Error(result.error);
      
      return result;
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

      const result = await getVideoAppointmentRecording(appointmentId);
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    enabled: !!appointmentId && hasPermission(Permission.VIEW_VIDEO_RECORDINGS),
  });
}

// ✅ Video Call Management Hook with WebSocket Integration
export function useVideoCall() {
  const { toast } = useToast();
  const { sendVideoAppointmentEvent, sendParticipantJoined, sendParticipantLeft, sendRecordingStarted, sendRecordingStopped } = useVideoAppointmentWebSocket();

  // ✅ Start Video Call
  const startCall = useCallback(async (appointmentData: VideoAppointment, userInfo: any) => {
    try {
      const call = await videoAppointmentService.startVideoAppointment(appointmentData, userInfo);
      
      // Send WebSocket events
      sendVideoAppointmentEvent('started', {
        appointmentId: appointmentData.appointmentId,
        userInfo,
        timestamp: new Date().toISOString(),
      });
      
      sendParticipantJoined(appointmentData.appointmentId, {
        userId: userInfo.userId,
        displayName: userInfo.displayName,
        role: userInfo.role,
        timestamp: new Date().toISOString(),
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
  }, [sendVideoAppointmentEvent, sendParticipantJoined, toast]);

  // ✅ End Video Call
  const endCall = useCallback(async (appointmentId: string) => {
    try {
      await videoAppointmentService.endVideoAppointment(appointmentId);
      
      // Send WebSocket events
      sendVideoAppointmentEvent('ended', {
        appointmentId,
        timestamp: new Date().toISOString(),
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
  const leaveCall = useCallback((appointmentId: string, userInfo: any) => {
    sendParticipantLeft(appointmentId, {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      role: userInfo.role,
      timestamp: new Date().toISOString(),
    });
  }, [sendParticipantLeft]);

  // ✅ Start recording
  const startRecording = useCallback((appointmentId: string, recordingData: any) => {
    sendRecordingStarted(appointmentId, {
      ...recordingData,
      timestamp: new Date().toISOString(),
    });
  }, [sendRecordingStarted]);

  // ✅ Stop recording
  const stopRecording = useCallback((appointmentId: string, recordingData: any) => {
    sendRecordingStopped(appointmentId, {
      ...recordingData,
      timestamp: new Date().toISOString(),
    });
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

  const getCallControls = (call: any) => {
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
