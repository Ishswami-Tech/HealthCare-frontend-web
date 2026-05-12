/**
 * Secure Token Manager
 * Provides secure token access with httpOnly-cookie-first behavior.
 *
 * SECURITY: Tokens must never be persisted in browser storage.
 */

'use client';

import { useAuthStore } from '@/stores/auth.store';
import { normalizeClinicId } from '@/lib/utils/clinic-id';

/**
 * Client-side code should not read access tokens directly.
 */
export async function getAccessToken(): Promise<string | null> {
  return useAuthStore.getState().session?.access_token || null;
}

/**
 * Get session ID securely
 */
export async function getSessionId(): Promise<string | null> {
  return useAuthStore.getState().session?.session_id || null;
}

/**
 * Get clinic ID securely
 */
export async function getClinicId(): Promise<string | null> {
  return normalizeClinicId(useAuthStore.getState().session?.user?.clinicId || null) || null;
}

/**
 * Tokens are intentionally not written to browser storage.
 */
export function setAccessToken(_token: string): void {
  const currentSession = useAuthStore.getState().session;
  if (!currentSession) return;
  useAuthStore.getState().setSession({
    ...currentSession,
    access_token: _token,
  });
  return;
}

/**
 * Set session ID (for client-side operations)
 */
export function setSessionId(_sessionId: string): void {
  const currentSession = useAuthStore.getState().session;
  if (!currentSession) return;
  useAuthStore.getState().setSession({
    ...currentSession,
    session_id: _sessionId,
  });
  return;
}

/**
 * Set clinic ID (for client-side operations)
 */
export function setClinicId(_clinicId: string): void {
  const currentSession = useAuthStore.getState().session;
  if (!currentSession) return;
  useAuthStore.getState().setSession({
    ...currentSession,
    user: {
      ...currentSession.user,
      clinicId: normalizeClinicId(_clinicId),
    },
  });
  return;
}

/**
 * Clear all tokens (logout)
 */
export function clearTokens(): void {
  useAuthStore.getState().clearAuth();
}

/**
 * Get authentication headers securely
 * Uses the centralized API client which handles token management
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { APP_CONFIG } = await import('@/lib/config/config');

  const token = await getAccessToken();
  const sessionId = await getSessionId();
  const clinicId = normalizeClinicId((await getClinicId()) || APP_CONFIG.CLINIC.ID);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }
  if (clinicId) {
    headers['X-Clinic-ID'] = clinicId;
  }

  return headers;
}
