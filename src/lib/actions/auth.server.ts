'use server';

import { 
  Role, 
  RegisterFormData,
  OtpRequestFormData,
  OtpVerifyFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from '@/types/auth.types';

import { redirect } from 'next/navigation';
import { getDashboardByRole, ROUTES } from '@/lib/config/routes';
import { calculateProfileCompletion } from '@/lib/config/profile';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { logger } from '@/lib/utils/logger';
import { fetchWithAbort } from '@/lib/utils/fetch-with-abort';
import { handleApiError, sanitizeErrorMessage } from '@/lib/utils/error-handler';

// Import central configuration
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';

// API URL configuration from central config
// ✅ APP_CONFIG.API.BASE_URL already includes /api/v1 prefix (see config.ts line 183)
const API_URL = APP_CONFIG.API.BASE_URL;
if (!API_URL) {
  throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
}

// ✅ REMOVED: API_PREFIX was causing double prefix issue
// APP_CONFIG.API.BASE_URL = https://backend.../api/v1
// Adding API_PREFIX = /api/v1 resulted in: /api/v1/api/v1/auth/login (404 ERROR!)
// Now we use API_URL directly without additional prefix

// Clinic ID from central config
const CLINIC_ID = APP_CONFIG.CLINIC.ID;

// ✅ Module-level Map to synchronize token refresh across concurrent requests
// This prevents multiple simultaneous refreshes for the same session which can trigger backend lockouts
const activeRefreshPromises = new Map<string, Promise<any>>();

// ✅ Environment-aware logging - only log once per process startup
// Use a module-level flag to prevent duplicate logs
let hasLoggedEnvironment = false;
if ((APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) && !hasLoggedEnvironment) {
  hasLoggedEnvironment = true;
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

// Update cookie options with better usage
const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days default
};

const SESSION_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 5, // 5 hours
};

