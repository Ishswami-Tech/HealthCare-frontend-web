'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useEffect } from 'react';
import { useQueryData, useMutationOperation, useQueryClient } from '@/hooks/core';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, TOAST_IDS } from '../utils/use-toast';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { ERROR_MESSAGES } from '@/lib/config/config';
import { useGlobalLoading } from '@/hooks/utils/useGlobalLoading';
import { logger } from '@/lib/utils/logger';
import { useAuthStore, resetAllStores } from '@/stores';
import { RedirectContext } from '@/lib/utils/redirect';
import { isSessionInvalidError } from '@/lib/utils/auth-recovery';
import {
  login as loginAction,
  verifyOTP as verifyOTPAction,
  logout as logoutAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  getServerSession,
  requestOTP as requestOTPAction,
  socialLogin as socialLoginAction,
  requestMagicLink as requestMagicLinkAction,
  verifyMagicLink as verifyMagicLinkAction,
  changePassword as changePasswordAction,
  terminateAllSessions,
  checkOTPStatus as checkOTPStatusAction,
  invalidateOTP as invalidateOTPAction,
  verifyEmail as verifyEmailAction,
  googleLogin as googleLoginAction,
  refreshToken,
  clearSession,
} from '@/lib/actions/auth.server';
import {
  getClinicById,
  getClinicDoctors,
  getClinicLocations,
  getMyClinic,
} from '@/lib/actions/clinic.server';
import type {
  OTPFormData,
  OtpRequestFormData,
  SocialLoginData,
  AuthResponse,
  MessageResponse,
  User,
  Session,
} from '@/types/auth.types';
import { Role } from '@/types/auth.types';
import { ROUTES, getDashboardByRole } from '@/lib/config/routes';
import { 
  clearTokens 
} from '@/lib/utils/token-manager';
import { clinicApiClient } from '@/lib/api/client';
import { clearInflightRequests } from '@/hooks/core/requestDeduper';
import { normalizeClinicId } from '@/lib/utils/clinic-id';
import {
  clearOtpVerificationLock,
  isOtpVerificationLocked,
  markOtpVerificationLocked,
} from '@/lib/utils/otp-verification-lock';

// Constants
const TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000; // 60 minutes - refresh tokens that expire within 1 hour
// SESSION_REFRESH_INTERVAL and MAX_RETRY_ATTEMPTS removed - not used

// Types
interface GoogleLoginResponse {
  user: User & {
    isNewUser?: boolean;
    googleId?: string;
    clinicId?: string;
    clinicName?: string;
  };
  token?: string;
  redirectUrl: string;
}

// SessionData is replaced by imported Session type

// Helper functions
function getRedirectPath(
  redirectUrl?: string
): string {
  if (!redirectUrl || redirectUrl.includes('/auth/')) {
    throw new Error('Backend redirectUrl missing or invalid');
  }
  return redirectUrl;
}

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Token parsing error', error, { component: 'useAuth' });
    }
    return true; // Assume token needs refresh if we can't parse it
  }
}

function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    return status === 401 || status === 403;
  }
  return false;
}

function resolveProfileCompleteFromBackend(user: Record<string, unknown> | null | undefined): boolean {
  if (!user) return false;
  if (user.role && String(user.role).toUpperCase() !== String(Role.PATIENT)) return true;
  if (typeof user.profileComplete === 'boolean') return user.profileComplete;
  if (typeof user.isProfileComplete === 'boolean') return user.isProfileComplete;
  if (typeof user.requiresProfileCompletion === 'boolean') {
    return !user.requiresProfileCompletion;
  }
  return false;
}

// Use centralized normalizeClinicId from @/lib/utils/clinic-id
function resolveClinicId(user: Record<string, unknown> | null | undefined): string | undefined {
  if (!user) return undefined;

  const clinicId = user.clinicId;
  const primaryClinicId = user.primaryClinicId;

  // Try clinicId first, then primaryClinicId, normalize both
  const normalized = normalizeClinicId(
    typeof clinicId === 'string' ? clinicId :
    typeof primaryClinicId === 'string' ? primaryClinicId : ''
  );

  return normalized || undefined;
}

