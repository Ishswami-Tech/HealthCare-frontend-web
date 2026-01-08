'use server';

import { clinicApiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Types
export interface LoginCredentials {
  email: string;
  password?: string;
  otp?: string;
  clinicId?: string;
  studioId?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  clinicId?: string;
  studioId?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

// Server Actions
export async function loginAction(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.login({
      email: credentials.email,
      password: credentials.password || '',
      clinicId: credentials.clinicId,
      rememberMe: false,
    });
    
    if (response.success && response.data) {
      const authData = response.data as any;
      if (authData.token || authData.access_token) {
        const token = authData.token || authData.access_token;
        // Store tokens securely (in production, use httpOnly cookies)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          if (authData.refreshToken || authData.refresh_token) {
            localStorage.setItem('refresh_token', authData.refreshToken || authData.refresh_token);
          }
          if (credentials.clinicId) {
            localStorage.setItem('clinic_id', credentials.clinicId);
          }
          if (credentials.studioId) {
            localStorage.setItem('studio_id', credentials.studioId);
          }
        }
        
        revalidatePath('/dashboard');
        return {
          success: true,
          user: authData.user,
          token: token,
          refreshToken: authData.refreshToken || authData.refresh_token,
        };
      }
    }
    
    return { success: false, error: response.message || 'Login failed' };
  } catch (error: any) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Login failed' 
    };
  }
}

export async function registerAction(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      role: data.role,
      clinicId: data.clinicId,
    });
    
    if (response.success) {
      revalidatePath('/auth/login');
      return {
        success: true,
        user: response.data as any,
        message: 'Registration successful',
      };
    }
    
    return { success: false, error: response.message || 'Registration failed' };
  } catch (error: any) {
    logger.error('Registration error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Registration failed' 
    };
  }
}

export async function logoutAction(): Promise<{ success: boolean; message?: string }> {
  try {
    await clinicApiClient.logout({});
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('clinic_id');
      localStorage.removeItem('studio_id');
    }
    
    revalidatePath('/');
    redirect('/auth/login');
  } catch (error: any) {
    logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, message: 'Logout failed' };
  }
}

export async function refreshTokenAction(): Promise<AuthResponse> {
  try {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;
    
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }
    
    const response = await clinicApiClient.refreshToken({ refreshToken });
    
    if (response.success && response.data) {
      const authData = response.data as any;
      const token = authData.token || authData.access_token;
      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          if (authData.refreshToken || authData.refresh_token) {
            localStorage.setItem('refresh_token', authData.refreshToken || authData.refresh_token);
          }
        }
        return {
          success: true,
          token: token,
          refreshToken: authData.refreshToken || authData.refresh_token,
        };
      }
    }
    
    return { success: false, error: 'Token refresh failed' };
  } catch (error: any) {
    logger.error('Token refresh error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Token refresh failed' 
    };
  }
}

export async function requestOTPAction(email: string, clinicId?: string): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.requestOTP({
      contact: email,
      clinicId,
    });
    
    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : (response.message || 'Failed to send OTP'),
    };
  } catch (error: any) {
    logger.error('OTP request error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Failed to send OTP' 
    };
  }
}

export async function verifyOTPAction(email: string, otp: string, clinicId?: string): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.verifyOTP({
      contact: email,
      otp,
      clinicId,
      rememberMe: false,
    });
    
    if (response.success && response.data) {
      const authData = response.data as any;
      const token = authData.token || authData.access_token;
      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          if (authData.refreshToken || authData.refresh_token) {
            localStorage.setItem('refresh_token', authData.refreshToken || authData.refresh_token);
          }
          if (clinicId) {
            localStorage.setItem('clinic_id', clinicId);
          }
        }
        
        revalidatePath('/dashboard');
        return {
          success: true,
          token: token,
          refreshToken: authData.refreshToken || authData.refresh_token,
          user: authData.user,
        };
      }
    }
    
    return { success: false, error: 'OTP verification failed' };
  } catch (error: any) {
    logger.error('OTP verification error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'OTP verification failed' 
    };
  }
}

export async function forgotPasswordAction(email: string): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.forgotPassword({ email });
    
    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : (response.message || 'Failed to send reset email'),
    };
  } catch (error: any) {
    logger.error('Forgot password error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Failed to send reset email' 
    };
  }
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<AuthResponse> {
  try {
    const response = await clinicApiClient.resetPassword({
      token,
      password: newPassword,
    });
    
    if (response.success) {
      revalidatePath('/auth/login');
    }
    
    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : (response.message || 'Password reset failed'),
    };
  } catch (error: any) {
    logger.error('Password reset error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Password reset failed' 
    };
  }
}

export async function googleLoginAction(
  code: string, 
  redirectUri: string, 
  clinicId?: string
): Promise<AuthResponse> {
  try {
    // Note: clinicApiClient may not have googleLogin method, use direct post
    const response = await clinicApiClient.post('/api/v1/auth/google', {
      code,
      redirectUri,
      clinicId,
    });
    
    if (response.success && response.data) {
      const authData = response.data as any;
      const token = authData.token || authData.access_token;
      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          if (authData.refreshToken || authData.refresh_token) {
            localStorage.setItem('refresh_token', authData.refreshToken || authData.refresh_token);
          }
          if (clinicId) {
            localStorage.setItem('clinic_id', clinicId);
          }
        }
        
        revalidatePath('/dashboard');
        return {
          success: true,
          token: token,
          refreshToken: authData.refreshToken || authData.refresh_token,
          user: authData.user,
        };
      }
    }
    
    return { success: false, error: 'Google login failed' };
  } catch (error: any) {
    logger.error('Google login error', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error.message || error.statusCode || 'Google login failed' 
    };
  }
}