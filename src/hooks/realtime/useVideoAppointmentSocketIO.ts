"use client";
import { nowIso } from '@/lib/utils/date-time';

/**
 * Video Appointment Socket.IO Hook
 * Provides real-time video appointment updates using Socket.IO
 * Replaces native WebSocket implementation
 */

import { useCallback } from 'react';
import { useWebSocketStore } from '@/stores';

// Video appointment event types (Socket.IO events)
export const VideoAppointmentEvents = {
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CONSULTATION_STARTED: 'appointment.consultation_started',
  VIDEO_CONSULTATION_STARTED: 'video.consultation.started',
  VIDEO_CONSULTATION_ENDED: 'video.consultation.ended',
  CONSULTATION_EVENT: 'consultation.event',
  VIDEO_PARTICIPANT_MANAGED: 'video.participant.managed',
  VIDEO_PARTICIPANT_JOINED: 'video_participant:joined',
  VIDEO_PARTICIPANT_LEFT: 'video_participant:left',
  VIDEO_RECORDING_STARTED: 'video_recording:started',
  VIDEO_RECORDING_STOPPED: 'video_recording:stopped',
  VIDEO_RECORDING_STARTED_BACKEND: 'video.recording.started',
  VIDEO_RECORDING_STOPPED_BACKEND: 'video.recording.stopped',
  VIDEO_VIRTUAL_BACKGROUND_UPDATED_BACKEND: 'video.virtual_background.updated',
  // Phase 1 & 2 Events - Match backend Socket.IO event names
  VIDEO_CHAT_MESSAGE_BACKEND: 'video.chat.message.sent',
  VIDEO_CHAT_TYPING: 'chat_typing',
  VIDEO_WAITING_ROOM_JOINED_BACKEND: 'video.waiting_room.joined',
  VIDEO_WAITING_ROOM_LEFT: 'waiting_room_left',
  VIDEO_WAITING_ROOM_ADMITTED_BACKEND: 'video.waiting_room.admitted',
  VIDEO_NOTE_CREATED_BACKEND: 'video.medical_note.created',
  VIDEO_NOTE_UPDATED: 'note_updated',
  VIDEO_QUALITY_UPDATE_BACKEND: 'video.quality.critical_warning',
  VIDEO_ANNOTATION_CREATED_BACKEND: 'video.annotation.created',
  VIDEO_ANNOTATION_UPDATED: 'annotation_updated',
  VIDEO_ANNOTATION_DELETED: 'annotation_deleted',
  VIDEO_TRANSCRIPTION_CREATED_BACKEND: 'video.transcription.created',
  VIDEO_TRANSCRIPTION_SAVED_TO_EHR_BACKEND: 'video.transcription.saved_to_ehr',
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

  /**
   * Subscribe to video appointment updates
   */
  const subscribeToVideoAppointments = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {}; // Return no-op unsubscribe
      }

      const unsubscribe = subscribe(VideoAppointmentEvents.APPOINTMENT_UPDATED, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      return unsubscribe;
    },
    [subscribe, isConnected]
  );

  const subscribeToConsultationEvents = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeStarted = subscribe(
        VideoAppointmentEvents.VIDEO_CONSULTATION_STARTED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), eventType: VideoAppointmentEvents.VIDEO_CONSULTATION_STARTED });
        }
      );
      const unsubscribeAppointmentStarted = subscribe(
        VideoAppointmentEvents.APPOINTMENT_CONSULTATION_STARTED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), eventType: VideoAppointmentEvents.APPOINTMENT_CONSULTATION_STARTED });
        }
      );
      const unsubscribeEnded = subscribe(
        VideoAppointmentEvents.VIDEO_CONSULTATION_ENDED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), eventType: VideoAppointmentEvents.VIDEO_CONSULTATION_ENDED });
        }
      );
      const unsubscribeConsultationEvent = subscribe(
        VideoAppointmentEvents.CONSULTATION_EVENT,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), eventType: VideoAppointmentEvents.CONSULTATION_EVENT });
        }
      );
      const unsubscribeTokenGenerated = subscribe('video.token.generated', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), eventType: 'video.token.generated' });
      });
      const unsubscribeConsultationFailed = subscribe('video.consultation.status.failed', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), eventType: 'video.consultation.status.failed' });
      });
      const unsubscribeTechnicalIssue = subscribe('video.technical.issue.reported', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), eventType: 'video.technical.issue.reported' });
      });
      const unsubscribeMedicalImage = subscribe('video.medical.image.shared', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), eventType: 'video.medical.image.shared' });
      });

      return () => {
        unsubscribeStarted();
        unsubscribeAppointmentStarted();
        unsubscribeEnded();
        unsubscribeConsultationEvent();
        unsubscribeTokenGenerated();
        unsubscribeConsultationFailed();
        unsubscribeTechnicalIssue();
        unsubscribeMedicalImage();
      };
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

      const unsubscribeManaged = subscribe(VideoAppointmentEvents.VIDEO_PARTICIPANT_MANAGED, (data: unknown) => {
        const payload = data as VideoAppointmentEventData & { action?: string };
        callback({
          ...payload,
          action: payload.action || 'participant_managed',
        });
      });
      const unsubscribeJoined = subscribe(
        VideoAppointmentEvents.VIDEO_PARTICIPANT_JOINED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), action: 'participant_joined' });
        }
      );
      const unsubscribeLeft = subscribe(
        VideoAppointmentEvents.VIDEO_PARTICIPANT_LEFT,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), action: 'participant_left' });
        }
      );

      return () => {
        unsubscribeManaged();
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

      const unsubscribeStartedBackend = subscribe(VideoAppointmentEvents.VIDEO_RECORDING_STARTED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'recording_started' });
      });
      const unsubscribeStarted = subscribe(
        VideoAppointmentEvents.VIDEO_RECORDING_STARTED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), action: 'recording_started' });
        }
      );
      const unsubscribeStoppedBackend = subscribe(VideoAppointmentEvents.VIDEO_RECORDING_STOPPED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'recording_stopped' });
      });
      const unsubscribeStopped = subscribe(
        VideoAppointmentEvents.VIDEO_RECORDING_STOPPED,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), action: 'recording_stopped' });
        }
      );
      const unsubscribeLegacyStarted = subscribe('recording_started', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'recording_started' });
      });
      const unsubscribeLegacyStopped = subscribe('recording_stopped', (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'recording_stopped' });
      });

      return () => {
        unsubscribeStartedBackend();
        unsubscribeStarted();
        unsubscribeStoppedBackend();
        unsubscribeStopped();
        unsubscribeLegacyStarted();
        unsubscribeLegacyStopped();
      };
    },
    [subscribe, isConnected]
  );

  /**
   * Subscribe to virtual background updates
   */
  const subscribeToVirtualBackground = useCallback(
    (callback: (data: VideoAppointmentEventData) => void) => {
      if (!isConnected) {
        console.warn('Socket.IO not connected, subscription will be queued');
        return () => {};
      }

      const unsubscribeBackend = subscribe(
        VideoAppointmentEvents.VIDEO_VIRTUAL_BACKGROUND_UPDATED_BACKEND,
        (data: unknown) => {
          callback({ ...(data as VideoAppointmentEventData), action: 'virtual_background_updated' });
        }
      );
      return () => {
        unsubscribeBackend();
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

      emit(VideoAppointmentEvents.APPOINTMENT_UPDATED, {
        action,
        ...data,
        timestamp: nowIso(),
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
        timestamp: nowIso(),
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
        timestamp: nowIso(),
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
        timestamp: nowIso(),
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
        timestamp: nowIso(),
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

      const unsubscribeBackend = subscribe(VideoAppointmentEvents.VIDEO_CHAT_MESSAGE_BACKEND, (data: unknown) => {
        callback(data as VideoAppointmentEventData);
      });
      return () => {
        unsubscribeBackend();
      };
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

      const unsubscribeJoinedBackend = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_JOINED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'waiting_room_joined' });
      });
      const unsubscribeLeft = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_LEFT, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'waiting_room_left' });
      });
      const unsubscribeAdmittedBackend = subscribe(VideoAppointmentEvents.VIDEO_WAITING_ROOM_ADMITTED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'waiting_room_admitted' });
      });

      return () => {
        unsubscribeJoinedBackend();
        unsubscribeLeft();
        unsubscribeAdmittedBackend();
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

      const unsubscribeCreatedBackend = subscribe(VideoAppointmentEvents.VIDEO_NOTE_CREATED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'note_created' });
      });
      const unsubscribeUpdated = subscribe(VideoAppointmentEvents.VIDEO_NOTE_UPDATED, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'note_updated' });
      });

      return () => {
        unsubscribeCreatedBackend();
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

      const unsubscribeBackend = subscribe(VideoAppointmentEvents.VIDEO_QUALITY_UPDATE_BACKEND, (data: unknown) => {
        const payload = data as VideoAppointmentEventData & { metrics?: unknown };
        callback({
          ...payload,
          action: 'quality_update',
          metrics: payload.metrics ?? payload,
        });
      });
      return () => {
        unsubscribeBackend();
      };
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

      const unsubscribeCreatedBackend = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_CREATED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'annotation_created' });
      });
      const unsubscribeUpdated = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_UPDATED, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'annotation_updated' });
      });
      const unsubscribeDeleted = subscribe(VideoAppointmentEvents.VIDEO_ANNOTATION_DELETED, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'annotation_deleted' });
      });

      return () => {
        unsubscribeCreatedBackend();
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

      const unsubscribeCreatedBackend = subscribe(VideoAppointmentEvents.VIDEO_TRANSCRIPTION_CREATED_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'transcription_started' });
      });
      const unsubscribeSavedToEhrBackend = subscribe(VideoAppointmentEvents.VIDEO_TRANSCRIPTION_SAVED_TO_EHR_BACKEND, (data: unknown) => {
        callback({ ...(data as VideoAppointmentEventData), action: 'transcription_stopped' });
      });

      return () => {
        unsubscribeCreatedBackend();
        unsubscribeSavedToEhrBackend();
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

      emit(VideoAppointmentEvents.VIDEO_CHAT_MESSAGE_BACKEND, {
        appointmentId,
        message,
        attachments,
        timestamp: nowIso(),
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
        timestamp: nowIso(),
      });
    },
    [emit, isConnected]
  );

  return {
    // Subscriptions
    subscribeToVideoAppointments,
    subscribeToConsultationEvents,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    subscribeToVirtualBackground,
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