function normalizeOtpIdentifier(identifier: string): string {
  const trimmed = identifier.trim();

  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (!cleaned) {
    return cleaned;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const verifyOtpInFlightRef = useRef(false);
  const requestOtpInFlightRef = useRef(false);
  
  // ✅ Sync with Zustand auth store
  const setSession = useAuthStore((state) => state.setSession);
  const syncAuthStateFromSession = useAuthStore(
    (state) => state.syncAuthStateFromSession
  );

  // Targeted cache reset for an auth transition. We must NOT call
  // `queryClient.clear()` here — that wipes every cache entry, including
  // any `placeholderData: keepPreviousData` snapshots that consumers rely on
  // to avoid the skeleton flash. The previously-cached entries for a
  // different user/role/session-id will simply not match any new key (the
  // session-id-aware key in `usePrefetchAppointmentsForRole` and elsewhere
  // changes after login), so they age out via `gcTime` naturally.
  const resetQueryCacheForAuthTransition = useCallback(
    (nextSession?: Session | null) => {
      // Cancel in-flight queries so we don't get a 401-stale response landing
      // on top of the new session's first fetch.
      void queryClient.cancelQueries();
      // Drop session and userProfile keys to prevent stale auth state
      // The new session's queries will fetch fresh; the old session's queries
      // age out via gcTime.
      queryClient.removeQueries({ queryKey: ['session'] });
      queryClient.removeQueries({ queryKey: ['userProfile'] });
      clinicApiClient.clearRequestCache();
      clearInflightRequests('api-client');
      clearInflightRequests('query');

      if (nextSession) {
        queryClient.setQueryData(['session'], nextSession);
        setSession(nextSession);
      }
    },
    [queryClient, setSession]
  );

  // Full cache wipe — used on logout/terminate where the user should
  // see no remnants of the prior session. Does NOT touch
  // placeholderData-friendly caches because there's no UI left to
  // flicker.
  const wipeQueryCacheOnLogout = useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
    clinicApiClient.clearRequestCache();
    clearInflightRequests('api-client');
    clearInflightRequests('query');
  }, [queryClient]);

  const prefetchAuthenticatedWorkspace = useCallback(
      async (clinicId?: string, authScope: string = 'guest') => {
        if (!clinicId) {
          return;
        }

      const normalizedClinicId = clinicId.trim();
      if (!normalizedClinicId) {
        return;
      }

        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: ['myClinic', authScope],
            queryFn: async () => getMyClinic(),
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['current-clinic', normalizedClinicId, authScope],
            queryFn: async () => getClinicById(normalizedClinicId),
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['activeLocations', normalizedClinicId, authScope],
            queryFn: async () => {
              const locations = await getClinicLocations(normalizedClinicId);
              return Array.isArray(locations)
                ? locations.filter(location => location?.isActive !== false)
                : [];
            },
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['clinicDoctors', normalizedClinicId, authScope],
            queryFn: async () => {
              const result = await getClinicDoctors(normalizedClinicId);
              return Array.isArray(result) ? result : [];
          },
          staleTime: 30 * 1000,
        }),
      ]);
    },
    [queryClient]
  );

  // Get current session with auto-refresh using core hook
  const { data: session, isPending, error: sessionError } = useQueryData<Session | null>(
    ['session'],
    async (): Promise<Session | null> => {
      const result = await getServerSession();

      if (!result) {
        return null;
      }

      // If session exists but token is expiring soon, refresh it
      if (result.user && result.access_token && isTokenExpiringSoon(result.access_token)) {
        const refreshedSession = await refreshToken();
        if (refreshedSession && refreshedSession.access_token && refreshedSession.user) {
          // Ensure clinicId is compatible by allowing undefined
          return {
            ...refreshedSession,
            user: {
              ...refreshedSession.user,
              clinicId: refreshedSession.user.clinicId || undefined
            }
          };
        }
        return null;
      }

      return result;
    },
    {
  // ✅ Disable auto-refetch on auth pages to prevent blocking
      // Only refetch when window is focused or explicitly requested
      refetchInterval: false, // Disabled - will be enabled after successful login
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // ✅ CRITICAL: Don't refetch on mount - prevents blocking navigation
      // ✅ Add caching to prevent duplicate calls - optimized for session data
      staleTime: 5 * 60 * 1000, // 5 minutes - session doesn't change frequently
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes to prevent unnecessary refetches
      // ✅ Make query non-blocking - don't wait for it
      enabled: true, // Keep enabled but make it non-blocking
      // ✅ Prevent duplicate calls in development (React Strict Mode)
      refetchOnReconnect: false, // Don't refetch on reconnect
      // ✅ Use structuralSharing to prevent unnecessary re-renders
      structuralSharing: true,
      retry: (failureCount: number, error: any) => {
        if (isAuthError(error) || isSessionInvalidError(error)) {
          return false;
        }
        return failureCount < 2;
      },
    }
  );

  // ✅ Sync session to Zustand store and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isResolvingSession = isPending || (!!sessionError && !session);
    const shouldClearAuth = session === null && !isPending && !sessionError;

    if (session) {
      const sessionForStore: Session = {
        user: session.user,
        access_token: session.access_token,
        session_id: session.session_id,
        isAuthenticated: session.isAuthenticated,
      };
      syncAuthStateFromSession({
        session: sessionForStore,
        isLoading: isResolvingSession,
        shouldClearAuth: false,
      });
    } else if (shouldClearAuth) {
      syncAuthStateFromSession({
        session: null,
        isLoading: isResolvingSession,
        shouldClearAuth: true,
      });
      clearTokens();
    } else {
      syncAuthStateFromSession({
        session: undefined,
        isLoading: isResolvingSession,
        shouldClearAuth: false,
      });
    }
  }, [session, isPending, sessionError, syncAuthStateFromSession]);

  // Function to manually refresh the session
  const refreshSession = async (force?: boolean): Promise<Session | null> => {
    try {
      const currentSession = queryClient.getQueryData<Session | null>(['session']) || null;

      // If not forced, try to get the session from the server first (fastest)
      if (!force) {
        const serverSession = await getServerSession();

        if (serverSession) {
          queryClient.setQueryData(['session'], serverSession);
          return serverSession;
        }
      }

      // If forced or no server session, try to refresh the token (hits backend)
      const refreshedSession = await refreshToken();

      if (refreshedSession) {
        queryClient.setQueryData(['session'], refreshedSession);
        return refreshedSession;
      }

      return currentSession;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Session refresh error', error, { component: 'useAuth' });
      }

      if (isSessionInvalidError(error)) {
        queryClient.setQueryData(['session'], null);
        showErrorToast('Session expired. Please login again.', { id: TOAST_IDS.AUTH.LOGIN });
        return null;
      }

      return (queryClient.getQueryData<Session | null>(['session']) || null);
    }
  };

  // Enhanced login mutation with proper error handling using core hook
  const loginMutation = useMutationOperation(
    async (data: { email: string; password: string; rememberMe?: boolean; clinicId?: string | undefined }) => {
      const result = await loginAction(data);

      // ✅ Check for explicit error return (avoids Next.js error masking)
      if ((result as any).error) {
        throw new Error((result as any).error);
      }

      if (!result.user) {
        throw new Error('Invalid user data received');
      }

      // Ensure required fields are present with defaults
      const user: User = {
        ...result.user,
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
      };

      return {
        ...result,
        user,
      };
    },
    {
      toastId: TOAST_IDS.AUTH.LOGIN,
      loadingMessage: 'Logging in...',
      successMessage: 'Logged in successfully',
      showToast: false,
      showLoading: false,
      onError: (error: Error) => {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Login failed', { error: error.message, component: 'useAuth' });
        }
      },
      onSuccess: (data) => {
        // Convert AuthResponse to Session
        const profileComplete = resolveProfileCompleteFromBackend(data.user as unknown as Record<string, unknown>);
        const clinicId = resolveClinicId(data.user as unknown as Record<string, unknown>);
        const { ...restUser } = data.user;
        const sessionData: Session = {
          user: {
            ...restUser,
            ...(clinicId ? { clinicId } : {}),
            profileComplete,
          } as User,
          access_token: data.access_token,
          session_id: data.session_id,
          isAuthenticated: true,
          };
          
          // Reset guest cache before establishing the authenticated session
          resetQueryCacheForAuthTransition(sessionData);
          void prefetchAuthenticatedWorkspace(clinicId, sessionData.session_id || sessionData.user.id || 'guest');
        
        router.push(getRedirectPath(data.redirectUrl));
      },
    }
  );

  // Google login mutation - ✅ Use core hook
  const googleLoginMutation = useMutationOperation<GoogleLoginResponse, { token: string; clinicId?: string | undefined }>(
    async (data: { token: string; clinicId?: string | undefined }) => {
      const result = await googleLoginAction(data.token, data.clinicId);

      if (!result) {
        throw new Error('Google login failed: No response from server');
      }

      if (!result.user || !result.user.id || !result.user.email || !result.user.role) {
        throw new Error('Google login failed: Invalid response from server');
      }

      return result;
    },
    {
      toastId: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      loadingMessage: 'Logging in with Google...',
      successMessage: 'Logged in successfully',
      showToast: false,
      showLoading: false,
      onSuccess: async (data) => {
        if (!data || !data.user) {
          showErrorToast('Google login failed: Invalid response data', {
            id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
          });
          return;
        }

        const initialProfileComplete = resolveProfileCompleteFromBackend(data.user as unknown as Record<string, unknown>);
        const clinicId = resolveClinicId(data.user as unknown as Record<string, unknown>);
        // Create session data with proper defaults
        const sessionData: Session = {
          user: {
            id: data.user.id,
            ...(data.user.loginMethod === 'phone_otp'
              ? {}
              : { email: data.user.email ?? undefined }),
            role: data.user.role,
            name: data.user.name || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim(),
            firstName: data.user.firstName || data.user.name?.split(/\s+/)[0] || '',
            lastName: data.user.lastName || data.user.name?.split(/\s+/).slice(1).join(' ') || '',
            isVerified: true,
            emailVerified: true,
            loginMethod: 'google_oauth',
            googleId: data.user.googleId || '',
            ...(clinicId ? { clinicId } : {}),
            ...(data.user.clinicName ? { clinicName: data.user.clinicName } : {}),
            profileComplete: initialProfileComplete
          },
          access_token: data.token || '',
          session_id: '',
          isAuthenticated: true
          };

          // Reset guest cache before establishing the authenticated session
          resetQueryCacheForAuthTransition(sessionData);
          void prefetchAuthenticatedWorkspace(clinicId, sessionData.session_id || sessionData.user.id || 'guest');

        router.push(getRedirectPath(data.redirectUrl));
      },
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Google login failed', {
            error: error instanceof Error ? error.message : String(error),
            component: 'useAuth',
          });
        }
      },
    }
  );
  
  const googleLogin = useCallback(
    (token: string, clinicId?: string | undefined) => googleLoginMutation.mutateAsync({ token, clinicId }),
    [googleLoginMutation]
  );
  const isGoogleLoggingIn = googleLoginMutation.isPending;

  // Enhanced logout mutation with proper cleanup - ✅ Use core hook
  const logoutMutation = useMutationOperation<{ success: boolean }, void>(
    async () => {
      try {
        await logoutAction();
        return { success: true };
      } catch (error) {
        // If it's a 401 or session-related error, treat as success
        if (error instanceof Error &&
            (error.message.includes('401') ||
             error.message.includes('Session') ||
             error.message.includes('session'))) {
          return { success: true };
        }
        throw error;
      }
    },
    {
      toastId: TOAST_IDS.AUTH.LOGOUT,
      loadingMessage: 'Logging out...',
      successMessage: 'Logged out successfully',
      showToast: false, // Handle manually for custom messages
      onSuccess: () => {
        // Clear query cache and Zustand stores (prevent cross-role state leakage)
        wipeQueryCacheOnLogout();
        resetAllStores();
        clearSession();

        // ✅ Use router.replace instead of push to prevent history issues
        router.replace(ROUTES.LOGIN);
        showSuccessToast('Logged out successfully', {
          id: TOAST_IDS.AUTH.LOGOUT,
        });
      },
      onError: (error: Error) => {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Logout error', error, { component: 'useAuth' });
        }

        // ✅ CRITICAL FIX: Immediately invalidate session query to prevent dashboard render
        // Clear client state even if server logout fails (prevent cross-role state leakage)
        wipeQueryCacheOnLogout();
        resetAllStores();
        clearSession();

        // ✅ Use router.replace instead of push to prevent history issues
        router.replace(ROUTES.LOGIN);
        showErrorToast('Logged out locally, but server logout failed', {
          id: TOAST_IDS.AUTH.LOGOUT,
        });
      },
    }
  );

  // OTP verification mutation - ✅ Use core hook
  const verifyOTPMutation = useMutationOperation<AuthResponse, OTPFormData>(
    async (data) => {
      if (verifyOtpInFlightRef.current) {
        throw new Error('OTP verification is already in progress');
      }

      const normalizedIdentifier = normalizeOtpIdentifier(data.identifier);
      if (isOtpVerificationLocked(normalizedIdentifier, data.clinicId)) {
        const currentSession = queryClient.getQueryData<Session | null>(['session']);
        if (currentSession?.user) {
          const profileComplete = resolveProfileCompleteFromBackend(
            currentSession.user as unknown as Record<string, unknown>
          );
          const redirectUrl =
            currentSession.user.role && String(currentSession.user.role).toUpperCase() === String(Role.PATIENT) && !profileComplete
              ? ROUTES.PROFILE_COMPLETION
              : getDashboardByRole(currentSession.user.role);

          return {
            user: currentSession.user,
            access_token: currentSession.access_token,
            session_id: currentSession.session_id,
            redirectUrl,
          } as AuthResponse;
        }
      }

      verifyOtpInFlightRef.current = true;
      try {
      const result = await verifyOTPAction({
        ...data,
        identifier: normalizedIdentifier,
      });
      if ('error' in result && result.error) {
        throw new Error(result.error);
      }
      return result as AuthResponse;
      } finally {
        verifyOtpInFlightRef.current = false;
      }
    },
    {
      toastId: TOAST_IDS.AUTH.OTP,
      loadingMessage: 'Verifying OTP...',
      successMessage: 'OTP verified successfully! Welcome back!',
      showToast: false,
      showLoading: false,
      onSuccess: (data, variables) => {
        // Convert AuthResponse to Session
        const profileComplete = resolveProfileCompleteFromBackend(data.user as unknown as Record<string, unknown>);
        const clinicId = resolveClinicId(data.user as unknown as Record<string, unknown>);
        // Determine login method from backend metadata, with a safe legacy fallback.
        const userRecord = data.user as unknown as Record<string, unknown>;
        const verificationIdentifier =
          typeof userRecord.phone === 'string' && userRecord.phone.trim()
            ? userRecord.phone
            : typeof userRecord.email === 'string' && userRecord.email.trim()
              ? userRecord.email
              : '';
        if (verificationIdentifier) {
          markOtpVerificationLocked(verificationIdentifier, clinicId);
        }
        const loginMethod = (() => {
          const method = typeof userRecord.loginMethod === 'string' ? userRecord.loginMethod : '';
          if (method && method !== 'otp') {
            return method;
          }

          if (userRecord.phoneVerified === true) {
            return 'phone_otp';
          }

          if (userRecord.emailVerified === true) {
            return 'email_otp';
          }

          return 'phone_otp';
        })();
        // Phone verified is true for OTP login since they just verified via OTP
        const phoneVerified = userRecord.phoneVerified as boolean ?? true;
        const fallbackPhone =
          typeof variables?.identifier === 'string' && variables.identifier.trim()
            ? normalizeOtpIdentifier(variables.identifier)
            : '';

        const sessionData: Session = {
          user: {
            ...data.user,
            phone: userRecord.phone || fallbackPhone,
            ...(clinicId ? { clinicId } : {}),
            profileComplete,
            loginMethod: loginMethod as User['loginMethod'],
            phoneVerified,
          } as User,
          access_token: data.access_token || '',
          session_id: data.session_id || '',
          isAuthenticated: true,
        };

        resetQueryCacheForAuthTransition(sessionData);
        void prefetchAuthenticatedWorkspace(clinicId, sessionData.session_id || sessionData.user.id || 'guest');

        // Redirect is handled by the page using the backend result.
      },
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('OTP verification failed', {
            error: error instanceof Error ? error.message : String(error),
            component: 'useAuth',
          });
        }
      },
    }
  );

  // Request OTP mutation - ✅ Use core hook
  const requestOTPMutation = useMutationOperation<{ success: boolean; message: string }, OtpRequestFormData>(
    async (data: OtpRequestFormData) => {
      if (requestOtpInFlightRef.current) {
        return {
          success: false,
          message: 'OTP request is already in progress',
        };
      }

      requestOtpInFlightRef.current = true;
      try {
        return requestOTPAction({
          ...data,
          identifier: normalizeOtpIdentifier(data.identifier),
        });
      } finally {
        requestOtpInFlightRef.current = false;
      }
    },
    {
      toastId: TOAST_IDS.AUTH.OTP,
      loadingMessage: 'Sending OTP...',
      successMessage: 'OTP sent successfully! Please check your email.',
      showToast: false,
      showLoading: false,
      invalidateQueries: [['session']],
      onSuccess: (_data, variables) => {
        clearOtpVerificationLock(variables.identifier, variables.clinicId);
        if (process.env.NODE_ENV === 'development') {
          logger.info('OTP sent', { component: 'useAuth' });
        }
      },
    }
  );

  // Password reset mutations - ✅ Use core hooks
  const forgotPasswordMutation = useMutationOperation<MessageResponse, string>(
    (email) => forgotPasswordAction({ email }) as Promise<MessageResponse>,
    {
      toastId: TOAST_IDS.AUTH.FORGOT_PASSWORD,
      loadingMessage: 'Sending reset instructions...',
      successMessage: 'Password reset instructions sent to your email',
      onSuccess: (data) => {
        showSuccessToast(data.message || 'Password reset instructions sent to your email', {
          id: TOAST_IDS.AUTH.FORGOT_PASSWORD,
        });
      },
    }
  );

  const forgotPassword = forgotPasswordMutation.mutate;
  const isRequestingReset = forgotPasswordMutation.isPending;

  const resetPasswordMutation = useMutationOperation<MessageResponse, { token: string; newPassword: string }>(
    (data) => resetPasswordAction({ 
      token: data.token, 
      password: data.newPassword, 
      confirmPassword: data.newPassword 
    }) as Promise<MessageResponse>,
    {
      toastId: TOAST_IDS.AUTH.RESET_PASSWORD,
      loadingMessage: 'Resetting password...',
      successMessage: 'Password reset successful',
      onSuccess: (data) => {
        router.push(`${ROUTES.LOGIN}?reset=true`);
        showSuccessToast(data.message || 'Password reset successful', {
          id: TOAST_IDS.AUTH.RESET_PASSWORD,
        });
      },
    }
  );
  
  const resetPassword = resetPasswordMutation.mutate;
  const isResettingPassword = resetPasswordMutation.isPending;

  // Social login mutation - ✅ Use core hook
  const socialLoginMutation = useMutationOperation<AuthResponse, SocialLoginData>(
    (data) => socialLoginAction(data),
    {
      toastId: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      loadingMessage: 'Logging in...',
      successMessage: 'Logged in successfully',
      showToast: false,
      showLoading: false,
        onSuccess: (data) => {
          const profileComplete = resolveProfileCompleteFromBackend(data.user as unknown as Record<string, unknown>);
          const clinicId = resolveClinicId(data.user as unknown as Record<string, unknown>);
          const accessToken =
            (data as unknown as { access_token?: string; accessToken?: string }).access_token ||
            (data as unknown as { access_token?: string; accessToken?: string }).accessToken ||
            '';
          const sessionId =
            (data as unknown as { session_id?: string; sessionId?: string }).session_id ||
            (data as unknown as { session_id?: string; sessionId?: string }).sessionId ||
            '';
          const sessionData: Session = {
            user: {
              ...data.user,
              ...(clinicId ? { clinicId } : {}),
              profileComplete,
            } as User,
            access_token: accessToken,
            session_id: sessionId,
            isAuthenticated: true,
          };

        resetQueryCacheForAuthTransition(sessionData);
        void prefetchAuthenticatedWorkspace(clinicId, sessionData.session_id || sessionData.user.id || 'guest');
        router.push(getRedirectPath(data.redirectUrl));
      },
    }
  );
  
  const socialLogin = socialLoginMutation.mutate;
  const isSocialLoggingIn = socialLoginMutation.isPending;

  // Magic link mutations - ✅ Use core hooks
  const requestMagicLinkMutation = useMutationOperation<MessageResponse, string>(
    (email) => requestMagicLinkAction(email),
    {
      toastId: TOAST_IDS.AUTH.LOGIN,
      loadingMessage: 'Sending magic link...',
      successMessage: 'Magic link sent to your email',
      onSuccess: (data) => {
        showSuccessToast(data.message || 'Magic link sent to your email', {
          id: TOAST_IDS.AUTH.LOGIN,
        });
      },
    }
  );
  
  const requestMagicLink = requestMagicLinkMutation.mutate;
  const isRequestingMagicLink = requestMagicLinkMutation.isPending;

  const verifyMagicLinkMutation = useMutationOperation<AuthResponse, string>(
    (token) => verifyMagicLinkAction(token),
    {
      toastId: TOAST_IDS.AUTH.LOGIN,
      loadingMessage: 'Verifying magic link...',
      successMessage: 'Logged in successfully',
        onSuccess: (data) => {
          const profileComplete = resolveProfileCompleteFromBackend(data.user as unknown as Record<string, unknown>);
          const clinicId = resolveClinicId(data.user as unknown as Record<string, unknown>);
          const accessToken =
            (data as unknown as { access_token?: string; accessToken?: string }).access_token ||
            (data as unknown as { access_token?: string; accessToken?: string }).accessToken ||
            '';
          const sessionId =
            (data as unknown as { session_id?: string; sessionId?: string }).session_id ||
            (data as unknown as { session_id?: string; sessionId?: string }).sessionId ||
            '';
          const sessionData: Session = {
            user: {
              ...data.user,
              ...(clinicId ? { clinicId } : {}),
              profileComplete,
            } as User,
            access_token: accessToken,
            session_id: sessionId,
            isAuthenticated: true,
          };

          resetQueryCacheForAuthTransition(sessionData);
          void prefetchAuthenticatedWorkspace(clinicId, sessionData.session_id || sessionData.user.id || 'guest');
        router.push(getRedirectPath(data.redirectUrl));
        showSuccessToast('Logged in successfully', {
          id: TOAST_IDS.AUTH.LOGIN,
        });
      },
    }
  );
  
  const verifyMagicLink = verifyMagicLinkMutation.mutate;
  const isVerifyingMagicLink = verifyMagicLinkMutation.isPending;

  // Change password mutation - ✅ Use core hook
  const changePasswordMutation = useMutationOperation<AuthResponse, { currentPassword?: string; newPassword: string }>(
    (data) => changePasswordAction(data),
    {
      toastId: TOAST_IDS.AUTH.RESET_PASSWORD,
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
      invalidateQueries: [['session']],
    }
  );
  
  const changePassword = changePasswordMutation.mutate;
  const changePasswordAsync = changePasswordMutation.mutateAsync;
  const isChangingPassword = changePasswordMutation.isPending;

  // Terminate all sessions mutation - ✅ Use core hook
  const terminateAllSessionsMutation = useMutationOperation<void, void>(
    () => terminateAllSessions(),
    {
      toastId: TOAST_IDS.SESSION.TERMINATE_ALL,
      loadingMessage: 'Terminating all sessions...',
      successMessage: 'All sessions terminated successfully',
      onSuccess: () => {
        wipeQueryCacheOnLogout();
        router.push(ROUTES.LOGIN);
        showSuccessToast('All sessions terminated successfully', {
          id: TOAST_IDS.SESSION.TERMINATE_ALL,
        });
      },
    }
  );

  // Check OTP Status mutation - ✅ Use core hook
  const checkOTPStatusMutation = useMutationOperation<{ hasActiveOTP: boolean }, string>(
    (email) => checkOTPStatusAction(email) as Promise<{ hasActiveOTP: boolean }>,
    {
      toastId: TOAST_IDS.VERIFICATION.OTP,
      loadingMessage: 'Checking OTP status...',
      successMessage: 'OTP status checked',
      showToast: false, // No toast for status checks
    }
  );
  
  const checkOTPStatus = checkOTPStatusMutation.mutate;
  const isCheckingOTPStatus = checkOTPStatusMutation.isPending;

  // Invalidate OTP mutation - ✅ Use core hook
  const invalidateOTPMutation = useMutationOperation<{ message: string }, string>(
    (email) => invalidateOTPAction(email) as Promise<{ message: string }>,
    {
      toastId: TOAST_IDS.AUTH.OTP,
      loadingMessage: 'Invalidating OTP...',
      successMessage: 'OTP invalidated',
      onSuccess: (data) => {
        showSuccessToast(data.message, {
          id: TOAST_IDS.AUTH.OTP,
        });
      },
    }
  );
  
  const invalidateOTP = invalidateOTPMutation.mutate;
  const isInvalidatingOTP = invalidateOTPMutation.isPending;

  // Verify Email mutation - ✅ Use core hook
  const verifyEmailMutation = useMutationOperation<{ success: boolean; message: string }, { email: string; otp: string }>(
    (data) => verifyEmailAction(data.email, data.otp),
    {
      toastId: 'verify-email', // Fallback string ID
      loadingMessage: 'Verifying email...',
      successMessage: 'Email verified successfully!',
      onSuccess: (data) => {
        if (!data.success) {
           throw new Error(data.message);
        }
        showSuccessToast(data.message || 'Email verified successfully!', {
          id: 'verify-email',
        });
        router.push(ROUTES.LOGIN);
      },
    }
  );
  
  const verifyEmail = verifyEmailMutation.mutate;
  const isVerifyingEmail = verifyEmailMutation.isPending;

  return {
    session,
    isPending,
    isAuthenticated: !!session?.user,
    user: session?.user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync, // ✅ Use mutateAsync for awaitable login
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    verifyOTP: verifyOTPMutation.mutateAsync, // ✅ Use mutateAsync for awaitable OTP verification
    requestOTP: requestOTPMutation.mutateAsync, // ✅ Use mutateAsync for awaitable OTP request
    forgotPassword,
    resetPassword,
    changePassword,
    changePasswordAsync,
    requestMagicLink,
    verifyMagicLink,
    terminateAllSessions: terminateAllSessionsMutation.mutate,
    checkOTPStatus,
    invalidateOTP,
    verifyEmail,
    googleLogin,
    socialLogin,
    isCheckingOTPStatus,
    isInvalidatingOTP,
    isVerifyingEmail,
    isGoogleLoggingIn,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRequestingReset,
    isResettingPassword,
    isChangingPassword,
    isRequestingMagicLink,
    isVerifyingMagicLink,
    isTerminatingAllSessions: terminateAllSessionsMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
    isRequestingOTP: requestOTPMutation.isPending,
    isSocialLoggingIn,
    getRedirectPath,
    refreshSession,
  };
}

