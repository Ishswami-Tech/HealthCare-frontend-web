'use server';

import type { DetailedHealthStatus } from '@/hooks/query/useHealth';
import { APP_CONFIG } from '@/lib/config/config';
import { handleApiError } from '@/lib/utils/error-handler';

// Health check server action for initial fetch
// Note: Health endpoint is public, no authentication required
// ⚠️ SECURITY: Gracefully handles backend unavailability to prevent 500 errors
export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
  const API_URL = APP_CONFIG.API.BASE_URL;
  if (!API_URL || API_URL.trim() === '') {
    // Return unavailable status instead of throwing
    return {
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      message: 'API URL is not configured',
      database: { status: 'unknown', isHealthy: false },
      cache: { status: 'unknown', healthy: false },
      queue: { status: 'unknown', healthy: false },
      communication: { status: 'unknown', healthy: false },
    } as DetailedHealthStatus;
  }
  
  try {
    // Health endpoint is public, so we can use direct fetch
    // ⚠️ NOTE: Health endpoint is at root level (/health), NOT under /api/v1
    const { API_ENDPOINTS } = await import('../config/config');
    
    // Add timeout to prevent hanging requests (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let response: Response;
    try {
      response = await fetch(`${API_URL}${API_ENDPOINTS.HEALTH.BASE}?detailed=true`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        next: { revalidate: 0 }, // Always fetch fresh data
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch errors (network failures, timeouts, etc.)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch health status';
      const isNetworkError = errorMessage.includes('fetch failed') || 
                            errorMessage.includes('aborted') ||
                            errorMessage.includes('ECONNREFUSED') ||
                            errorMessage.includes('ENOTFOUND') ||
                            errorMessage.includes('timeout') ||
                            (fetchError as Error)?.name === 'AbortError';
      
      return {
        status: 'unavailable',
        timestamp: new Date().toISOString(),
        message: isNetworkError ? 'Backend service is unavailable. Please ensure the backend is running at ' + API_URL : errorMessage,
        database: { status: 'unknown', isHealthy: false },
        cache: { status: 'unknown', healthy: false },
        queue: { status: 'unknown', healthy: false },
        communication: { status: 'unknown', healthy: false },
      } as DetailedHealthStatus;
    }
    
    if (!response.ok) {
      // ✅ Use centralized error handler for message
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = await handleApiError(response, errorData);
      
      // Return unavailable status instead of throwing
      return {
        status: 'unavailable',
        timestamp: new Date().toISOString(),
        message: errorMessage,
        database: { status: 'unknown', isHealthy: false },
        cache: { status: 'unknown', healthy: false },
        queue: { status: 'unknown', healthy: false },
        communication: { status: 'unknown', healthy: false },
      } as DetailedHealthStatus;
    }
    
    const data = await response.json();
    return data as DetailedHealthStatus;
  } catch (error) {
    // Handle network errors, timeouts, and other failures gracefully
    // Don't throw - return unavailable status instead
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch health status';
    const isNetworkError = errorMessage.includes('fetch failed') || 
                          errorMessage.includes('aborted') ||
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('timeout');
    
    return {
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      message: isNetworkError ? 'Backend service is unavailable' : errorMessage,
      database: { status: 'unknown', isHealthy: false },
      cache: { status: 'unknown', healthy: false },
      queue: { status: 'unknown', healthy: false },
      communication: { status: 'unknown', healthy: false },
    } as DetailedHealthStatus;
  }
} 