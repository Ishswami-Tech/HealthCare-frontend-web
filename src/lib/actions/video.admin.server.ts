'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import type { ListAllVideoSessionsResponse } from '@/types/video.types';

/**
 * List all active video sessions (Super Admin only)
 */
export async function listAllVideoSessions(): Promise<ListAllVideoSessionsResponse> {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.ADMIN.LIST_SESSIONS,
    {}
  );
  return response as ListAllVideoSessionsResponse;
}

/**
 * Force-terminate an active video session (Super Admin only)
 */
export async function terminateVideoSession(sessionId: string, reason?: string) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.ADMIN.TERMINATE_SESSION(sessionId),
    {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Terminated by Super Admin' }),
    }
  );
  return response as { success: boolean; message?: string };
}
