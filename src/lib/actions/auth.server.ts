'use server';

import { Role, Session } from '@/types/auth.types';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDashboardByRole } from '@/config/routes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ishswami.in';

/**
 * Get the current server session
 */
export async function getServerSession(): Promise<Session | null> {
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
      // If verification fails, clear the cookies
      cookieStore.delete('access_token');
      cookieStore.delete('session_id');
      cookieStore.delete('user_role');
      return null;
    }

    const data = await response.json();
    
    // Ensure the response matches our Session type
    const session: Session = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as Role,
        name: data.user.name,
        isVerified: data.user.isVerified,
        createdAt: data.user.createdAt || new Date().toISOString(),
        updatedAt: data.user.updatedAt || new Date().toISOString()
      },
      permissions: data.permissions || [],
      redirectPath: data.redirectPath
    };

    return session;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Login with email and password
 */
export async function login(data: { email: string; password: string; rememberMe?: boolean }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Register a new user
 */
export async function register(formData: FormData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Register with clinic
 */
export async function registerWithClinic(data: { 
  email: string;
  password: string;
  name?: string;
  role?: Role;
  clinicId: string;
  appName: string;
}) {
  const response = await fetch(`${API_URL}/auth/register-with-clinic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration with clinic failed');
  }

  return response.json();
}

/**
 * Request OTP
 */
export async function requestOTP(identifier: string) {
  const response = await fetch(`${API_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request OTP');
  }

  return response.json();
}

/**
 * Verify OTP
 */
export async function verifyOTP(data: { email: string; otp: string; rememberMe?: boolean }) {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'OTP verification failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Check OTP Status
 */
export async function checkOTPStatus(email: string) {
  const response = await fetch(`${API_URL}/auth/check-otp-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check OTP status');
  }

  return response.json();
}

/**
 * Invalidate OTP
 */
export async function invalidateOTP(email: string) {
  const response = await fetch(`${API_URL}/auth/invalidate-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to invalidate OTP');
  }

  return response.json();
}

/**
 * Request Magic Link
 */
export async function requestMagicLink(email: string) {
  const response = await fetch(`${API_URL}/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send magic link');
  }

  return response.json();
}

/**
 * Verify Magic Link
 */
export async function verifyMagicLink(token: string) {
  const response = await fetch(`${API_URL}/auth/verify-magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Invalid or expired magic link');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Social Login
 */
export async function socialLogin({ provider, token }: { provider: string; token: string }) {
  const response = await fetch(`${API_URL}/auth/social/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Social login failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Forgot Password
 */
export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process forgot password request');
  }

  return response.json();
}

/**
 * Reset Password
 */
export async function resetPassword(data: { token: string; newPassword: string }) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Password reset failed');
  }

  return response.json();
}

/**
 * Change Password
 */
export async function changePassword(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
}

/**
 * Refresh Token
 */
export async function refreshToken() {
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
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Logout
 */
export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId || '',
      },
    });
  }

  cookieStore.delete('access_token');
  cookieStore.delete('session_id');
  cookieStore.delete('user_role');
}

/**
 * Terminate All Sessions
 */
export async function terminateAllSessions() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Session-ID': sessionId || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ allDevices: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to terminate all sessions');
  }

  cookieStore.delete('access_token');
  cookieStore.delete('session_id');
  cookieStore.delete('user_role');
}

// Helper function to set auth cookies
async function setAuthCookies(data: {
  access_token?: string;
  session_id?: string;
  user?: {
    role?: Role;
  };
}) {
  const cookieStore = await cookies();
  
  if (data.access_token) {
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
  }

  if (data.session_id) {
    cookieStore.set('session_id', data.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
  }

  if (data.user?.role) {
    cookieStore.set('user_role', data.user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  return session;
}

/**
 * Require specific role - redirects to appropriate dashboard if role doesn't match
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role)) {
    const dashboardPath = getRedirectPath(session.user.role);
    redirect(dashboardPath);
  }
  
  return session;
}

/**
 * Check authentication status without redirection
 */
export async function checkAuth() {
  const session = await getServerSession();
  return {
    isAuthenticated: !!session?.user,
    session,
  };
}

/**
 * Get the appropriate dashboard path for a role
 */
function getRedirectPath(role: Role): string {
  return getDashboardByRole(role);
}

/**
 * Verify Email
 */
export async function verifyEmail(token: string) {
  const response = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify email');
  }

  return response.json();
}

/**
 * Google Login
 */
export async function googleLogin(token: string) {
  const response = await fetch(`${API_URL}/auth/social/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Google login failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Facebook Login
 */
export async function facebookLogin(token: string) {
  const response = await fetch(`${API_URL}/auth/social/facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Facebook login failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
}

/**
 * Apple Login
 */
export async function appleLogin(token: string) {
  const response = await fetch(`${API_URL}/auth/social/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Apple login failed');
  }

  const responseData = await response.json();
  await setAuthCookies(responseData);
  return responseData;
} 