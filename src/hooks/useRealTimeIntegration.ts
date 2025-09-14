"use client";

// Re-export all real-time hooks for easy importing
export * from './useWebSocketIntegration';
export * from './useRealTimeQueries';

// Additional integration utilities
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, useAppointmentsStore } from '@/stores';
import { useWebSocketIntegration } from './useWebSocketIntegration';
import type { Appointment } from '@/stores/appointments.store';
import type { User, Clinic } from '@/stores/app.store';

// Master hook for complete real-time integration
export function useRealTimeIntegration() {
  const queryClient = useQueryClient();
  const { user, currentClinic } = useAppStore();
  
  // Initialize WebSocket integration
  const webSocketIntegration = useWebSocketIntegration({
    autoConnect: true,
    subscribeToQueues: true,
    subscribeToAppointments: true,
    tenantId: currentClinic?.id,
    userId: user?.id,
  });

  // Sync Zustand stores with server state
  useEffect(() => {
    if (!webSocketIntegration.isReady) return;

    // Subscribe to real-time store synchronization events
    const unsubscribeFunctions: (() => void)[] = [];

    // Sync appointments store
    const unsubscribeAppointmentSync = webSocketIntegration.subscribe('store:sync:appointments', (data: unknown) => {
      const { setAppointments } = useAppointmentsStore.getState();
      const typedData = data as { appointments: Appointment[] };
      setAppointments(typedData.appointments);
    });

    // Sync user data
    const unsubscribeUserSync = webSocketIntegration.subscribe('store:sync:user', (data: unknown) => {
      const { setUser } = useAppStore.getState();
      const typedData = data as { user: User | null };
      setUser(typedData.user);
    });

    // Sync clinic data
    const unsubscribeClinicSync = webSocketIntegration.subscribe('store:sync:clinic', (data: unknown) => {
      const { setCurrentClinic } = useAppStore.getState();
      const typedData = data as { clinic: Clinic | null };
      setCurrentClinic(typedData.clinic);
    });

    unsubscribeFunctions.push(
      unsubscribeAppointmentSync,
      unsubscribeUserSync,
      unsubscribeClinicSync
    );

    return () => {
      unsubscribeFunctions.forEach(fn => fn());
    };
  }, [webSocketIntegration.isReady, webSocketIntegration.subscribe]);

  // Invalidate queries on reconnection
  useEffect(() => {
    if (webSocketIntegration.isConnected && webSocketIntegration.connectionStatus === 'connected') {
      // Invalidate all queries to ensure fresh data after reconnection
      queryClient.invalidateQueries();
    }
  }, [webSocketIntegration.isConnected, webSocketIntegration.connectionStatus, queryClient]);

  return {
    ...webSocketIntegration,
    
    // Additional utilities
    syncStoreWithServer: () => {
      if (webSocketIntegration.isReady) {
        webSocketIntegration.emit('request:store:sync', {
          userId: user?.id,
          clinicId: currentClinic?.id,
        });
      }
    },

    // Force refresh all data
    refreshAllData: () => {
      queryClient.invalidateQueries();
      if (webSocketIntegration.isReady) {
        webSocketIntegration.emit('request:data:refresh', {
          userId: user?.id,
          clinicId: currentClinic?.id,
        });
      }
    },
  };
}