'use server';

import { Role, RegisterFormData } from '@/types/auth.types';
import { redirect } from 'next/navigation';
import { getDashboardByRole } from '@/lib/config/config';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { logger } from '@/lib/logger';
import { fetchWithAbort } from '@/lib/utils/fetch-with-abort';

// Import central configuration
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';

// API URL configuration from central config
const API_URL = APP_CONFIG.API.BASE_URL;
if (!API_URL) {
  throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
}

// API prefix - backend uses /api/v1 as global prefix
const API_PREFIX = '/api/v1';

// Clinic ID from central config
const CLINIC_ID = APP_CONFIG.CLINIC.ID;

// Environment-aware logging
if (APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) {
  logger.info('Environment configuration', { 
    environment: APP_CONFIG.ENVIRONMENT,
    apiUrl: API_URL,
    clinicId: CLINIC_ID 
  });
}

/**
 * Utility function to check API connectivity
 */
async function checkApiConnection(): Promise<boolean> {
  try {
    // Try multiple endpoints that might be available
    const endpoints = ['/health', '/health/api-health', '/health/api', '/'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithAbort(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
          timeout: 3000,
        });

        if (response.ok) {
          logger.info(`API connection successful via ${endpoint}`, { endpoint });
          return true;
        }
      } catch (endpointError) {
        logger.warn(`Failed to connect to ${endpoint}`, { 
          endpoint, 
          error: endpointError instanceof Error ? endpointError.message : String(endpointError) 
        });
      }
    }

    // If we're in development, allow proceeding even with connection issues
    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.warn('API connection failed but proceeding anyway in development mode');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('API connection error', error instanceof Error ? error : new Error(String(error)));
    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.warn('API connection failed but proceeding anyway in development mode');
      return true;
    }

    return false;
  }
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
  maxAge: 60 * 60 * 5, // 5 hours for access token
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
    phone?: string;
    dateOfBirth?: string | null;
    gender?: string;
    address?: string;
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
    phone?: string;
    dateOfBirth?: string | null;
    gender?: string;
    address?: string;
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

    logger.debug('getServerSession - Checking cookies', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshTokenValue,
      hasSessionId: !!sessionId,
      userRole
    });

    // If no access token, try to refresh if we have a refresh token
    if (!accessToken && refreshTokenValue) {
      logger.debug('getServerSession - No access token, attempting refresh');
      try {
        const refreshedSession = await refreshToken();
        if (refreshedSession) {
          logger.info('getServerSession - Session refreshed successfully');
          return refreshedSession;
        }
      } catch (error) {
        logger.error('getServerSession - Refresh failed', error instanceof Error ? error : new Error(String(error)));
        await clearSession();
        return null;
      }
    }

    // If no tokens at all, return null
    if (!accessToken) {
      logger.debug('getServerSession - No tokens found');
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
        const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
        logger.debug('getServerSession - JWT payload', { payload });
        
        session.user.id = payload.sub || '';
        session.user.email = payload.email || '';
        session.user.role = payload.role || userRole as Role;
        
        // If we have basic user info, return the session
        if (session.user.id && session.user.email && session.user.role) {
          logger.info('getServerSession - Created session from JWT', { userId: session.user.id, email: session.user.email });
          return session;
        }
      } catch (jwtError) {
        logger.error('getServerSession - Error parsing JWT', jwtError instanceof Error ? jwtError : new Error(String(jwtError)));
      }

      // Fall back to API call if JWT parsing fails
      logger.debug('getServerSession - Attempting to fetch user data from API');
      const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.USERS.PROFILE}`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Session-ID': sessionId || '',
        },
      });

      if (!response.ok) {
        logger.error('getServerSession - User fetch failed', new Error(`HTTP ${response.status}`));
        if (response.status === 401 && refreshTokenValue) {
          logger.debug('getServerSession - Attempting token refresh after 401');
          const refreshedSession = await refreshToken();
          return refreshedSession;
        }
        await clearSession();
        return null;
      }

      const userData = await response.json();
      logger.debug('getServerSession - User data fetched', { userId: userData.id, email: userData.email });

      // Return only the properties defined in the Session interface
      return {
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role || userRole as Role,
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || userData.date_of_birth || null,
          gender: userData.gender || '',
          address: userData.address || '',
          isVerified: userData.isVerified || true,
          profileComplete: userData.profileComplete || false
        },
        access_token: accessToken,
        session_id: sessionId || '',
        isAuthenticated: true
      };
    } catch (error) {
      logger.error('getServerSession - Error fetching user data', error instanceof Error ? error : new Error(String(error)));
      await clearSession();
      return null;
    }
  } catch (error) {
    logger.error('getServerSession - Unexpected error', error instanceof Error ? error : new Error(String(error)));
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
    phone?: string;
    dateOfBirth?: string | null;
    gender?: string;
    address?: string;
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
      ...(data.user.firstName || data.user.lastName ? { name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() } : {}),
      phone: data.user.phone || '',
      dateOfBirth: data.user.dateOfBirth || null,
      gender: data.user.gender || '',
      address: data.user.address || '',
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
export async function login(data: {
  email: string;
  password?: string;
  otp?: string;
  rememberMe?: boolean;
}) {
  try {
    // Validate input
    if (!data.email) {
      throw new Error('Email is required');
    }

    if (!data.password && !data.otp) {
      throw new Error('Either password or OTP must be provided');
    }

    // Prepare request body
    const requestBody: Record<string, unknown> = {
      email: data.email,
    };

    if (data.password) {
      requestBody.password = data.password;
    }

    if (data.otp) {
      requestBody.otp = data.otp;
    }

    // Include clinic ID if available
    if (CLINIC_ID) {
      requestBody.clinicId = CLINIC_ID;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Include clinic ID in headers for redundancy
    if (CLINIC_ID) {
      headers['X-Clinic-ID'] = CLINIC_ID;
    }

    // ✅ PERFORMANCE: Use fetch with AbortController for timeout handling
    const { fetchWithAbort } = await import('@/lib/utils/fetch-with-abort');
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: 10000, // 10 second timeout
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || 'Login failed');
    }

    logger.info('Login successful', { userId: result.user?.id, email: result.user?.email });

    // Set authentication cookies
    const cookieStore = await cookies();
    const profileComplete = calculateProfileCompletionFromUserData(result.user);

    // Set access token
    cookieStore.set({
      name: 'access_token',
      value: result.access_token,
      ...SESSION_TOKEN_OPTIONS,
      sameSite: 'lax', // Use lax for better compatibility with redirects
    });

    // Set session ID
    cookieStore.set({
      name: 'session_id',
      value: result.session_id || '',
      ...COOKIE_OPTIONS,
      sameSite: 'lax',
    });

    // Set user role for middleware access
    cookieStore.set({
      name: 'user_role',
      value: result.user.role,
      ...COOKIE_OPTIONS,
      sameSite: 'lax',
    });

    // Set profile completion status
    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete.toString(),
      ...COOKIE_OPTIONS,
      sameSite: 'lax',
    });

    // Return structured response
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        phone: result.user.phone || '',
        dateOfBirth: result.user.dateOfBirth || null,
        gender: result.user.gender || '',
        address: result.user.address || '',
        isVerified: result.user.isVerified || false,
        profileComplete
      },
      access_token: result.access_token,
      refresh_token: result.refresh_token || '',
      session_id: result.session_id,
      isAuthenticated: true,
      redirectUrl: result.redirectUrl || getDashboardByRole(result.user.role)
    };
  } catch (error) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Login failed');
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterFormData & { clinicId?: string }) {
  try {
    logger.info('Starting registration process', { 
      clinicIdFromData: data.clinicId,
      clinicIdFromEnv: CLINIC_ID,
      email: data.email 
    });
    
    // Ensure firstName and lastName are properly formatted
    const formattedData = {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Priority: Use clinicId from data, then from env
    let finalClinicId = data.clinicId || CLINIC_ID;
    
    // ⚠️ IMPORTANT: Backend expects UUID format for clinicId
    // If we have a clinic code (like "CL0002"), we need to convert it to UUID
    // For now, if it's not a UUID, we'll need to look it up or use a default
    // TODO: Implement clinic code to UUID lookup if needed
    
    // Always include clinic ID in headers
    if (finalClinicId) {
      headers['X-Clinic-ID'] = finalClinicId;
      logger.debug('Added X-Clinic-ID header', { clinicId: finalClinicId });
    } else {
      logger.warn('No clinic ID available for registration');
    }

    // Always include clinic ID in request body for redundancy
    if (finalClinicId) {
      formattedData.clinicId = finalClinicId;
      logger.debug('Added clinicId to request body', { clinicId: finalClinicId });
    }

    logger.debug('Registration request', { 
      url: `${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REGISTER}`,
      headers: Object.keys(headers),
      bodyKeys: Object.keys(formattedData)
    });

    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formattedData),
      timeout: 15000, // Registration may take longer
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || 'Registration failed';
      logger.error('Registration error', new Error(errorMessage), {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(errorMessage);
    }

    logger.info('Registration successful', { email: responseData.user?.email, userId: responseData.user?.id });
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
  const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REGISTER_WITH_CLINIC}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    timeout: 15000,
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
  try {
    logger.info('Starting OTP request process', { identifier, clinicId: CLINIC_ID });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Always include clinic ID in headers
    if (CLINIC_ID) {
      headers['X-Clinic-ID'] = CLINIC_ID;
      logger.debug('Added X-Clinic-ID header', { clinicId: CLINIC_ID });
    } else {
      logger.warn('CLINIC_ID not found in environment variables');
    }
    
    const requestBody: Record<string, unknown> = { 
      identifier,
      clinicId: CLINIC_ID 
    };
    
    // Always include clinic ID in request body for redundancy
    if (CLINIC_ID) {
      logger.debug('Added clinicId to request body', { clinicId: CLINIC_ID });
    }

    logger.debug('OTP request', { 
      headers: Object.keys(headers),
      bodyKeys: Object.keys(requestBody)
    });
    
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REQUEST_OTP}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: 10000,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request OTP');
    }

    const result = await response.json();
    logger.info('OTP request successful', { identifier });
    return result;
  } catch (error) {
    logger.error('OTP request error', error instanceof Error ? error : new Error(String(error)), { identifier });
    throw error instanceof Error ? error : new Error('Failed to request OTP');
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(data: { 
  email: string; 
  otp: string; 
  rememberMe?: boolean;
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (CLINIC_ID) {
    headers['X-Clinic-ID'] = CLINIC_ID;
  }
  const requestBody = { ...data, clinicId: CLINIC_ID };
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.VERIFY_OTP}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    timeout: 10000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.CHECK_OTP_STATUS}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeout: 10000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.INVALIDATE_OTP}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeout: 10000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.MAGIC_LINK}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeout: 10000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.VERIFY_MAGIC_LINK}`, {
      timeout: 10000,
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
  try {
    logger.info('Starting social login process', { provider, clinicId: CLINIC_ID });
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Always include clinic ID in headers
    if (CLINIC_ID) {
      headers['X-Clinic-ID'] = CLINIC_ID;
      logger.debug('Added X-Clinic-ID header', { clinicId: CLINIC_ID });
    } else {
      logger.warn('CLINIC_ID not found in environment variables');
    }
    
    const requestBody: Record<string, unknown> = { token };
    
    // Always include clinic ID in request body for redundancy
    if (CLINIC_ID) {
      requestBody.clinicId = CLINIC_ID;
      logger.debug('Added clinicId to request body', { clinicId: CLINIC_ID });
    }

    logger.debug('Social login request', { 
      headers: Object.keys(headers),
      bodyKeys: Object.keys(requestBody)
    });
    
    const providerEndpoint = provider === 'google' 
      ? API_ENDPOINTS.AUTH.GOOGLE_LOGIN 
      : provider === 'facebook' 
      ? API_ENDPOINTS.AUTH.FACEBOOK_LOGIN 
      : provider === 'apple' 
      ? API_ENDPOINTS.AUTH.APPLE_LOGIN 
      : `${API_ENDPOINTS.AUTH.BASE}/${provider}`;
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${providerEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: 15000, // Social login may take longer
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Social login failed');
    }

    const responseData = await response.json();
    logger.info('Social login successful', { provider, userId: responseData.user?.id });
    await setAuthCookies(responseData);
    return responseData;
  } catch (error) {
    logger.error('Social login error', error instanceof Error ? error : new Error(String(error)), { provider });
    throw error instanceof Error ? error : new Error('Social login failed');
  }
}