// ============================================================================
// ✅ UNIFIED AUTH FORM HOOK
// Follows SOLID, DRY, KISS principles
// Centralizes common auth form patterns: loading, error handling, toast, overlay
// ============================================================================

export interface AuthFormOptions {
  /** Toast ID for this operation */
  toastId: string;
  /** Loading message */
  loadingMessage: string;
  /** Success message */
  successMessage: string;
  /** Error message fallback */
  errorMessage?: string;
  /** Redirect URL on success */
  redirectUrl?: string;
  /** Delay before redirect (ms) */
  redirectDelay?: number;
  /** Callback on success */
  onSuccess?: (data?: AuthResponse) => void | Promise<void>;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Whether to show toast */
  showToast?: boolean;
}

/**
 * ✅ Unified Auth Form Hook
 * Provides consistent loading, error handling, and toast management
 * Uses Zustand for global loading state (no overlay)
 */
export function useAuthForm(options: AuthFormOptions) {
  const router = useRouter();
  const { startLoading, stopLoading } = useGlobalLoading();

  // ✅ Use refs to avoid dependency issues
  const startLoadingRef = useRef(startLoading);
  const stopLoadingRef = useRef(stopLoading);

  useEffect(() => {
    startLoadingRef.current = startLoading;
    stopLoadingRef.current = stopLoading;
  }, [startLoading, stopLoading]);

  /**
   * ✅ Execute auth operation with consistent error handling
   */
  const executeAuthOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      customOptions?: Partial<AuthFormOptions>
    ): Promise<T | null> => {
      const opts = { ...options, ...customOptions };
      const {
        toastId,
        loadingMessage,
        successMessage,
        errorMessage,
        redirectUrl,
        redirectDelay = 0,
        onSuccess,
        onError,
        showToast = true,
      } = opts;

      try {
        // ✅ Show loading indicators
        startLoadingRef.current(loadingMessage);
        if (showToast) {
          showLoadingToast(loadingMessage, toastId);
        }

        // ✅ Execute operation
        const result = await operation();

        // ✅ Handle success
        stopLoadingRef.current();
        if (showToast) {
          dismissToast(toastId);
          showSuccessToast(successMessage, { id: toastId });
        }

        // ✅ Call success callback
        if (onSuccess) {
          await onSuccess(result as AuthResponse);
        }

        // ✅ Redirect if specified
        if (redirectUrl) {
          if (redirectDelay > 0) {
            setTimeout(() => router.push(redirectUrl), redirectDelay);
          } else {
            router.push(redirectUrl);
          }
        }

        return result;
      } catch (error) {
        // ✅ Consistent error handling
        stopLoadingRef.current();
        if (showToast) {
          dismissToast(toastId);
        }

        const sanitizedError = sanitizeErrorMessage(error);
        const finalErrorMessage = errorMessage || sanitizedError || ERROR_MESSAGES.UNKNOWN_ERROR;

        if (showToast) {
          showErrorToast(finalErrorMessage, { id: toastId });
        }

        if (onError) {
          onError(error instanceof Error ? error : new Error(finalErrorMessage));
        }

        return null;
      }
    },
    [options, router]
  );

  return {
    executeAuthOperation,
    startLoading: startLoadingRef.current,
    stopLoading: stopLoadingRef.current,
  };
} 



