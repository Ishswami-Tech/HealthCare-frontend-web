"use client";

import { useEffect } from 'react';
import { useHealthRealtime } from '@/hooks/useHealthRealtime';

/**
 * Health Status Provider
 * Initializes Socket.IO connection for health monitoring
 * Should be added to AppProvider
 */
export function HealthStatusProvider() {
  const { subscribe } = useHealthRealtime({ enabled: true });

  useEffect(() => {
    // Subscribe to health updates on mount
    subscribe();
  }, [subscribe]);

  return null;
}

