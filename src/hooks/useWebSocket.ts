// ✅ WebSocket Hooks for Healthcare Frontend
// This file provides React hooks for real-time WebSocket communication

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { 
  healthcareWebSocketService, 
  WebSocketEventType, 
  WebSocketEventHandlers,
  WebSocketMessage 
} from '@/lib/websocket/websocket-client';

// ✅ WebSocket Connection Hook
export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      const eventHandlers: WebSocketEventHandlers = {
        onConnect: () => {
          setIsConnected(true);
          setConnectionStatus('connected');
          toast({
            title: 'Connected',
            description: 'Real-time connection established',
          });
        },
        onDisconnect: (reason) => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          toast({
            title: 'Disconnected',
            description: `Connection lost: ${reason}`,
            variant: 'destructive',
          });
        },
        onReconnect: (attempt) => {
          setConnectionStatus('reconnecting');
          toast({
            title: 'Reconnecting',
            description: `Attempt ${attempt} to reconnect...`,
          });
        },
        onError: (error) => {
          setError('WebSocket connection error');
          toast({
            title: 'Connection Error',
            description: 'Failed to establish real-time connection',
            variant: 'destructive',
          });
        },
        onMessage: (message) => {
          setLastMessage(message);
        },
      };

      await healthcareWebSocketService.initialize(eventHandlers);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect');
      toast({
        title: 'Connection Failed',
        description: 'Unable to establish real-time connection',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ✅ Disconnect WebSocket
  const disconnect = useCallback(() => {
    healthcareWebSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // ✅ Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    const client = healthcareWebSocketService.getClient();
    if (client) {
      client.send(message);
    }
  }, []);

  // ✅ Subscribe to events
  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    const client = healthcareWebSocketService.getClient();
    if (client) {
      return client.subscribe(eventType, callback);
    }
    return () => {}; // No-op if not connected
  }, []);

  // ✅ Auto-connect on mount
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // ✅ Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = healthcareWebSocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    subscribe,
  };
}

