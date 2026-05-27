'use server';

import {
  Role,
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
import { createHash } from 'crypto';
import { logger } from '@/lib/utils/logger';
import { isApiError } from '@/lib/utils/error-handler';
import { fetchWithAbort } from '@/lib/utils/fetch-with-abort';
import { revalidatePath } from 'next/cache';
import { clinicApiClient } from '@/lib/api/client';
import { normalizeClinicId } from '@/lib/utils/clinic-id';

import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';

const API_URL = APP_CONFIG.API.BASE_URL;
if (!API_URL) {
  throw new Error('API URL is not configured');
}

// NOTE: CLINIC_ID is for reference only - do NOT use as fallback
const CLINIC_ID = APP_CONFIG.CLINIC.ID;

function resolveClinicContextId(clinicId?: string | null): string {
  return normalizeClinicId(clinicId);
}

function requireClinicContextId(clinicId?: string | null, operation = 'auth'): string {
  // CRITICAL: No fallback to hardcoded value - each request must explicitly specify clinicId
  // This ensures proper multi-tenant isolation
  const trimmedClinicId = clinicId?.trim();
  if (!trimmedClinicId) {
    throw new Error(`Clinic ID is required for ${operation}. Please select a clinic and try again.`);
  }
  return trimmedClinicId;
}

function extractClinicIdFromTokenValue(token?: string): string | undefined {
  if (!token) {
    return undefined;
  }

  return normalizeClinicId(
    extractClinicIdFromPayload(parseJwtPayload(token)) ||
      undefined
  );
}

function extractClinicNameFromPayload(
  payload: Record<string, unknown> | null | undefined
): string | undefined {
  if (!payload) {
    return undefined;
  }

  const directClinicName = payload['clinicName'];
  if (typeof directClinicName === 'string' && directClinicName.trim()) {
    return directClinicName.trim();
  }

  const nestedUser = payload['user'];
  if (nestedUser && typeof nestedUser === 'object') {
    const nestedClinicName = (nestedUser as Record<string, unknown>)['clinicName'];
    if (typeof nestedClinicName === 'string' && nestedClinicName.trim()) {
      return nestedClinicName.trim();
    }
  }

  return undefined;
}

function normalizeAuthUserPayload(
  user: Record<string, unknown> | null | undefined,
  token?: string
): Record<string, unknown> {
  const clinicId = normalizeClinicId(
    (typeof user?.clinicId === 'string' ? user.clinicId : undefined) ||
      (typeof user?.primaryClinicId === 'string' ? user.primaryClinicId : undefined) ||
      extractClinicIdFromTokenValue(token)
  );

  const clinicName =
    (typeof user?.clinicName === 'string' && user.clinicName.trim()) ||
    extractClinicNameFromPayload(parseJwtPayload(token || '')) ||
    undefined;

  return {
    ...(user || {}),
    ...(clinicId ? { clinicId } : {}),
    ...(clinicName ? { clinicName } : {}),
  };
}

if (APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) {
  logger.info('Environment configuration', { 
    environment: APP_CONFIG.ENVIRONMENT,
    apiUrl: API_URL,
    clinicId: CLINIC_ID 
  });
}

async function checkApiConnection(): Promise<boolean> {
  try {
    const healthBaseUrl = APP_CONFIG.API.HEALTH_BASE_URL || API_URL;
    const endpoint = '/health';
    const response = await fetchWithAbort(`${healthBaseUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      timeout: 5000,
    });

    if (response.ok) {
      logger.info('API connection successful via /health', { endpoint });
      return true;
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

function cookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

function sessionTokenOptions(): Partial<ResponseCookie> {
  return {
    ...cookieOptions(),
    maxAge: 60 * 60 * 5,
  };
}

function refreshTokenOptions(): Partial<ResponseCookie> {
  return {
    ...cookieOptions(),
    maxAge: 60 * 60 * 24 * 30,
  };
}

const INVALID_REFRESH_TOKEN_TTL_MS = 5 * 60 * 1000;
const INVALID_REFRESH_TOKEN_COOKIE = 'invalid_refresh_token';

function getRefreshTokenFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getInvalidRefreshTokenMarker(value?: string): { fingerprint: string; invalidUntil: number } | null {
  if (!value) {
    return null;
  }

  const [fingerprint, invalidUntilValue] = value.split(':');
  const invalidUntil = Number(invalidUntilValue);
  if (!fingerprint || !Number.isFinite(invalidUntil)) {
    return null;
  }

  return { fingerprint, invalidUntil };
}

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

function getJwtExpiryMs(token: string): number | null {
  const payload = parseJwtPayload(token);
  if (!payload) {
    return null;
  }

  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return null;
  }

  return Math.floor(exp * 1000);
}

function shouldRefreshJwt(token: string, thresholdMs = 60 * 60 * 1000): boolean {
  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs === null) {
    return false;
  }

  return expiryMs <= Date.now() + thresholdMs;
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
  if (String(userData.role || '').toUpperCase() !== String(Role.PATIENT)) return true;
  if (typeof userData.profileComplete === 'boolean') return userData.profileComplete;
  if (typeof userData.isProfileComplete === 'boolean') return userData.isProfileComplete;
  if (typeof userData.requiresProfileCompletion === 'boolean') {
    return !userData.requiresProfileCompletion;
  }
  return calculateProfileCompletion(userData as any);
}

function resolveProfileCompleteFromPayload(
  payload: Record<string, unknown> | null | undefined
): boolean | undefined {
  if (!payload) {
    return undefined;
  }

  const directRole = String(payload['role'] || '').toUpperCase();
  if (directRole && directRole !== String(Role.PATIENT)) {
    return true;
  }

  if (typeof payload['profileComplete'] === 'boolean') {
    return payload['profileComplete'] as boolean;
  }

  if (typeof payload['isProfileComplete'] === 'boolean') {
    return payload['isProfileComplete'] as boolean;
  }

  if (typeof payload['requiresProfileCompletion'] === 'boolean') {
    return !(payload['requiresProfileCompletion'] as boolean);
  }

  const nestedUser = payload['user'];
  if (nestedUser && typeof nestedUser === 'object') {
    const nestedRole = String((nestedUser as Record<string, unknown>)['role'] || '').toUpperCase();
    if (nestedRole && nestedRole !== String(Role.PATIENT)) {
      return true;
    }
    return resolveProfileComplete(nestedUser as Record<string, unknown>);
  }

  return undefined;
}

async function fetchAuthoritativeProfileComplete(
  accessToken: string,
  sessionId?: string
): Promise<boolean | undefined> {
  try {
    const response = await fetchWithAbort(`${API_URL}/profile/completion/status`, {
      method: 'GET',
      cache: 'no-store',
      timeout: 3000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(sessionId ? { 'X-Session-ID': sessionId } : {}),
      },
    });

    if (!response.ok) return undefined;

    const payload = (await response.json()) as {
      isComplete?: boolean;
      data?: { isComplete?: boolean };
    };

    if (typeof payload.isComplete === 'boolean') return payload.isComplete;
    if (typeof payload.data?.isComplete === 'boolean') return payload.data.isComplete;
    return undefined;
  } catch {
    return undefined;
  }
}

function extractSessionIdFromToken(token: string): string | undefined {
  const payload = parseJwtPayload(token);
  if (!payload) {
    return undefined;
  }

  const directSessionId = payload['sessionId'];
  if (typeof directSessionId === 'string' && directSessionId.trim()) {
    return directSessionId;
  }

  const legacySessionId = payload['session_id'];
  if (typeof legacySessionId === 'string' && legacySessionId.trim()) {
    return legacySessionId;
  }

  const subject = payload['sub'];
  if (typeof subject === 'string' && subject.trim()) {
    return subject;
  }

  return undefined;
}

function extractNamePartsFromPayload(
  payload: Record<string, unknown> | null | undefined
): { firstName: string; lastName: string; name: string } {
  const empty = { firstName: '', lastName: '', name: '' };
  if (!payload) {
    return empty;
  }

  const firstNameCandidates = [
    payload['firstName'],
    payload['given_name'],
    payload['givenName'],
  ];
  const lastNameCandidates = [
    payload['lastName'],
    payload['family_name'],
    payload['familyName'],
  ];
  const nameCandidates = [payload['name'], payload['fullName']];

  let firstName =
    firstNameCandidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )?.trim() || '';
  let lastName =
    lastNameCandidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )?.trim() || '';
  let name =
    nameCandidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )?.trim() || '';

  if (!name && (firstName || lastName)) {
    name = `${firstName} ${lastName}`.trim();
  }

  if ((!firstName || !lastName) && name) {
    const [derivedFirstName = '', ...derivedRest] = name.split(/\s+/);
    const derivedLastName = derivedRest.join(' ').trim();
    firstName = firstName || derivedFirstName;
    lastName = lastName || derivedLastName;
  }

  return { firstName, lastName, name };
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
    clinicId?: string;
    clinicName?: string;
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
    const firstNameCookie = cookieStore.get('first_name')?.value?.trim() || '';
    const lastNameCookie = cookieStore.get('last_name')?.value?.trim() || '';
    const nameCookie = cookieStore.get('user_name')?.value?.trim() || '';
    const profileComplete = profileCompleteCookie === 'true';
    const cookieClinicId = normalizeClinicId(cookieStore.get('clinic_id')?.value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('getServerSession - Checking cookies', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshTokenValue,
        hasSessionId: !!sessionId,
        userRole,
        profileComplete
      });
    }

    if (accessToken && refreshTokenValue && shouldRefreshJwt(accessToken)) {
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

    const accessTokenExpiryMs = getJwtExpiryMs(accessToken);
    if (accessTokenExpiryMs !== null && accessTokenExpiryMs <= Date.now()) {
      if (refreshTokenValue) {
        try {
          const refreshedSession = await refreshToken();
          if (refreshedSession) {
            return refreshedSession;
          }
        } catch (error: unknown) {
          if (isTransientSessionError(error)) {
            logger.warn('getServerSession - Expired token refresh failed transiently', {
              error: error instanceof Error ? error : new Error(String(error)),
            });
            throw error;
          }
          logger.error('getServerSession - Expired token refresh failed', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
          if (isSessionInvalidError(error)) {
            await clearSession();
          }
          return null;
        }
      }

      await clearSession();
      return null;
    }

    let authoritativeProfileComplete = profileComplete;
    
    try {
      const payload = parseJwtPayload(accessToken);
      const tokenProfileComplete = resolveProfileCompleteFromPayload(payload);
      const payloadClinicId = normalizeClinicId(extractClinicIdFromPayload(payload));
      const resolvedClinicId = payloadClinicId || normalizeClinicId(cookieClinicId);

      if (payloadClinicId && payloadClinicId !== cookieClinicId) {
        cookieStore.set({
          name: 'clinic_id',
          value: payloadClinicId,
          ...cookieOptions(),
        });
      }

      const session: Session = {
        user: {
          id: '',
          email: '',
          role: userRole as Role,
          ...extractNamePartsFromPayload(payload),
          isVerified: true,
          profileComplete: profileComplete,
          clinicId: resolvedClinicId,
          ...(extractClinicNameFromPayload(payload) ? { clinicName: extractClinicNameFromPayload(payload) } : {})
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
        const tokenNameParts = extractNamePartsFromPayload(tokenPayload);
        session.user.firstName = session.user.firstName || tokenNameParts.firstName || firstNameCookie;
        session.user.lastName = session.user.lastName || tokenNameParts.lastName || lastNameCookie;
        session.user.name = session.user.name || tokenNameParts.name || nameCookie;
        if (!session.user.clinicId) {
          session.user.clinicId =
            payloadClinicId || cookieClinicId;
        }

        if (session.user.id && session.user.email && session.user.role) {
          if (tokenProfileComplete === true) {
            authoritativeProfileComplete = true;
            cookieStore.set({
              name: 'profile_complete',
              value: 'true',
              ...cookieOptions(),
            });
          } else if (!authoritativeProfileComplete) {
            const backendProfileComplete = await fetchAuthoritativeProfileComplete(accessToken, sessionId);
            if (backendProfileComplete === true) {
              authoritativeProfileComplete = true;
              cookieStore.set({
                name: 'profile_complete',
                value: 'true',
                ...cookieOptions(),
              });
            }
          }

          session.user.profileComplete = authoritativeProfileComplete;
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
        if (response.status === 403) {
          logger.warn('getServerSession - User fetch forbidden, preserving token-derived session', {
            sessionId,
            hasPayload: !!payload,
          });
          session.user.profileComplete = authoritativeProfileComplete || profileComplete;
          return session;
        }
        if (response.status === 401) {
          await clearSession();
          return null;
        }

        throw new Error(`Failed to fetch user profile: HTTP ${response.status}`);
      }

      const userData = await response.json();
      const resolvedFromUserData = resolveProfileComplete(userData);
      if (!resolvedFromUserData) {
        const backendProfileComplete = await fetchAuthoritativeProfileComplete(accessToken, sessionId);
        if (backendProfileComplete === true) {
          authoritativeProfileComplete = true;
          cookieStore.set({
            name: 'profile_complete',
            value: 'true',
            ...cookieOptions(),
          });
        }
      } else {
        authoritativeProfileComplete = true;
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role || userRole as Role,
          firstName: userData.firstName || userData.first_name || firstNameCookie || '',
          lastName: userData.lastName || userData.last_name || lastNameCookie || '',
          name: userData.name || `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || userData.date_of_birth || null,
          gender: userData.gender || '',
          address: userData.address || '',
          isVerified: userData.isVerified || true,
          profileComplete: authoritativeProfileComplete || resolvedFromUserData || profileComplete,
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

export async function auth(): Promise<Session | null> {
  return getServerSession();
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

    logger.info('setSession: Processing token-based session recovery', {
      hasAccessToken: !!accessTokenValue,
      hasRefreshToken: !!refreshTokenValue,
      hasSessionId: !!(newSessionId || currentSessionId),
      hasUserRole: !!(tokenUserRole || currentUserRole),
      tokenUserRole,
      currentUserRole,
    });

    if (currentSessionId) {
       const tokenPayload = accessTokenValue ? parseJwtPayload(accessTokenValue) : null;
       const tokenClinicId = normalizeClinicId(
         extractClinicIdFromPayload(tokenPayload) || cookieStore.get('clinic_id')?.value
       );

       // Recover userRole from JWT if not in cookie
       const resolvedUserRole = tokenUserRole || currentUserRole;

       if (accessTokenValue) {
          cookieStore.set({
             name: 'access_token',
             value: accessTokenValue,
             ...sessionTokenOptions(),
          });
       }
       if (refreshTokenValue) {
          cookieStore.set({
             name: 'refresh_token',
             value: refreshTokenValue,
             ...refreshTokenOptions(),
          });
       }

       if (newSessionId && newSessionId !== currentSessionId) {
          cookieStore.set({
             name: 'session_id',
             value: newSessionId,
             ...cookieOptions(),
          });
       }

       if (tokenClinicId) {
         cookieStore.set({
           name: 'clinic_id',
           value: tokenClinicId,
           ...cookieOptions(),
         });
       }

       // Store user_role if we have a JWT role and cookie doesn't have one
       if (resolvedUserRole && !cookieStore.get('user_role')?.value) {
         cookieStore.set({
           name: 'user_role',
           value: resolvedUserRole,
           ...cookieOptions(),
         });
       }

       const session: Session = {
         access_token: accessTokenValue || '',
         session_id: newSessionId || currentSessionId,
         user: {
           id: tokenUserId || '',
           email: tokenUserEmail || '',
           role: resolvedUserRole,
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
      clinicId: normalizeClinicId(data.user.clinicId)
    },
    isAuthenticated: true
  };

  const accessTokenValue = data.access_token || (data as any).accessToken;
  const refreshTokenValue = data.refresh_token || (data as any).refreshToken;

  // Set cookies using Next.js 15 cookie API
  cookieStore.set({
    name: 'access_token',
    value: accessTokenValue,
    ...sessionTokenOptions(),
  });
  
  cookieStore.set({
    name: 'refresh_token',
    value: refreshTokenValue,
    ...refreshTokenOptions(),
  });
  
  cookieStore.set({
    name: 'session_id',
    value: data.session_id,
    ...cookieOptions(),
  });
  
  cookieStore.set({
    name: 'user_role',
    value: data.user.role,
    ...cookieOptions(),
  });
  
  cookieStore.set({
    name: 'profile_complete',
    value: String(resolveProfileComplete(data.user as unknown as Record<string, unknown>)),
    ...cookieOptions(),
  });

  const normalizedClinicId = normalizeClinicId(data.user.clinicId);

  if (normalizedClinicId) {
    cookieStore.set({
      name: 'clinic_id',
      value: normalizedClinicId,
      ...cookieOptions(),
    });
  }

  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const expiredOptions: Partial<ResponseCookie> = {
    ...cookieOptions(),
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
    name: 'clinic_name',
    value: '',
    ...expiredOptions,
  });

  cookieStore.set({
    name: 'profile_complete',
    value: '',
    ...expiredOptions,
  });

  cookieStore.set({
    name: 'first_name',
    value: '',
    ...expiredOptions,
  });

  cookieStore.set({
    name: 'last_name',
    value: '',
    ...expiredOptions,
  });

  cookieStore.set({
    name: 'user_name',
    value: '',
    ...expiredOptions,
  });

  cookieStore.set({
    name: INVALID_REFRESH_TOKEN_COOKIE,
    value: '',
    ...expiredOptions,
  });
}

export async function login(data: { email: string; password?: string; otp?: string; rememberMe?: boolean; clinicId?: string | undefined }) {
  try {
    if (!data.email) {
      throw new Error('Email is required');
    }

    if (!data.password && !data.otp) {
      throw new Error('Either password or OTP must be provided');
    }
    
    const requestBody: Record<string, unknown> = {
      email: data.email,
      clinicId: requireClinicContextId(data.clinicId, 'login'),
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
      user: normalizeAuthUserPayload(
        resultData.user,
        resultData.access_token || resultData.accessToken
      ),
    };
    
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: normalizeAuthUserPayload(result.user, result.access_token || result.accessToken),
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

    // If the login payload does not clearly indicate completion, ask the backend
    // once for the authoritative profile status before writing cookies.
    if (profileComplete !== true && normalizedResult.access_token) {
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

    if (profileComplete !== true && normalizedResult.access_token) {
      const authoritativeProfileComplete = await fetchAuthoritativeProfileComplete(
        normalizedResult.access_token,
        sessionId
      );
      if (typeof authoritativeProfileComplete === 'boolean') {
        profileComplete = authoritativeProfileComplete;
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

    const normalizedResultClinicId = normalizeClinicId(normalizedResult.user?.clinicId);

    if (normalizedResultClinicId) {
       cookieStore.set({
        name: 'clinic_id',
        value: normalizedResultClinicId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    const clinicName = normalizedResult.user?.clinicName;
    if (typeof clinicName === 'string' && clinicName.trim()) {
      cookieStore.set({
        name: 'clinic_name',
        value: clinicName.trim(),
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
        clinicId: normalizeClinicId(normalizedResult.user.clinicId)
      },
      access_token: normalizedResult.access_token,
      refresh_token: normalizedResult.refresh_token || '',
      session_id: sessionId || '',
      isAuthenticated: true,
      redirectUrl:
        normalizedResult.redirectUrl ||
        (profileComplete
          ? getDashboardByRole(normalizedResult.user.role || Role.PATIENT)
          : ROUTES.PROFILE_COMPLETION)
    };
  } catch (error) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { error: errorMessage };
  }
}

export async function requestOTP(data: OtpRequestFormData): Promise<{ success: boolean; message: string }> {
  try {
    const requestBody = {
      identifier: data.identifier,
      clinicId: requireClinicContextId(data.clinicId, 'OTP request'),
    };
    const response = await clinicApiClient.requestOTP(requestBody);
    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const result = {
      ...resultData,
      access_token: resultData.access_token || resultData.accessToken,
      refresh_token: resultData.refresh_token || resultData.refreshToken,
      session_id: resultData.session_id || resultData.sessionId,
      user: normalizeAuthUserPayload(
        resultData.user,
        resultData.access_token || resultData.accessToken
      ),
    };

    // Set clinic_id cookie for subsequent requests
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'clinic_id',
      value: requestBody.clinicId,
      ...cookieOptions(),
    });

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

export async function resendVerification(email: string, clinicId?: string | undefined): Promise<{ success: boolean; message: string }> {
  try {
    const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email,
        clinicId: resolveClinicContextId(clinicId)
    });
    return response.data as { success: boolean; message: string };
  } catch (error) {
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'Resend verification failed' };
  }
}

export async function verifyOTP(data: OtpVerifyFormData): Promise<AuthResponse | { error: string }> {
  try {
    const requestBody = {
      identifier: data.identifier,
      otp: data.otp,
      clinicId: requireClinicContextId(data.clinicId, 'OTP verification'),
      ...(data.rememberMe !== undefined ? { rememberMe: data.rememberMe } : {}),
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
      user: normalizeAuthUserPayload(
        resultData.user,
        resultData.access_token || resultData.accessToken
      ),
    };
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: {
        ...result.user,
        clinicId:
          result.user?.clinicId ||
          result.user?.primaryClinicId ||
          extractClinicIdFromTokenValue(result.access_token || result.accessToken),
      },
    };

    await setAuthCookies(normalizedResult);
    return normalizedResult as AuthResponse;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to verify OTP';
    return { error: message };
  }
}

export async function verifyPhoneNumber(data: { phone: string; otp: string }): Promise<{
  success: boolean;
  phoneVerified: boolean;
  phoneVerifiedAt: string;
}> {
  const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.VERIFY_PHONE, {
    phone: data.phone,
    otp: data.otp,
  });

  const responseData = response.data as Record<string, any>;
  const resultData = responseData.data || responseData;

  return {
    success: resultData.success ?? true,
    phoneVerified: resultData.phoneVerified ?? true,
    phoneVerifiedAt:
      resultData.phoneVerifiedAt ||
      resultData.phone_verified_at ||
      new Date().toISOString(),
  };
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
      user: normalizeAuthUserPayload(
        resultData.user,
        resultData.access_token || resultData.accessToken
      ),
    };
    await setAuthCookies(normalizedResult);
    return normalizedResult as AuthResponse;
}

export async function socialLogin(data: { provider: string; token: string; clinicId?: string | undefined }): Promise<AuthResponse> {
    const response = await clinicApiClient.socialLogin({
      provider: data.provider,
      token: data.token,
      clinicId: requireClinicContextId(data.clinicId, 'social login'),
    });
    const responseData = response.data as Record<string, any>;
    const result = responseData.data || responseData;
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: normalizeAuthUserPayload(result.user, result.access_token || result.accessToken),
    };
    
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

    const invalidMarker = getInvalidRefreshTokenMarker(cookieStore.get(INVALID_REFRESH_TOKEN_COOKIE)?.value);
    const refreshTokenFingerprint = getRefreshTokenFingerprint(refreshTokenValue);
    if (
      invalidMarker?.fingerprint === refreshTokenFingerprint &&
      invalidMarker.invalidUntil > Date.now()
    ) {
      await clearSession();
      return null;
    }

    if (invalidMarker && invalidMarker.invalidUntil <= Date.now()) {
      cookieStore.delete(INVALID_REFRESH_TOKEN_COOKIE);
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
      cookieStore.set(
        INVALID_REFRESH_TOKEN_COOKIE,
        `${getRefreshTokenFingerprint(refreshTokenValue)}:${Date.now() + INVALID_REFRESH_TOKEN_TTL_MS}`,
        {
          ...cookieOptions(),
          maxAge: Math.ceil(INVALID_REFRESH_TOKEN_TTL_MS / 1000),
        }
      );
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }


   const response = await clinicApiClient.getUserSessions();
   return response.data;
}

export async function terminateAllSessions() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }


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
    clinicName?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
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
      ...sessionTokenOptions(),
    });
  }

  if (refreshTokenValue) {
    cookieStore.set({
      name: 'refresh_token',
      value: refreshTokenValue,
      ...refreshTokenOptions(),
    });
  }

  if (sessionIdValue) {
    cookieStore.set({
      name: 'session_id',
      value: sessionIdValue,
      ...cookieOptions(),
    });
  }

  if (data.user?.role) {
    cookieStore.set({
      name: 'user_role',
      value: data.user.role,
      ...cookieOptions(),
    });
  }

  const normalizedClinicId = normalizeClinicId(
    data.user?.clinicId ||
      (data.user as { primaryClinicId?: string } | undefined)?.primaryClinicId ||
      extractClinicIdFromTokenValue(accessTokenValue)
    // NO FALLBACK - only set cookie if we have a real clinicId
  );

  if (normalizedClinicId) {
    cookieStore.set({
      name: 'clinic_id',
      value: normalizedClinicId,
      ...cookieOptions(),
    });
  }

  const clinicName = typeof data.user?.clinicName === 'string' ? data.user.clinicName.trim() : '';
  if (clinicName) {
    cookieStore.set({
      name: 'clinic_name',
      value: clinicName,
      ...cookieOptions(),
    });
  }

  const firstName = typeof data.user?.firstName === 'string' ? data.user.firstName.trim() : '';
  const lastName = typeof data.user?.lastName === 'string' ? data.user.lastName.trim() : '';
  const name = typeof data.user?.name === 'string' ? data.user.name.trim() : '';

  if (firstName) {
    cookieStore.set({
      name: 'first_name',
      value: firstName,
      ...cookieOptions(),
    });
  }

  if (lastName) {
    cookieStore.set({
      name: 'last_name',
      value: lastName,
      ...cookieOptions(),
    });
  }

  if (name) {
    cookieStore.set({
      name: 'user_name',
      value: name,
      ...cookieOptions(),
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
      ...cookieOptions(),
    });
  }
}

