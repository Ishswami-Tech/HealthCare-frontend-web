/**
 * ✅ Auth Store (Zustand)
 * Dedicated store for authentication state
 * Syncs with React Query session state
 * Follows SOLID, DRY, KISS principles
 */

'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, Session } from '@/types/auth.types';

export interface AuthState {
  // Session state (synced with React Query)
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,
        
        setSession: (session) => {
          set((state) => {
            state.session = session;
            state.user = session?.user || null;
            state.isAuthenticated = !!session?.isAuthenticated;
            state.error = null;
          });
        },
        
        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            if (!user) {
              state.session = null;
            }
          });
        },
        
        clearAuth: () => {
          set((state) => {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.error = null;
          });
        },
        
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },
        
        setRefreshing: (refreshing) => {
          set((state) => {
            state.isRefreshing = refreshing;
          });
        },
        
        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },
        
        reset: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'auth-store',
        partialize: (state) => ({
          // Only persist user and session, not loading/error states
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
