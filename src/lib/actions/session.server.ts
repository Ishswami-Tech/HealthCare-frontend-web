'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { logger } from '@/lib/utils/logger';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export async function getActiveSessions(): Promise<Session[]> {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data } = await authenticatedApi<{ data?: Session[] }>('/auth/sessions', {
      method: 'GET',
      cache: 'no-store',
      omitClinicId: true,
    });
    logger.info('[getActiveSessions] Fetched sessions', { component: 'sessions', action: 'fetch' });
    return data.data || [];
  } catch (error) {
    logger.error('[getActiveSessions] Error', error instanceof Error ? error : undefined, { component: 'sessions', action: 'fetch' });
    throw error;
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    await authenticatedApi(`/user/sessions/${sessionId}`, {
      method: 'DELETE',
      omitClinicId: true,
    });

    logger.info('[revokeSession] Session revoked successfully', { component: 'sessions', action: 'revoke' });
  } catch (error) {
    logger.error('[revokeSession] Error', error instanceof Error ? error : undefined, { component: 'sessions', action: 'revoke' });
    throw error;
  }
}
