'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
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

    // GET /auth/sessions answers `{ data: Session[] }`; the API client hands back the
    // inner list. (The backend currently always returns an empty list.)
    const { data } = await authenticatedApi<Session[] | { sessions?: Session[]; data?: Session[] }>(
      API_ENDPOINTS.AUTH.SESSIONS,
      {
        method: 'GET',
        cache: 'no-store',
        omitClinicId: true,
      }
    );
    logger.info('[getActiveSessions] Fetched sessions', { component: 'sessions', action: 'fetch' });
    if (Array.isArray(data)) return data;
    return data?.sessions ?? data?.data ?? [];
  } catch (error) {
    logger.error('[getActiveSessions] Error', error instanceof Error ? error : undefined, { component: 'sessions', action: 'fetch' });
    throw error;
  }
}

/**
 * Sign out one session. The backend has no `DELETE /user/sessions/:id`; the route that
 * ends a session by id is `POST /auth/logout` with `{ sessionId }` (LogoutDto). The
 * caller's own session is refused: it has to end through the normal sign-out, which
 * also clears the session cookies.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const targetSessionId = String(sessionId || '').trim();
    if (!targetSessionId) {
      throw new Error('Session ID is required');
    }
    if (targetSessionId === session.session_id) {
      throw new Error('This is the session you are using. Use Sign out to end it.');
    }

    await authenticatedApi(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ sessionId: targetSessionId }),
      omitClinicId: true,
    });

    logger.info('[revokeSession] Session revoked successfully', { component: 'sessions', action: 'revoke' });
  } catch (error) {
    logger.error('[revokeSession] Error', error instanceof Error ? error : undefined, { component: 'sessions', action: 'revoke' });
    throw error;
  }
}
