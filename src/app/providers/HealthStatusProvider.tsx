"use client";

import { useHealthRealtime } from '@/hooks/realtime/useHealthRealtime';


/**
 * Health Status Provider
 * Initializes Socket.IO connection for health monitoring and renders global health status button
 * Auto-subscribes when socket connects (handled in useHealthRealtime)
 * Should be added to AppProvider
 */
export function HealthStatusProvider() {
  // ✅ Only enable health realtime when not on auth pages
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
  useHealthRealtime({ enabled: !isAuthPage });

  return null;
}
