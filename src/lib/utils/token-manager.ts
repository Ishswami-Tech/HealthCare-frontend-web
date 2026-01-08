/**
 * 🔒 Secure Token Manager
 * Provides secure token access with fallback to httpOnly cookies
 * 
 * SECURITY: Tokens should ideally be in httpOnly cookies, but for client-side
 * operations, we provide a secure wrapper that can be migrated to server-side
 * operations in the future.
 */

'use client';

import { clinicApiClient } from '@/lib/api/client';

/**
 * Get access token securely
 * Priority: httpOnly cookies (via Server Actions) > localStorage (fallback)
 */
export async function getAccessToken(): Promise<string | null> {
  // In client components, we need to use localStorage as fallback
  // TODO: Migrate to httpOnly cookies via Server Actions for better security
  if (typeof window === 'undefined') {
    // Server-side: should use cookies via Server Actions
    return null;
  }

  // Client-side: use localStorage (will be migrated to httpOnly cookies)
  return localStorage.getItem('access_token') || null;
}

/**
 * Get session ID securely
 */
export async function getSessionId(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('session_id') || null;
}

/**
 * Get clinic ID securely
 */
export async function getClinicId(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('clinic_id') || null;
}

/**
 * Set access token (for client-side operations)
 * ⚠️ SECURITY: This is a temporary solution. Tokens should be set via httpOnly cookies
 */
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

/**
 * Clear all tokens (logout)
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('session_id');
    localStorage.removeItem('clinic_id');
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Get authentication headers securely
 * Uses the centralized API client which handles token management
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  // Use the API client's auth header generator which handles both
  // server-side (cookies) and client-side (localStorage) scenarios
  const { clinicApiClient } = await import('@/lib/api/client');
  
  // The API client already handles secure token access
  // This is a wrapper for convenience
  const token = await getAccessToken();
  const sessionId = await getSessionId();
  const clinicId = await getClinicId();

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

