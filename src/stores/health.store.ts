"use client";

import { create } from 'zustand';
import type { DetailedHealthStatus } from '@/hooks/query/useHealth';

interface HealthState {
  // Health status data
  healthStatus: DetailedHealthStatus | null;
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Metadata
  lastUpdate: Date | null;
  error: Error | null;
  
  // Actions
  setHealthStatus: (status: DetailedHealthStatus | null) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  setIsConnected: (connected: boolean) => void;
  setLastUpdate: (date: Date | null) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

const initialState = {
  healthStatus: null,
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  lastUpdate: null,
  error: null,
};

export const useHealthStore = create<HealthState>((set) => ({
  ...initialState,

  setHealthStatus: (status) => set({ healthStatus: status, lastUpdate: new Date() }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  setLastUpdate: (date) => set({ lastUpdate: date }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

