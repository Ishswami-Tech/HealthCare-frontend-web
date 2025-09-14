export * from './app.store';
export * from './websocket.store';
export * from './appointments.store';
export * from './useMedicalRecordsStore';

// Store provider for SSR compatibility
import { ReactNode, useEffect } from 'react';
import { useAppStore } from './app.store';
import { useWebSocketStore } from './websocket.store';
import { useAppointmentsStore } from './appointments.store';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => {
    // Initialize store data on mount
  }, []);

  return children;
}

export const getStoreState = () => ({
  app: useAppStore.getState(),
  websocket: useWebSocketStore.getState(),
  appointments: useAppointmentsStore.getState(),
});

export const resetAllStores = () => {
  useAppStore.getState().reset();
  useAppointmentsStore.getState().reset();
};

export const useStoreActions = () => ({
  app: {
    setUser: useAppStore.getState().setUser,
    setAuthenticated: useAppStore.getState().setAuthenticated,
    setCurrentClinic: useAppStore.getState().setCurrentClinic,
    addNotification: useAppStore.getState().addNotification,
    setLoading: useAppStore.getState().setLoading,
    setError: useAppStore.getState().setError,
  },
  websocket: {
    connect: useWebSocketStore.getState().connect,
    disconnect: useWebSocketStore.getState().disconnect,
    emit: useWebSocketStore.getState().emit,
    subscribe: useWebSocketStore.getState().subscribe,
  },
  appointments: {
    setAppointments: useAppointmentsStore.getState().setAppointments,
    addAppointment: useAppointmentsStore.getState().addAppointment,
    updateAppointment: useAppointmentsStore.getState().updateAppointment,
    setSelectedAppointment: useAppointmentsStore.getState().setSelectedAppointment,
    setFilters: useAppointmentsStore.getState().setFilters,
  },
});

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__HEALTHCARE_STORES__ = {
    app: useAppStore,
    websocket: useWebSocketStore,
    appointments: useAppointmentsStore,
    getState: getStoreState,
    reset: resetAllStores,
  };
}