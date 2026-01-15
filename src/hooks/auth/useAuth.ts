'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, TOAST_IDS } from '../utils/use-toast'; // ✅ Use consolidated toast hook
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { ERROR_MESSAGES } from '@/lib/config/config';
import { useLoadingOverlay } from '@/app/providers/LoadingOverlayContext';
import { logger } from '@/lib/utils/logger';
import {
  login as loginAction,
  register as registerAction,
  verifyOTP as verifyOTPAction,
  logout as logoutAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  getServerSession,
  requestOTP as requestOTPAction,
  socialLogin as socialLoginAction,
  requestMagicLink as requestMagicLinkAction,
  verifyMagicLink as verifyMagicLinkAction,
  registerWithClinic as registerWithClinicAction,
  changePassword as changePasswordAction,
  terminateAllSessions,
  checkOTPStatus as checkOTPStatusAction,
  invalidateOTP as invalidateOTPAction,
  verifyEmail as verifyEmailAction,
  googleLogin as googleLoginAction,
  facebookLogin as facebookLoginAction,
  appleLogin as appleLoginAction,
  refreshToken,
  clearSession,
} from '@/lib/actions/auth.server';
import type {
  OTPFormData,
  RegisterData,
  SocialLoginData,
  AuthResponse,
  MessageResponse,
  User,
} from '@/types/auth.types';
import { Role } from '@/types/auth.types';
import { getDashboardByRole } from '@/lib/config/routes';

// Constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
// SESSION_REFRESH_INTERVAL and MAX_RETRY_ATTEMPTS removed - not used

// Types
interface GoogleLoginResponse {
  user: User & {
    isNewUser?: boolean;
    googleId?: string;
  };
  token?: string;
  redirectUrl?: string;
}

interface SessionData {
  user: User;
  access_token: string;
  session_id: string;
  isAuthenticated: boolean;
}

