'use server';

import { fetchWithAbort, FetchTimeoutError } from '@/lib/utils/fetch-with-abort';
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';
import type { DetailedHealthStatus } from '@/hooks/query/useHealth';

const createUnavailableStatus = (error: string): DetailedHealthStatus => ({
  database: { status: 'unavailable', isHealthy: false },
  cache: { status: 'unavailable', healthy: false },
  queue: { status: 'unavailable', healthy: false },
  communication: { status: 'unavailable', healthy: false },
  video: { status: 'unavailable', isHealthy: false, error },
  logging: { status: 'unavailable', healthy: false, error },
});

export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
  const healthUrl = `${APP_CONFIG.API.HEALTH_BASE_URL}${API_ENDPOINTS.HEALTH.DETAILED}`;

  try {
    const response = await fetchWithAbort(healthUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      timeout: 5000,
      cache: 'no-store',
    });

    if (response.status >= 400) {
      return createUnavailableStatus(`Backend health returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return createUnavailableStatus('Backend health returned non-JSON response');
    }

    const data = await response.json();
    const backendData = data as Record<string, any>;

    return {
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
      },
    };
  } catch (error: unknown) {
    if (error instanceof FetchTimeoutError) {
      return createUnavailableStatus('Backend health request timed out');
    }

    return createUnavailableStatus(
      error instanceof Error ? error.message : 'Backend health request failed'
    );
  }
}

export async function getFrontendSystemMetrics() {
  const os = await import('os');
  return {
    uptime: os.uptime(),
    platform: os.platform(),
    loadAvg: os.loadavg(),
  };
}