export async function authenticatedApi<T = unknown>(
  endpoint: string,
  options: RequestInit & {
    omitClinicId?: boolean;
    clinicId?: string;
    requireClinicId?: boolean;
  } = {}
): Promise<{ status: number; data: T }> {
  try {
    // Note: This is an internal helper used by authenticated server actions.
    // Auth checks should be done at the action level, not here.
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
        const accessToken = cookieStore.get('access_token')?.value;
        const sessionId = cookieStore.get('session_id')?.value;
        const authoritativeProfileComplete =
          accessToken
            ? await fetchAuthoritativeProfileComplete(accessToken, sessionId)
            : undefined;

        if (authoritativeProfileComplete === true) {
          cookieStore.set({
            name: 'profile_complete',
            value: 'true',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });
        }
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


export async function googleLogin(
  token: string,
  clinicId?: string | undefined
): Promise<GoogleLoginResponse> {
  try {
    const resolvedClinicId = requireClinicContextId(clinicId, 'Google login');
    logger.info('Starting Google login', { apiUrl: API_URL, clinicId: resolvedClinicId });
    
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
      clinicId: resolvedClinicId
    });

    const responseData = response.data as Record<string, any>;
    const resultData = responseData.data || responseData;
    const accessToken = resultData.access_token || resultData.accessToken;
    const refreshToken = resultData.refresh_token || resultData.refreshToken;
    const sessionId =
      resultData.session_id ||
      resultData.sessionId ||
      (typeof accessToken === 'string' ? extractSessionIdFromToken(accessToken) : undefined);
    const resolvedUserFirstName = resultData.user?.firstName || '';
    const resolvedUserLastName = resultData.user?.lastName || '';
    const resolvedUserName =
      resultData.user?.name ||
      `${resolvedUserFirstName} ${resolvedUserLastName}`.trim();
    const result = {
      ...resultData,
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: normalizeAuthUserPayload(
        {
          ...resultData.user,
          firstName: resolvedUserFirstName,
          lastName: resolvedUserLastName,
          name: resolvedUserName,
        },
        accessToken
      ),
    };

    if (!result?.access_token || !result?.user) {
      logger.error('Missing required data in Google login response', new Error('Missing required fields'));
      throw new Error('Invalid response from server: Missing required fields');
    }

    const firstName = result.user.firstName || '';
    const lastName = result.user.lastName || '';
    const name = result.user.name || `${firstName} ${lastName}`.trim();
    let profileComplete = resolveProfileComplete(result.user as Record<string, unknown>);

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
               'X-Clinic-ID': resolvedClinicId || ''
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
            profileComplete = resolveProfileComplete(profileData as Record<string, unknown>);
        }
      } catch (profileError: unknown) {
        logger.error('Error fetching user profile', profileError instanceof Error ? profileError : new Error(String(profileError)));
      }
    }

    if (!profileComplete) {
      try {
        const authoritativeProfileComplete = await fetchAuthoritativeProfileComplete(
          result.access_token,
          result.session_id
        );
        if (typeof authoritativeProfileComplete === 'boolean') {
          profileComplete = authoritativeProfileComplete;
        }
      } catch (profileStatusError: unknown) {
        logger.warn('Unable to verify Google profile completion status', {
          error: profileStatusError instanceof Error ? profileStatusError.message : String(profileStatusError),
        });
      }
    }

    result.user = {
      ...result.user,
      profileComplete,
    };

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
        clinicId: result.user.clinicId,
        clinicName: result.user.clinicName,
        profileComplete: resolveProfileComplete(result.user as Record<string, unknown>)
      },
      token: result.access_token,
      redirectUrl:
        result.redirectUrl ||
        (resolveProfileComplete(result.user as Record<string, unknown>)
          ? getDashboardByRole(result.user.role)
          : ROUTES.PROFILE_COMPLETION)
    };
    
    logger.info('Google login completed successfully', { userId: outputData.user?.id });
    return outputData;

  } catch (error: unknown) {
    logger.error('Google login error', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Google login failed');
  }
}

