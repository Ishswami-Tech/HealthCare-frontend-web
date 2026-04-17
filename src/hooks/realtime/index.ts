// ✅ Real-time Hooks
// WebSocket, FCM, and real-time data synchronization hooks

export { useWebSocketIntegration } from './useWebSocketIntegration';
export type { UseWebSocketIntegrationOptions } from './useWebSocketIntegration';

export { useFCM } from './useFCM';

// Real-time query hooks
export { 
  useRealTimeAppointments,
  useRealTimeAppointmentStats,
  useRealTimeQueueStatus,
  useRealTimeAppointmentMutation,
  useWebSocketQuerySync
} from './useRealTimeQueries';

// Real-time Integration (master hook - merged into useRealTimeQueries)
export { useRealTimeIntegration } from './useRealTimeQueries';

// Backward compatibility: export useWebSocketQuerySync as useRealTimeQueries
export { useWebSocketQuerySync as useRealTimeQueries } from './useRealTimeQueries';

// Health real-time
export { useHealthRealtime } from './useHealthRealtime';

// Video appointment real-time
export { useVideoAppointmentWebSocket } from './useVideoAppointmentSocketIO';
export { useVideoAppointmentWebSocket as useVideoAppointmentSocketIO } from './useVideoAppointmentSocketIO';
export { VideoAppointmentEvents } from './useVideoAppointmentSocketIO';
export type { VideoAppointmentEventData } from './useVideoAppointmentSocketIO';
