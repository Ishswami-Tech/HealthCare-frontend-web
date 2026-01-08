"use client";

import { useEffect } from 'react';
import { useHealthRealtime } from '@/hooks/useHealthRealtime';
import { useHealthStore } from '@/stores/health.store';

/**
 * Health Status Provider
 * Initializes Socket.IO connection for health monitoring
 * Auto-subscribes when socket connects (handled in useHealthRealtime)
 * Should be added to AppProvider
 */
export function HealthStatusProvider() {
  const { socket, subscribe } = useHealthRealtime({ enabled: true });
  const isConnected = useHealthStore((state) => state.isConnected);

  useEffect(() => {
    // Subscribe to health updates when socket is connected
    // Note: useHealthRealtime already auto-subscribes on connect,
    // but we call subscribe here as a fallback if connection happens after mount
    if (socket?.connected || isConnected) {
      subscribe();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ HealthStatusProvider: Subscribed to health updates');
      }
    }
  }, [socket, isConnected, subscribe]);

  return null;
}

