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
export * from './notifications.store';
export * from './health.store';

// Store provider for SSR compatibility
import { ReactNode, useEffect } from 'react';
import { useAppStore } from './app.store';
import { useAuthStore } from './auth.store';
import { useWebSocketStore } from './websocket.store';
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

import { useNotificationStore } from './notifications.store';

export const getStoreState = () => ({
  app: useAppStore.getState(),
  auth: useAuthStore.getState(),
  websocket: useWebSocketStore.getState(),
  health: useHealthStore.getState(),
  notifications: useNotificationStore.getState(),
});

export const resetAllStores = () => {
  useWebSocketStore.getState().disconnect();
  useAppStore.getState().reset();
  useAuthStore.getState().reset();
  useNotificationStore.getState().reset();
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
});

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__HEALTHCARE_STORES__ = {
    app: useAppStore,
    auth: useAuthStore,
    websocket: useWebSocketStore,
    health: useHealthStore,
    notifications: useNotificationStore,
    getState: getStoreState,
    reset: resetAllStores,
  };
}
