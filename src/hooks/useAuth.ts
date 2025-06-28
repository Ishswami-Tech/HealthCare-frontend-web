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
} from '@/types/auth.types';
import { Role } from '@/types/auth.types';
import { getDashboardByRole } from '@/config/routes';

// Helper function to determine the redirect path
function getRedirectPath(user: { role?: Role | string } | null | undefined, redirectUrl?: string) {
  if (redirectUrl && !redirectUrl.includes('/auth/')) {
    return redirectUrl;
  }
  if (user?.role) {
    return getDashboardByRole(user.role as Role);
  }
  return '/auth/login'; // Default to login if no role
}

interface GoogleLoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role: Role;
    isNewUser?: boolean;
    googleId?: string;
    profileComplete?: boolean;
  };
  token?: string;
  redirectUrl?: string;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current session with auto-refresh
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        console.log('useAuth - Fetching session');
        const result = await getServerSession();
        console.log('useAuth - Session result:', JSON.stringify(result, null, 2));

        // If no session, return null
        if (!result) {
          console.log('useAuth - No session found');
          return null;
        }

        // If session exists but is about to expire, refresh it
        if (result.user && isTokenExpiringSoon(result.access_token)) {
          console.log('useAuth - Token expiring soon, refreshing...');
          try {
            const refreshedSession = await refreshToken();
            if (refreshedSession) {
              console.log('useAuth - Session refreshed successfully');
              return refreshedSession;
            }
            // If refresh failed, clear session and return null
            console.log('useAuth - Session refresh failed, clearing session');
            await clearSession();
            return null;
          } catch (error) {
            console.error('useAuth - Session refresh error:', error);
            await clearSession();
            return null;
          }
        }

        return result;
      } catch (error) {
        console.error('Session fetch error:', error);
        // Clear session on error
        await clearSession();
        return null;
      }
    },
    // Refresh session every 4 minutes
    refetchInterval: 4 * 60 * 1000,
    // Don't retry on 401/403 errors
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  // Helper function to check if token is expiring soon
  const isTokenExpiringSoon = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Return true if token expires in less than 5 minutes
      const isExpiring = timeUntilExpiry < 5 * 60 * 1000;
      console.log('useAuth - Token expiry check:', {
        expiryTime: new Date(expiryTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000),
        isExpiring
      });
      return isExpiring;
    } catch (error) {
      console.error('Token parsing error:', error);
      return true; // Assume token needs refresh if we can't parse it
    }
  };

  // Function to manually refresh the session
  const refreshSession = async () => {
    console.log('useAuth - Manually refreshing session');
    try {
      // First try to get the session from the server
      const serverSession = await getServerSession();
      
      if (serverSession) {
        console.log('useAuth - Server session found:', JSON.stringify(serverSession, null, 2));
        queryClient.setQueryData(['session'], serverSession);
        return serverSession;
      }
      
      // If no server session, try to refresh the token
      console.log('useAuth - No server session, attempting token refresh');
      const refreshedSession = await refreshToken();
      
      if (refreshedSession) {
        console.log('useAuth - Token refreshed successfully');
        queryClient.setQueryData(['session'], refreshedSession);
        return refreshedSession;
      }
      
      // If refresh fails, clear session
      console.log('useAuth - Refresh failed, clearing session');
      queryClient.setQueryData(['session'], null);
      return null;
    } catch (error) {
      console.error('useAuth - Session refresh error:', error);
      queryClient.setQueryData(['session'], null);
      return null;
    }
  };

  // Enhanced login mutation with proper error handling
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; rememberMe?: boolean }) => {
      console.log('useAuth - Starting login mutation');
      try {
        const result = await loginAction(data);
        console.log('useAuth - Login result:', JSON.stringify(result, null, 2));

        if (!result.user) {
          throw new Error('Invalid user data received');
        }

        // Ensure required fields are present with defaults
        const user = {
          ...result.user,
          firstName: result.user.firstName || '',
          lastName: result.user.lastName || '',
          phone: result.user.phone || '',
          dateOfBirth: result.user.dateOfBirth || null,
          gender: result.user.gender || '',
          address: result.user.address || '',
        };

        return {
          ...result,
          user,
        };
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          if (error.message.includes('credentials')) {
            throw new Error('Invalid email or password');
          }
          throw error;
        }
        throw new Error('An unexpected error occurred during login');
      }
    },
    onSuccess: (data) => {
      console.log('useAuth - Login success, setting session data:', JSON.stringify(data, null, 2));
      queryClient.setQueryData(['session'], data);
      
      // Check if profile is complete and redirect accordingly
      const profileComplete = data.user.profileComplete || false;
      console.log('useAuth - Profile completion status:', profileComplete);
      
      if (!profileComplete) {
        console.log('useAuth - Profile not complete, redirecting to profile completion');
        router.push('/profile-completion');
      } else {
        const dashboardPath = getDashboardByRole(data.user.role as Role);
        console.log('useAuth - Redirecting to:', dashboardPath);
        router.push(dashboardPath);
        // Only show success toast if not already showing an error
        setTimeout(() => toast.success(`Welcome back${data.user.firstName ? ', ' + data.user.firstName : ''}!`), 100);
      }
    },
    onError: (error: Error) => {
      console.error('useAuth - Login error:', error);
      // Dismiss all toasts before showing error
      toast.dismiss && toast.dismiss();
      toast.error(error.message || 'Login failed');
    },
  });

  // Google login mutation
  const {
    mutateAsync: googleLogin,
    isPending: isGoogleLoggingIn
  } = useMutation<GoogleLoginResponse, Error, string>({
    mutationFn: async (token: string) => {
      console.log('useAuth - Starting Google login');
      const result = await googleLoginAction(token);
      console.log('useAuth - Google login result:', JSON.stringify(result, null, 2));
      
      // Check if result is undefined or null
      if (!result) {
        throw new Error('Google login failed: No response from server');
      }
      
      // Check if required fields are present
      if (!result.user || !result.user.id || !result.user.email || !result.user.role) {
        console.error('useAuth - Invalid response structure:', result);
        throw new Error('Google login failed: Invalid response from server');
      }
      
      return result;
    },
    onSuccess: async (data) => {
      console.log('useAuth - Google login success, setting session data');
      
      // Additional safety check
      if (!data || !data.user) {
        console.error('useAuth - onSuccess called with invalid data:', data);
        toast.error('Google login failed: Invalid response data');
        return;
      }
      
      // Set the session data in the query client
      const sessionData = {
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
        session_id: '', // Will be set by the server
        isAuthenticated: true
      };

      // Set the session data immediately to prevent redirect loops
      queryClient.setQueryData(['session'], sessionData);
      
      // Force a session refresh to get the latest data from the server
      try {
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Manually fetch the session to ensure it's properly set
        const serverSession = await getServerSession();
        console.log('useAuth - Manual session refresh result:', JSON.stringify(serverSession, null, 2));
        
        if (serverSession) {
          // Update with the server session data
          queryClient.setQueryData(['session'], serverSession);
        }
      } catch (refreshError) {
        console.error('useAuth - Error refreshing session:', refreshError);
      }
      
      // Check if profile is complete and redirect accordingly
      const profileComplete = data.user.profileComplete || false;
      console.log('useAuth - Profile completion status:', profileComplete);
      
      if (!profileComplete) {
        console.log('useAuth - Profile not complete, redirecting to profile completion');
        router.push('/profile-completion');
      } else {
        // Get the redirect path for complete profiles
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        console.log('useAuth - Redirecting to:', redirectPath);
        
        // Show success message
        toast.success(`Welcome${data.user.firstName ? ', ' + data.user.firstName : ''}!`);
        
        // Redirect to dashboard
        router.push(redirectPath);
      }
    },
    onError: (error) => {
      console.error('useAuth - Google login error:', error);
      toast.error(error instanceof Error ? error.message : 'Google login failed');
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
  const logoutMutation = useMutation({
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
      // Clear all query cache
      queryClient.clear();
      // Clear any stored auth state
      queryClient.setQueryData(['session'], null);
      // Clear local storage and cookies
      clearSession();
      router.push('/auth/login');
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      console.error('Logout error in mutation:', error);
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
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Check if profile is complete and redirect accordingly
      const profileComplete = data.user.profileComplete || false;
      console.log('useAuth - OTP verification - Profile completion status:', profileComplete);
      
      if (!profileComplete) {
        console.log('useAuth - OTP verification - Profile not complete, redirecting to profile completion');
        router.push('/profile-completion');
      } else {
        const redirectPath = getRedirectPath(data.user, data.redirectUrl);
        router.push(redirectPath);
        toast.success('OTP verified successfully! Welcome back!');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Invalid or expired OTP');
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