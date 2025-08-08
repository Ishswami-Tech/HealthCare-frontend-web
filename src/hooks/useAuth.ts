'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { getDashboardByRole } from '@/config/routes';

// Constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const SESSION_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
const MAX_RETRY_ATTEMPTS = 3;

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
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token parsing error:', error);
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
              console.error('Session refresh error:', error);
            }
            await clearSession();
            return null;
          }
        }

        return result;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Session fetch error:', error);
        }
        // Clear session on error
        await clearSession();
        return null;
      }
    },
    refetchInterval: SESSION_REFRESH_INTERVAL,
    retry: (failureCount, error) => {
      if (isAuthError(error)) {
        return false;
      }
      return failureCount < MAX_RETRY_ATTEMPTS;
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
        console.error('Session refresh error:', error);
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
        // Show success toast after a brief delay to ensure navigation
        setTimeout(() => {
          toast.success(`Welcome back${data.user.firstName ? ', ' + data.user.firstName : ''}!`);
        }, 100);
      }
    },
    onError: (error: Error) => {
      // Provide user-friendly error messages
      let errorMessage = 'Login failed';

      if (error.message.includes('credentials') || error.message.includes('Invalid')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
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
        toast.error('Google login failed: Invalid response data');
        return;
      }

      // Create session data with proper defaults
      const sessionData: SessionData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name,
          firstName: data.user.firstName || data.user.name?.split(' ')[0] || '',
          lastName: data.user.lastName || data.user.name?.split(' ').slice(1).join(' ') || '',
          isVerified: true,
          googleId: data.user.googleId,
          profileComplete: data.user.profileComplete
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
          console.error('Error refreshing session:', refreshError);
        }
      }

      // Handle redirect based on profile completion
      const profileComplete = data.user.profileComplete || false;

      if (!profileComplete) {
        router.push('/profile-completion');
      } else {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        toast.success(`Welcome${data.user.firstName ? ', ' + data.user.firstName : ''}!`);
        router.push(redirectPath);
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      toast.error(errorMessage);
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerAction,
    onSuccess: (data) => {
      // If profile is not complete, redirect to profile completion
      if (data.user && !data.user.profileComplete) {
        router.push('/profile-completion');
      } else {
        toast.success('Registration successful. Please check your email to verify your account.');
        router.push('/auth/login');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
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
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }

      // Clear client state even if server logout fails
      queryClient.clear();
      queryClient.setQueryData(['session'], null);
      clearSession();

      router.push('/auth/login');
      toast.error('Logged out locally, but server logout failed');
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
      toast.success('Registration successful');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
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
        toast.success('OTP verified successfully! Welcome back!');
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Invalid or expired OTP';
      toast.error(errorMessage);
    },
  });

  // Request OTP mutation
  const { mutate: requestOTP, isPending: isRequestingOTP } = useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (identifier: string) => {
      return requestOTPAction(identifier);
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Password reset mutations
  const { mutate: forgotPassword, isPending: isRequestingReset } = useMutation<MessageResponse, Error, string>({
    mutationFn: (email) => forgotPasswordAction(email),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset instructions sent to your email');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to request password reset');
    },
  });

  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation<MessageResponse, Error, { token: string; newPassword: string }>({
    mutationFn: (data) => resetPasswordAction(data),
    onSuccess: (data) => {
      router.push('/auth/login?reset=true');
      toast.success(data.message || 'Password reset successful');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Password reset failed');
    },
  });

  // Social login mutation
  const { mutate: socialLogin, isPending: isSocialLoggingIn } = useMutation<AuthResponse, Error, SocialLoginData>({
    mutationFn: (data) => socialLoginAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('Logged in successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Social login failed');
    },
  });

  // Magic link mutations
  const { mutate: requestMagicLink, isPending: isRequestingMagicLink } = useMutation<MessageResponse, Error, string>({
    mutationFn: (email) => requestMagicLinkAction(email),
    onSuccess: (data) => {
      toast.success(data.message || 'Magic link sent to your email');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send magic link');
    },
  });

  const { mutate: verifyMagicLink, isPending: isVerifyingMagicLink } = useMutation<AuthResponse, Error, string>({
    mutationFn: (token) => verifyMagicLinkAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('Logged in successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Magic link verification failed');
    },
  });

  // Change password mutation
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation<AuthResponse, Error, FormData>({
    mutationFn: (data) => changePasswordAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.message);
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
    mutationFn: () => Promise.resolve() // TODO: Implement Apple login
  });

  return {
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    user: session?.user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
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