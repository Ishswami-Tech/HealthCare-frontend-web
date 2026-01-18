"use client";

import { useWebSocketStore } from '@/stores';
import type { ConnectionOptions } from '@/stores';
type SocketEventData = Record<string, unknown>;
import { APP_CONFIG } from '@/lib/config/config';

export interface WebSocketManagerOptions extends ConnectionOptions {
  url?: string;
  namespace?: string;
  autoConnect?: boolean;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private isInitialized = false;
  private defaultUrl: string;
  private activeConnections = new Map<string, boolean>();

  constructor() {
    // Use centralized config for WebSocket URL
    this.defaultUrl = APP_CONFIG.WEBSOCKET.URL || '';
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initialize(options: { url?: string; autoConnect?: boolean } = {}) {
    if (this.isInitialized) {
      console.warn('WebSocketManager already initialized');
      return;
    }

    this.defaultUrl = options.url || this.defaultUrl;
    this.isInitialized = true;

    console.log('🚀 WebSocketManager initialized with URL:', this.defaultUrl);

    // Auto-connect if specified
    if (options.autoConnect) {
      this.connectDefault();
    }
  }

  private connectDefault() {
    if (typeof window !== 'undefined') {
      const { connect } = useWebSocketStore.getState();
      connect(this.defaultUrl, {
        autoReconnect: true,
        reconnectionAttempts: 5,
      });
    }
  }

  connect(options: WebSocketManagerOptions = {}) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized. Call initialize() first.');
    }

    const {
      url = this.defaultUrl,
      namespace = '',
      autoConnect = true,
      ...connectionOptions
    } = options;

    const connectionKey = `${url}${namespace}`;
    
    if (this.activeConnections.has(connectionKey)) {
      console.warn(`Connection already exists for ${connectionKey}`);
      return;
    }

    const { connect } = useWebSocketStore.getState();
    
    try {
      connect(url, {
        ...connectionOptions,
        namespace,
        autoReconnect: autoConnect,
      });

      this.activeConnections.set(connectionKey, true);
      console.log(`📡 Connected to ${connectionKey}`);

    } catch (error) {
      console.error(`Failed to connect to ${connectionKey}:`, error);
      throw error;
    }
  }

  disconnect(namespace = '') {
    const connectionKey = `${this.defaultUrl}${namespace}`;
    
    if (!this.activeConnections.has(connectionKey)) {
      console.warn(`No active connection found for ${connectionKey}`);
      return;
    }

    const { disconnect } = useWebSocketStore.getState();
    disconnect();
    
    this.activeConnections.delete(connectionKey);
    console.log(`🔌 Disconnected from ${connectionKey}`);
  }

  emit(event: string, data: SocketEventData, _namespace = '') {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    const { emit, isConnected } = useWebSocketStore.getState();
    
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }

    emit(event, data);
  }

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    const { subscribe } = useWebSocketStore.getState();
    return subscribe(event, callback);
  }

  getConnectionStatus() {
    const { connectionStatus, isConnected, error, connectionMetrics } = useWebSocketStore.getState();
    
    return {
      status: connectionStatus,
      isConnected,
      error,
      metrics: connectionMetrics,
      activeConnections: Array.from(this.activeConnections.keys()),
    };
  }

  // Healthcare-specific connection helpers
  connectToQueue(options: Omit<ConnectionOptions, 'namespace'> = {}) {
    return this.connect({
      ...options,
      namespace: '/queue-status',
    });
  }

  connectToAppointments(options: Omit<ConnectionOptions, 'namespace'> = {}) {
    return this.connect({
      ...options,
      namespace: '/appointments',
    });
  }

  connectToNotifications(options: Omit<ConnectionOptions, 'namespace'> = {}) {
    return this.connect({
      ...options,
      namespace: '/notifications',
    });
  }

  // Queue-specific methods
  subscribeToQueue(queueName: string, filters?: any) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    this.emit('subscribe_queue', { queueName, filters }, '/queue-status');
  }

  unsubscribeFromQueue(queueName: string) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    this.emit('unsubscribe_queue', { queueName }, '/queue-status');
  }

  getQueueMetrics(queueNames?: string[], detailed = false) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    this.emit('get_queue_metrics', { queueNames, detailed }, '/queue-status');
  }

  // Appointment-specific methods
  subscribeToAppointmentUpdates(filters?: { clinicId?: string; doctorId?: string; patientId?: string }) {
    if (!this.isInitialized) {
      throw new Error('WebSocketManager not initialized');
    }

    this.emit('subscribe_appointments', filters || {}, '/appointments');
  }

  // Utility methods
  isConnected(namespace = ''): boolean {
    const connectionKey = `${this.defaultUrl}${namespace}`;
    return this.activeConnections.has(connectionKey) && useWebSocketStore.getState().isConnected;
  }

  reconnect() {
    const { reconnect } = useWebSocketStore.getState();
    reconnect();
  }

  clearError() {
    const { clearError } = useWebSocketStore.getState();
    clearError();
  }

  destroy() {
    console.log('🧹 Cleaning up WebSocketManager');
    
    // Disconnect all active connections
    for (const _connectionKey of this.activeConnections.keys()) {
      this.disconnect();
    }

    this.activeConnections.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const websocketManager = WebSocketManager.getInstance();

// React Hook for easy access
export function useWebSocketManager() {
  return websocketManager;
}

// Environment-specific configuration
export const getWebSocketConfig = () => {
  // Use centralized config for WebSocket URL
  return {
    url: APP_CONFIG.WEBSOCKET.URL,
    reconnectionAttempts: APP_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: APP_CONFIG.IS_DEVELOPMENT ? 1000 : 2000,
    timeout: APP_CONFIG.WEBSOCKET.TIMEOUT,
    autoConnect: true,
  };
};
