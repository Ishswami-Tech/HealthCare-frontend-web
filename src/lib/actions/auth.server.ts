'use server';

import { Role, AuthResponse, RegisterData, SocialLoginData, ResetPasswordFormData, SessionInfo } from '@/types/auth.types';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ishswami.in';

// Server-side session management
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    if (!token || !sessionId) {
      return null;
    }

    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      ...data.user,
      permissions: data.permissions,
      redirectPath: data.redirectPath
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getServerSession();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard');
  }
  
  return user;
}

export async function checkAuth() {
  const user = await getServerSession();
  return {
    isAuthenticated: !!user,
    user,
  };
}

// Authentication Actions
export async function login(formData: FormData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: formData.get('email'),
      password: formData.get('password'),
      otp: formData.get('otp'),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleApiResponse<AuthResponse>(response);
  
  if (data.access_token) {
    const cookieStore = await cookies();
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    if (data.session_id) {
      cookieStore.set('session_id', data.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
  }

  return data;
}

export async function register(formData: FormData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData)),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function registerWithClinic(data: RegisterData & { clinicId: string; appName: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register-with-clinic`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId || '',
        'Content-Type': 'application/json',
      },
    });
    
    cookieStore.delete('access_token');
    cookieStore.delete('session_id');
  }
}

export async function terminateAllSessions(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      body: JSON.stringify({ allDevices: true }),
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId || '',
        'Content-Type': 'application/json',
      },
    });
    
    cookieStore.delete('access_token');
    cookieStore.delete('session_id');
  }
}

// OTP Management
export async function requestOTP(identifier: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/request-otp`, {
    method: 'POST',
    body: JSON.stringify({ identifier }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function verifyOTP(formData: FormData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({
      email: formData.get('email'),
      otp: formData.get('otp'),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleApiResponse<AuthResponse>(response);
  
  if (data.access_token) {
    const cookieStore = await cookies();
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    if (data.session_id) {
      cookieStore.set('session_id', data.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
  }

  return data;
}

export async function checkOTPStatus(email: string): Promise<{ hasActiveOTP: boolean }> {
  const response = await fetch(`${API_URL}/auth/check-otp-status`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<{ hasActiveOTP: boolean }>(response);
}

// Social Login
export async function socialLogin(data: SocialLoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/social/${data.provider}`, {
    method: 'POST',
    body: JSON.stringify({ token: data.token }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseData = await handleApiResponse<AuthResponse>(response);
  
  if (responseData.access_token) {
    const cookieStore = await cookies();
    cookieStore.set('access_token', responseData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    if (responseData.session_id) {
      cookieStore.set('session_id', responseData.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
  }

  return responseData;
}

// Magic Link Authentication
export async function requestMagicLink(email: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/magic-link`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/verify-magic-link`, {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleApiResponse<AuthResponse>(response);
  
  if (data.access_token) {
    const cookieStore = await cookies();
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    if (data.session_id) {
      cookieStore.set('session_id', data.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
  }

  return data;
}

// Password Management
export async function forgotPassword(email: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function resetPassword(data: ResetPasswordFormData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function changePassword(formData: FormData): Promise<AuthResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

// Token Management
export async function refreshToken(): Promise<AuthResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!token) {
    throw new Error('No token to refresh');
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
      'Content-Type': 'application/json',
    },
  });

  const data = await handleApiResponse<AuthResponse>(response);
  
  if (data.access_token) {
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    if (data.session_id) {
      cookieStore.set('session_id', data.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
  }

  return data;
}

// Session Management
export async function getActiveSessions(): Promise<SessionInfo[]> {
  const token = (await cookies()).get('access_token')?.value;
  const sessionId = (await cookies()).get('session_id')?.value;
  
  if (!token) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_URL}/auth/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
    },
    cache: 'no-store',
  });

  return handleApiResponse<SessionInfo[]>(response);
}

export async function terminateSession(targetSessionId: string): Promise<void> {
  const token = (await cookies()).get('access_token')?.value;
  const sessionId = (await cookies()).get('session_id')?.value;
  
  if (!token) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_URL}/auth/sessions/${targetSessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to terminate session');
  }

  // If terminating current session, remove cookies
  if (sessionId === targetSessionId) {
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('session_id');
  }
}

// Helper Functions
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
}

export async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!token) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse<T>(response);
} 