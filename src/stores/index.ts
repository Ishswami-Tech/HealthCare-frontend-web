/**
 * ✅ Consolidated Store Exports
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for all store exports
 */

export * from './app.store';
// Re-export auth.store but exclude useIsAuthenticated to avoid duplicate export
export { 
  useAuthStore, 
  useAuthUser, 
  useAuthSession, 
  useAuthLoading, 
  useAuthError,
  type AuthState 
} from './auth.store';
export * from './websocket.store';
export * from './appointments.store';
export * from './medical-records.store';
export * from './pharmacy.store';
export * from './notifications.store';
export * from './health.store';

// Store provider for SSR compatibility
import { ReactNode, useEffect } from 'react';
import { useAppStore } from './app.store';
import { useAuthStore } from './auth.store';
import { useWebSocketStore } from './websocket.store';
import { useAppointmentsStore } from './appointments.store';
import { useHealthStore } from './health.store';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => {
    // Initialize store data on mount
  }, []);

  return children;
}

// ✅ Consolidated: Import all stores
import { usePharmacyStore } from './pharmacy.store';
import { useNotificationStore } from './notifications.store';
import { useMedicalRecordsStore } from './medical-records.store';

export const getStoreState = () => ({
  app: useAppStore.getState(),
  auth: useAuthStore.getState(),
  websocket: useWebSocketStore.getState(),
  appointments: useAppointmentsStore.getState(),
  health: useHealthStore.getState(),
  pharmacy: usePharmacyStore.getState(),
  notifications: useNotificationStore.getState(),
  medicalRecords: useMedicalRecordsStore.getState(),
});

export const resetAllStores = () => {
  useAppStore.getState().reset();
  useAuthStore.getState().reset();
  useAppointmentsStore.getState().reset();
  // Add reset methods for other stores if they have them
  if ('reset' in usePharmacyStore.getState()) {
    (usePharmacyStore.getState() as any).reset();
  }
  if ('reset' in useNotificationStore.getState()) {
    (useNotificationStore.getState() as any).reset();
  }
  if ('reset' in useMedicalRecordsStore.getState()) {
    (useMedicalRecordsStore.getState() as any).reset();
  }
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
  auth: {
    setSession: useAuthStore.getState().setSession,
    setUser: useAuthStore.getState().setUser,
    clearAuth: useAuthStore.getState().clearAuth,
    setLoading: useAuthStore.getState().setLoading,
    setError: useAuthStore.getState().setError,
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
    auth: useAuthStore,
    websocket: useWebSocketStore,
    appointments: useAppointmentsStore,
    health: useHealthStore,
    pharmacy: usePharmacyStore,
    notifications: useNotificationStore,
    medicalRecords: useMedicalRecordsStore,
    getState: getStoreState,
    reset: resetAllStores,
  };
}