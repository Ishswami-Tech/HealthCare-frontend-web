/**
 * Auth Store (Zustand)
 * Dedicated store for authentication state.
 * Session persistence is intentionally disabled so tokens stay in memory only.
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Session, User } from '@/types/auth.types';

function isSameUser(a: User | null | undefined, b: User | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;

  return (
    a.id === b.id &&
    a.email === b.email &&
    a.role === b.role &&
    a.name === b.name &&
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.phone === b.phone &&
    a.isVerified === b.isVerified &&
    a.profileComplete === b.profileComplete &&
    a.clinicId === b.clinicId
  );
}

function isSameSession(a: Session | null, b: Session | null): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;

  return (
    a.access_token === b.access_token &&
    a.session_id === b.session_id &&
    a.isAuthenticated === b.isAuthenticated &&
    isSameUser(a.user, b.user)
  );
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  requiresProfileCompletion: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
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
} satisfies Omit<
  AuthState,
  | 'setSession'
  | 'setUser'
  | 'setProfileCompletion'
  | 'clearAuth'
  | 'setLoading'
  | 'setRefreshing'
  | 'setError'
  | 'reset'
>;

export const useAuthStore = create<AuthState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setSession: (session) => {
        if (isSameSession((useAuthStore.getState() as AuthState).session, session)) {
          return;
        }
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
        if (isSameUser((useAuthStore.getState() as AuthState).user, user)) {
          return;
        }
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
        const current = useAuthStore.getState() as AuthState;
        if (
          current.isProfileComplete === isComplete &&
          current.requiresProfileCompletion === requiresCompletion
        ) {
          return;
        }
        set((state) => {
          state.isProfileComplete = isComplete;
          state.requiresProfileCompletion = requiresCompletion;
          if (state.user) {
            state.user.profileComplete = isComplete;
          }
        });
      },

      clearAuth: () => {
        const current = useAuthStore.getState() as AuthState;
        if (
          current.user === null &&
          current.session === null &&
          current.isAuthenticated === false &&
          current.isProfileComplete === false &&
          current.requiresProfileCompletion === true &&
          current.error === null
        ) {
          return;
        }
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
        if ((useAuthStore.getState() as AuthState).isLoading === loading) {
          return;
        }
        set((state) => {
          state.isLoading = loading;
        });
      },

      setRefreshing: (refreshing) => {
        if ((useAuthStore.getState() as AuthState).isRefreshing === refreshing) {
          return;
        }
        set((state) => {
          state.isRefreshing = refreshing;
        });
      },

      setError: (error) => {
        if ((useAuthStore.getState() as AuthState).error === error) {
          return;
        }
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },
    })),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useProfileComplete = () => useAuthStore((state) => state.isProfileComplete);
export const useRequiresProfileCompletion = () =>
  useAuthStore((state) => state.requiresProfileCompletion);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
