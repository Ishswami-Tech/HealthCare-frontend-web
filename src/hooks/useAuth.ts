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
  terminateAllSessions,
  registerWithClinic as registerWithClinicAction,
} from '@/lib/actions/auth.server';
import type {
  LoginFormData,
  RegisterFormData,
  OTPFormData,
  ResetPasswordFormData,
  RegisterData,
  SocialLoginData,
  Role,
} from '@/types/auth.types';
import { getDashboardByRole } from '@/config/routes';

// Toast style configurations
const toastStyles = {
  success: {
    className: 'bg-green-50 border border-green-200 text-green-800',
    icon: '✓',
  },
  error: {
    className: 'bg-red-50 border border-red-200 text-red-800',
    icon: '✕',
  },
  warning: {
    className: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    icon: '⚠',
  },
  info: {
    className: 'bg-blue-50 border border-blue-200 text-blue-800',
    icon: 'ℹ',
  },
};

interface User {
  role?: Role;
  firstName?: string;
  lastName?: string;
  email?: string;
  isVerified?: boolean;
}

// Helper function to determine the redirect path
function getRedirectPath(user: User | null | undefined, redirectUrl?: string) {
  if (redirectUrl && !redirectUrl.includes('/auth/')) {
    return redirectUrl;
  }
  if (user?.role) {
    return getDashboardByRole(user.role);
  }
  return '/patient/dashboard'; // Default fallback route
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for user session
  const {
    data: session,
    isLoading,
    error: sessionError,
  } = useQuery({
    queryKey: ['session'],
    queryFn: getServerSession,
  });

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const formData = new FormData();
      if (data.email) formData.append('email', data.email);
      if (data.password) formData.append('password', data.password);
      if (data.otp) formData.append('otp', data.otp);
      return loginAction(formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      
      toast.success('Welcome back! You have successfully logged in', {
        ...toastStyles.success,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Unable to log in. Please check your credentials and try again',
        {
          ...toastStyles.error,
          duration: 5000,
        }
      );
    },
  });

  // Register mutation
  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      return registerAction(formData);
    },
    onSuccess: () => {
      router.push('/auth/login?registered=true');
      toast.success(
        'Registration successful! Please check your email to verify your account',
        {
          ...toastStyles.success,
          duration: 5000,
        }
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please check your information and try again',
        {
          ...toastStyles.error,
          duration: 5000,
        }
      );
    },
  });

  // Register with clinic mutation
  const { mutate: registerWithClinic, isPending: isRegisteringWithClinic } = useMutation({
    mutationFn: (data: RegisterData & { clinicId: string; appName: string }) => registerWithClinicAction(data),
    onSuccess: (data) => {
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

  // OTP mutations
  const { mutate: verifyOTP, isPending: isVerifyingOTP } = useMutation({
    mutationFn: async (data: OTPFormData) => {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('otp', data.otp);
      return verifyOTPAction(formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      const redirectPath = getRedirectPath(data.user, data.redirectUrl);
      router.push(redirectPath);
      
      toast.success('OTP verified successfully! Welcome back', {
        ...toastStyles.success,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Invalid OTP. Please check and try again',
        {
          ...toastStyles.error,
          duration: 5000,
        }
      );
    },
  });

  const { mutate: requestOTP, isPending: isRequestingOTP } = useMutation({
    mutationFn: (identifier: string) => requestOTPAction(identifier),
    onSuccess: () => {
      toast.success('OTP has been sent to your email', {
        ...toastStyles.success,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send OTP. Please try again',
        {
          ...toastStyles.error,
          duration: 5000,
        }
      );
    },
  });

  // Logout mutations
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth/login');
      toast.success('You have been successfully logged out', {
        ...toastStyles.success,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'There was a problem logging out. Please try again',
        {
          ...toastStyles.error,
          duration: 5000,
        }
      );
    },
  });

  const { mutate: logoutAllDevices, isPending: isLoggingOutAll } = useMutation({
    mutationFn: terminateAllSessions,
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth/login');
      toast.success('Logged out from all devices');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
    },
  });

  // Password reset mutations
  const { mutate: forgotPassword, isPending: isRequestingReset } = useMutation({
    mutationFn: (email: string) => forgotPasswordAction(email),
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to request password reset');
    },
  });

  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation({
    mutationFn: (data: ResetPasswordFormData) => resetPasswordAction({
      token: data.token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    }),
    onSuccess: () => {
      router.push('/auth/login?reset=true');
      toast.success('Password reset successful');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Password reset failed');
    },
  });

  // Social login mutation
  const { mutate: socialLogin, isPending: isSocialLoggingIn } = useMutation({
    mutationFn: (data: SocialLoginData) => socialLoginAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/dashboard');
      }
      toast.success('Logged in successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Social login failed');
    },
  });

  // Magic link mutations
  const { mutate: requestMagicLink, isPending: isRequestingMagicLink } = useMutation({
    mutationFn: (email: string) => requestMagicLinkAction(email),
    onSuccess: () => {
      toast.success('Magic link sent to your email');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send magic link');
    },
  });

  const { mutate: verifyMagicLink, isPending: isVerifyingMagicLink } = useMutation({
    mutationFn: (token: string) => verifyMagicLinkAction(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/dashboard');
      }
      toast.success('Logged in successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Magic link verification failed');
    },
  });

  // Password change mutation
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    },
  });

  return {
    // Session state
    session,
    isLoading,
    isAuthenticated: !!session,
    sessionError,

    // Auth mutations
    login,
    isLoggingIn,
    register,
    isRegistering,
    registerWithClinic,
    isRegisteringWithClinic,
    verifyOTP,
    isVerifyingOTP,
    requestOTP,
    isRequestingOTP,
    logout,
    isLoggingOut,
    logoutAllDevices,
    isLoggingOutAll,
    forgotPassword,
    isRequestingReset,
    resetPassword,
    isResettingPassword,
    socialLogin,
    isSocialLoggingIn,
    requestMagicLink,
    isRequestingMagicLink,
    verifyMagicLink,
    isVerifyingMagicLink,
    changePassword,
    isChangingPassword,
  };
} 