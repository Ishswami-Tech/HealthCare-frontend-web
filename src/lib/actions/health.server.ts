'use server';

import type { DetailedHealthStatus } from '@/hooks/query/useHealth';
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';
import { fetchWithAbort, FetchTimeoutError } from '@/lib/utils/fetch-with-abort';

// ✅ Public API utility for unauthenticated endpoints
// This is intentionally NOT using authenticatedApi since /health is public
async function publicApi<T>(endpoint: string, options: RequestInit = {}): Promise<{ status: number; data: T }> {
  const API_URL = APP_CONFIG.API.BASE_URL;
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetchWithAbort(url, {
    ...options,
    timeout: 5000,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });
  
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  
  return { status: response.status, data: data as T };
}

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
    const { status, data } = await publicApi<DetailedHealthStatus>(
      `${API_ENDPOINTS.HEALTH.BASE}?detailed=true`,
      { method: 'GET', cache: 'no-store' }
    );
    
    // Check for non-OK status
    if (status >= 400) {
      return createUnavailableStatus(`Health check failed with status ${status}`);
    }
    
    return data;
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