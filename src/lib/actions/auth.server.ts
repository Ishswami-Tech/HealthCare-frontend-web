'use server';

import { Role, Session, RegisterFormData } from '@/types/auth.types';
import { redirect } from 'next/navigation';
import { getDashboardByRole } from '@/config/routes';
import { setSession, getSession, clearSession } from '@/lib/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  throw new Error('API URL is not configured');
}

/**
 * Get the current server session
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    console.log('1. Starting getServerSession');
    const session = await getSession();
    console.log('2. Current session from cookie:', session);
    
    if (!session) {
      console.log('3. No session found');
      return null;
    }

    console.log('4. Making verify request to API');
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'X-Session-ID': session.session_id,
      },
      cache: 'no-store',
    });

    console.log('5. API Response status:', response.status);
    
    if (!response.ok) {
      console.log('6. Response not OK, clearing session');
      await clearSession();
      return null;
    }

    const data = await response.json();
    console.log('7. API Response data:', JSON.stringify(data, null, 2));
    
    // Ensure the response matches our Session type
    const updatedSession: Session = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as Role,
        firstName: data.user.firstName || data.user.first_name || '',
        lastName: data.user.lastName || data.user.last_name || '',
        name: data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || undefined,
        isVerified: data.user.isVerified || data.user.is_verified || false,
        createdAt: data.user.createdAt || data.user.created_at || new Date().toISOString(),
        updatedAt: data.user.updatedAt || data.user.updated_at || new Date().toISOString()
      },
      permissions: data.permissions || [],
      redirectPath: data.redirectPath
    };

    console.log('8. Mapped session:', JSON.stringify(updatedSession, null, 2));
    return updatedSession;
  } catch (error) {
    console.error('9. Session verification error:', error);
    return null;
  }
}

/**
 * Login with email and password
 */
export async function login(data: { email: string; password: string; rememberMe?: boolean }) {
  try {
    console.log('1. Starting login process');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('2. Login response status:', response.status);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('3. Login error response:', result);
      throw new Error(result.message || result.error || 'Login failed');
    }

    console.log('3. Login response data:', JSON.stringify(result, null, 2));

    // Additional request to get full user details if firstName/lastName are missing
    if (!result.user.firstName || !result.user.lastName) {
      console.log('4. Fetching additional user details');
      try {
        const userResponse = await fetch(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${result.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('5. Profile response status:', userResponse.status);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('6. Profile data:', JSON.stringify(userData, null, 2));
          
          // Merge the user data, handling both camelCase and snake_case
          result.user = {
            ...result.user,
            ...userData,
            firstName: userData.firstName || userData.first_name || '',
            lastName: userData.lastName || userData.last_name || '',
            // Include other relevant fields
            phone: userData.phone || userData.phoneNumber || '',
            dateOfBirth: userData.dateOfBirth || userData.date_of_birth || null,
            gender: userData.gender || '',
            address: userData.address || '',
          };
        } else {
          console.warn('Failed to fetch user profile:', userResponse.status);
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Don't throw here, continue with basic user data
      }
    }
    
    // Set session data
    console.log('7. Final session data:', JSON.stringify(result, null, 2));
    await setSession(result);
    console.log('8. Session data set successfully');

    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterFormData) {
  try {
    // Ensure firstName and lastName are properly formatted
    const formattedData = {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    };

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || 'Registration failed';
      console.error('Registration error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to the registration service. Please try again.');
  }
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
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Session-ID': session.session_id,
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
  const session = await getSession();
  if (!session) {
    throw new Error('No token to refresh');
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Session-ID': session.session_id,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }

  const responseData = await response.json();
  await setSession(responseData);
  return responseData;
}

/**
 * Logout
 */
export async function logout() {
  const session = await getSession();
  if (session) {
    try {
      console.log('Attempting to logout on server with session:', session.session_id);
      
      // Get device info from session if available
      const deviceInfo = {
        browser: 'web', // Default to web browser
        os: process.platform,
        device: 'browser',
        deviceId: session.session_id // Use session ID as device ID
      };

      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Session-Id': session.session_id,
          'X-Device-Id': deviceInfo.deviceId,
          'X-Device-Info': JSON.stringify(deviceInfo)
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          deviceId: deviceInfo.deviceId,
          deviceInfo: deviceInfo,
          allDevices: true
        }),
        credentials: 'include'
      });

      // Wait for and parse the response
      const data = await response.json().catch(() => ({ message: 'No response body' }));
      console.log('Logout API response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 401) {
          if (data.message?.includes('Invalid device')) {
            // If device validation fails, try to logout from all devices
            console.log('Device validation failed, attempting to logout from all devices');
            return await logoutAllDevices();
          }
          console.log('Session already expired on server');
        } else {
          console.error('Server logout failed:', data.message || response.statusText);
          throw new Error(data.message || `Logout failed with status ${response.status}`);
        }
      } else {
        console.log('Successfully logged out on server');
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      await clearSession();
      console.log('Local session cleared');
    }
  } else {
    console.log('No active session to logout');
    await clearSession();
  }
}

// Helper function to logout from all devices
async function logoutAllDevices() {
  const session = await getSession();
  if (!session) return;

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-Session-Id': session.session_id
    },
    body: JSON.stringify({
      sessionId: session.session_id,
      allDevices: true
    }),
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({ message: 'No response body' }));
  console.log('Logout all devices response:', { status: response.status, data });

  if (!response.ok && response.status !== 401) {
    throw new Error(data.message || `Logout all devices failed with status ${response.status}`);
  }
}

/**
 * Terminate All Sessions
 */
export async function terminateAllSessions() {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Session-ID': session.session_id,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ allDevices: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to terminate all sessions');
  }

  await clearSession();
}

// Helper function to set auth cookies
async function setAuthCookies(data: {
  access_token?: string;
  session_id?: string;
  user?: {
    role?: Role;
  };
}) {
  const cookies = await import('next/headers').then(mod => mod.cookies());
  
  if (data.access_token) {
    cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  if (data.session_id) {
    cookies.set('session_id', data.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  if (data.user) {
    cookies.set('user_role', data.user.role || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    const dashboardPath = getDashboardByRole(session.user.role);
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
  try {
    console.log('Starting Google login with token');
    const response = await fetch(`${API_URL}/auth/social/google`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Google login error response:', result);
      throw new Error(result.message || result.error || 'Google login failed');
    }

    console.log('Google login successful, setting auth cookies');
    
    // Set auth cookies
    await setAuthCookies(result);
    
    // Add additional user information
    const enhancedResponse = {
      ...result,
      user: {
        ...result.user,
        isNewUser: result.isNewUser,
        googleId: result.user.googleId,
        profileComplete: result.user.profileComplete
      }
    };

    return enhancedResponse;
  } catch (error) {
    console.error('Google login error:', error);
    throw error instanceof Error ? error : new Error('Google login failed');
  }
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