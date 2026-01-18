'use server';

import type { DetailedHealthStatus } from '@/hooks/query/useHealth';
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';
import { fetchWithAbort, FetchTimeoutError } from '@/lib/utils/fetch-with-abort';

// Helper to create unavailable status response
function createUnavailableStatus(message: string): DetailedHealthStatus {
  return {
    status: 'unavailable',
    timestamp: new Date().toISOString(),
    message,
    database: { status: 'unknown', isHealthy: false },
    cache: { status: 'unknown', healthy: false },
    queue: { status: 'unknown', healthy: false },
    communication: { status: 'unknown', healthy: false },
  } as DetailedHealthStatus;
}

// Health check server action for initial fetch
// ✅ Uses publicApi - Health endpoint is public, no authentication required
// ⚠️ SECURITY: Gracefully handles backend unavailability to prevent 500 errors
export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
  const API_URL = APP_CONFIG.API.BASE_URL;
  
  if (!API_URL || API_URL.trim() === '') {
    return createUnavailableStatus('API URL is not configured');
  }
  
  try {
    // Use centralized health endpoint configuration
    // Health endpoint is at /health (NOT /api/v1/health) - it's excluded from API versioning
    const healthUrl = `${APP_CONFIG.API.HEALTH_BASE_URL}${API_ENDPOINTS.HEALTH.DETAILED}`;
    
    // Debug logging
    if (APP_CONFIG.IS_DEVELOPMENT) {
      // console.log('[Health Check] Calling:', healthUrl);
    }
    
    const response = await fetchWithAbort(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
    });
    
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    
    // Debug logging
    if (APP_CONFIG.IS_DEVELOPMENT) {
      // console.log('[Health Check] Status:', response.status, 'Data:', data);
    }
    
    // Check for non-OK status
    if (response.status >= 400) {
      return createUnavailableStatus(`Health check failed with status ${response.status}`);
    }
    
    // Map backend response to frontend expected format
    const backendData = data as any;
    const mappedData: DetailedHealthStatus = {
      uptime: backendData.systemMetrics?.uptime || backendData.realtime?.uptime || 0,
      system: {
        cpu: backendData.realtime?.system?.cpu || 0,
        memory: backendData.realtime?.system?.memory || 0,
        activeConnections: backendData.realtime?.system?.activeConnections || 0,
        requestRate: backendData.realtime?.system?.requestRate || 0,
        errorRate: backendData.realtime?.system?.errorRate || 0,
      },
      database: {
        status: backendData.services?.database?.status === 'healthy' ? 'up' : 'down',
        isHealthy: backendData.services?.database?.status === 'healthy',
        avgResponseTime: backendData.services?.database?.responseTime || 0,
      },
      cache: {
        status: backendData.services?.cache?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.cache?.status === 'healthy',
        latency: backendData.services?.cache?.responseTime || 0,
      },
      queue: {
        status: backendData.services?.queue?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.queue?.status === 'healthy',
        connection: {
          connected: backendData.services?.queue?.status === 'healthy',
          latency: backendData.services?.queue?.responseTime || 0,
        },
      },
      communication: {
        status: backendData.services?.communication?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.communication?.status === 'healthy',
        socket: {
          connected: backendData.services?.communication?.status === 'healthy',
          latency: backendData.services?.communication?.responseTime || 0,
        },
      },
      video: {
        status: backendData.services?.video?.status === 'healthy' ? 'up' : 'down',
        isHealthy: backendData.services?.video?.status === 'healthy',
      },
      logging: {
        status: backendData.services?.logger?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.logger?.status === 'healthy',
        service: {
          available: backendData.services?.logger?.status === 'healthy',
          latency: backendData.services?.logger?.responseTime || 0,
        },
      },
    };
    
    return mappedData;
  } catch (error) {
    // Handle network errors, timeouts, and other failures gracefully
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch health status';
    
    const isNetworkError = 
      error instanceof FetchTimeoutError ||
      errorMessage.includes('fetch failed') || 
      errorMessage.includes('aborted') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('timeout');
    
    return createUnavailableStatus(
      isNetworkError 
        ? `Backend service is unavailable. Please ensure the backend is running at ${API_URL}` 
        : errorMessage
    );
  }
}

// ✅ New: Get Frontend Server System Metrics
export async function getFrontendSystemMetrics() {
  const os = await import('os');
  
  return {
    uptime: os.uptime(),
    platform: os.platform(),
    loadAvg: os.loadavg(),
  };
}