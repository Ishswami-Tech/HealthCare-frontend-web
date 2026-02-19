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

  // Profile completion state
  isProfileComplete: boolean;
  requiresProfileCompletion: boolean;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Error state
  error: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfileCompletion: (isComplete: boolean, requiresCompletion: boolean) => void;
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
  isProfileComplete: false,
  requiresProfileCompletion: true,
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
            state.isProfileComplete = session?.user?.profileComplete || false;
            state.requiresProfileCompletion = !session?.user?.profileComplete;
            state.error = null;
          });
        },

        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.isProfileComplete = user?.profileComplete || false;
            state.requiresProfileCompletion = !user?.profileComplete;
            if (!user) {
              state.session = null;
            }
          });
        },

        setProfileCompletion: (isComplete, requiresCompletion) => {
          set((state) => {
            state.isProfileComplete = isComplete;
            state.requiresProfileCompletion = requiresCompletion;
            if (state.user) {
              state.user.profileComplete = isComplete;
            }
          });
        },

        clearAuth: () => {
          set((state) => {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.isProfileComplete = false;
            state.requiresProfileCompletion = true;
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
          // Only persist user, session, and profile completion status
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          isProfileComplete: state.isProfileComplete,
          requiresProfileCompletion: state.requiresProfileCompletion,
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
export const useProfileComplete = () => useAuthStore((state) => state.isProfileComplete);
export const useRequiresProfileCompletion = () => useAuthStore((state) => state.requiresProfileCompletion);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
