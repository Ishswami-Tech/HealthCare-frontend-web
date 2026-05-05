'use server';

import { 
  Role, 
  RegisterFormData,
  OtpRequestFormData,
  OtpVerifyFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  Session,
  AuthResponse,
  MessageResponse,
  User,
} from '@/types/auth.types';

import { redirect } from 'next/navigation';
import { getDashboardByRole, ROUTES } from '@/lib/config/routes';
import { calculateProfileCompletion } from '@/lib/config/profile';
import { cookies, headers as getHeaders } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { logger } from '@/lib/utils/logger';
import { isApiError } from '@/lib/utils/error-handler';
import { fetchWithAbort } from '@/lib/utils/fetch-with-abort';
import { revalidateTag } from 'next/cache';
import { clinicApiClient } from '@/lib/api/client';

export async function revalidateCache(tag: string) {
  try {
    (revalidateTag as any)(tag, 'max');
  } catch (error: unknown) {
    logger.warn(`Failed to revalidate tag: ${tag}`, { error });
  }
}

import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';

const API_URL = APP_CONFIG.API.BASE_URL;
if (!API_URL) {
  throw new Error('API URL is not configured');
}

const CLINIC_ID = APP_CONFIG.CLINIC.ID;

let hasLoggedEnvironment = false;
if ((APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) && !hasLoggedEnvironment) {
  hasLoggedEnvironment = true;
  logger.info('Environment configuration', { 
    environment: APP_CONFIG.ENVIRONMENT,
    apiUrl: API_URL,
    clinicId: CLINIC_ID 
  });
}

async function checkApiConnection(): Promise<boolean> {
  try {
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
      } catch (endpointError: unknown) {
        logger.warn(`Failed to connect to ${endpoint}`, { 
          endpoint, 
          error: endpointError instanceof Error ? endpointError.message : String(endpointError) 
        });
      }
    }

    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.warn('API connection failed but proceeding anyway in development mode');
      return true;
    }

    return false;
  } catch (error: unknown) {
    logger.error('API connection error', error instanceof Error ? error : new Error(String(error)));
    if (APP_CONFIG.IS_DEVELOPMENT) {
      logger.warn('API connection failed but proceeding anyway in development mode');
      return true;
    }

    return false;
  }
}

const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

const SESSION_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 5,
};

const REFRESH_TOKEN_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30,
};

const INVALID_REFRESH_TOKEN_TTL_MS = 5 * 60 * 1000;
const invalidRefreshTokenCache = new Map<string, number>();

const accessTokenOptions = SESSION_TOKEN_OPTIONS;
const refreshTokenOptions = REFRESH_TOKEN_OPTIONS;
const sessionOptions = COOKIE_OPTIONS;

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractClinicIdFromPayload(
  payload: Record<string, unknown> | null | undefined
): string | undefined {
  if (!payload) {
    return undefined;
  }

  const directClinicId = payload['clinicId'];
  if (typeof directClinicId === 'string' && directClinicId.trim()) {
    return directClinicId;
  }

  const primaryClinicId = payload['primaryClinicId'];
  if (typeof primaryClinicId === 'string' && primaryClinicId.trim()) {
    return primaryClinicId;
  }

  const nestedUser = payload['user'];
  if (nestedUser && typeof nestedUser === 'object') {
    const nestedClinicId = (nestedUser as Record<string, unknown>)['clinicId'];
    if (typeof nestedClinicId === 'string' && nestedClinicId.trim()) {
      return nestedClinicId;
    }

    const nestedPrimaryClinicId = (nestedUser as Record<string, unknown>)['primaryClinicId'];
    if (typeof nestedPrimaryClinicId === 'string' && nestedPrimaryClinicId.trim()) {
      return nestedPrimaryClinicId;
    }
  }

  return undefined;
}

function resolveProfileComplete(userData: Record<string, unknown> | undefined): boolean {
  if (!userData) return false;
  if (typeof userData.profileComplete === 'boolean') return userData.profileComplete;
  if (typeof userData.isProfileComplete === 'boolean') return userData.isProfileComplete;
  if (typeof userData.requiresProfileCompletion === 'boolean') {
    return !userData.requiresProfileCompletion;
  }
  return calculateProfileCompletion(userData as any);
}

