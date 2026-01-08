"use client";

import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '@/lib/config/config';
import { useHealthStore } from '@/stores/health.store';
import { DetailedHealthStatus } from './useHealth';

// Realtime health status types matching backend format
export interface RealtimeHealthStatus {
  t: string; // timestamp (ISO 8601)
  o: 'healthy' | 'degraded' | 'unhealthy'; // overall status
  s: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      responseTime?: number;
      error?: string;
      details?: string;
    };
  };
  sys?: {
    cpu: number;
    memory: number;
    activeConnections: number;
    requestRate: number;
    errorRate: number;
  };
  u: number; // uptime in seconds
}

export interface HealthUpdate {
  t: string; // timestamp
  ty: 'service' | 'system'; // type
  id: string; // service ID
  st: 'healthy' | 'degraded' | 'unhealthy'; // status
  rt?: number; // response time
}

export interface HealthHeartbeat {
  t: string; // timestamp
  o: 'healthy' | 'degraded' | 'unhealthy'; // overall status
}

// Convert realtime format to DetailedHealthStatus format
function convertRealtimeToDetailed(realtime: RealtimeHealthStatus): DetailedHealthStatus {
  const services = realtime.s;
  const result: DetailedHealthStatus = {};
  
  // Database
  if (services.database) {
    result.database = {
      status: services.database.status === 'healthy' ? 'up' : 'down',
      isHealthy: services.database.status === 'healthy',
      lastHealthCheck: services.database.timestamp,
    };
    if (services.database.responseTime !== undefined) {
      result.database.avgResponseTime = services.database.responseTime;
    }
    if (services.database.error) {
      result.database.errors = [services.database.error];
    }
  }
  
  // Cache
  if (services.cache) {
    const cacheConnection: {
      connected: boolean;
      latency?: number;
      provider: string;
      providerStatus: string;
    } = {
      connected: services.cache.status === 'healthy',
      provider: 'dragonfly',
      providerStatus: services.cache.status === 'healthy' ? 'connected' : 'disconnected',
    };
    
    if (services.cache.responseTime !== undefined) {
      cacheConnection.latency = services.cache.responseTime;
    }
    
    result.cache = {
      status: services.cache.status === 'healthy' ? 'up' : 'down',
      healthy: services.cache.status === 'healthy',
      connection: cacheConnection,
      provider: 'dragonfly',
    };
    
    if (services.cache.responseTime !== undefined) {
      result.cache.latency = services.cache.responseTime;
    }
  }
  
  // Queue
  if (services.queue) {
    const queueConnection: NonNullable<DetailedHealthStatus['queue']>['connection'] = {
      connected: services.queue.status === 'healthy',
      provider: 'bullmq',
    };
    
    if (services.queue.responseTime !== undefined) {
      queueConnection.latency = services.queue.responseTime;
    }
    
    result.queue = {
      status: services.queue.status === 'healthy' ? 'up' : 'down',
      healthy: services.queue.status === 'healthy',
      connection: queueConnection,
    };
  }
  
  // Communication
  if (services.communication || services.socket) {
    const commStatus = services.communication?.status || services.socket?.status;
    const isHealthy = commStatus === 'healthy';
    const isDegraded = commStatus === 'degraded';
    
    result.communication = {
      status: isHealthy ? 'up' : 'down',
      healthy: isHealthy,
    };
    
    if (isDegraded) {
      result.communication.degraded = true;
    }
    
    if (services.socket) {
      result.communication.socket = {
        connected: services.socket.status === 'healthy',
        connectedClients: 0,
      };
      if (services.socket.responseTime !== undefined) {
        result.communication.socket.latency = services.socket.responseTime;
      }
    }
    
    if (services.email) {
      result.communication.email = {
        connected: services.email.status === 'healthy',
      };
      if (services.email.responseTime !== undefined) {
        result.communication.email.latency = services.email.responseTime;
      }
    }
    
    if (services.whatsapp) {
      result.communication.whatsapp = {
        connected: services.whatsapp.status === 'healthy',
      };
    }
    
    if (services.push) {
      result.communication.push = {
        connected: services.push.status === 'healthy',
      };
    }
  }
  
  // Video
  if (services.video) {
    result.video = {
      status: services.video.status === 'healthy' ? 'up' : 'down',
      primaryProvider: 'openvidu',
    };
    if (services.video.status === 'healthy') {
      result.video.isHealthy = true;
    }
    if (services.video.error) {
      result.video.error = services.video.error;
    }
  }
  
  // Logging
  if (services.logger || services.logging) {
    const loggerStatus = services.logger?.status || services.logging?.status;
    const isHealthy = loggerStatus === 'healthy';
    const responseTime = services.logger?.responseTime || services.logging?.responseTime;
    const error = services.logger?.error || services.logging?.error;
    
    const loggingService: NonNullable<DetailedHealthStatus['logging']>['service'] = {
      available: isHealthy,
      serviceName: 'LoggingService',
    };
    
    if (responseTime !== undefined) {
      loggingService.latency = responseTime;
    }
    
    result.logging = {
      status: isHealthy ? 'up' : 'down',
      service: loggingService,
    };
    
    if (isHealthy) {
      result.logging.healthy = true;
    }
    
    if (error) {
      result.logging.error = error;
    }
  }
  
  return result;
}

