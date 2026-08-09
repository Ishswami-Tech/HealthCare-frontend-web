'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { logger } from '@/lib/utils/logger';

interface Session {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

type SessionPayload = Partial<Session> & {
  id?: string;
  session_id?: string;
  device?: string;
  deviceName?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  isCurrentSession?: boolean;
  current?: boolean;
};

function normalizeSession(session: SessionPayload): Session | null {
  const sessionId = session.sessionId || session.session_id || session.id;
  if (!sessionId) {
    return null;
  }

  return {
    sessionId,
    deviceInfo: session.deviceInfo || session.device || session.deviceName || 'Unknown device',
    ipAddress: session.ipAddress || 'Unknown',
    lastActivity: session.lastActivity || session.lastSeenAt || session.updatedAt || new Date().toISOString(),
    createdAt: session.createdAt || session.lastActivity || session.lastSeenAt || new Date().toISOString(),
    isCurrent: Boolean(session.isCurrent ?? session.isCurrentSession ?? session.current),
  };
}

export async function getActiveSessions(): Promise<Session[]> {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data } = await authenticatedApi<{ sessions?: SessionPayload[]; data?: SessionPayload[] }>(
      '/auth/sessions',
      {
        method: 'GET',
        cache: 'no-store',
        omitClinicId: true,
      }
    );
    logger.info('[getActiveSessions] Fetched sessions', { component: 'sessions', action: 'fetch' });
    const payload = data.sessions ?? data.data ?? [];
    return payload.map(normalizeSession).filter((session): session is Session => Boolean(session));
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
