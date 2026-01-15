"use client";

/**
 * Video Appointment Socket.IO Hook
 * Provides real-time video appointment updates using Socket.IO
 * Replaces native WebSocket implementation
 */

import { useCallback } from 'react';
import { useWebSocketStore } from '@/stores';
import { useWebSocketIntegration } from './useWebSocketIntegration';

// Video appointment event types (Socket.IO events)
export const VideoAppointmentEvents = {
  VIDEO_APPOINTMENT_CREATED: 'video_appointment:created',
  VIDEO_APPOINTMENT_UPDATED: 'video_appointment:updated',
  VIDEO_APPOINTMENT_JOINED: 'video_appointment:joined',
  VIDEO_APPOINTMENT_LEFT: 'video_appointment:left',
  VIDEO_APPOINTMENT_ENDED: 'video_appointment:ended',
  VIDEO_PARTICIPANT_JOINED: 'video_participant:joined',
  VIDEO_PARTICIPANT_LEFT: 'video_participant:left',
  VIDEO_RECORDING_STARTED: 'video_recording:started',
  VIDEO_RECORDING_STOPPED: 'video_recording:stopped',
  VIDEO_RECORDING_PAUSED: 'video_recording:paused',
  VIDEO_RECORDING_RESUMED: 'video_recording:resumed',
  // Phase 1 & 2 Events - Match backend Socket.IO event names
  VIDEO_CHAT_MESSAGE: 'chat_message', // Backend emits: 'chat_message'
  VIDEO_CHAT_TYPING: 'chat_typing', // Backend emits: 'chat_typing'
  VIDEO_WAITING_ROOM_JOINED: 'waiting_room_joined', // Backend emits: 'waiting_room_joined'
  VIDEO_WAITING_ROOM_LEFT: 'waiting_room_left', // Backend emits: 'waiting_room_left'
  VIDEO_WAITING_ROOM_ADMITTED: 'waiting_room_admitted', // Backend emits: 'waiting_room_admitted'
  VIDEO_NOTE_CREATED: 'note_created', // Backend emits: 'note_created'
  VIDEO_NOTE_UPDATED: 'note_updated', // Backend emits: 'note_updated'
  VIDEO_QUALITY_UPDATE: 'quality_warnings', // Backend emits: 'quality_warnings'
  VIDEO_ANNOTATION_CREATED: 'annotation_created', // Backend emits: 'annotation_created'
  VIDEO_ANNOTATION_UPDATED: 'annotation_updated', // Backend emits: 'annotation_updated'
  VIDEO_ANNOTATION_DELETED: 'annotation_deleted', // Backend emits: 'annotation_deleted'
  VIDEO_TRANSCRIPTION_SEGMENT: 'transcription_segment', // Backend emits: 'transcription_segment'
  VIDEO_TRANSCRIPTION_STARTED: 'transcription_started', // Backend emits: 'transcription_started'
  VIDEO_TRANSCRIPTION_STOPPED: 'transcription_stopped', // Backend emits: 'transcription_stopped'
  VIDEO_PARTICIPANT_MUTED: 'video_participant:muted',
  VIDEO_PARTICIPANT_UNMUTED: 'video_participant:unmuted',
  VIDEO_PARTICIPANT_REMOVED: 'video_participant:removed',
} as const;

export interface VideoAppointmentEventData {
  appointmentId: string;
  action?: string;
  participant?: {
    userId: string;
    displayName: string;
    role?: string;
  };
  recordingData?: {
    recordingId: string;
    status: string;
  };
  [key: string]: unknown;
}

/**
 * Hook for video appointment real-time updates using Socket.IO
 */
