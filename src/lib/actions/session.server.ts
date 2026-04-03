'use server';

import { getServerSession } from './auth.server';
import { APP_CONFIG } from '@/lib/config/config';
import { logger } from '@/lib/utils/logger';

const API_URL = APP_CONFIG.API.BASE_URL;

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

    const response = await fetch(`${API_URL}/auth/sessions`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to fetch sessions');
    }

    const data = await response.json();
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

    const response = await fetch(`${API_URL}/user/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to revoke session');
    }

    logger.info('[revokeSession] Session revoked successfully', { component: 'sessions', action: 'revoke' });
  } catch (error) {
    logger.error('[revokeSession] Error', error instanceof Error ? error : undefined, { component: 'sessions', action: 'revoke' });
    throw error;
  }
}
