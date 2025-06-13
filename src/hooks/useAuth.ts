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
  appleLogin as appleLoginAction,
} from '@/lib/actions/auth.server';
import type {
  RegisterFormData,
  OTPFormData,
  RegisterData,
  SocialLoginData,
  Session,
  AuthResponse,
} from '@/types/auth.types';
import { Role } from '@/types/auth.types';
import { getDashboardByRole } from '@/config/routes';

// Helper function to determine the redirect path
function getRedirectPath(user: { role?: Role } | null | undefined, redirectUrl?: string) {
  if (redirectUrl && !redirectUrl.includes('/auth/')) {
    return redirectUrl;
  }
  if (user?.role) {
    return getDashboardByRole(user.role);
  }
  return '/auth/login'; // Default to login if no role
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current session
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: getServerSession,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginAction,
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data);
      const dashboardPath = getDashboardByRole(data.user.role);
      router.push(dashboardPath);
      toast.success('Login successful');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerAction,
    onSuccess: () => {
      toast.success('Registration successful. Please check your email to verify your account.');
      router.push('/auth/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth/login');
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Logout failed');
    },
  });

  // Register with clinic mutation
  const { mutate: registerWithClinic, isPending: isRegisteringWithClinic } = useMutation<AuthResponse, Error, RegisterData & { clinicId: string; appName: string }>({
    mutationFn: (data) => registerWithClinicAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      if (data.user?.role) {
        router.push(getDashboardByRole(data.user.role));
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
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('OTP verified successfully! Welcome back!');
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
  const { mutate: forgotPassword, isPending: isRequestingReset } = useMutation<AuthResponse, Error, string>({
    mutationFn: (email) => forgotPasswordAction(email),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset instructions sent to your email');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to request password reset');
    },
  });

  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation<AuthResponse, Error, { token: string; newPassword: string }>({
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
  const { mutate: requestMagicLink, isPending: isRequestingMagicLink } = useMutation<AuthResponse, Error, string>({
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

  // Logout all devices mutation
  const { mutate: logoutAllDevices, isPending: isLoggingOutAll } = useMutation<void, Error, void>({
    mutationFn: () => terminateAllSessions(),
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth/login');
      toast.success('Logged out from all devices');
    },
    onError: (error) => {
      toast.error(error.message);
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
  const { mutate: googleLogin, isPending: isGoogleLoggingIn } = useMutation<AuthResponse, Error, string>({
    mutationFn: (token) => googleLoginAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('Logged in with Google successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

  const { mutate: appleLogin, isPending: isAppleLoggingIn } = useMutation<AuthResponse, Error, string>({
    mutationFn: (token) => appleLoginAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      toast.success('Logged in with Apple successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAuthRedirect = (user: { role?: Role } | null | undefined, redirectUrl?: string) => {
    const path = getRedirectPath(user, redirectUrl);
    router.push(path);
  };

  return {
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    user: session?.user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    registerWithClinic,
    verifyOTP,
    requestOTP,
    forgotPassword,
    resetPassword,
    socialLogin,
    requestMagicLink,
    verifyMagicLink,
    changePassword,
    logoutAllDevices,
    isRegisteringWithClinic,
    isVerifyingOTP,
    isRequestingOTP,
    isRequestingReset,
    isResettingPassword,
    isSocialLoggingIn,
    isRequestingMagicLink,
    isVerifyingMagicLink,
    isChangingPassword,
    isLoggingOutAll,
    checkOTPStatus,
    invalidateOTP,
    verifyEmail,
    googleLogin,
    facebookLogin,
    appleLogin,
    isCheckingOTPStatus,
    isInvalidatingOTP,
    isVerifyingEmail,
    isGoogleLoggingIn,
    isFacebookLoggingIn,
    isAppleLoggingIn,
    handleAuthRedirect,
    getRedirectPath
  };
} 