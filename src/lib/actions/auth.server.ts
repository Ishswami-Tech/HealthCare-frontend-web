'use server';

import { Role, RegisterFormData } from '@/types/auth.types';
import { redirect } from 'next/navigation';
import { getDashboardByRole } from '@/config/routes';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  throw new Error('API URL is not configured');
}

// Update cookie options with better security
const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// Add session token options
const SESSION_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 15, // 15 minutes for access token
};

const REFRESH_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
};

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

// Update Session type at the top of the file
export interface Session {
  user: {
    id: string;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    name?: string;
    isVerified?: boolean;
    profileComplete?: boolean;
  };
  access_token: string;
  session_id: string;
  isAuthenticated: boolean;
}

/**
 * Get the current server session
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshTokenValue = cookieStore.get('refresh_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    console.log('getServerSession - Checking cookies:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshTokenValue,
      hasSessionId: !!sessionId,
      userRole
    });

    // If no access token, try to refresh if we have a refresh token
    if (!accessToken && refreshTokenValue) {
      console.log('getServerSession - No access token, attempting refresh');
      try {
        const refreshedSession = await refreshToken();
        if (refreshedSession) {
          console.log('getServerSession - Session refreshed successfully');
          return refreshedSession;
        }
      } catch (error) {
        console.error('getServerSession - Refresh failed:', error);
        await clearSession();
        return null;
      }
    }

    // If no tokens at all, return null
    if (!accessToken) {
      console.log('getServerSession - No tokens found');
      return null;
    }

    // Use the token data directly instead of fetching user data again
    // This avoids the 404 error when the /users/me endpoint might not be available
    try {
      // Create a session from the existing cookie data
      const session: Session = {
        user: {
          id: '', // We'll fill this from JWT if possible
          email: '',
          role: userRole as Role,
          firstName: '',
          lastName: '',
          name: '',
          isVerified: true,
          profileComplete: false
        },
        access_token: accessToken,
        session_id: sessionId || '',
        isAuthenticated: true
      };

      // Try to extract user info from JWT token
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        console.log('getServerSession - JWT payload:', payload);
        
        session.user.id = payload.sub || '';
        session.user.email = payload.email || '';
        session.user.role = payload.role || userRole as Role;
        
        // If we have basic user info, return the session
        if (session.user.id && session.user.email && session.user.role) {
          console.log('getServerSession - Created session from JWT:', session);
          return session;
        }
      } catch (jwtError) {
        console.error('getServerSession - Error parsing JWT:', jwtError);
      }

      // Fall back to API call if JWT parsing fails
      console.log('getServerSession - Attempting to fetch user data from API');
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Session-ID': sessionId || '',
        },
      });

      if (!response.ok) {
        console.error('getServerSession - User fetch failed:', response.status);
        if (response.status === 401 && refreshTokenValue) {
          console.log('getServerSession - Attempting token refresh after 401');
          const refreshedSession = await refreshToken();
          return refreshedSession;
        }
        await clearSession();
        return null;
      }

      const userData = await response.json();
      console.log('getServerSession - User data fetched:', JSON.stringify(userData, null, 2));

      // Return only the properties defined in the Session interface
      return {
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role || userRole as Role,
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          isVerified: userData.isVerified || true,
          profileComplete: userData.profileComplete || false
        },
        access_token: accessToken,
        session_id: sessionId || '',
        isAuthenticated: true
      };
    } catch (error) {
      console.error('getServerSession - Error fetching user data:', error);
      await clearSession();
      return null;
    }
  } catch (error) {
    console.error('getServerSession - Unexpected error:', error);
    return null;
  }
}

/**
 * Set session data in cookies with proper expiration
 */
export async function setSession(data: {
  access_token: string;
  refresh_token: string;
  session_id: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    isVerified?: boolean;
  };
}) {
  const cookieStore = await cookies();
  const session: Session = {
    access_token: data.access_token,
    session_id: data.session_id,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.firstName || '',
      lastName: data.user.lastName || '',
      name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || undefined,
      isVerified: data.user.isVerified || false,
      profileComplete: false
    },
    isAuthenticated: true
  };

  // Set cookies using Next.js 15 cookie API
  cookieStore.set({
    name: 'access_token',
    value: data.access_token,
    ...SESSION_TOKEN_OPTIONS,
  });
  
  cookieStore.set({
    name: 'refresh_token',
    value: data.refresh_token,
    ...REFRESH_TOKEN_OPTIONS,
  });
  
  cookieStore.set({
    name: 'session_id',
    value: data.session_id,
    ...COOKIE_OPTIONS,
  });
  
  cookieStore.set({
    name: 'user_role',
    value: data.user.role,
    ...COOKIE_OPTIONS,
  });

  return session;
}

/**
 * Clear session data from cookies
 */
