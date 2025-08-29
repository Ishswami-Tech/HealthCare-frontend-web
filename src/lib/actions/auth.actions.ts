'use server';

import { apiClient } from '@/lib/api-client';
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
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.token) {
      // Store tokens securely (in production, use httpOnly cookies)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
        if (credentials.clinicId) {
          localStorage.setItem('clinic_id', credentials.clinicId);
        }
        if (credentials.studioId) {
          localStorage.setItem('studio_id', credentials.studioId);
        }
      }
      
      revalidatePath('/dashboard');
      return response;
    }
    
    return { success: false, error: response.message || 'Login failed' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Login failed' 
    };
  }
}

export async function registerAction(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.success) {
      revalidatePath('/auth/login');
      return response;
    }
    
    return { success: false, error: response.message || 'Registration failed' };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Registration failed' 
    };
  }
}

export async function logoutAction(): Promise<{ success: boolean; message?: string }> {
  try {
    await apiClient.post('/auth/logout', {});
    
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
    console.error('Logout error:', error);
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
    
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken
    });
    
    if (response.success && response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
      }
      return response;
    }
    
    return { success: false, error: 'Token refresh failed' };
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Token refresh failed' 
    };
  }
}

export async function requestOTPAction(email: string, clinicId?: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/request-otp', {
      identifier: email,
      clinicId
    });
    
    return response;
  } catch (error: any) {
    console.error('OTP request error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send OTP' 
    };
  }
}

export async function verifyOTPAction(email: string, otp: string, clinicId?: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
      email,
      otp,
      clinicId
    });
    
    if (response.success && response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
        if (clinicId) {
          localStorage.setItem('clinic_id', clinicId);
        }
      }
      
      revalidatePath('/dashboard');
    }
    
    return response;
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'OTP verification failed' 
    };
  }
}

export async function forgotPasswordAction(email: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/forgot-password', {
      email
    });
    
    return response;
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to send reset email' 
    };
  }
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/reset-password', {
      token,
      newPassword
    });
    
    if (response.success) {
      revalidatePath('/auth/login');
    }
    
    return response;
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Password reset failed' 
    };
  }
}

export async function googleLoginAction(
  code: string, 
  redirectUri: string, 
  clinicId?: string
): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/google', {
      code,
      redirectUri,
      clinicId
    });
    
    if (response.success && response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
        if (clinicId) {
          localStorage.setItem('clinic_id', clinicId);
        }
      }
      
      revalidatePath('/dashboard');
    }
    
    return response;
  } catch (error: any) {
    console.error('Google login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Google login failed' 
    };
  }
}