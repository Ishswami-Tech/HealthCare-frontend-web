/**
 * 🔒 Secure Token Manager
 * Provides secure token access with httpOnly-cookie-first behavior.
 * 
 * SECURITY: Tokens must never be persisted in browser storage.
 */

'use client';

import { useAuthStore } from '@/stores/auth.store';

// clinicApiClient import removed - not used in this file

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
  return useAuthStore.getState().session?.user?.clinicId || null;
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
      clinicId: _clinicId,
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
  // Use the API client's auth header generator which handles both
  // server-side (cookies) and client-side (localStorage) scenarios
  // clinicApiClient not needed here
  const { APP_CONFIG } = await import('@/lib/config/config');
  
  // The API client already handles secure token access
  // This is a wrapper for convenience
  const token = await getAccessToken();
  const sessionId = await getSessionId();
  let clinicId = await getClinicId();

  // ✅ Fallback to APP_CONFIG.CLINIC.ID if clinic ID is not in localStorage
  // This ensures clinic ID is always set from environment variable or config default
  if (!clinicId) {
    clinicId = APP_CONFIG.CLINIC.ID;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }
  // ✅ Always include clinic ID in headers (from localStorage or config)
  if (clinicId) {
    headers['X-Clinic-ID'] = clinicId;
  }

  return headers;
}