export interface UseHealthRealtimeOptions {
  enabled?: boolean;
}

export interface UseHealthRealtimeReturn {
  socket: Socket | null;
  reconnect: () => void;
  subscribe: () => void;
  unsubscribe: () => void;
}

/**
 * Hook for real-time health monitoring via Socket.IO
 * Uses Zustand store for state management
 */
export function useHealthRealtime(
  options: UseHealthRealtimeOptions = {}
): UseHealthRealtimeReturn {
  const {
    enabled = true,
  } = options;

  // Get store actions
  const setHealthStatus = useHealthStore((state) => state.setHealthStatus);
  const setConnectionStatus = useHealthStore((state) => state.setConnectionStatus);
  const setIsConnected = useHealthStore((state) => state.setIsConnected);
  const setLastUpdate = useHealthStore((state) => state.setLastUpdate);
  const setError = useHealthStore((state) => state.setError);

  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!enabled) return;

    const API_URL = APP_CONFIG.API.BASE_URL;
    const healthSocket = io(`${API_URL}/health`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
    });

    socketRef.current = healthSocket;

    // Connection events
    healthSocket.on('connect', () => {
      console.log('✅ Health monitoring connected via Socket.IO to /health namespace');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      
      // Auto-subscribe to health updates on connection
      healthSocket.emit('health:subscribe', { room: 'health:all' }, (response: { success: boolean; status?: RealtimeHealthStatus }) => {
        if (response.success && response.status) {
          const converted = convertRealtimeToDetailed(response.status);
          setHealthStatus(converted);
          setLastUpdate(new Date(response.status.t));
          console.log('✅ Auto-subscribed to health updates on connection');
        }
      });
    });

    healthSocket.on('disconnect', (reason) => {
      console.log('❌ Health monitoring disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // ⚠️ FALLBACK: Start REST polling if Socket.IO disconnects
      // Note: BackendStatusIndicator also has polling fallback
      // This ensures health data is still available even if Socket.IO fails
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.warn('⚠️ Socket.IO disconnected, component will use REST polling fallback');
      }
    });

    healthSocket.on('connect_error', (err) => {
      console.error('❌ Health monitoring connection error:', err);
      setConnectionStatus('error');
      setError(err);
      
      // ⚠️ FALLBACK: Connection error - component will use REST polling fallback
      console.warn('⚠️ Socket.IO connection error, component will use REST polling fallback');
    });

    // Health status events
    healthSocket.on('health:status', (data: RealtimeHealthStatus) => {
      try {
        const converted = convertRealtimeToDetailed(data);
        setHealthStatus(converted);
        setLastUpdate(new Date(data.t));
        setError(null);
      } catch (err) {
        console.error('Error converting health status:', err);
        setError(err instanceof Error ? err : new Error('Invalid health data'));
      }
    });

    healthSocket.on('health:service:update', (update: HealthUpdate) => {
      // Update service status in Zustand store
      const currentStatus = useHealthStore.getState().healthStatus;
      if (!currentStatus) return;

      const updated = { ...currentStatus };
      
      // Map service IDs to our format
      if (update.id === 'database' && updated.database) {
        updated.database = {
          ...updated.database,
          status: update.st === 'healthy' ? 'up' : 'down',
          isHealthy: update.st === 'healthy',
          ...(update.rt !== undefined && { avgResponseTime: update.rt }),
          lastHealthCheck: update.t,
        };
      } else if (update.id === 'cache' && updated.cache) {
        updated.cache = {
          ...updated.cache,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
          ...(update.rt !== undefined && { latency: update.rt }),
          connection: updated.cache.connection ? {
            ...updated.cache.connection,
            connected: update.st === 'healthy',
            ...(update.rt !== undefined && { latency: update.rt }),
          } : {
            connected: update.st === 'healthy',
            ...(update.rt !== undefined && { latency: update.rt }),
            provider: 'dragonfly',
          },
        };
      } else if (update.id === 'queue' && updated.queue) {
        updated.queue = {
          ...updated.queue,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
          connection: updated.queue.connection ? {
            ...updated.queue.connection,
            connected: update.st === 'healthy',
            ...(update.rt !== undefined && { latency: update.rt }),
          } : {
            connected: update.st === 'healthy',
            ...(update.rt !== undefined && { latency: update.rt }),
            provider: 'bullmq',
          },
        };
      } else if (update.id === 'communication' || update.id === 'socket') {
        if (updated.communication) {
          const commUpdate: typeof updated.communication = {
            ...updated.communication,
            status: update.st === 'healthy' ? 'up' : 'down',
            healthy: update.st === 'healthy',
          };
          
          if (update.st === 'degraded') {
            commUpdate.degraded = true;
          }
          
          if (updated.communication.socket) {
            commUpdate.socket = {
              ...updated.communication.socket,
              connected: update.st === 'healthy',
            };
            if (update.rt !== undefined) {
              commUpdate.socket.latency = update.rt;
            }
          }
          
          updated.communication = commUpdate;
        }
      } else if (update.id === 'video' && updated.video) {
        updated.video = {
          ...updated.video,
          status: update.st === 'healthy' ? 'up' : 'down',
          ...(update.st === 'healthy' && { isHealthy: true }),
        };
      } else if ((update.id === 'logger' || update.id === 'logging') && updated.logging) {
        const loggingUpdate: typeof updated.logging = {
          ...updated.logging,
          status: update.st === 'healthy' ? 'up' : 'down',
        };
        
        if (update.st === 'healthy') {
          loggingUpdate.healthy = true;
        }
        
        if (updated.logging.service) {
          loggingUpdate.service = {
            ...updated.logging.service,
            available: update.st === 'healthy',
          };
          if (update.rt !== undefined) {
            loggingUpdate.service.latency = update.rt;
          }
        }
        
        updated.logging = loggingUpdate;
      }
      
      setHealthStatus(updated);
      setLastUpdate(new Date(update.t));
    });

    healthSocket.on('health:heartbeat', (heartbeat: HealthHeartbeat) => {
      setLastUpdate(new Date(heartbeat.t));
    });

    setConnectionStatus('connecting');

    // Cleanup
    return () => {
      healthSocket.disconnect();
    };
  }, [enabled, setHealthStatus, setConnectionStatus, setIsConnected, setLastUpdate, setError]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  const subscribe = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('health:subscribe', { room: 'health:all' }, (response: { success: boolean; status?: RealtimeHealthStatus }) => {
        if (response.success && response.status) {
          const converted = convertRealtimeToDetailed(response.status);
          setHealthStatus(converted);
          setLastUpdate(new Date(response.status.t));
        }
      });
    }
  }, [setHealthStatus, setLastUpdate]);

  const unsubscribe = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('health:unsubscribe', () => {});
    }
  }, []);

  return {
    socket: socketRef.current,
    reconnect,
    subscribe,
    unsubscribe,
  };
}