export function useVideoAppointmentWebSocket() {
  const { subscribe, emit, isConnected } = useWebSocketStore();
  
  // Ensure WebSocket connection is active
  useWebSocketIntegration({
    autoConnect: true,
    subscribeToAppointments: true,
  });

  /**
   * Subscribe to video appointment updates
   */
  const subscribeToVideoAppointments = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {}; // Return no-op unsubscribe
      }

      const unsubscribe = subscribe(VideoAppointmentEvents.VIDEO_APPOINTMENT_UPDATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      return unsubscribe;
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to participant events (joined/left)
   */
  const subscribeToParticipantEvents = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {}; // Return no-op unsubscribe
      }

      const unsubscribeJoined = subscribe(
        VideoAppointmentEvents.VIDEO_PARTICIPANT_JOINED,
        (data: unknown) => {
          callback(data as VideoAppointmentEventData);
        }
      );
      const unsubscribeLeft = subscribe(
        VideoAppointmentEvents.VIDEO_PARTICIPANT_LEFT,
        (data: unknown) => {
          callback(data as VideoAppointmentEventData);
        }
      );

      return () => {
        unsubscribeJoined();
        unsubscribeLeft();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to recording events (started/stopped)
   */
  const subscribeToRecordingEvents = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {}; // Return no-op unsubscribe
      }

      const unsubscribeStarted = subscribe(
        VideoAppointmentEvents.VIDEO_RECORDING_STARTED,
        (data: unknown) => {
          callback(data as VideoAppointmentEventData);
        }
      );
      const unsubscribeStopped = subscribe(
        VideoAppointmentEvents.VIDEO_RECORDING_STOPPED,
        (data: unknown) => {
          callback(data as VideoAppointmentEventData);
        }
      );

      return () => {
        unsubscribeStarted();
        unsubscribeStopped();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Send video appointment event
   */
  const sendVideoAppointmentEvent = useCallback(
    (action: string, data: VideoAppointmentEventData) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_APPOINTMENT_UPDATED, {
        action,
        ...data,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Send participant joined event
   */
  const sendParticipantJoined = useCallback(
    (appointmentId: string, participant: VideoAppointmentEventData['participant']) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_PARTICIPANT_JOINED, {
        appointmentId,
        action: 'participant_joined',
        participant,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Send participant left event
   */
  const sendParticipantLeft = useCallback(
    (appointmentId: string, participant: VideoAppointmentEventData['participant']) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_PARTICIPANT_LEFT, {
        appointmentId,
        action: 'participant_left',
        participant,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Send recording started event
   */
  const sendRecordingStarted = useCallback(
    (appointmentId: string, recordingData: VideoAppointmentEventData['recordingData']) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_RECORDING_STARTED, {
        appointmentId,
        action: 'recording_started',
        recordingData,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Send recording stopped event
   */
  const sendRecordingStopped = useCallback(
    (appointmentId: string, recordingData: VideoAppointmentEventData['recordingData']) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_RECORDING_STOPPED, {
        appointmentId,
        action: 'recording_stopped',
        recordingData,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Subscribe to chat messages
   */
  const subscribeToChatMessages = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribe = subscribe(VideoAppointmentEvents.VIDEO_CHAT_MESSAGE, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      return unsubscribe;
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to waiting room events
   */
  const subscribeToWaitingRoom = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeJoined = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_JOINED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeLeft = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_LEFT, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeAdmitted = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_ADMITTED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });

      return () => {
        unsubscribeJoined();
        unsubscribeLeft();
        unsubscribeAdmitted();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to medical notes events
   */
  const subscribeToMedicalNotes = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeCreated = subscribe(VideoAppointmentEvents.VIDEO_NOTE_CREATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeUpdated = subscribe(VideoAppointmentEvents.VIDEO_NOTE_UPDATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });

      return () => {
        unsubscribeCreated();
        unsubscribeUpdated();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to call quality updates
   */
  const subscribeToCallQuality = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribe = subscribe(VideoAppointmentEvents.VIDEO_QUALITY_UPDATE, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      return unsubscribe;
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to annotation events
   */
  const subscribeToAnnotations = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeCreated = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_CREATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeUpdated = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_UPDATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeDeleted = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_DELETED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });

      return () => {
        unsubscribeCreated();
        unsubscribeUpdated();
        unsubscribeDeleted();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to transcription events
   */
  const subscribeToTranscription = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeSegment = subscribe(VideoAppointmentEvents.VIDEO_TRANSCRIPTION_SEGMENT, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeStarted = subscribe(VideoAppointmentEvents.VIDEO_TRANSCRIPTION_STARTED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      const unsubscribeStopped = subscribe(VideoAppointmentEvents.VIDEO_TRANSCRIPTION_STOPPED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });

      return () => {
        unsubscribeSegment();
        unsubscribeStarted();
        unsubscribeStopped();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Send chat message
   */
  const sendChatMessage = useCallback(
    (appointmentId: string, message: string, attachments?: Array<{ type: string; url: string; name: string }>) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_CHAT_MESSAGE, {
        appointmentId,
        message,
        attachments,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(
    (appointmentId: string, isTyping: boolean) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, cannot send event');
        return;
      }

      emit(VideoAppointmentEvents.VIDEO_CHAT_TYPING, {
        appointmentId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, isConnected]
  );

  return {
    // Subscriptions
    subscribeToVideoAppointments,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    subscribeToChatMessages,
    subscribeToWaitingRoom,
    subscribeToMedicalNotes,
    subscribeToCallQuality,
    subscribeToAnnotations,
    subscribeToTranscription,
    
    // Event emitters
    sendVideoAppointmentEvent,
    sendParticipantJoined,
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped,
    sendChatMessage,
    sendTypingIndicator,
    
    // Connection status
    isConnected,
  };
}