const REFRESH_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Access token cookie options (alias for consistency)
const accessTokenOptions = SESSION_TOKEN_OPTIONS;
// Refresh token cookie options (alias for consistency)
const refreshTokenOptions = REFRESH_TOKEN_OPTIONS;
// Session options (alias for consistency)
const sessionOptions = COOKIE_OPTIONS;

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

    clinicId?: string | undefined;
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
    const profileCompleteCookie = cookieStore.get('profile_complete')?.value;
    const profileComplete = profileCompleteCookie === 'true';

    // ✅ Only log in development - use request-scoped deduplication
    // In Next.js server actions, each request gets a new execution context
    // Use a WeakMap to track logs per request (using the function call stack as key)
    if (process.env.NODE_ENV === 'development') {
      // Simple approach: only log if we haven't logged in the last 500ms
      // This prevents duplicate logs from React Query deduplication and React Strict Mode
      const now = Date.now();
      const lastLog = (global as any).__lastSessionCheckLog || 0;
      if (now - lastLog > 500) {
        (global as any).__lastSessionCheckLog = now;
        logger.debug('getServerSession - Checking cookies', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshTokenValue,
          hasSessionId: !!sessionId,
          userRole,
          profileComplete
        });
      }
    }

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

    // If no tokens at all, return null immediately (don't make any API calls)
    if (!accessToken) {
      // ✅ Only log in development and prevent duplicate logs
      if (process.env.NODE_ENV === 'development') {
        const now = Date.now();
        const lastLog = (global as any).__lastNoTokenLog || 0;
        // ✅ Increased to 500ms to catch rapid duplicate calls
        if (now - lastLog > 500) {
          (global as any).__lastNoTokenLog = now;
          logger.debug('getServerSession - No tokens found');
        }
      }
      return null;
    }
    
    // ✅ On auth pages, we can return early if we have a token but don't need full user data
    // This prevents blocking API calls when just checking if user is authenticated

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
          profileComplete: profileComplete, // Use cookie value instead of hardcoded false
          clinicId: cookieStore.get('clinic_id')?.value
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
      // ✅ Reduce timeout for auth pages to prevent blocking navigation
      logger.debug('getServerSession - Attempting to fetch user data from API');
      const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
        timeout: 3000, // ✅ Reduced from 10000 to 3000ms to prevent blocking
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
          // ✅ Calculate profile completion dynamically from user data to ensure accuracy
          // This fixes issues where backend might return false/undefined or cookie is out of sync
          profileComplete: calculateProfileCompletion(userData) || (userData.profileComplete ?? profileComplete),
          clinicId: userData.clinicId || userData.primaryClinicId
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
    profileComplete?: boolean;
    clinicId?: string;
  };
}) {
  const cookieStore = await cookies();
  // Check if we have complete user data
  if (!data.user) {
    // If user data is missing (token refresh scenario), try to merge with existing session from cookies
    const currentSessionId = cookieStore.get('session_id')?.value;
    const currentUserRole = cookieStore.get('user_role')?.value as Role;
    const currentProfileComplete = cookieStore.get('profile_complete')?.value === 'true';

    // We can't reconstruct the full user object securely without data, 
    // but for token refresh we just need to ensure cookies are updated.
    
    // If we have at least the critical session identifiers, we can proceed with updating tokens
    if (currentSessionId && currentUserRole) {
       // Update tokens in cookies
       const accessTokenValue = data.access_token || (data as any).accessToken;
       const refreshTokenValue = data.refresh_token || (data as any).refreshToken;

       if (accessTokenValue) {
          cookieStore.set({
             name: 'access_token',
             value: accessTokenValue,
             ...accessTokenOptions,
          });
       }
       if (refreshTokenValue) {
          cookieStore.set({
             name: 'refresh_token',
             value: refreshTokenValue,
             ...refreshTokenOptions,
          });
       }
       
       // Construct a partial session object to return
       // Note: This matches the structure of Session but with potential missing user details
       // The caller (refreshToken) mainly cares about the tokens and success state
      const session: Session = {
        access_token: data.access_token || '',
        session_id: currentSessionId,
        user: {
          id: '', // We don't have ID here, but downstream logic usually uses the token
          email: '',
          role: currentUserRole,
          firstName: '',
          lastName: '',
          phone: '',
          dateOfBirth: null,
          gender: '',
          address: '',
          isVerified: true,
          profileComplete: currentProfileComplete,
          clinicId: cookieStore.get('clinic_id')?.value
        },
        isAuthenticated: true
      };
      return session;
    }
    
    // If we can't merge, we can't set a valid session.
    console.warn('[setSession] Failed to merge session: missing existing cookies');
    throw new Error('Invalid session data: User object missing and no active session keys to merge');
  }

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
      profileComplete: data.user.profileComplete || false,
      clinicId: data.user.clinicId
    },
    isAuthenticated: true
  };

  const accessTokenValue = data.access_token || (data as any).accessToken;
  const refreshTokenValue = data.refresh_token || (data as any).refreshToken;

  // Set cookies using Next.js 15 cookie API
  cookieStore.set({
    name: 'access_token',
    value: accessTokenValue,
    ...accessTokenOptions,
  });
  
  cookieStore.set({
    name: 'refresh_token',
    value: refreshTokenValue,
    ...refreshTokenOptions,
  });
  
  cookieStore.set({
    name: 'session_id',
    value: data.session_id,
    ...sessionOptions,
  });
  
  cookieStore.set({
    name: 'user_role',
    value: data.user.role,
    ...sessionOptions,
  });
  
  cookieStore.set({
    name: 'profile_complete',
    value: String(data.user.profileComplete || false),
    ...sessionOptions,
  });

  if (data.user.clinicId) {
    cookieStore.set({
      name: 'clinic_id',
      value: data.user.clinicId,
      ...sessionOptions,
    });
  }

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

  cookieStore.set({
    name: 'clinic_id',
    value: '',
    ...expiredOptions,
  });
}

/**
 * Login with email and password or OTP
 */