// ✅ Video Appointment WebSocket Hook
export function useVideoAppointmentWebSocket() {
  const { subscribe, sendMessage } = useWebSocket();
  const { toast } = useToast();

  // ✅ Subscribe to video appointment events
  const subscribeToVideoAppointments = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.VIDEO_APPOINTMENT_UPDATED, callback);
  }, [subscribe]);

  // ✅ Subscribe to participant events
  const subscribeToParticipantEvents = useCallback((callback: (data: any) => void) => {
    const unsubscribeJoined = subscribe(WebSocketEventType.VIDEO_PARTICIPANT_JOINED, callback);
    const unsubscribeLeft = subscribe(WebSocketEventType.VIDEO_PARTICIPANT_LEFT, callback);
    
    return () => {
      unsubscribeJoined();
      unsubscribeLeft();
    };
  }, [subscribe]);

  // ✅ Subscribe to recording events
  const subscribeToRecordingEvents = useCallback((callback: (data: any) => void) => {
    const unsubscribeStarted = subscribe(WebSocketEventType.VIDEO_RECORDING_STARTED, callback);
    const unsubscribeStopped = subscribe(WebSocketEventType.VIDEO_RECORDING_STOPPED, callback);
    
    return () => {
      unsubscribeStarted();
      unsubscribeStopped();
    };
  }, [subscribe]);

  // ✅ Send video appointment event
  const sendVideoAppointmentEvent = useCallback((action: string, data: any) => {
    sendMessage({
      type: WebSocketEventType.VIDEO_APPOINTMENT_UPDATED,
      action,
      data,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send participant joined event
  const sendParticipantJoined = useCallback((appointmentId: string, participant: any) => {
    sendMessage({
      type: WebSocketEventType.VIDEO_PARTICIPANT_JOINED,
      action: 'participant_joined',
      data: {
        appointmentId,
        participant,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send participant left event
  const sendParticipantLeft = useCallback((appointmentId: string, participant: any) => {
    sendMessage({
      type: WebSocketEventType.VIDEO_PARTICIPANT_LEFT,
      action: 'participant_left',
      data: {
        appointmentId,
        participant,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send recording started event
  const sendRecordingStarted = useCallback((appointmentId: string, recordingData: any) => {
    sendMessage({
      type: WebSocketEventType.VIDEO_RECORDING_STARTED,
      action: 'recording_started',
      data: {
        appointmentId,
        recordingData,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send recording stopped event
  const sendRecordingStopped = useCallback((appointmentId: string, recordingData: any) => {
    sendMessage({
      type: WebSocketEventType.VIDEO_RECORDING_STOPPED,
      action: 'recording_stopped',
      data: {
        appointmentId,
        recordingData,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  return {
    subscribeToVideoAppointments,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    sendVideoAppointmentEvent,
    sendParticipantJoined,
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped,
  };
}

// ✅ Queue WebSocket Hook
export function useQueueWebSocket() {
  const { subscribe, sendMessage } = useWebSocket();
  const { toast } = useToast();

  // ✅ Subscribe to queue events
  const subscribeToQueueEvents = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.QUEUE_UPDATED, callback);
  }, [subscribe]);

  // ✅ Subscribe to patient called events
  const subscribeToPatientCalled = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.PATIENT_CALLED, callback);
  }, [subscribe]);

  // ✅ Subscribe to queue position changes
  const subscribeToQueuePositionChanges = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.QUEUE_POSITION_CHANGED, callback);
  }, [subscribe]);

  // ✅ Send queue update event
  const sendQueueUpdate = useCallback((queueType: string, queueData: any) => {
    sendMessage({
      type: WebSocketEventType.QUEUE_UPDATED,
      action: 'queue_updated',
      data: {
        queueType,
        queueData,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send patient called event
  const sendPatientCalled = useCallback((queueType: string, patientData: any) => {
    sendMessage({
      type: WebSocketEventType.PATIENT_CALLED,
      action: 'patient_called',
      data: {
        queueType,
        patientData,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  return {
    subscribeToQueueEvents,
    subscribeToPatientCalled,
    subscribeToQueuePositionChanges,
    sendQueueUpdate,
    sendPatientCalled,
  };
}

// ✅ Notification WebSocket Hook
export function useNotificationWebSocket() {
  const { subscribe, sendMessage } = useWebSocket();
  const { toast } = useToast();

  // ✅ Subscribe to notifications
  const subscribeToNotifications = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.NOTIFICATION_RECEIVED, callback);
  }, [subscribe]);

  // ✅ Subscribe to messages
  const subscribeToMessages = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.MESSAGE_RECEIVED, callback);
  }, [subscribe]);

  // ✅ Subscribe to alerts
  const subscribeToAlerts = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.ALERT_TRIGGERED, callback);
  }, [subscribe]);

  // ✅ Send notification
  const sendNotification = useCallback((type: string, message: string, data?: any) => {
    sendMessage({
      type: WebSocketEventType.NOTIFICATION_RECEIVED,
      action: 'send_notification',
      data: {
        type,
        message,
        ...data,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send message
  const sendMessageToUser = useCallback((userId: string, message: string, data?: any) => {
    sendMessage({
      type: WebSocketEventType.MESSAGE_RECEIVED,
      action: 'send_message',
      data: {
        userId,
        message,
        ...data,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  return {
    subscribeToNotifications,
    subscribeToMessages,
    subscribeToAlerts,
    sendNotification,
    sendMessageToUser,
  };
}

// ✅ Appointment WebSocket Hook
export function useAppointmentWebSocket() {
  const { subscribe, sendMessage } = useWebSocket();
  const { toast } = useToast();

  // ✅ Subscribe to appointment events
  const subscribeToAppointmentEvents = useCallback((callback: (data: any) => void) => {
    const unsubscribeCreated = subscribe(WebSocketEventType.APPOINTMENT_CREATED, callback);
    const unsubscribeUpdated = subscribe(WebSocketEventType.APPOINTMENT_UPDATED, callback);
    const unsubscribeCancelled = subscribe(WebSocketEventType.APPOINTMENT_CANCELLED, callback);
    
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCancelled();
    };
  }, [subscribe]);

  // ✅ Subscribe to appointment reminders
  const subscribeToAppointmentReminders = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.APPOINTMENT_REMINDER, callback);
  }, [subscribe]);

  // ✅ Send appointment created event
  const sendAppointmentCreated = useCallback((appointmentData: any) => {
    sendMessage({
      type: WebSocketEventType.APPOINTMENT_CREATED,
      action: 'appointment_created',
      data: appointmentData,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send appointment updated event
  const sendAppointmentUpdated = useCallback((appointmentData: any) => {
    sendMessage({
      type: WebSocketEventType.APPOINTMENT_UPDATED,
      action: 'appointment_updated',
      data: appointmentData,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // ✅ Send appointment cancelled event
  const sendAppointmentCancelled = useCallback((appointmentId: string, reason: string) => {
    sendMessage({
      type: WebSocketEventType.APPOINTMENT_CANCELLED,
      action: 'appointment_cancelled',
      data: {
        appointmentId,
        reason,
      },
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  return {
    subscribeToAppointmentEvents,
    subscribeToAppointmentReminders,
    sendAppointmentCreated,
    sendAppointmentUpdated,
    sendAppointmentCancelled,
  };
}

// ✅ System WebSocket Hook
export function useSystemWebSocket() {
  const { subscribe } = useWebSocket();
  const { toast } = useToast();

  // ✅ Subscribe to system maintenance events
  const subscribeToSystemMaintenance = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.SYSTEM_MAINTENANCE, callback);
  }, [subscribe]);

  // ✅ Subscribe to clinic status changes
  const subscribeToClinicStatusChanges = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.CLINIC_STATUS_CHANGED, callback);
  }, [subscribe]);

  // ✅ Subscribe to user status changes
  const subscribeToUserStatusChanges = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.USER_STATUS_CHANGED, callback);
  }, [subscribe]);

  // ✅ Subscribe to backend status
  const subscribeToBackendStatus = useCallback((callback: (data: any) => void) => {
    return subscribe(WebSocketEventType.BACKEND_STATUS, callback);
  }, [subscribe]);

  return {
    subscribeToSystemMaintenance,
    subscribeToClinicStatusChanges,
    subscribeToUserStatusChanges,
    subscribeToBackendStatus,
  };
}
