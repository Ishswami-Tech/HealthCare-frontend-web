import { useQueryData } from '../core/useQueryData';
import { getDetailedHealthStatus } from '@/lib/actions/health.server';
import { useHealthRealtime } from '../realtime/useHealthRealtime';
import { useHealthStore } from '@/stores';
import { useEffect } from 'react';

// Detailed health check response type matching backend structure
export interface DetailedHealthStatus {
  database?: {
    status: string;
    isHealthy: boolean;
    connectionCount?: number;
    activeQueries?: number;
    avgResponseTime?: number;
    lastHealthCheck?: string;
    errors?: string[];
  };
  cache?: {
    status: string;
    healthy: boolean;
    connection?: {
      connected: boolean;
      latency?: number;
      provider?: string;
      providerStatus?: string;
    };
    latency?: number;
    provider?: string;
  };
  queue?: {
    status: string;
    healthy: boolean;
    connection?: {
      connected: boolean;
      latency?: number;
      provider?: string;
    };
    metrics?: {
      totalJobs?: number;
      activeJobs?: number;
      waitingJobs?: number;
      failedJobs?: number;
      completedJobs?: number;
      errorRate?: number;
    };
    performance?: {
      averageProcessingTime?: number;
      throughputPerMinute?: number;
    };
  };
  communication?: {
    status: string;
    healthy: boolean;
    degraded?: boolean;
    circuitBreakerOpen?: boolean;
    socket?: {
      connected: boolean;
      latency?: number;
      connectedClients?: number;
    };
    email?: {
      connected: boolean;
      latency?: number;
    };
    whatsapp?: {
      connected: boolean;
    };
    push?: {
      connected: boolean;
    };
    metrics?: {
      socketConnections?: number;
      emailQueueSize?: number;
    };
    issues?: string[];
  };
  video?: {
    status: string;
    primaryProvider?: string;
    fallbackProvider?: string;
    isHealthy?: boolean;
    error?: string;
  };
  logging?: {
    status: string;
    healthy?: boolean;
    service?: {
      available?: boolean;
      latency?: number;
      serviceName?: string;
    };
    endpoint?: {
      accessible?: boolean;
      latency?: number;
      url?: string;
      port?: number;
      statusCode?: number;
    };
    metrics?: {
      totalLogs?: number;
      errorRate?: number;
      averageResponseTime?: number;
    };
    error?: string;
  };
  uptime?: number;
  system?: {
    cpu?: number;
    memory?: number;
    activeConnections?: number;
    requestRate?: number;
    errorRate?: number;
  };
}

export const useHealthStatus = () => {
  return useQueryData<DetailedHealthStatus>(
    ['healthStatus'],
    async () => {
      const result = await getDetailedHealthStatus();
      return result;
    },
    { refetchInterval: false } // No polling - use Socket.IO only
  );
};

/**
 * Comprehensive health check hook using Socket.IO real-time updates
 * Uses Zustand store for state management
 * Uses React Query with server action for initial fetch
 */
export const useDetailedHealthStatus = () => {
  // Initialize Socket.IO connection (updates Zustand store)
  const { socket, reconnect, subscribe } = useHealthRealtime({ enabled: true });

  // Get state from Zustand store
  const healthStatus = useHealthStore((state) => state.healthStatus);
  const isConnected = useHealthStore((state) => state.isConnected);
  const connectionStatus = useHealthStore((state) => state.connectionStatus);
  const lastUpdate = useHealthStore((state) => state.lastUpdate);
  const error = useHealthStore((state) => state.error);

  // Use React Query with server action for initial fetch (only if no Socket.IO data)
  const queryResult = useQueryData<DetailedHealthStatus>(
    ['detailedHealthStatus'],
    getDetailedHealthStatus,
    { 
      refetchInterval: false, // No polling - Socket.IO handles updates
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !healthStatus && connectionStatus === 'disconnected', // Only fetch if no Socket.IO data
    }
  );

  // Subscribe to Socket.IO on mount
  useEffect(() => {
    if (socket?.connected) {
      subscribe();
    }
  }, [socket, subscribe]);

  // Use Zustand store data (from Socket.IO) or fallback to React Query (initial fetch)
  const data = healthStatus || queryResult.data || null;
  const isPending = !healthStatus && connectionStatus === 'connecting';
  
  return {
    data,
    isPending,
    isFetching: queryResult.isFetching,
    error: error || queryResult.error,
    refetch: async () => {
      reconnect();
      return queryResult.refetch();
    },
    // Socket.IO connection info
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect,
  };
}; 