/**
 * Forgot Password
 */
export async function forgotPassword(email: string) {
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeout: 10000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    timeout: 10000,
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

    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'X-Session-ID': session.session_id,
      },
      timeout: 10000,
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

      const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'X-Session-ID': sessionId,
        },
        timeout: 10000,
      });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const responseData = await response.json();
    await setSession(responseData);
    return responseData;
  } catch (error) {
    logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
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
      logger.info('Attempting to logout on server', { sessionId: session.session_id });
      
      // Get device info from session if available
      const deviceInfo = {
        browser: 'web', // Default to web browser
        os: process.platform,
        device: 'browser',
        deviceId: session.session_id // Use session ID as device ID
      };

      const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Session-ID': session.session_id,
          'X-Device-ID': deviceInfo.deviceId,
          'X-Device-Info': JSON.stringify(deviceInfo),
        },
        timeout: 10000,
        body: JSON.stringify({
          sessionId: session.session_id,
          deviceId: deviceInfo.deviceId,
          deviceInfo: deviceInfo,
          allDevices: true,
        }),
        credentials: 'include',
      });

      // Wait for and parse the response
      const data = await response.json().catch(() => ({ message: 'No response body' }));
      logger.debug('Logout API response', { status: response.status });

      if (!response.ok) {
        if (response.status === 401) {
          if (data.message?.includes('Invalid device')) {
            // If device validation fails, try to logout from all devices
            logger.warn('Device validation failed, attempting to logout from all devices');
            return await logoutAllDevices();
          }
          logger.info('Session already expired on server');
        } else {
          logger.error('Server logout failed', new Error(data.message || response.statusText));
          throw new Error(data.message || `Logout failed with status ${response.status}`);
        }
      } else {
        logger.info('Successfully logged out on server');
      }
    } catch (error) {
      logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      await clearSession();
      logger.debug('Local session cleared');
    }
  } else {
    logger.debug('No active session to logout');
    await clearSession();
  }
}