export async function clearSession() {
  const cookieStore = await cookies();
  const expiredOptions: Partial<ResponseCookie> = {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  };
  
  // Clear cookies using Next.js 15 cookie API
  cookieStore.set({
    name: 'access_token',
    value: '',
    ...expiredOptions,
  });
  
  cookieStore.set({
    name: 'refresh_token',
    value: '',
    ...expiredOptions,
  });
  
  cookieStore.set({
    name: 'session_id',
    value: '',
    ...expiredOptions,
  });
  
  cookieStore.set({
    name: 'user_role',
    value: '',
    ...expiredOptions,
  });
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

    // Set profile completion status based on user data
    const profileComplete = calculateProfileCompletionFromUserData(result.user);
    await setProfileComplete(profileComplete);

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
  const session = await getServerSession();
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
export async function refreshToken(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('access_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    if (!currentToken || !sessionId) {
      throw new Error('No token to refresh');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'X-Session-ID': sessionId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const responseData = await response.json();
    await setSession(responseData);
    return responseData;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await clearSession();
    return null;
  }
}

/**
 * Logout
 */
export async function logout() {
  const session = await getServerSession();
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
  const session = await getServerSession();
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
  const session = await getServerSession();
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
  refresh_token?: string;
  session_id?: string;
  user?: {
    role?: Role;
    profileComplete?: boolean;
  };
}) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  
  // Access token cookie options (15 minutes)
  const accessTokenOptions: Partial<ResponseCookie> = {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  };
  
  // Refresh token cookie options (30 days)
  const refreshTokenOptions: Partial<ResponseCookie> = {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
  
  // Session and user cookie options (7 days)
  const sessionOptions: Partial<ResponseCookie> = {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
  
  if (data.access_token) {
    cookieStore.set({
      name: 'access_token',
      value: data.access_token,
      ...accessTokenOptions,
    });
  }

  if (data.refresh_token) {
    cookieStore.set({
      name: 'refresh_token',
      value: data.refresh_token,
      ...refreshTokenOptions,
    });
  }

  if (data.session_id) {
    cookieStore.set({
      name: 'session_id',
      value: data.session_id,
      ...sessionOptions,
    });
  }

  if (data.user?.role) {
    cookieStore.set({
      name: 'user_role',
      value: data.user.role,
      ...sessionOptions,
    });
  }

  // Set profile completion status
  if (data.user?.profileComplete !== undefined) {
    cookieStore.set({
      name: 'profile_complete',
      value: data.user.profileComplete.toString(),
      ...sessionOptions,
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
export async function googleLogin(token: string): Promise<GoogleLoginResponse> {
  try {
    console.log('Starting Google login with token');
    const response = await fetch(`${API_URL}/auth/social/google`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    
    // Ensure we have all required data
    if (!result.access_token || !result.refresh_token || !result.user) {
      console.error('Missing required data in Google login response:', result);
      throw new Error('Invalid response from server');
    }
    
    // Set cookies with explicit options to ensure they're properly set
    const cookieStore = await cookies();
    
    // Set access token with shorter expiry (15 minutes)
    cookieStore.set({
      name: 'access_token',
      value: result.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax to ensure it works with redirects
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });
    
    // Set refresh token with longer expiry (30 days)
    cookieStore.set({
      name: 'refresh_token',
      value: result.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax to ensure it works with redirects
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Set session ID
    cookieStore.set({
      name: 'session_id',
      value: result.session_id || '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax to ensure it works with redirects
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // Set user role for quick access in middleware
    cookieStore.set({
      name: 'user_role',
      value: result.user.role,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax to ensure it works with redirects
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set profile completion status based on user data
    const profileComplete = calculateProfileCompletionFromUserData(result.user);
    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax to ensure it works with redirects
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('Auth cookies being set:', {
      accessToken: result.access_token ? 'SET' : 'NOT SET',
      sessionId: result.session_id ? 'SET' : 'NOT SET',
    });
    console.log('Auth cookies set successfully');

    // Ensure firstName and lastName are properly extracted
    const firstName = result.user.firstName || '';
    const lastName = result.user.lastName || '';
    const name = result.user.name || `${firstName} ${lastName}`.trim();

    // Try to get additional user profile data if firstName/lastName are missing
    if (!firstName || !lastName) {
      try {
        // Extract user ID from JWT token
        const payload = JSON.parse(atob(result.access_token.split('.')[1]));
        const userId = payload.sub;
        
        console.log('Fetching additional user profile data from:', `${API_URL}/user/${userId}`);
        console.log('Using auth token:', result.access_token.substring(0, 15) + '...');
        
        const profileResponse = await fetch(`${API_URL}/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${result.access_token}`,
            'X-Session-ID': result.session_id || '',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Additional profile data:', JSON.stringify(profileData, null, 2));
          
          // Update user data with profile information
          if (profileData) {
            result.user = {
              ...result.user,
              firstName: profileData.firstName || firstName,
              lastName: profileData.lastName || lastName,
              name: profileData.name || name,
            };
            
            // Recalculate profile completion based on updated data
            const updatedProfileComplete = calculateProfileCompletionFromUserData(result.user);
            if (updatedProfileComplete !== profileComplete) {
              console.log('Updating profile completion cookie based on API response');
              cookieStore.set({
                name: 'profile_complete',
                value: updatedProfileComplete.toString(),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
              });
            }
          }
        } else {
          console.warn('Failed to fetch additional profile data:', profileResponse.status);
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
      }
    }

    // Return the response with proper typing
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        isNewUser: result.isNewUser,
        googleId: result.user.googleId,
        profileComplete: calculateProfileCompletionFromUserData(result.user)
      },
      token: result.access_token,
      redirectUrl: result.redirectUrl || getDashboardByRole(result.user.role)
    };
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

/**
 * Set profile completion status in cookies
 */
export async function setProfileComplete(complete: boolean) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  
  console.log('Setting profile completion cookie:', { complete, secure });
  
  cookieStore.set({
    name: 'profile_complete',
    value: complete.toString(),
    httpOnly: true,
    secure,
    sameSite: 'lax', // Use lax for better compatibility with redirects
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  console.log('Profile completion cookie set successfully');
}

function calculateProfileCompletionFromUserData(user: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string;
}): boolean {
  return !!(
    user.firstName?.trim() &&
    user.lastName?.trim() &&
    user.phone?.trim() &&
    user.dateOfBirth &&
    user.gender?.trim() &&
    user.address?.trim()
  );
} 