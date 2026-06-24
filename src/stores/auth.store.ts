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
import { normalizeClinicId } from '@/lib/utils/clinic-id';

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
    a.emailVerified === b.emailVerified &&
    a.phoneVerified === b.phoneVerified &&
    a.phoneVerifiedAt === b.phoneVerifiedAt &&
    a.loginMethod === b.loginMethod &&
    a.googleId === b.googleId &&
    a.profileComplete === b.profileComplete &&
    a.clinicId === b.clinicId &&
    a.clinicName === b.clinicName
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

function normalizeAuthUser(user: User | null | undefined): User | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    clinicId: normalizeClinicId(user.clinicId || null) || user.clinicId,
  };
}

function resolveProfileCompleteFromPayload(
  user: User | null | undefined,
  session?: Session | null
): boolean {
  const userRecord = user as unknown as Record<string, unknown> | null | undefined;
  const sessionUserRecord = session?.user as unknown as Record<string, unknown> | null | undefined;

  const userRole = String(userRecord?.role || sessionUserRecord?.role || '').toUpperCase();
  if (userRole && userRole !== 'PATIENT') {
    return true;
  }

  if (typeof userRecord?.profileComplete === 'boolean') {
    return userRecord.profileComplete;
  }

  if (typeof sessionUserRecord?.profileComplete === 'boolean') {
    return sessionUserRecord.profileComplete;
  }

  if (typeof userRecord?.requiresProfileCompletion === 'boolean') {
    return !userRecord.requiresProfileCompletion;
  }

  if (typeof sessionUserRecord?.requiresProfileCompletion === 'boolean') {
    return !sessionUserRecord.requiresProfileCompletion;
  }

  if (typeof userRecord?.isProfileComplete === 'boolean') {
    return userRecord.isProfileComplete;
  }

  if (typeof sessionUserRecord?.isProfileComplete === 'boolean') {
    return sessionUserRecord.isProfileComplete;
  }

  return false;
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
  syncAuthStateFromSession: (payload: {
    session: Session | null | undefined;
    isLoading: boolean;
    shouldClearAuth: boolean;
  }) => void;
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
  | 'syncAuthStateFromSession'
  | 'reset'
>;

export const useAuthStore = create<AuthState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setSession: (session) => {
        const normalizedSession = session
          ? {
              ...session,
              user: normalizeAuthUser(session.user) || session.user,
            }
          : session;

        if (isSameSession((useAuthStore.getState() as AuthState).session, normalizedSession)) {
          return;
        }
        set((state) => {
          const nextProfileComplete = resolveProfileCompleteFromPayload(
            normalizedSession?.user || null,
            normalizedSession
          );
          state.session = normalizedSession;
          state.user = normalizedSession?.user || null;
          state.isAuthenticated = !!normalizedSession?.isAuthenticated;
          state.isProfileComplete = nextProfileComplete;
          state.requiresProfileCompletion = !nextProfileComplete;
          state.error = null;
        });
      },

      setUser: (user) => {
        const normalizedUser = normalizeAuthUser(user);

        if (isSameUser((useAuthStore.getState() as AuthState).user, normalizedUser)) {
          return;
        }
        set((state) => {
          const nextProfileComplete = resolveProfileCompleteFromPayload(normalizedUser);
          state.user = normalizedUser;
          state.isAuthenticated = !!normalizedUser;
          state.isProfileComplete = nextProfileComplete;
          state.requiresProfileCompletion = !nextProfileComplete;
          if (!normalizedUser) {
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

      syncAuthStateFromSession: ({ session, isLoading, shouldClearAuth }) => {
        const normalizedSession = session
          ? {
              ...session,
              user: normalizeAuthUser(session.user) || session.user,
            }
          : session;
        const current = useAuthStore.getState() as AuthState;

        if (
          current.isLoading === isLoading &&
          isSameSession(current.session, normalizedSession ?? null) &&
          (!shouldClearAuth ||
            (current.user === null &&
              current.session === null &&
              current.isAuthenticated === false &&
              current.isProfileComplete === false &&
              current.requiresProfileCompletion === true &&
              current.error === null))
        ) {
          return;
        }

        set((state) => {
          state.isLoading = isLoading;

          if (normalizedSession) {
            const nextProfileComplete = resolveProfileCompleteFromPayload(
              normalizedSession.user,
              normalizedSession
            );
            state.session = normalizedSession;
            state.user = normalizedSession.user || null;
            state.isAuthenticated = !!normalizedSession.isAuthenticated;
            state.isProfileComplete = nextProfileComplete;
            state.requiresProfileCompletion = !nextProfileComplete;
            state.error = null;
            return;
          }

          if (shouldClearAuth) {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.isProfileComplete = false;
            state.requiresProfileCompletion = true;
            state.error = null;
          }
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

// ─── Cross-store wiring ────────────────────────────────────────────────────
// Reset the "appointments have loaded for this session" flag whenever the
// auth session changes. This prevents a stale `loaded=true` from leaking
// across users on the same workstation (e.g. logout + new login, or role
// elevation) and causing the next user to see an empty page with a
// suppressed skeleton.
//
// We use a dynamic import inside the subscriber so this file does not
// import from `useAppointments` at module-load time (that file already
// imports the auth store, which would create a circular import).
if (typeof window !== 'undefined') {
  let lastObservedSessionId: string | null = null;
  useAuthStore.subscribe((state) => {
    const nextSessionId = state.session?.session_id ?? null;
    if (nextSessionId === lastObservedSessionId) return;
    lastObservedSessionId = nextSessionId;
    // Lazy-load to avoid circular import.
    void import('@/hooks/query/useAppointments').then((mod) => {
      mod.resetAppointmentsLoadedForSession();
    }).catch(() => {
      // The appointments module isn't always available during early
      // hydration; silently no-op.
    });
  });
}
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useProfileComplete = () => useAuthStore((state) => state.isProfileComplete);
export const useRequiresProfileCompletion = () =>
  useAuthStore((state) => state.requiresProfileCompletion);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