// Helper functions
function getRedirectPath(user: { role?: Role | string } | null | undefined, redirectUrl?: string): string {
  if (redirectUrl && !redirectUrl.includes('/auth/')) {
    return redirectUrl;
  }
  if (user?.role) {
    return getDashboardByRole(user.role as Role);
  }
  return '/auth/login';
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

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current session with auto-refresh
  const { data: session, isLoading } = useQuery<SessionData | null>({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionData | null> => {
      try {
        const result = await getServerSession();

        if (!result) {
          return null;
        }

        // If session exists but token is expiring soon, refresh it
        if (result.user && result.access_token && isTokenExpiringSoon(result.access_token)) {
          try {
            const refreshedSession = await refreshToken();
            if (refreshedSession) {
              return refreshedSession;
            }
            // If refresh failed, clear session and return null
            await clearSession();
            return null;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              logger.error('Session refresh error', error, { component: 'useAuth' });
            }
            await clearSession();
            return null;
          }
        }

        return result;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Session fetch error', error, { component: 'useAuth' });
        }
        // Clear session on error
        await clearSession();
        return null;
      }
    },
    // ✅ Disable auto-refetch on auth pages to prevent blocking
    // Only refetch when window is focused or explicitly requested
    refetchInterval: false, // Disabled - will be enabled after successful login
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // ✅ CRITICAL: Don't refetch on mount - prevents blocking navigation
    // ✅ Add caching to prevent duplicate calls - increased staleTime
    staleTime: 10000, // Consider data fresh for 10 seconds to prevent duplicate calls
    gcTime: 60000, // Cache for 60 seconds to prevent unnecessary refetches
    // ✅ Make query non-blocking - don't wait for it
    enabled: true, // Keep enabled but make it non-blocking
    // ✅ Prevent duplicate calls in development (React Strict Mode)
    refetchOnReconnect: false, // Don't refetch on reconnect
    // ✅ Use structuralSharing to prevent unnecessary re-renders
    structuralSharing: true,
    retry: (_failureCount, error) => {
      if (isAuthError(error)) {
        return false;
      }
      // ✅ No retries on auth pages to prevent blocking
      return false; // Don't retry at all on auth pages
    },
  });

  // Function to manually refresh the session
  const refreshSession = async (): Promise<SessionData | null> => {
    try {
      // First try to get the session from the server
      const serverSession = await getServerSession();

      if (serverSession) {
        queryClient.setQueryData(['session'], serverSession);
        return serverSession;
      }

      // If no server session, try to refresh the token
      const refreshedSession = await refreshToken();

      if (refreshedSession) {
        queryClient.setQueryData(['session'], refreshedSession);
        return refreshedSession;
      }

      // If refresh fails, clear session
      queryClient.setQueryData(['session'], null);
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Session refresh error', error, { component: 'useAuth' });
      }
      queryClient.setQueryData(['session'], null);
      return null;
    }
  };

  // Enhanced login mutation with proper error handling
  const loginMutation = useMutation<AuthResponse, Error, { email: string; password: string; rememberMe?: boolean }>({
    mutationFn: async (data) => {
      const result = await loginAction(data);

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
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data);

      // Check if profile is complete and redirect accordingly
      const profileComplete = data.user.profileComplete || false;

      if (!profileComplete) {
        router.push('/profile-completion');
      } else {
        const dashboardPath = getDashboardByRole(data.user.role as Role);
        router.push(dashboardPath);
        // ✅ Don't show toast here - let component handle it to prevent duplicates
        // Component-level handling will show the toast
      }
    },
    onError: (_error: Error) => {
      // ✅ Don't show toast here - let component handle it to prevent duplicates
      // Component-level handling will show the toast with proper error sanitization
    },
  });

  // Google login mutation
  const {
    mutateAsync: googleLogin,
    isPending: isGoogleLoggingIn
  } = useMutation<GoogleLoginResponse, Error, string>({
    mutationFn: async (token: string) => {
      const result = await googleLoginAction(token);

      if (!result) {
        throw new Error('Google login failed: No response from server');
      }

      if (!result.user || !result.user.id || !result.user.email || !result.user.role) {
        throw new Error('Google login failed: Invalid response from server');
      }

      return result;
    },
    onSuccess: async (data) => {
      if (!data || !data.user) {
        // ✅ Use centralized error handler
        showErrorToast('Google login failed: Invalid response data', {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
        return;
      }

      // Create session data with proper defaults
      const sessionData: SessionData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || '',
          firstName: data.user.firstName || data.user.name?.split(' ')[0] || '',
          lastName: data.user.lastName || data.user.name?.split(' ').slice(1).join(' ') || '',
          isVerified: true,
          googleId: data.user.googleId || '',
          profileComplete: data.user.profileComplete || false
        },
        access_token: data.token || '',
        session_id: '',
        isAuthenticated: true
      };

      // Set the session data immediately
      queryClient.setQueryData(['session'], sessionData);

      // Refresh session from server after a brief delay
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const serverSession = await getServerSession();

        if (serverSession) {
          queryClient.setQueryData(['session'], serverSession);
        }
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error refreshing session', refreshError, { component: 'useAuth' });
        }
      }

      // Handle redirect based on profile completion
      const profileComplete = data.user.profileComplete || false;

      if (!profileComplete) {
        router.push('/profile-completion');
      } else {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        // ✅ Use centralized toast manager
        showSuccessToast(`Welcome${data.user.firstName ? ', ' + data.user.firstName : ''}!`, {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
        router.push(redirectPath);
      }
    },
    onError: (error) => {
      // ✅ Use centralized error handler
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerAction,
    // ✅ Removed onSuccess redirect - let page component handle it to prevent double redirects
    // ✅ Removed onError toast - let page component handle it to prevent duplicate toasts
  });

  // Enhanced logout mutation with proper cleanup
  const logoutMutation = useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
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
    onSuccess: () => {
      // Clear all query cache and session data
      queryClient.clear();
      queryClient.setQueryData(['session'], null);
      clearSession();

      router.push('/auth/login');
      showSuccessToast('Logged out successfully', {
        id: TOAST_IDS.AUTH.LOGOUT,
      });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Logout error', error, { component: 'useAuth' });
      }

      // Clear client state even if server logout fails
      queryClient.clear();
      queryClient.setQueryData(['session'], null);
      clearSession();

      router.push('/auth/login');
      showErrorToast('Logged out locally, but server logout failed', {
        id: TOAST_IDS.AUTH.LOGOUT,
      });
    },
  });

  // Register with clinic mutation
  const { mutate: registerWithClinic, isPending: isRegisteringWithClinic } = useMutation<AuthResponse, Error, RegisterData & { clinicId: string; appName: string }>({
    mutationFn: (data) => registerWithClinicAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      if (data.user?.role) {
        router.push(getDashboardByRole(data.user.role as Role));
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/auth/login?registered=true');
      }
      // ✅ Don't show toast here - component handles it
    },
    onError: (_error) => {
      // ✅ Don't show toast here - component handles it
    },
  });

  // OTP verification mutation
  const { mutate: verifyOTP, isPending: isVerifyingOTP } = useMutation<AuthResponse, Error, OTPFormData>({
    mutationFn: (data) => verifyOTPAction(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data);

      // Check if profile is complete and redirect accordingly
      const profileComplete = data.user.profileComplete || false;

      if (!profileComplete) {
        router.push('/profile-completion');
      } else {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        router.push(redirectPath);
        showSuccessToast('OTP verified successfully! Welcome back!', {
          id: TOAST_IDS.AUTH.OTP,
        });
      }
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.OTP,
      });
    },
  });

  // Request OTP mutation
  const { mutate: requestOTP, isPending: isRequestingOTP } = useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (identifier: string) => {
      return requestOTPAction(identifier);
    },
    onSuccess: (data) => {
      showSuccessToast(data.message, {
        id: TOAST_IDS.AUTH.OTP,
      });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.OTP,
      });
    },
  });

  // Password reset mutations
  const { mutate: forgotPassword, isPending: isRequestingReset } = useMutation<MessageResponse, Error, string>({
    mutationFn: (email) => forgotPasswordAction(email),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Password reset instructions sent to your email', {
        id: TOAST_IDS.AUTH.FORGOT_PASSWORD,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.FORGOT_PASSWORD,
      });
    },
  });

  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation<MessageResponse, Error, { token: string; newPassword: string }>({
    mutationFn: (data) => resetPasswordAction(data),
    onSuccess: (data) => {
      router.push('/auth/login?reset=true');
      showSuccessToast(data.message || 'Password reset successful', {
        id: TOAST_IDS.AUTH.RESET_PASSWORD,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.RESET_PASSWORD,
      });
    },
  });

  // Social login mutation
  const { mutate: socialLogin, isPending: isSocialLoggingIn } = useMutation<AuthResponse, Error, SocialLoginData>({
    mutationFn: (data) => socialLoginAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      showSuccessToast('Logged in successfully', {
        id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      });
    },
  });

  // Magic link mutations
  const { mutate: requestMagicLink, isPending: isRequestingMagicLink } = useMutation<MessageResponse, Error, string>({
    mutationFn: (email) => requestMagicLinkAction(email),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Magic link sent to your email', {
        id: TOAST_IDS.AUTH.LOGIN,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.LOGIN,
      });
    },
  });

  const { mutate: verifyMagicLink, isPending: isVerifyingMagicLink } = useMutation<AuthResponse, Error, string>({
    mutationFn: (token) => verifyMagicLinkAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      showSuccessToast('Logged in successfully', {
        id: TOAST_IDS.AUTH.LOGIN,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.LOGIN,
      });
    },
  });

  // Change password mutation
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation<AuthResponse, Error, FormData>({
    mutationFn: (data) => changePasswordAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      showSuccessToast('Password changed successfully', {
        id: TOAST_IDS.AUTH.RESET_PASSWORD,
      });
    },
    onError: (error) => {
      showErrorToast(error, {
        id: TOAST_IDS.AUTH.RESET_PASSWORD,
      });
    },
  });

  // Terminate all sessions mutation
  const terminateAllSessionsMutation = useMutation({
    mutationFn: terminateAllSessions,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['session'], null);
      router.push('/auth/login');
      toast.success('All sessions terminated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to terminate all sessions');
    },
  });

  // Check OTP Status mutation
  const { mutate: checkOTPStatus, isPending: isCheckingOTPStatus } = useMutation<{ hasActiveOTP: boolean }, Error, string>({
    mutationFn: (email) => checkOTPStatusAction(email),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Invalidate OTP mutation
  const { mutate: invalidateOTP, isPending: isInvalidatingOTP } = useMutation<{ message: string }, Error, string>({
    mutationFn: (email) => invalidateOTPAction(email),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Verify Email mutation
  const { mutate: verifyEmail, isPending: isVerifyingEmail } = useMutation<{ message: string }, Error, string>({
    mutationFn: (token) => verifyEmailAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success(data.message);
      router.push('/auth/login');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Social Login mutations
  const { mutate: facebookLogin, isPending: isFacebookLoggingIn } = useMutation<AuthResponse, Error, string>({
    mutationFn: (token) => facebookLoginAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('Logged in with Facebook successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    mutateAsync: appleLogin,
    isPending: isAppleLoggingIn
  } = useMutation({
    mutationFn: async (token: string) => {
      const result = await appleLoginAction(token);
      if (!result.success) {
        throw new Error(result.error || 'Apple login failed');
      }
      return result;
    },
    onSuccess: (data) => {
      // Handle successful Apple login
      if (data?.user) {
        // Invalidate auth queries to refresh session
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
        // Redirect to dashboard
        router.push(getDashboardByRole(data.user.role as Role));
        toast.success('Successfully logged in with Apple');
      }
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Apple login failed');
    },
  });

  return {
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    user: session?.user,
    login: loginMutation.mutate,
    register: registerMutation.mutateAsync, // ✅ Use mutateAsync so await works properly
    logout: logoutMutation.mutate,
    verifyOTP,
    requestOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    requestMagicLink,
    verifyMagicLink,
    registerWithClinic,
    terminateAllSessions: terminateAllSessionsMutation.mutate,
    checkOTPStatus,
    invalidateOTP,
    verifyEmail,
    googleLogin,
    facebookLogin,
    appleLogin,
    socialLogin,
    isCheckingOTPStatus,
    isInvalidatingOTP,
    isVerifyingEmail,
    isGoogleLoggingIn,
    isFacebookLoggingIn,
    isAppleLoggingIn,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRequestingReset,
    isResettingPassword,
    isChangingPassword,
    isRequestingMagicLink,
    isVerifyingMagicLink,
    isTerminatingAllSessions: terminateAllSessionsMutation.isPending,
    isRegisteringWithClinic,
    isVerifyingOTP,
    isRequestingOTP,
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
  /** Overlay variant */
  overlayVariant?: 'default' | 'login' | 'register' | 'logout';
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
  /** Whether to show overlay */
  showOverlay?: boolean;
  /** Whether to show toast */
  showToast?: boolean;
}

/**
 * ✅ Unified Auth Form Hook
 * Provides consistent loading, error handling, toast, and overlay management
 */
export function useAuthForm(options: AuthFormOptions) {
  const router = useRouter();
  const { setOverlay, clearOverlay } = useLoadingOverlay();

  // ✅ Use refs to avoid dependency issues and infinite loops
  const setOverlayRef = useRef(setOverlay);
  const clearOverlayRef = useRef(clearOverlay);

  useEffect(() => {
    setOverlayRef.current = setOverlay;
    clearOverlayRef.current = clearOverlay;
  }, [setOverlay, clearOverlay]);

  // ✅ Overlay clearing is handled by auth layout - this hook only manages overlay during auth operations
  // Removing lifecycle-based clearing prevents race conditions and conflicts with Next.js navigation

  /**
   * ✅ Execute auth operation with consistent error handling
   * Follows DRY - single implementation for all auth operations
   */
  const executeAuthOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      customOptions?: Partial<AuthFormOptions>
    ): Promise<T | null> => {
      const opts = { ...options, ...customOptions };
      const {
        toastId,
        overlayVariant = 'default',
        loadingMessage,
        successMessage,
        errorMessage,
        redirectUrl,
        redirectDelay = 0,
        onSuccess,
        onError,
        showOverlay = true,
        showToast = true,
      } = opts;

      try {
        // ✅ Show loading indicators
        if (showOverlay) {
          setOverlayRef.current({
            show: true,
            variant: overlayVariant,
            message: loadingMessage,
          });
        }
        if (showToast) {
          showLoadingToast(loadingMessage, toastId);
        }

        // ✅ Execute operation
        const result = await operation();

        // ✅ Handle success - always clear overlay immediately
        if (showOverlay) {
          // Clear overlay immediately after success
          clearOverlayRef.current();
        }
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
            setTimeout(() => {
              router.push(redirectUrl);
            }, redirectDelay);
          } else {
            router.push(redirectUrl);
          }
        }

        return result;
      } catch (error) {
        // ✅ Consistent error handling - always clear overlay immediately on error
        if (showOverlay) {
          clearOverlayRef.current();
        }
        if (showToast) {
          dismissToast(toastId);
        }

        const sanitizedError = sanitizeErrorMessage(error);
        const finalErrorMessage =
          errorMessage || sanitizedError || ERROR_MESSAGES.UNKNOWN_ERROR;

        if (showToast) {
          showErrorToast(error, {
            id: toastId,
          });
        }

        // ✅ Call error callback
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
    clearOverlay: clearOverlayRef.current,
    setOverlay: setOverlayRef.current,
  };
} 