// Helper function to logout from all devices
async function logoutAllDevices() {
  const session = await getServerSession();
  if (!session) return;

  const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.LOGOUT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-Session-ID': session.session_id,
    },
    timeout: 10000,
    body: JSON.stringify({
      sessionId: session.session_id,
      allDevices: true,
    }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({ message: 'No response body' }));
  logger.debug('Logout all devices response', { status: response.status });

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

  const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.LOGOUT}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Session-ID': session.session_id,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
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
  
  // Access token cookie options (5 hours for development)
  const accessTokenOptions: Partial<ResponseCookie> = {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 5, // 5 hours
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
 * Central utility for authenticated API calls using server-side cookies
 */
export async function authenticatedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const CLINIC_ID = APP_CONFIG.CLINIC.ID;
  const API_URL = APP_CONFIG.API.BASE_URL;

  if (!accessToken) {
    throw new Error('No access token found');
  }

  const url = `${API_URL}${endpoint}`;
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
  if (sessionId) baseHeaders['X-Session-ID'] = sessionId;
  if (CLINIC_ID) baseHeaders['X-Clinic-ID'] = CLINIC_ID;
  const headers: Record<string, string> = {
    ...baseHeaders,
    ...(options.headers as Record<string, string>),
  };

  // Debug: Log headers before making the request (only in development)
  if (APP_CONFIG.IS_DEVELOPMENT) {
    logger.debug('[authenticatedApi] Request', { endpoint, method: options.method || 'GET' });
  }

  const response = await fetchWithAbort(url, {
    ...options,
    headers,
    timeout: 10000,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    let errMsg: string | undefined = undefined;
    if (data && typeof data === 'object' && data !== null && 'message' in data) {
      errMsg = (data as { message?: string }).message;
    }
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  return { status: response.status, data: data as T };
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    timeout: 10000,
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
    logger.info('Starting Google login', { apiUrl: API_URL, clinicId: CLINIC_ID });
    
    // Check API connectivity first
    const isApiConnected = await checkApiConnection();
    if (!isApiConnected) {
      // Create a more helpful error message with troubleshooting steps
      throw new Error(
        'Cannot connect to the backend API. Please try the following:\n' +
        '1. Check your network connection\n' +
        '2. Verify the backend server is running\n' +
        '3. Check if the API URL is correct: ' + API_URL
      );
    }
    
    try {
      logger.debug('Making Google login request', { url: `${API_URL}/auth/google` });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Always include clinic ID in headers if available
      if (CLINIC_ID) {
        headers['X-Clinic-ID'] = CLINIC_ID;
        logger.debug('Added X-Clinic-ID header', { clinicId: CLINIC_ID });
      } else {
        logger.warn('CLINIC_ID not found in environment variables');
      }
      
      const requestBody: Record<string, unknown> = { token };
      
      // Always include clinic ID in request body for redundancy
      if (CLINIC_ID) {
        requestBody.clinicId = CLINIC_ID;
        logger.debug('Added clinicId to request body', { clinicId: CLINIC_ID });
      }
      
      logger.debug('Google login request', { 
        headers: Object.keys(headers),
        bodyKeys: Object.keys(requestBody)
      });
      
      const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        credentials: 'include',
        timeout: 15000, // Social login may take longer
      });

      logger.debug('Google login response', { status: response.status, statusText: response.statusText });

      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON, likely HTML error page
        const text = await response.text();
        logger.error('Non-JSON response received', new Error(`Status: ${response.status}`), {
          preview: text.substring(0, 200),
          apiUrl: `${API_URL}/auth/google`
        });
        
        throw new Error(`Server returned non-JSON response (${response.status}). Check if the backend is running correctly.`);
      }

      const result = await response.json();
      logger.debug('Parsed Google login response', { hasToken: !!result.access_token, hasUser: !!result.user });
      
      if (!response.ok) {
        logger.error('Google login error response', new Error(result.message || result.error || `Status ${response.status}`));
        throw new Error(result.message || result.error || `Google login failed with status ${response.status}`);
      }

      logger.info('Google login successful, setting auth cookies');
      
      // Ensure we have all required data
      if (!result.access_token || !result.session_id || !result.user) {
        logger.error('Missing required data in Google login response', new Error('Missing required fields'));
        throw new Error('Invalid response from server: Missing required fields');
      }
      
      // Set cookies with explicit options to ensure they're properly set
      const cookieStore = await cookies();
      
      // Set access token with 5 hour expiry for development
      cookieStore.set({
        name: 'access_token',
        value: result.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use lax to ensure it works with redirects
        path: '/',
        maxAge: 60 * 60 * 5, // 5 hours
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

      logger.debug('Auth cookies being set', {
        accessToken: result.access_token ? 'SET' : 'NOT SET',
        sessionId: result.session_id ? 'SET' : 'NOT SET',
      });
      logger.info('Auth cookies set successfully');

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
          
          logger.debug('Fetching additional user profile data', { userId, url: `${API_URL}/user/${userId}` });
          
          const profileResponse = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.USERS.GET_BY_ID(userId)}`, {
            headers: {
              'Authorization': `Bearer ${result.access_token}`,
              'X-Session-ID': result.session_id || '',
              'X-Clinic-ID': CLINIC_ID || '',
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
            timeout: 10000,
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            logger.debug('Additional profile data fetched', { userId });
            
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
                logger.debug('Updating profile completion cookie based on API response', { updatedProfileComplete });
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
            logger.warn('Failed to fetch additional profile data', { status: profileResponse.status });
          }
        } catch (profileError) {
          logger.error('Error fetching user profile', profileError instanceof Error ? profileError : new Error(String(profileError)));
        }
      }

      // Return the response with proper typing
      const responseData = {
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
      
      logger.info('Google login completed successfully', { userId: responseData.user?.id, email: responseData.user?.email });
      return responseData;
    } catch (error) {
      logger.error('Google login error', error instanceof Error ? error : new Error(String(error)));
      throw error instanceof Error ? error : new Error('Google login failed');
    }
  } catch (error) {
    logger.error('Google login error', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Google login failed');
  }
}

/**
 * Facebook Login
 */
export async function facebookLogin(token: string) {
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.FACEBOOK_LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    timeout: 15000,
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
    const response = await fetchWithAbort(`${API_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.APPLE_LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    timeout: 15000,
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
  
  logger.debug('Setting profile completion cookie', { complete, secure });
  
  cookieStore.set({
    name: 'profile_complete',
    value: complete.toString(),
    httpOnly: true,
    secure,
    sameSite: 'lax', // Use lax for better compatibility with redirects
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  logger.debug('Profile completion cookie set successfully');
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