function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const apiError = error as Record<string, unknown>;
  const response = apiError.response as Record<string, unknown> | undefined;
  const responseStatus = response?.status;
  if (typeof responseStatus === 'number') {
    return responseStatus;
  }

  const statusCode = apiError.statusCode;
  if (typeof statusCode === 'number') {
    return statusCode;
  }

  const status = apiError.status;
  if (typeof status === 'number') {
    return status;
  }

  return undefined;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (!error || typeof error !== 'object') {
    return String(error || '');
  }

  const apiError = error as Record<string, unknown>;
  const response = apiError.response as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | undefined;
  const message =
    responseData?.message ||
    responseData?.error ||
    apiError.message ||
    apiError.error ||
    apiError.details ||
    '';

  return typeof message === 'string' ? message : '';
}

function isSessionInvalidError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }

  const message = extractErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return [
    'no token provided',
    'authentication required',
    'session expired',
    'invalid token',
    'invalid session',
    'unauthorized',
    'no refresh token available',
    'auth token invalid',
    'refresh token invalid',
  ].some((pattern) => message.includes(pattern));
}

function isTransientSessionError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  if (
    typeof status === 'number' &&
    [408, 425, 429, 500, 502, 503, 504].includes(status)
  ) {
    return true;
  }

  const message = extractErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return [
    'timeout',
    'timed out',
    'aborterror',
    'failed to fetch',
    'fetch failed',
    'networkerror',
    'network error',
    'econnreset',
    'enotfound',
    'econnrefused',
    'etimedout',
    'socket hang up',
    'request aborted',
  ].some((pattern) => message.includes(pattern));
}

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

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshTokenValue = cookieStore.get('refresh_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;
    const profileCompleteCookie = cookieStore.get('profile_complete')?.value;
    const profileComplete = profileCompleteCookie === 'true';
    const cookieClinicId = cookieStore.get('clinic_id')?.value;

    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      const lastLog = (global as unknown as Record<string, number>).__lastSessionCheckLog || 0;
      if (now - lastLog > 500) {
        (global as unknown as Record<string, number>).__lastSessionCheckLog = now;
        logger.debug('getServerSession - Checking cookies', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshTokenValue,
          hasSessionId: !!sessionId,
          userRole,
          profileComplete
        });
      }
    }

    if (!accessToken && refreshTokenValue) {
      try {
        const refreshedSession = await refreshToken();
        if (refreshedSession) {
          return refreshedSession;
        }
      } catch (error: unknown) {
        if (isTransientSessionError(error)) {
          logger.warn('getServerSession - Refresh failed transiently', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }
        logger.error('getServerSession - Refresh failed', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        if (isSessionInvalidError(error)) {
          await clearSession();
        }
        return null;
      }
    }

    if (!accessToken) {
      if (process.env.NODE_ENV === 'development') {
        const now = Date.now();
        const lastLog = (global as unknown as Record<string, number>).__lastNoTokenLog || 0;
        if (now - lastLog > 500) {
          (global as unknown as Record<string, number>).__lastNoTokenLog = now;
          logger.debug('getServerSession - No tokens found');
        }
      }
      return null;
    }
    
    try {
      const payload = parseJwtPayload(accessToken);
      const payloadClinicId = extractClinicIdFromPayload(payload);
      const resolvedClinicId = payloadClinicId || cookieClinicId;

      if (payloadClinicId && payloadClinicId !== cookieClinicId) {
        cookieStore.set({
          name: 'clinic_id',
          value: payloadClinicId,
          ...sessionOptions,
        });
      }

      const session: Session = {
        user: {
          id: '',
          email: '',
          role: userRole as Role,
          firstName: '',
          lastName: '',
          name: '',
          isVerified: true,
          profileComplete: profileComplete,
          clinicId: resolvedClinicId
        },
        access_token: accessToken,
        session_id: sessionId || '',
        isAuthenticated: true
      };

      try {
        if (!payload) {
          throw new Error('Invalid JWT payload');
        }
        const tokenPayload = payload;
        
        session.user.id = String(tokenPayload['sub'] || '');
        session.user.email = String(tokenPayload['email'] || '');
        session.user.role = (tokenPayload['role'] as Role) || (userRole as Role);
        if (!session.user.clinicId) {
          session.user.clinicId =
            payloadClinicId || cookieClinicId;
        }

        if (session.user.id && session.user.email && session.user.role) {
          return session;
        }
      } catch (jwtError: unknown) {
        logger.error('getServerSession - Error parsing JWT', jwtError instanceof Error ? jwtError : new Error(String(jwtError)));
      }

      const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
        timeout: 3000,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Session-ID': sessionId || '',
        },
      });

      if (!response.ok) {
        logger.error('getServerSession - User fetch failed', new Error(`HTTP ${response.status}`));
        if (response.status === 401 && refreshTokenValue) {
          const refreshedSession = await refreshToken();
          return refreshedSession;
        }
        if (response.status === 401 || response.status === 403) {
          await clearSession();
          return null;
        }

        throw new Error(`Failed to fetch user profile: HTTP ${response.status}`);
      }

      const userData = await response.json();

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
          profileComplete: resolveProfileComplete(userData) || profileComplete,
          clinicId: userData.clinicId || userData.primaryClinicId
        },
        access_token: accessToken,
        session_id: sessionId || '',
        isAuthenticated: true
      };
    } catch (error: unknown) {
      if (isTransientSessionError(error)) {
        logger.warn('getServerSession - Transient session error', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        throw error;
      }

      if (isSessionInvalidError(error)) {
      logger.error('getServerSession - Session invalid', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
        await clearSession();
        return null;
      }

      logger.error('getServerSession - Error fetching user data', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  } catch (error: unknown) {
    if (isTransientSessionError(error)) {
      logger.warn('getServerSession - Unexpected transient error', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }

    if (isSessionInvalidError(error)) {
      logger.error('getServerSession - Unexpected session invalid error', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      await clearSession();
      return null;
    }

    logger.error('getServerSession - Unexpected error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

export async function getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    const headersList = await getHeaders();
    return {
      ipAddress: headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown'
    };
  } catch (error: unknown) {
    logger.error('getClientInfo - Error fetching headers', error instanceof Error ? error : new Error(String(error)));
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  }
}



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
  if (!data.user) {
    const currentSessionId = cookieStore.get('session_id')?.value;
    const currentUserRole = cookieStore.get('user_role')?.value as Role;
    const currentProfileComplete = cookieStore.get('profile_complete')?.value === 'true';
    const accessTokenValue = data.access_token || (data as Record<string, any>).accessToken;
    const refreshTokenValue = data.refresh_token || (data as Record<string, any>).refreshToken;
    const newSessionId = data.session_id || (data as Record<string, any>).sessionId || currentSessionId;

    // Recover user claims from JWT when refresh response does not include user payload.
    let tokenUserId = '';
    let tokenUserEmail = '';
    let tokenUserRole = currentUserRole;
    if (accessTokenValue) {
      try {
        const payload = JSON.parse(atob(accessTokenValue.split('.')[1] || ''));
        tokenUserId = payload.sub || payload.id || '';
        tokenUserEmail = payload.email || '';
        tokenUserRole = payload.role || currentUserRole;
      } catch {
        // keep cookie-derived fallback values
      }
    }

    if (currentSessionId && currentUserRole) {
       const tokenPayload = accessTokenValue ? parseJwtPayload(accessTokenValue) : null;
       const tokenClinicId = extractClinicIdFromPayload(tokenPayload) || cookieStore.get('clinic_id')?.value;

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
       
       if (newSessionId && newSessionId !== currentSessionId) {
          cookieStore.set({
             name: 'session_id',
             value: newSessionId,
             ...sessionOptions,
          });
       }

       if (tokenClinicId) {
         cookieStore.set({
           name: 'clinic_id',
           value: tokenClinicId,
           ...sessionOptions,
         });
       }
       
       const session: Session = {
         access_token: accessTokenValue || '',
         session_id: newSessionId,
         user: {
           id: tokenUserId,
           email: tokenUserEmail,
           role: tokenUserRole,
           firstName: '',
           lastName: '',
           phone: '',
           dateOfBirth: null,
           gender: '',
           address: '',
           isVerified: true,
           profileComplete: currentProfileComplete,
           clinicId: tokenClinicId
         },
         isAuthenticated: true
       };
       return session;
    }
    
    throw new Error('Invalid session data');
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
      profileComplete: resolveProfileComplete(data.user as unknown as Record<string, unknown>),
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
    value: String(resolveProfileComplete(data.user as unknown as Record<string, unknown>)),
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

export async function clearSession() {
  const cookieStore = await cookies();
  const expiredOptions: Partial<ResponseCookie> = {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  };
  
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

  cookieStore.set({
    name: 'profile_complete',
    value: '',
    ...expiredOptions,
  });
}

export async function login(data: { email: string; password?: string; otp?: string; rememberMe?: boolean }) {
  try {
    if (!data.email) {
      throw new Error('Email is required');
    }

    if (!data.password && !data.otp) {
      throw new Error('Either password or OTP must be provided');
    }
    
    const requestBody: Record<string, unknown> = {
      email: data.email,
    };

    if (data.password) requestBody.password = data.password;
    if (data.otp) requestBody.otp = data.otp;
    if (data.rememberMe !== undefined) requestBody.rememberMe = data.rememberMe;
    
    const response = await clinicApiClient.login(requestBody as any);
    
    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const result = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: {
        ...resultData.user,
        clinicId: resultData.user?.clinicId || resultData.user?.primaryClinicId,
      },
    };
    
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: {
        ...result.user,
        clinicId: result.user?.clinicId || result.user?.primaryClinicId
      },
    };
    
    let sessionId = normalizedResult.session_id;
    if (!sessionId && normalizedResult.access_token) {
      try {
        const tokenParts = normalizedResult.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          sessionId = payload.sessionId || payload.session_id || payload.sub;
        }
      } catch (error: unknown) {
        logger.warn('[login] Failed to extract session_id from token', { error });
      }
    }

    const cookieStore = await cookies();
    let profileComplete = resolveProfileComplete(normalizedResult.user as Record<string, unknown>);

    const hasExplicitProfileFlags =
      normalizedResult.user &&
      typeof normalizedResult.user === 'object' &&
      ('profileComplete' in normalizedResult.user ||
        'isProfileComplete' in normalizedResult.user ||
        'requiresProfileCompletion' in normalizedResult.user);

    // If login payload doesn't carry profile flags, fetch authoritative profile once.
    if (!hasExplicitProfileFlags && normalizedResult.access_token) {
      try {
        const profileResponse = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${normalizedResult.access_token}`,
            ...(sessionId ? { 'X-Session-ID': sessionId } : {}),
          },
          cache: 'no-store',
          timeout: 3000,
        });
        if (profileResponse.ok) {
          const profileData = (await profileResponse.json()) as Record<string, unknown>;
          profileComplete = resolveProfileComplete(profileData);
        }
      } catch (error) {
        logger.warn('[login] Could not fetch profile completion status from profile API', { error });
      }
    }

    if (normalizedResult.access_token) {
      cookieStore.set({
        name: 'access_token',
        value: normalizedResult.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, 
      });
    } else {
        return { error: 'Invalid server response: Access token missing' };
    }

    if (sessionId) {
      cookieStore.set({
        name: 'session_id',
        value: sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (normalizedResult.refresh_token) {
      cookieStore.set({
        name: 'refresh_token',
        value: normalizedResult.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    if (normalizedResult.user?.role) {
      cookieStore.set({
        name: 'user_role',
        value: normalizedResult.user.role,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (normalizedResult.user?.clinicId) {
       cookieStore.set({
        name: 'clinic_id',
        value: normalizedResult.user.clinicId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

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

export async function register(data: RegisterFormData): Promise<AuthResponse | { error: string }> {
  try {
    // ✅ clinicId validation removed - backend will use X-Clinic-ID header
    // The header is automatically set by clinicApiClient
    
    // Calculate dateOfBirth from age if provided
    let dateOfBirth: string | undefined;
    if (data.dateOfBirth) {
      dateOfBirth = data.dateOfBirth;
    } else if ((data as any).age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Number((data as any).age);
      dateOfBirth = `${birthYear}-01-01`;
    }

    const formattedData = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: (data.phone || '').trim(),
      // ✅ clinicId removed - will be sent via X-Clinic-ID header only
      ...(data.role && { role: data.role }),
      ...(data.gender && { gender: data.gender.toUpperCase() }),
      ...(dateOfBirth && { dateOfBirth }),
      ...((data as any).address && { address: (data as any).address }),
    };

    const response = await clinicApiClient.register(formattedData);
    
    const responseData = response.data as any;
    const result = responseData.data || responseData;

    logger.info('Registration successful', { email: result.user?.email, userId: result.user?.id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'Registration failed' };
  }
}

export async function requestOTP(data: OtpRequestFormData): Promise<{ success: boolean; message: string }> {
  try {
    const requestBody = {
      identifier: data.identifier,
      clinicId: CLINIC_ID,
      ...(data.isRegistration !== undefined ? { isRegistration: data.isRegistration } : {}),
    };
    const response = await clinicApiClient.requestOTP(requestBody);
    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const result = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: {
        ...resultData.user,
        clinicId: resultData.user?.clinicId || resultData.user?.primaryClinicId,
      },
    };
    return {
      success: result.success ?? true,
      message: result.message || 'OTP sent successfully',
    };
  } catch (error) {
    logger.error('OTP request error', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Failed to request OTP');
  }
}

export async function verifyEmail(email: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email,
        otp
    });
    return response.data as { success: boolean; message: string };
  } catch (error) {
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'Email verification failed' };
  }
}

export async function resendVerification(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email,
        clinicId: CLINIC_ID
    });
    return response.data as { success: boolean; message: string };
  } catch (error) {
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'Resend verification failed' };
  }
}

export async function verifyOTP(data: OtpVerifyFormData): Promise<AuthResponse> {
  try {
    const requestBody = {
      identifier: data.identifier,
      otp: data.otp,
      clinicId: CLINIC_ID,
      ...(data.rememberMe !== undefined ? { rememberMe: data.rememberMe } : {}),
      ...(data.isRegistration !== undefined ? { isRegistration: data.isRegistration } : {}),
      ...(data.firstName ? { firstName: data.firstName } : {}),
      ...(data.lastName ? { lastName: data.lastName } : {}),
    };
    const response = await clinicApiClient.verifyOTP(requestBody);
    
    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const result = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: {
        ...resultData.user,
        clinicId: resultData.user?.clinicId || resultData.user?.primaryClinicId,
      },
    };
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: {
        ...result.user,
        clinicId: result.user?.clinicId || result.user?.primaryClinicId,
      },
    };

    await setAuthCookies(normalizedResult);
    return normalizedResult as AuthResponse;
  } catch (error) {
     throw error;
  }
}

export async function checkOTPStatus(email: string): Promise<{ hasActiveOTP: boolean }> {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.CHECK_OTP_STATUS, { email });
    return response.data as { hasActiveOTP: boolean };
}

export async function invalidateOTP(email: string): Promise<{ message: string }> {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.INVALIDATE_OTP, { email });
    return response.data as { message: string };
}

export async function requestMagicLink(email: string): Promise<MessageResponse> {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.MAGIC_LINK, { email });
    return response.data as MessageResponse;
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.VERIFY_MAGIC_LINK, { token });
    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const normalizedResult = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: {
        ...resultData.user,
        clinicId: resultData.user?.clinicId || resultData.user?.primaryClinicId,
      },
    };
    await setAuthCookies(normalizedResult);
    return normalizedResult as AuthResponse;
}

export async function socialLogin(data: { provider: string; token: string }): Promise<AuthResponse> {
    const response = await clinicApiClient.socialLogin(data);
    const responseData = response.data as Record<string, any>;
    const result = responseData.data || responseData;
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: {
        ...result.user,
        clinicId: result.user?.clinicId || result.user?.primaryClinicId,
      },
    };
    
    if (CLINIC_ID && normalizedResult?.user && !normalizedResult.user.clinicId) {
        normalizedResult.user.clinicId = CLINIC_ID;
    }
    
    await setAuthCookies(normalizedResult);
    return normalizedResult as AuthResponse;
}

export async function forgotPassword(data: ForgotPasswordFormData): Promise<MessageResponse> {
    const response = await clinicApiClient.forgotPassword({ email: data.email });
    return response.data as MessageResponse;
}

export async function resetPassword(data: ResetPasswordFormData): Promise<MessageResponse> {
    const response = await clinicApiClient.resetPassword({ token: data.token, password: data.password });
    return response.data as MessageResponse;
}

export async function changePassword(data: { currentPassword?: string; newPassword: string }): Promise<AuthResponse> {
   const response = await clinicApiClient.changePassword({ 
       currentPassword: data.currentPassword || '', 
       newPassword: data.newPassword 
   });
   return response.data as AuthResponse;
}

export async function refreshToken(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get('refresh_token')?.value;

    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const invalidUntil = invalidRefreshTokenCache.get(refreshTokenValue);
    if (invalidUntil && invalidUntil > Date.now()) {
      await clearSession();
      return null;
    }

    if (invalidUntil && invalidUntil <= Date.now()) {
      invalidRefreshTokenCache.delete(refreshTokenValue);
    }

    const response = await clinicApiClient.refreshToken({ refreshToken: refreshTokenValue });
    const responseData = response.data as Record<string, any>;
    
    if (!responseData.data?.accessToken && !responseData?.accessToken) {
      throw new Error('Invalid refresh response');
    }

    const tokens = responseData.data || responseData;

    const session = await setSession(tokens);
    return session; 
  } catch (error) {
    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get('refresh_token')?.value;
    if (refreshTokenValue && isSessionInvalidError(error)) {
      invalidRefreshTokenCache.set(refreshTokenValue, Date.now() + INVALID_REFRESH_TOKEN_TTL_MS);
    }
    if (isTransientSessionError(error)) {
      logger.warn('Token refresh failed transiently', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }

    logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
    if (isSessionInvalidError(error)) {
      await clearSession();
      return null;
    }

    throw error;
  }
}

export async function logout() {
  const session = await getServerSession();
  if (session) {
    try {
        await clinicApiClient.logout({ 
            sessionId: session.session_id,
            allDevices: false 
        });
    } catch (error) {
      logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      await clearSession();
    }
  } else {
    await clearSession();
  }
}



export async function getUserSessions() {
   const response = await clinicApiClient.getUserSessions();
   return response.data;
}

export async function terminateAllSessions() {
  await clinicApiClient.logout({ allDevices: true });
  await clearSession();
}

async function setAuthCookies(data: {
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  user?: {
    role?: Role;
    profileComplete?: boolean;
    clinicId?: string;
  };
}) {
  const cookieStore = await cookies();
  
  const accessTokenValue = data.access_token || data.accessToken;
  const refreshTokenValue = data.refresh_token || data.refreshToken;
  const sessionIdValue = data.session_id || data.sessionId;

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

  if (sessionIdValue) {
    cookieStore.set({
      name: 'session_id',
      value: sessionIdValue,
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

  if (data.user?.clinicId) {
    cookieStore.set({
      name: 'clinic_id',
      value: data.user.clinicId,
      ...sessionOptions,
    });
  }

  // Set profile completion status
  let profileComplete: string | undefined;
  if (data.user && ((data.user as any).profileComplete !== undefined || (data.user as any).isProfileComplete !== undefined || (data.user as any).requiresProfileCompletion !== undefined)) {
    profileComplete = resolveProfileComplete(data.user as unknown as Record<string, unknown>).toString();
  }

  if (profileComplete !== undefined) {
    cookieStore.set({
      name: 'profile_complete',
      value: profileComplete,
      ...sessionOptions,
    });
  }
}

export async function authenticatedApi<T = unknown>(
  endpoint: string,
  options: RequestInit & { omitClinicId?: boolean } = {}
): Promise<{ status: number; data: T }> {
  try {
    const response = await clinicApiClient.request<T>(endpoint, options);
    return { 
      status: response.statusCode || 200, 
      data: response.data as T 
    };
  } catch (error: unknown) {
    // Gracefully handle "Profile Incomplete" to prevent Next.js from crashing
    const normalizedCode =
      isApiError(error) && typeof error.code === 'string'
        ? error.code.replace(/[\s_-]+/g, '_').toUpperCase()
        : '';

    if (
      isApiError(error) &&
      error.statusCode === 403 &&
      (normalizedCode === 'PROFILE_INCOMPLETE' || normalizedCode === 'USER_PROFILE_INCOMPLETE')
    ) {
      try {
        const cookieStore = await cookies();
        cookieStore.set({
          name: 'profile_complete',
          value: 'false',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
      } catch {
        // no-op: preserve original 403 handling
      }
      return { status: 403, data: null as unknown as T };
    }
    if (error instanceof Error && 'statusCode' in error) {
       throw error;
    }
    throw error;
  }
}

export async function publicApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  try {
    const response = await clinicApiClient.publicRequest<T>(endpoint, options);
    return { 
      status: response.statusCode || 200, 
      data: response.data as T 
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'statusCode' in error) {
       throw error;
    }
    throw error;
  }
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as Role)) {
    const dashboardPath = getDashboardByRole(session.user.role);
    redirect(dashboardPath);
  }
  return session;
}

export async function checkAuth() {
  const session = await getServerSession();
  return {
    isAuthenticated: !!session?.user,
    session,
  };
}


export async function googleLogin(token: string): Promise<GoogleLoginResponse> {
  try {
    logger.info('Starting Google login', { apiUrl: API_URL, clinicId: CLINIC_ID });
    
    const isApiConnected = await checkApiConnection();
    if (!isApiConnected) {
      throw new Error(
        'Cannot connect to the backend API. Please try the following:\n' +
        '1. Check your network connection\n' +
        '2. Verify the backend server is running\n' +
        '3. Check if the API URL is correct: ' + API_URL
      );
    }
    
    const response = await clinicApiClient.socialLogin({
      provider: 'google',
      token,
      clinicId: CLINIC_ID
    });

    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const result = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: {
        ...resultData.user,
        clinicId: resultData.user?.clinicId || resultData.user?.primaryClinicId,
      },
    };

    if (!result?.access_token || !result?.session_id || !result?.user) {
      logger.error('Missing required data in Google login response', new Error('Missing required fields'));
      throw new Error('Invalid response from server: Missing required fields');
    }

    const firstName = result.user.firstName || '';
    const lastName = result.user.lastName || '';
    const name = result.user.name || `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName) {
      try {
        const payload = JSON.parse(atob(result.access_token.split('.')[1]));
        const userId = payload.sub;
        
        logger.debug('Fetching additional user profile data', { userId });
        
        const profileResponse = await clinicApiClient.get<Record<string, any>>(
           `${API_ENDPOINTS.USERS.GET_BY_ID(userId)}`,
           undefined, 
           {
             headers: {
               'Authorization': `Bearer ${result.access_token}`,
               'X-Session-ID': result.session_id || '',
               'X-Clinic-ID': CLINIC_ID || ''
             }
           }
        );
        
        const profileData = profileResponse.data as Record<string, any> | undefined;
        if (profileData) {
           result.user = {
             ...result.user,
             firstName: profileData.firstName || firstName,
             lastName: profileData.lastName || lastName,
             name: profileData.name || name,
           };
        }
      } catch (profileError: unknown) {
        logger.error('Error fetching user profile', profileError instanceof Error ? profileError : new Error(String(profileError)));
      }
    }

    await setAuthCookies(result);

    const outputData = {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        isNewUser: result.isNewUser,
        googleId: result.user.googleId,
        profileComplete: resolveProfileComplete(result.user as Record<string, unknown>)
      },
      token: result.access_token,
      redirectUrl: result.redirectUrl || getDashboardByRole(result.user.role)
    };
    
    logger.info('Google login completed successfully', { userId: outputData.user?.id });
    return outputData;

  } catch (error: unknown) {
    logger.error('Google login error', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Google login failed');
  }
}

export async function facebookLogin(token: string): Promise<AuthResponse> {
  const response = await clinicApiClient.socialLogin({ 
    provider: 'facebook', 
    token,
    clinicId: CLINIC_ID 
  });
  const responseData = response.data as Record<string, any>;
  const result = responseData.data || responseData;
  const normalizedResult = {
    ...result,
    access_token: result.access_token || result.accessToken,
    refresh_token: result.refresh_token || result.refreshToken,
    session_id: result.session_id || result.sessionId,
    user: {
      ...result.user,
      clinicId: result.user?.clinicId || result.user?.primaryClinicId,
    },
  };
  await setAuthCookies(normalizedResult);
  return normalizedResult as AuthResponse;
}

export async function appleLogin(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await clinicApiClient.socialLogin({ 
    provider: 'apple', 
    token,
    clinicId: CLINIC_ID
  });
  const responseData = response.data as Record<string, any>;
  const result = responseData.data || responseData;
  const normalizedResult = {
    ...result,
    access_token: result.access_token || result.accessToken,
    refresh_token: result.refresh_token || result.refreshToken,
    session_id: result.session_id || result.sessionId,
    user: {
      ...result.user,
      clinicId: result.user?.clinicId || result.user?.primaryClinicId,
    },
  };
  await setAuthCookies(normalizedResult);
  return normalizedResult as { success: boolean; user?: User; error?: string };
}


export async function setProfileComplete(complete: boolean) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  
  cookieStore.set({
    name: 'profile_complete',
    value: complete.toString(),
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
