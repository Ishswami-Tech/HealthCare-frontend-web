"use client";

import { useEffect } from 'react';
import { useHealthRealtime } from '@/hooks/realtime/useHealthRealtime';
import { useHealthStore } from '@/stores';


/**
 * Health Status Provider
 * Initializes Socket.IO connection for health monitoring and renders global health status button
 * Auto-subscribes when socket connects (handled in useHealthRealtime)
 * Should be added to AppProvider
 */
export function HealthStatusProvider() {
  // ✅ Only enable health realtime when not on auth pages
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
  const { socket, subscribe } = useHealthRealtime({ enabled: !isAuthPage });
  const isConnected = useHealthStore((state) => state.isConnected);

  useEffect(() => {
    // ✅ Don't subscribe on auth pages to prevent blocking
    if (isAuthPage) {
      return;
    }

    // Subscribe to health updates when socket is connected
    // Note: useHealthRealtime already auto-subscribes on connect,
    // but we call subscribe here as a fallback if connection happens after mount
    if (socket?.connected || isConnected) {
      subscribe();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ HealthStatusProvider: Subscribed to health updates');
      }
    }
  }, [socket, isConnected, subscribe, isAuthPage]);

  return null;
}
