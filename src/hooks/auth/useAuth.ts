'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useEffect } from 'react';
import { useQueryData, useMutationOperation, useQueryClient } from '@/hooks/core';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, TOAST_IDS } from '../utils/use-toast';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { ERROR_MESSAGES } from '@/lib/config/config';
import { useGlobalLoading } from '@/hooks/utils/useGlobalLoading';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/stores/auth.store';
import { resolveRedirect } from '@/lib/utils/redirect';
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
  OtpRequestFormData,
  RegisterData,
  SocialLoginData,
  AuthResponse,
  MessageResponse,
  User,
  Session,
} from '@/types/auth.types';
import { Role } from '@/types/auth.types';
import { getDashboardByRole, ROUTES } from '@/lib/config/routes';

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
  return ROUTES.LOGIN;
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
  
  // ✅ Sync with Zustand auth store
  const setSession = useAuthStore((state) => state.setSession);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);

  // Get current session with auto-refresh using core hook
  const { data: session, isPending } = useQueryData<SessionData | null>(
    ['session'],
    async (): Promise<SessionData | null> => {
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
    {
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
      retry: (_failureCount: number, error: any) => {
        if (isAuthError(error)) {
          return false;
        }
        // ✅ No retries on auth pages to prevent blocking
        return false; // Don't retry at all on auth pages
      },
    }
  );

  // ✅ Sync session to Zustand store and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setLoading(isPending);

    if (session) {
      // Convert SessionData to Session format for Zustand
      const sessionForStore: Session = {
        user: session.user,
        access_token: session.access_token,
        session_id: session.session_id,
        isAuthenticated: session.isAuthenticated,
      };
      setSession(sessionForStore);
      
      // Sync to localStorage for legacy API clients
      localStorage.setItem('access_token', session.access_token);
      if (session.session_id) {
        localStorage.setItem('session_id', session.session_id);
      }
      setError(null);
    } else if (session === null && !isPending) {
      // Only clear if explicitly null (logged out) and not loading
      clearAuth();
      localStorage.removeItem('access_token');
      localStorage.removeItem('session_id');
    }
  }, [session, isPending, setSession, clearAuth, setLoading, setError]);

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

  // Enhanced login mutation with proper error handling using core hook
  const loginMutation = useMutationOperation(
    async (data: { email: string; password: string; rememberMe?: boolean }) => {
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
      // showToast: true (default) - to ensure errors are shown
      onError: (error: Error) => {
        showErrorToast(error.message || 'Login failed', {
          id: TOAST_IDS.AUTH.LOGIN,
        });
      },
      onSuccess: (data) => {
        // Convert AuthResponse to SessionData
        const sessionData: SessionData = {
          user: data.user,
          access_token: data.access_token,
          session_id: data.session_id,
          isAuthenticated: true,
        };
        
        // Update React Query cache
        queryClient.setQueryData(['session'], sessionData);
        
        // ✅ Use centralized redirect utility
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const redirect = resolveRedirect({
          user: data.user,
          redirectUrl: data.redirectUrl,
          ...(currentPath ? { currentPath } : {}),
          isAuthenticated: true,
        });
        
        // Redirect to determined path
        router.push(redirect.path);
      },
    }
  );

  // Google login mutation - ✅ Use core hook
  const googleLoginMutation = useMutationOperation<GoogleLoginResponse, string>(
    async (token: string) => {
      const result = await googleLoginAction(token);

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
      showToast: false, // Handle manually for custom message
      onSuccess: async (data) => {
        if (!data || !data.user) {
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
          router.push(ROUTES.PROFILE_COMPLETION);
        } else {
          const redirectPath = getRedirectPath(data.user, data.redirectUrl);
          showSuccessToast(`Welcome${data.user.firstName ? ', ' + data.user.firstName : ''}!`, {
            id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
          });
          router.push(redirectPath);
        }
      },
      onError: (error) => {
        showErrorToast(error, {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
      },
    }
  );
  
  const googleLogin = googleLoginMutation.mutateAsync;
  const isGoogleLoggingIn = googleLoginMutation.isPending;

  // Register mutation - ✅ Use core hook
  const registerMutation = useMutationOperation<AuthResponse, RegisterData>(
    async (data: RegisterData) => {
       // @ts-ignore - fixing type mismatch with updated server action return type
       const result = await registerAction(data);
       
       // ✅ Check for explicit error return
       if ((result as any).error) {
         throw new Error((result as any).error);
       }
       
       return result;
    },
    {
      toastId: TOAST_IDS.AUTH.REGISTER,
      loadingMessage: 'Registering...',
      successMessage: 'Registration successful',
      showToast: false, // Let page component handle it
      // ✅ Removed onSuccess redirect - let page component handle it to prevent double redirects
      // ✅ Removed onError toast - let page component handle it to prevent duplicate toasts
    }
  );

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
        // Clear all query cache and session data
        queryClient.clear();
        queryClient.setQueryData(['session'], null);
        clearAuth(); // ✅ Use auth store clearAuth
        clearSession();

        // ✅ Use centralized redirect utility
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const redirectContext: Parameters<typeof resolveRedirect>[0] = {
          isAuthenticated: false,
        };
        if (currentPath) {
          redirectContext.currentPath = currentPath;
        }
        const redirect = resolveRedirect(redirectContext);
        
        router.push(redirect.path);
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
        clearAuth(); // ✅ Use auth store clearAuth
        clearSession();

        // ✅ Use centralized redirect utility
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const redirectContext: Parameters<typeof resolveRedirect>[0] = {
          isAuthenticated: false,
        };
        if (currentPath) {
          redirectContext.currentPath = currentPath;
        }
        const redirect = resolveRedirect(redirectContext);
        
        router.push(redirect.path);
        showErrorToast('Logged out locally, but server logout failed', {
          id: TOAST_IDS.AUTH.LOGOUT,
        });
      },
    }
  );

  // Register with clinic mutation - ✅ Use core hook
  const registerWithClinicMutation = useMutationOperation<AuthResponse, RegisterData & { clinicId: string; appName: string }>(
    (data) => registerWithClinicAction(data),
    {
      toastId: TOAST_IDS.AUTH.REGISTER,
      loadingMessage: 'Registering with clinic...',
      successMessage: 'Registration successful',
      showToast: false, // Component handles it
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        if (data.user?.role) {
          router.push(getDashboardByRole(data.user.role as Role));
        } else if (data.redirectUrl) {
          router.push(data.redirectUrl);
        } else {
          router.push(`${ROUTES.LOGIN}?registered=true`);
        }
      },
    }
  );
  
  const registerWithClinic = registerWithClinicMutation.mutate;
  const isRegisteringWithClinic = registerWithClinicMutation.isPending;

  // OTP verification mutation - ✅ Use core hook
  const verifyOTPMutation = useMutationOperation<AuthResponse, OTPFormData>(
    (data) => verifyOTPAction(data),
    {
      toastId: TOAST_IDS.AUTH.OTP,
      loadingMessage: 'Verifying OTP...',
      successMessage: 'OTP verified successfully! Welcome back!',
      showToast: false, // Handle manually for custom message
      onSuccess: (data) => {
        // Convert AuthResponse to SessionData
        const sessionData: SessionData = {
          user: data.user,
          access_token: data.access_token || '',
          session_id: data.session_id || '',
          isAuthenticated: true,
        };
        
        queryClient.setQueryData(['session'], sessionData);
        
        // ✅ Use centralized redirect utility
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const redirectContext: Parameters<typeof resolveRedirect>[0] = {
          user: data.user,
          isAuthenticated: true,
        };
        if (currentPath) {
          redirectContext.currentPath = currentPath;
        }
        if (data.redirectUrl) {
          redirectContext.redirectUrl = data.redirectUrl;
        }
        const redirect = resolveRedirect(redirectContext);
        
        router.push(redirect.path);
        showSuccessToast('OTP verified successfully! Welcome back!', {
          id: TOAST_IDS.AUTH.OTP,
        });
      },
      onError: (error) => {
        showErrorToast(error, {
          id: TOAST_IDS.AUTH.OTP,
        });
      },
    }
  );

  // Request OTP mutation - ✅ Use core hook
  const requestOTPMutation = useMutationOperation<{ success: boolean; message: string }, OtpRequestFormData>(
    async (data: OtpRequestFormData) => {
      return requestOTPAction(data);
    },
    {
      toastId: TOAST_IDS.AUTH.OTP,
      loadingMessage: 'Sending OTP...',
      successMessage: 'OTP sent successfully! Please check your email.',
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        showSuccessToast(data.message || 'OTP sent successfully! Please check your email.', {
          id: TOAST_IDS.AUTH.OTP,
        });
      },
    }
  );

  // Password reset mutations - ✅ Use core hooks
  const forgotPasswordMutation = useMutationOperation<MessageResponse, string>(
    (email) => forgotPasswordAction({ email }),
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
    (data) => resetPasswordAction({ token: data.token, password: data.newPassword, confirmPassword: data.newPassword }),
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
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        router.push(redirectPath);
        showSuccessToast('Logged in successfully', {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
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
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        router.push(redirectPath);
        showSuccessToast('Logged in successfully', {
          id: TOAST_IDS.AUTH.LOGIN,
        });
      },
    }
  );
  
  const verifyMagicLink = verifyMagicLinkMutation.mutate;
  const isVerifyingMagicLink = verifyMagicLinkMutation.isPending;

  // Change password mutation - ✅ Use core hook
  const changePasswordMutation = useMutationOperation<AuthResponse, FormData>(
    (data) => changePasswordAction(data),
    {
      toastId: TOAST_IDS.AUTH.RESET_PASSWORD,
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
      invalidateQueries: [['session']],
    }
  );
  
  const changePassword = changePasswordMutation.mutate;
  const isChangingPassword = changePasswordMutation.isPending;

  // Terminate all sessions mutation - ✅ Use core hook
  const terminateAllSessionsMutation = useMutationOperation<void, void>(
    () => terminateAllSessions(),
    {
      toastId: TOAST_IDS.SESSION.TERMINATE_ALL,
      loadingMessage: 'Terminating all sessions...',
      successMessage: 'All sessions terminated successfully',
      onSuccess: () => {
        queryClient.clear();
        queryClient.setQueryData(['session'], null);
        router.push(ROUTES.LOGIN);
        showSuccessToast('All sessions terminated successfully', {
          id: TOAST_IDS.SESSION.TERMINATE_ALL,
        });
      },
    }
  );

  // Check OTP Status mutation - ✅ Use core hook
  const checkOTPStatusMutation = useMutationOperation<{ hasActiveOTP: boolean }, string>(
    (email) => checkOTPStatusAction(email),
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
    (email) => invalidateOTPAction(email),
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
  const verifyEmailMutation = useMutationOperation<{ message: string }, string>(
    (token) => verifyEmailAction(token),
    {
      toastId: TOAST_IDS.VERIFICATION.EMAIL,
      loadingMessage: 'Verifying email...',
      successMessage: 'Email verified successfully',
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        showSuccessToast(data.message, {
          id: TOAST_IDS.VERIFICATION.EMAIL,
        });
        router.push(ROUTES.LOGIN);
      },
    }
  );
  
  const verifyEmail = verifyEmailMutation.mutate;
  const isVerifyingEmail = verifyEmailMutation.isPending;

  // Social Login mutations - ✅ Use core hooks
  const facebookLoginMutation = useMutationOperation<AuthResponse, string>(
    (token) => facebookLoginAction(token),
    {
      toastId: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      loadingMessage: 'Logging in with Facebook...',
      successMessage: 'Logged in with Facebook successfully',
      invalidateQueries: [['session']],
      onSuccess: (data) => {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        router.push(redirectPath);
        showSuccessToast('Logged in with Facebook successfully', {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
      },
    }
  );
  
  const facebookLogin = facebookLoginMutation.mutate;
  const isFacebookLoggingIn = facebookLoginMutation.isPending;

  const appleLoginMutation = useMutationOperation<{ success: boolean; user?: User; error?: string }, string>(
    async (token: string) => {
      const result = await appleLoginAction(token);
      if (!result.success) {
        throw new Error(result.error || 'Apple login failed');
      }
      return result;
    },
    {
      toastId: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      loadingMessage: 'Logging in with Apple...',
      successMessage: 'Successfully logged in with Apple',
      invalidateQueries: [['session'], ['auth', 'session']],
      onSuccess: (data) => {
        // Handle successful Apple login
        if (data?.user) {
          // Redirect to dashboard
          router.push(getDashboardByRole(data.user.role as Role));
          showSuccessToast('Successfully logged in with Apple', {
            id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
          });
        }
      },
    }
  );
  
  const appleLogin = appleLoginMutation.mutateAsync;
  const isAppleLoggingIn = appleLoginMutation.isPending;

  return {
    session,
    isPending,
    isAuthenticated: !!session?.user,
    user: session?.user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync, // ✅ Use mutateAsync for awaitable login
    register: registerMutation.mutateAsync, // ✅ Use mutateAsync so await works properly
    logout: logoutMutation.mutate,
    verifyOTP: verifyOTPMutation.mutateAsync, // ✅ Use mutateAsync for awaitable OTP verification
    requestOTP: requestOTPMutation.mutateAsync, // ✅ Use mutateAsync for awaitable OTP request
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
          showErrorToast(error, { id: toastId });
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