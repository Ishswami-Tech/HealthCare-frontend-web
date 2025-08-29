// ✅ WebSocket Client for Healthcare Frontend
// This module provides real-time communication with the backend using WebSockets

export interface WebSocketMessage {
  type: string;
  action: string;
  data: any;
  timestamp: string;
  requestId?: string;
  userId?: string;
  clinicId?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

// ✅ WebSocket Event Types
export enum WebSocketEventType {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  ERROR = 'error',

  // Video Appointment Events
  VIDEO_APPOINTMENT_CREATED = 'video_appointment_created',
  VIDEO_APPOINTMENT_UPDATED = 'video_appointment_updated',
  VIDEO_APPOINTMENT_JOINED = 'video_appointment_joined',
  VIDEO_APPOINTMENT_LEFT = 'video_appointment_left',
  VIDEO_APPOINTMENT_ENDED = 'video_appointment_ended',
  VIDEO_PARTICIPANT_JOINED = 'video_participant_joined',
  VIDEO_PARTICIPANT_LEFT = 'video_participant_left',
  VIDEO_RECORDING_STARTED = 'video_recording_started',
  VIDEO_RECORDING_STOPPED = 'video_recording_stopped',

  // Appointment Events
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',

  // Queue Events
  QUEUE_UPDATED = 'queue_updated',
  PATIENT_CALLED = 'patient_called',
  QUEUE_POSITION_CHANGED = 'queue_position_changed',

  // Notification Events
  NOTIFICATION_RECEIVED = 'notification_received',
  MESSAGE_RECEIVED = 'message_received',
  ALERT_TRIGGERED = 'alert_triggered',

  // System Events
  SYSTEM_MAINTENANCE = 'system_maintenance',
  CLINIC_STATUS_CHANGED = 'clinic_status_changed',
  USER_STATUS_CHANGED = 'user_status_changed',

  // Health Check Events
  HEALTH_CHECK = 'health_check',
  BACKEND_STATUS = 'backend_status',
}

// ✅ WebSocket Client Class
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: WebSocketEventHandlers;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualDisconnect = false;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: WebSocketConfig, eventHandlers: WebSocketEventHandlers = {}) {
    this.config = config;
    this.eventHandlers = eventHandlers;
  }

  // ✅ Connect to WebSocket
  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      this.isManualDisconnect = false;

      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);

      // Set connection timeout
      setTimeout(() => {
        if (this.socket?.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      }, this.config.timeout);

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleError(error as Event);
    }
  }

  // ✅ Disconnect from WebSocket
  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
  }

  // ✅ Send Message
  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message for later if not connected
      this.messageQueue.push(message);
    }
  }

  // ✅ Subscribe to Event
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  // ✅ Unsubscribe from Event
  unsubscribe(eventType: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  // ✅ Get Connection Status
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.readyState === WebSocket.OPEN) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  // ✅ Handle Connection Open
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.flushMessageQueue();

    // Emit connect event
    this.emitEvent(WebSocketEventType.CONNECT);
    this.eventHandlers.onConnect?.();
  }

  // ✅ Handle Connection Close
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isConnecting = false;
    this.stopHeartbeat();

    // Emit disconnect event
    this.emitEvent(WebSocketEventType.DISCONNECT, { code: event.code, reason: event.reason });
    this.eventHandlers.onDisconnect?.(event.reason);

    // Attempt to reconnect if not manual disconnect
    if (!this.isManualDisconnect && this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  // ✅ Handle Message
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Emit message event
      this.emitEvent(WebSocketEventType.MESSAGE_RECEIVED, message);
      this.eventHandlers.onMessage?.(message);

      // Emit specific event type
      if (message.type) {
        this.emitEvent(message.type, message.data);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // ✅ Handle Error
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emitEvent(WebSocketEventType.ERROR, error);
    this.eventHandlers.onError?.(error);
  }

  // ✅ Schedule Reconnect
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.emitEvent(WebSocketEventType.RECONNECT, { attempt: this.reconnectAttempts });
      this.eventHandlers.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  // ✅ Start Heartbeat
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({
          type: WebSocketEventType.HEALTH_CHECK,
          action: 'ping',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  // ✅ Stop Heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ✅ Clear Reconnect Timeout
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ✅ Flush Message Queue
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // ✅ Emit Event
  private emitEvent(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }
}

// ✅ WebSocket Service for Healthcare
export class HealthcareWebSocketService {
  private static instance: HealthcareWebSocketService;
  private client: WebSocketClient | null = null;
  private config: WebSocketConfig;

  private constructor() {
    this.config = {
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/ws',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000, // 30 seconds
      timeout: 10000, // 10 seconds
    };
  }

  static getInstance(): HealthcareWebSocketService {
    if (!HealthcareWebSocketService.instance) {
      HealthcareWebSocketService.instance = new HealthcareWebSocketService();
    }
    return HealthcareWebSocketService.instance;
  }

  // ✅ Initialize WebSocket Client
  async initialize(eventHandlers?: WebSocketEventHandlers): Promise<WebSocketClient> {
    if (this.client) {
      return this.client;
    }

    this.client = new WebSocketClient(this.config, eventHandlers);
    await this.client.connect();

    return this.client;
  }

  // ✅ Get WebSocket Client
  getClient(): WebSocketClient | null {
    return this.client;
  }

  // ✅ Connect
  async connect(): Promise<void> {
    if (this.client) {
      await this.client.connect();
    }
  }

  // ✅ Disconnect
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  // ✅ Send Video Appointment Event
  sendVideoAppointmentEvent(action: string, data: any): void {
    if (this.client) {
      this.client.send({
        type: WebSocketEventType.VIDEO_APPOINTMENT_UPDATED,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ✅ Send Queue Event
  sendQueueEvent(action: string, data: any): void {
    if (this.client) {
      this.client.send({
        type: WebSocketEventType.QUEUE_UPDATED,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ✅ Send Notification
  sendNotification(type: string, message: string, data?: any): void {
    if (this.client) {
      this.client.send({
        type: WebSocketEventType.NOTIFICATION_RECEIVED,
        action: 'send',
        data: {
          type,
          message,
          ...data,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ✅ Subscribe to Video Appointment Events
  subscribeToVideoAppointments(callback: (data: any) => void): () => void {
    if (!this.client) {
      throw new Error('WebSocket client not initialized');
    }

    const unsubscribe = this.client.subscribe(WebSocketEventType.VIDEO_APPOINTMENT_UPDATED, callback);
    return unsubscribe;
  }

  // ✅ Subscribe to Queue Events
  subscribeToQueueEvents(callback: (data: any) => void): () => void {
    if (!this.client) {
      throw new Error('WebSocket client not initialized');
    }

    const unsubscribe = this.client.subscribe(WebSocketEventType.QUEUE_UPDATED, callback);
    return unsubscribe;
  }

  // ✅ Subscribe to Notifications
  subscribeToNotifications(callback: (data: any) => void): () => void {
    if (!this.client) {
      throw new Error('WebSocket client not initialized');
    }

    const unsubscribe = this.client.subscribe(WebSocketEventType.NOTIFICATION_RECEIVED, callback);
    return unsubscribe;
  }

  // ✅ Get Connection Status
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    return this.client?.getConnectionStatus() || 'disconnected';
  }
}

// ✅ Export singleton instance
export const healthcareWebSocketService = HealthcareWebSocketService.getInstance();
