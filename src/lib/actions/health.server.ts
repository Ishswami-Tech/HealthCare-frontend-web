'use server';

import { DetailedHealthStatus } from '@/hooks/useHealth';
import { APP_CONFIG } from '@/lib/config/config';

// Health check server action for initial fetch
// Note: Health endpoint is public, no authentication required
export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
  const API_URL = APP_CONFIG.API.BASE_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured');
  }
  
  try {
    // Health endpoint is public, so we can use direct fetch
    const { API_ENDPOINTS } = await import('../config/config');
    const response = await fetch(`${API_URL}${API_ENDPOINTS.HEALTH.BASE}?detailed=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      next: { revalidate: 0 }, // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data as DetailedHealthStatus;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch health status');
  }
} 