export async function facebookLogin(token: string, clinicId?: string | undefined): Promise<AuthResponse> {
  const resolvedClinicId = requireClinicContextId(clinicId, 'Facebook login');
  const response = await clinicApiClient.socialLogin({ 
    provider: 'facebook', 
    token,
    clinicId: resolvedClinicId
  });
  const responseData = response.data as Record<string, any>;
  const result = responseData.data || responseData;
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: normalizeAuthUserPayload(result.user, result.access_token || result.accessToken),
    };
  await setAuthCookies(normalizedResult);
  return normalizedResult as AuthResponse;
}

export async function appleLogin(token: string, clinicId?: string | undefined): Promise<{ success: boolean; user?: User; error?: string }> {
  const resolvedClinicId = requireClinicContextId(clinicId, 'Apple login');
  const response = await clinicApiClient.socialLogin({ 
    provider: 'apple', 
    token,
    clinicId: resolvedClinicId
  });
  const responseData = response.data as Record<string, any>;
  const result = responseData.data || responseData;
    const normalizedResult = {
      ...result,
      access_token: result.access_token || result.accessToken,
      refresh_token: result.refresh_token || result.refreshToken,
      session_id: result.session_id || result.sessionId,
      user: normalizeAuthUserPayload(result.user, result.access_token || result.accessToken),
    };
  await setAuthCookies(normalizedResult);
  return normalizedResult as { success: boolean; user?: User; error?: string };
}


export async function setProfileComplete(complete: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }


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

  revalidatePath('/', 'layout');
}