export async function login(data: { email: string; password?: string; otp?: string; rememberMe?: boolean }) {
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

    if (data.rememberMe !== undefined) {
      requestBody.rememberMe = data.rememberMe;
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: 10000, // 10 second timeout
    });

    // ✅ Use centralized error handler for user-friendly messages
    let responseData: any = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      // ✅ Log raw error details for debugging
      const errorText = JSON.stringify(responseData);
      logger.error(`[login] API Error: ${response.status} ${response.statusText}`, new Error(errorText), {
        url: response.url,
        status: response.status,
        responseData
      });

      // ✅ Use centralized error handler
      const errorMessage = await handleApiError(response, responseData);
      // ✅ Return error object instead of throwing to prevent 500s and masking
      return { error: errorMessage };
    }

    // ✅ Handle wrapped response structure (backend returns { status, message, timestamp, data })
    const result = responseData.data || responseData;
    
    // ✅ Normalize field names: Backend uses camelCase (accessToken), frontend expects snake_case (access_token)
    const normalizedResult = {
      ...result,
      // Handle both camelCase and snake_case
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: {
        ...result.user,
        clinicId: result.user.clinicId || result.user.primaryClinicId
      },
    };
    
    // ✅ Extract session_id from token if not provided directly
    let sessionId = normalizedResult.session_id;
    if (!sessionId && normalizedResult.access_token) {
      try {
        // Decode JWT to extract sessionId from payload
        const tokenParts = normalizedResult.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          sessionId = payload.sessionId || payload.session_id || payload.sub;
        }
      } catch (error) {
        logger.warn('[login] Failed to extract session_id from token', { error });
      }
    }
    
    // Debug: Log the full response structure to understand why access_token is missing
    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.debug('[login] Full response structure', {
        hasData: !!responseData.data,
        responseKeys: responseData ? Object.keys(responseData) : [],
        resultKeys: result ? Object.keys(result) : [],
        normalizedKeys: normalizedResult ? Object.keys(normalizedResult) : [],
        hasAccessToken: !!normalizedResult?.access_token,
        hasSessionId: !!sessionId,
        hasUser: !!normalizedResult?.user,
        // Log first 50 chars of access_token if it exists
        accessTokenPreview: normalizedResult?.access_token ? normalizedResult.access_token.substring(0, 50) + '...' : 'MISSING'
      });
    }
    
    logger.info('Login successful', { userId: normalizedResult?.user?.id, email: normalizedResult?.user?.email });

    // Validate response structure
    if (!normalizedResult || !normalizedResult.user) {
      logger.error('Login response missing user object', new Error('Invalid response structure'), {
        responseKeys: responseData ? Object.keys(responseData) : [],
        dataKeys: result ? Object.keys(result) : [],
        normalizedKeys: normalizedResult ? Object.keys(normalizedResult) : [],
        hasAccessToken: !!normalizedResult?.access_token,
        hasSessionId: !!sessionId
      });
      return { error: 'Invalid server response: User data missing' };
    }

    // Set authentication cookies
    const cookieStore = await cookies();
    const profileComplete = calculateProfileCompletion(normalizedResult.user);

    // Debug: Log what we're about to set
    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.debug('[login] Setting cookies', {
        hasAccessToken: !!normalizedResult.access_token,
        hasSessionId: !!sessionId,
        userRole: normalizedResult.user.role,
        profileComplete
      });
    }

    // Set access token - CRITICAL: This must be set for authenticated API calls
    if (normalizedResult.access_token) {
      cookieStore.set({
        name: 'access_token',
        value: normalizedResult.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use lax for better compatibility with redirects
        path: '/',
        maxAge: 15 * 60, // 15 minutes - matches backend JWT_ACCESS_EXPIRES_IN
      });
      
      if (APP_CONFIG.IS_DEVELOPMENT) {
        logger.debug('[login] Access token cookie set', { 
          tokenLength: normalizedResult.access_token.length 
        });
      }
    } else {
      logger.error('[login] No access token in response!', new Error('Missing access_token'), {
        resultKeys: result ? Object.keys(result) : [],
        normalizedKeys: normalizedResult ? Object.keys(normalizedResult) : []
      });
      return { error: 'Invalid server response: Access token missing' };
    }

    // Set session ID (extracted from token if not provided)
    if (sessionId) {
      cookieStore.set({
        name: 'session_id',
        value: sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Set refresh token if available
    if (normalizedResult.refresh_token) {
      cookieStore.set({
        name: 'refresh_token',
        value: normalizedResult.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use lax for better compatibility with redirects
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days - matches backend JWT_REFRESH_EXPIRES_IN
      });
    }

    // Set user role (for middleware checks)
    if (normalizedResult.user.role) {
      cookieStore.set({
        name: 'user_role',
        value: normalizedResult.user.role,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use lax for better compatibility with redirects
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Set profile completion status
    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax for better compatibility with redirects
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set clinic ID cookie if available
    if (normalizedResult.user.clinicId) {
       cookieStore.set({
        name: 'clinic_id',
        value: normalizedResult.user.clinicId,
        httpOnly: true, // Should be httpOnly as it is identifying info? client.ts reads it from cookieStore on server, but what about client side?
        // client.ts line 105: clinicId = localStorage.getItem('clinic_id') || undefined;
        // client.ts line 97: clinicId = cookieStore.get('clinic_id')?.value;
        // If httpOnly is true, client-side JS cannot read it from document.cookie, but we are using localStorage on client side?
        // Wait, client.ts checks localStorage on client side.
        // auth.server.ts is server-side actions.
        // If we want client-side to have access, we might need to expose it or have a client component set it.
        // BUT, client.ts on server-side reads cookies.
        // client.ts on client-side reads localStorage.
        // Login action returns the user object. The UI component calling login can set localStorage.
        // So for server-side `clinic_id` cookie, checking httpOnly:
        // If we want to read it via `cookies()` in server components, httpOnly is fine.
        // If we want the browser to send it in requests automatically? No, we manually set headers.
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Verify cookies were set successfully (debugging aid)
    if (APP_CONFIG.IS_DEVELOPMENT) {
      const verifyAccess = cookieStore.get('access_token');
      const verifyRefresh = cookieStore.get('refresh_token');
      const verifySession = cookieStore.get('session_id');
      const verifyRole = cookieStore.get('user_role');
      
      logger.debug('[login] Cookie verification after setting', {
        hasAccessToken: !!verifyAccess,
        hasRefreshToken: !!verifyRefresh,
        hasSessionId: !!verifySession,
        hasUserRole: !!verifyRole,
        accessTokenLength: verifyAccess?.value.length || 0,
        environment: process.env.NODE_ENV,
        secure: process.env.NODE_ENV === 'production',
        clinicId: normalizedResult.user.clinicId
      });
    }

    // Return structured response
    return {
      user: {
        id: normalizedResult.user.id,
        email: normalizedResult.user.email,
        role: normalizedResult.user.role || Role.PATIENT,
        name: normalizedResult.user.name || `${normalizedResult.user.firstName || ''} ${normalizedResult.user.lastName || ''}`.trim(),
        firstName: normalizedResult.user.firstName || '',
        lastName: normalizedResult.user.lastName || '',
        phone: normalizedResult.user.phone || '',
        dateOfBirth: normalizedResult.user.dateOfBirth || null,
        gender: normalizedResult.user.gender || '',
        address: normalizedResult.user.address || '',
        isVerified: normalizedResult.user.isVerified || false,
        profileComplete,
        clinicId: normalizedResult.user.clinicId
      },
      access_token: normalizedResult.access_token,
      refresh_token: normalizedResult.refresh_token || '',
      session_id: sessionId || '',
      isAuthenticated: true,
      redirectUrl: normalizedResult.redirectUrl || getDashboardByRole(normalizedResult.user.role || Role.PATIENT)
    };
  } catch (error) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { error: errorMessage };
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
    
    // ✅ CRITICAL: Clinic ID is REQUIRED by backend
    // Priority: Use clinicId from data, then from env config
    // Backend can handle both UUID and clinic code (like "CL0002") - it will resolve to UUID automatically
    const finalClinicId = (data.clinicId || CLINIC_ID)?.trim();
    
    // ✅ Ensure clinicId is always provided (backend requires it)
    if (!finalClinicId || finalClinicId === '') {
      const errorMsg = 'Clinic ID is required for registration. Please configure NEXT_PUBLIC_CLINIC_ID or provide clinicId in registration data.';
      logger.error('Registration failed: No clinic ID available', new Error(errorMsg));
      return { error: errorMsg };
    }
    
    // ✅ Clean up data to match backend RegisterDto exactly
    // Backend expects: email, password, firstName, lastName, phone, clinicId (required)
    //                  role?, gender?, dateOfBirth?, address?, studioId?, emergencyContact?, googleId? (optional)
    // Frontend may send: confirmPassword, age, terms (frontend-only - must be removed)
    
    // Calculate dateOfBirth from age if provided
    let dateOfBirth: string | undefined;
    if (data.dateOfBirth) {
      dateOfBirth = data.dateOfBirth;
    } else if ((data as any).age) {
      // Convert age to dateOfBirth (approximate - subtract age from current year)
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Number((data as any).age);
      dateOfBirth = `${birthYear}-01-01`; // Use January 1st as default
    }
    
    // Build clean request body matching backend RegisterDto
    // ✅ clinicId is REQUIRED - always included
    const formattedData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      clinicId: string; // REQUIRED by backend
      role?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
    } = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: (data.phone || '').trim(),
      clinicId: finalClinicId, // ✅ REQUIRED - backend will resolve clinic code to UUID if needed
      // Optional fields - only include if provided
      ...(data.role && { role: data.role }),
      ...(data.gender && { gender: data.gender.toUpperCase() }), // Backend expects MALE/FEMALE/OTHER
      ...(dateOfBirth && { dateOfBirth }),
      ...((data as any).address && { address: (data as any).address }),
      // ✅ Explicitly excluded: confirmPassword, age, terms - these are frontend-only validation fields
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // ✅ Always include clinic ID in headers for multi-tenant context
      'X-Clinic-ID': finalClinicId,
    };
    
    logger.debug('Registration request prepared', { 
      clinicId: finalClinicId,
      hasClinicIdInBody: !!formattedData.clinicId,
      hasClinicIdInHeader: !!headers['X-Clinic-ID'],
    });

    const fullUrl = `${API_URL}${API_ENDPOINTS.AUTH.REGISTER}`;
    logger.debug('Registration request', { 
      url: fullUrl,
      headers: Object.keys(headers),
      bodyKeys: Object.keys(formattedData),
      clinicId: finalClinicId
    });

    const response = await fetchWithAbort(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(formattedData),
      timeout: 15000, // Registration may take longer
    });

    // ✅ Use centralized error handler for user-friendly messages
    let responseData: any = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      // ✅ Use centralized error handler
      const errorMessage = await handleApiError(response, responseData);
      logger.error('Registration error', new Error(errorMessage), {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        originalError: responseData.message || responseData.error,
        responseBody: responseData,
      });
      return { error: errorMessage };
    }

    // ✅ Handle wrapped response structure (backend returns { status, message, timestamp, data })
    const result = responseData.data || responseData;

    logger.info('Registration successful', { email: result.user?.email, userId: result.user?.id });
    return result;
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
  const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.REGISTER_WITH_CLINIC}`, {
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
export async function requestOTP(data: OtpRequestFormData) {
  try {
    const identifier = data.identifier;
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
      clinicId: CLINIC_ID,
      isRegistration: data.isRegistration
    };
    
    // Always include clinic ID in request body for redundancy
    if (CLINIC_ID) {
      logger.debug('Added clinicId to request body', { clinicId: CLINIC_ID });
    }

    logger.debug('OTP request', { 
      headers: Object.keys(headers),
      bodyKeys: Object.keys(requestBody)
    });
    
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.REQUEST_OTP}`, {
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
    logger.error('OTP request error', error instanceof Error ? error : new Error(String(error)), { identifier: data.identifier });
    throw error instanceof Error ? error : new Error('Failed to request OTP');
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(data: OtpVerifyFormData) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (CLINIC_ID) {
    headers['X-Clinic-ID'] = CLINIC_ID;
  }
  const requestBody = { ...data, clinicId: CLINIC_ID };
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.VERIFY_OTP}`, {
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.CHECK_OTP_STATUS}`, {
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.INVALIDATE_OTP}`, {
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.MAGIC_LINK}`, {
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.VERIFY_MAGIC_LINK}`, {
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
    const response = await fetchWithAbort(`${API_URL}${providerEndpoint}`, {
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
/**
 * Forgot Password
 */
export async function forgotPassword(data: ForgotPasswordFormData) {
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: data.email }),
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
/**
 * Reset Password
 */
export async function resetPassword(data: ResetPasswordFormData) {
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      token: data.token, 
      newPassword: data.password 
    }),
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
export async function changePassword(data: { currentPassword?: string; newPassword: string }) {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'X-Session-ID': session.session_id,
      },
      timeout: 10000,
      body: JSON.stringify(data),
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
    // ✅ Use refresh_token instead of access_token for token refresh
    const refreshTokenValue = cookieStore.get('refresh_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;
    const expiredAccessToken = cookieStore.get('access_token')?.value;

    if (!refreshTokenValue) {
      logger.debug('[refreshToken] No refresh token available');
      throw new Error('No refresh token available');
    }

    logger.debug('[refreshToken] Attempting token refresh', { 
      hasRefreshToken: true, 
      hasSessionId: !!sessionId,
      hasExpiredAccessToken: !!expiredAccessToken 
    });

    // Build headers - use expired token if available for backend validation
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (expiredAccessToken) {
      headers['Authorization'] = `Bearer ${expiredAccessToken}`;
    }
    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
      timeout: 10000,
      credentials: 'include', // ✅ FIX: Ensure cookies are sent and received
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('[refreshToken] Backend refresh failed', new Error(errorData.message || 'Failed to refresh token'), { status: response.status });
      throw new Error('Failed to refresh token');
    }

    const responseData = await response.json();
    
    // ✅ FIX: Verify backend returned new tokens
    if (!responseData.data?.accessToken || !responseData.data?.refreshToken) {
      logger.error('[refreshToken] Invalid response - missing tokens', new Error('Backend did not return tokens'));
      throw new Error('Invalid refresh response');
    }

    logger.info('[refreshToken] Successfully refreshed tokens', {
      hasNewAccessToken: !!responseData.data.accessToken,
      hasNewRefreshToken: !!responseData.data.refreshToken,
    });

    // setSession will update cookies with new tokens
    const session = await setSession(responseData.data);
    
    // Verify cookies were updated
    const verifyAccess = cookieStore.get('access_token');
    const verifyRefresh = cookieStore.get('refresh_token');
    logger.debug('[refreshToken] Cookie verification after refresh', {
      hasAccessToken: !!verifyAccess,
      hasRefreshToken: !!verifyRefresh,
      accessTokenUpdated: verifyAccess?.value !== expiredAccessToken,
    });
    
    return session; // Return fresh session with new tokens
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

      const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
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

  const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
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
 * ✅ Get User Sessions
 * Backend endpoint: GET /auth/sessions
 */
export async function getUserSessions() {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    logger.debug('[getUserSessions] Fetching user sessions');

    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.SESSIONS}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'X-Session-ID': session.session_id,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = await handleApiError(response, error);
      logger.error('[getUserSessions] Failed', { error: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    logger.info('[getUserSessions] Success', { sessionsCount: Array.isArray(data) ? data.length : 0 });
    return data;
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    logger.error('[getUserSessions] Error', { error: errorMessage });
    throw new Error(errorMessage);
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

  const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
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
  
  const accessTokenValue = data.access_token || (data as any).accessToken;
  const refreshTokenValue = data.refresh_token || (data as any).refreshToken;

  if (accessTokenValue) {
    cookieStore.set({
      name: 'access_token',
      value: accessTokenValue,
      ...accessTokenOptions,
    });
  }

  if (refreshTokenValue) {
    cookieStore.set({
      name: 'refresh_token',
      value: refreshTokenValue,
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

  // Set profile completion status
  let profileComplete: string | undefined;
  if (data.user?.profileComplete !== undefined) {
    profileComplete = data.user.profileComplete.toString();
  } else if (data.user && (data.user as any).id && (data.user as any).email) {
    // Only calculate if we have basically enough info
    profileComplete = calculateProfileCompletion(data.user as any).toString();
  }

  if (profileComplete !== undefined) {
    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete,
      ...sessionOptions,
    });
  }
}

/**
 * Central utility for authenticated API calls using server-side cookies
 * Automatically handles token refresh on 401 errors
 */
export async function authenticatedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const refreshTokenValue = cookieStore.get('refresh_token')?.value;
  const CLINIC_ID = APP_CONFIG.CLINIC.ID;
  const API_URL = APP_CONFIG.API.BASE_URL;

  // If no access token but have refresh token, try to refresh first
  if (!accessToken && refreshTokenValue && sessionId) {
    logger.debug('[authenticatedApi] No access token, checking for active refresh promise');
    
    let refreshPromise = activeRefreshPromises.get(sessionId);
    if (!refreshPromise) {
      refreshPromise = refreshToken();
      activeRefreshPromises.set(sessionId, refreshPromise);
      refreshPromise.finally(() => activeRefreshPromises.delete(sessionId));
    }

    try {
      const refreshedSession = await refreshPromise;
      if (refreshedSession?.access_token) {
        accessToken = refreshedSession.access_token;
        logger.debug('[authenticatedApi] Token refreshed successfully');
      }
    } catch (refreshError) {
      logger.error('[authenticatedApi] Pre-request token refresh failed', refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
    }
  }

  if (!accessToken) {
    // Debug: Log available cookies to help diagnose why token is missing
    if (APP_CONFIG.IS_DEVELOPMENT) {
      const allCookies = cookieStore.getAll().map(c => c.name).join(', ');
      logger.debug('[authenticatedApi] No access token found', { 
        availableCookies: allCookies, 
        endpoint 
      });
    }
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

  let response = await fetchWithAbort(url, {
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

  // ✅ Handle 401 by attempting token refresh and retrying
  if (response.status === 401 && refreshTokenValue && sessionId) {
    logger.debug('[authenticatedApi] Received 401, checking for active refresh promise', { sessionId });
    
    let refreshPromise = activeRefreshPromises.get(sessionId);
    if (!refreshPromise) {
      logger.debug('[authenticatedApi] Starting new refresh promise');
      refreshPromise = refreshToken();
      activeRefreshPromises.set(sessionId, refreshPromise);
      refreshPromise.finally(() => activeRefreshPromises.delete(sessionId));
    } else {
      logger.debug('[authenticatedApi] Waiting for already active refresh promise');
    }

    try {
      const refreshedSession = await refreshPromise;
      if (refreshedSession?.access_token) {
        logger.debug('[authenticatedApi] Token refreshed, retrying request');
        // Update authorization header with new token
        const retryHeaders: Record<string, string> = {
          ...headers,
          'Authorization': `Bearer ${refreshedSession.access_token}`,
        };
        
        response = await fetchWithAbort(url, {
          ...options,
          headers: retryHeaders,
          timeout: 10000,
        });
        
        try {
          data = await response.json();
        } catch {
          data = {};
        }
      }
    } catch (refreshError) {
      logger.error('[authenticatedApi] Token refresh failed after 401', refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
    }
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
    redirect(ROUTES.LOGIN);
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
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
      
      const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`, {
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
      const profileComplete = calculateProfileCompletion(result.user);
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
          
          const profileResponse = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.USERS.GET_BY_ID(userId)}`, {
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
              const updatedProfileComplete = calculateProfileCompletion(result.user);
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
          profileComplete: calculateProfileCompletion(result.user)
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.FACEBOOK_LOGIN}`, {
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
    const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.AUTH.APPLE_LOGIN}`, {
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

