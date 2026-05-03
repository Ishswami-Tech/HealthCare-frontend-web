/**
 * ✅ Next.js 16 Proxy
 * Consolidated authentication, authorization, and i18n handling
 * Uses consolidated i18n from @/lib/i18n
 * Follows DRY, SOLID, KISS principles
 * 
 * This is the SINGLE SOURCE OF TRUTH for proxy logic.
 * 
 * @see https://nextjs.org/docs/app/getting-started/proxy
 * @see https://nextjs.org/blog/next-16#proxyts-formerly-middlewarets
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@/types/auth.types';
import { shouldRedirectToProfileCompletion } from '@/lib/config/profile';
import {
  getDashboardByRole,
  ROUTES,
  isPublicRoute,
  isAuthOnlyRoute,
  isAuthPath, // Imported for middleware parity
  shouldSkipProxy as shouldSkipProxyRoute,
  getProtectedRouteRoles,
  isProtectedRoute,
} from '@/lib/config/routes';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse role string to Role enum
 * @param roleStr - Role string from cookie
 * @returns Role enum or undefined
 */
function parseRole(roleStr: string | undefined): Role | undefined {
  if (!roleStr) return undefined;
  const validRole = Object.values(Role).includes(roleStr as Role);
  return validRole ? roleStr as Role : undefined;
}

function resolveProfileCompletionFromUserData(userData: Record<string, unknown> | null): boolean | undefined {
  if (!userData) return undefined;
  if (typeof userData.profileComplete === 'boolean') return userData.profileComplete;
  if (typeof userData.isProfileComplete === 'boolean') return userData.isProfileComplete;
  if (typeof userData.requiresProfileCompletion === 'boolean') {
    return !userData.requiresProfileCompletion;
  }
  return undefined;
}

function normalizeOrigin(input: string | undefined): string {
  if (!input || !input.trim()) {
    return '';
  }

  const trimmed = input.trim();
  const isLocalhostLike = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(trimmed);

  try {
    const normalized = /^[a-z]+:\/\//i.test(trimmed)
      ? trimmed
      : isLocalhostLike
        ? `http://${trimmed}`
        : `https://${trimmed}`;
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function buildConnectSrcSources(rawUrl: string | undefined): string[] {
  const origin = normalizeOrigin(rawUrl);
  if (!origin) {
    return [];
  }

  try {
    const parsed = new URL(origin);
    const base = `${parsed.protocol}//${parsed.host}`;
    const websocketScheme = parsed.protocol === 'https:' ? 'wss' : 'ws';
    return [base, `${websocketScheme}://${parsed.host}`];
  } catch {
    return [origin];
  }
}

function buildOpenViduConnectSrcSources(rawUrl: string | undefined): string[] {
  const sources = new Set(buildConnectSrcSources(rawUrl));
  const origin = normalizeOrigin(rawUrl);

  if (!origin) {
    return [...sources];
  }

  try {
    const parsed = new URL(origin);
    const openViduPort = parsed.port || '4443';
    const websocketScheme = parsed.protocol === 'https:' ? 'wss' : 'ws';

    sources.add(`${parsed.protocol}//${parsed.host}`);
    sources.add(`${websocketScheme}://${parsed.hostname}:${openViduPort}`);

    if (!parsed.port) {
      sources.add(`https://${parsed.hostname}:${openViduPort}`);
    }
  } catch {
    // Fall back to the normalized origin only.
  }

  return [...sources];
}


/**
 * Extract user data from JWT token
 * @param accessToken - JWT access token
 * @returns User data object or null
 */
function extractUserDataFromToken(accessToken: string): Record<string, unknown> | null {
  try {
    const tokenParts = accessToken.split('.');
    if (tokenParts.length >= 2 && tokenParts[1]) {
      const payload = JSON.parse(atob(tokenParts[1]));
      return {
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        phone: payload.phone || '',
        dateOfBirth: payload.dateOfBirth || '',
        gender: payload.gender || '',
        address: payload.address || '',
        profileComplete: payload.profileComplete,
        isProfileComplete: payload.isProfileComplete,
        requiresProfileCompletion: payload.requiresProfileCompletion,
        role: payload.role || undefined, // Extract role from token
      };
    }
  } catch {
    // Error parsing JWT token
  }
  return null;
}


// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

/**
 * Unified proxy function
 * Handles authentication, authorization, profile completion, and i18n
 * 
 * @param request - Next.js request object
 * @returns NextResponse
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =========================================================================
  // STEP 1: Skip proxy for static files and API routes
  // =========================================================================
  if (shouldSkipProxyRoute(pathname)) {
    return NextResponse.next();
  }

  // =========================================================================
  // STEP 2: Handle i18n for non-auth routes
  // =========================================================================
  let response = NextResponse.next();
  
  if (!pathname.startsWith('/(auth)') && !pathname.startsWith('/auth')) {
    const locale = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value || DEFAULT_LANGUAGE;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);

    response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Ensure locale cookie is set
    if (!request.cookies.get(LANGUAGE_COOKIE_NAME)?.value) {
      response.cookies.set(LANGUAGE_COOKIE_NAME, DEFAULT_LANGUAGE, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
      });
    }
  }

  // =========================================================================
  // STEP 3: Allow public routes without authentication
  // =========================================================================
  const isPublic = isPublicRoute(pathname);
  if (isPublic) {
    return response;
  }

  // =========================================================================
  // STEP 4: Get authentication tokens and user data
  // =========================================================================
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  // Also check for legacy token cookie names
  const legacyToken = request.cookies.get('token')?.value || 
                      request.cookies.get('next-auth.session-token')?.value;
  
  const hasValidToken = accessToken || legacyToken;
  
  // Extract user data from JWT token (including role)
  const userData = accessToken ? extractUserDataFromToken(accessToken) : null;
  
  // Get role from cookie or fallback to token
  const cookieRoleStr = request.cookies.get('user_role')?.value;
  const tokenRoleStr = userData?.role as string | undefined;
  
  // Prioritize cookie, fallback to token (middleware parity)
  const userRoleStr = cookieRoleStr || tokenRoleStr;
  const userRole = parseRole(userRoleStr);
  
  const profileCompleteCookie = request.cookies.get('profile_complete')?.value;

  // =========================================================================
  // STEP 5: Handle authentication
  // =========================================================================
  
  // If no access token but has refresh token, let the app handle the refresh
  if (!hasValidToken && refreshToken) {
    return response;
  }

  // If no tokens at all, redirect to login for protected routes
  if (!hasValidToken && !refreshToken) {
    if (isProtectedRoute(pathname)) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return response;
  }

  // If we have access token but no role, check if trying to access protected route
  if (hasValidToken && !userRole) {
    // If accessing protected route without valid role, redirect to login
    if (isProtectedRoute(pathname)) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set('error', 'invalid_role');
      return NextResponse.redirect(loginUrl);
    }
    // Otherwise, allow the request and let the app handle it
    // Otherwise, allow the request and let the app handle it
    return response;
  }

  // =========================================================================
  // STEP 6: Handle Auth Routes (Redirect if already authenticated)
  // =========================================================================
  // Parity with middleware.ts: Don't let logged-in users see login page
  const isAuth = isAuthPath(pathname);
  if (isAuth) {
    if (hasValidToken && userRole) {
      const dashboardUrl = getDashboardByRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    // Allow access to auth pages if not authenticated
    return response;
  }

  // =========================================================================
  // STEP 7: Check auth-only routes (requires auth but not profile completion)
  // =========================================================================
  if (isAuthOnlyRoute(pathname)) {
    return response;
  }

  // =========================================================================
  // STEP 7: Check profile completion for authenticated users
  // =========================================================================
  const profileCompleteFromCookie = profileCompleteCookie === 'true';
  const profileCompleteFromUserData = resolveProfileCompletionFromUserData(userData);
  // Treat either signal as completion=true to avoid redirect loops after profile update
  // when JWT claims are stale but the server-updated cookie is already true.
  // Cookie is httpOnly and only set server-side in this app.
  const profileComplete =
    profileCompleteFromCookie || profileCompleteFromUserData === true;
  
  const shouldRedirectToProfile = shouldRedirectToProfileCompletion(!!hasValidToken, profileComplete, pathname);

  if (shouldRedirectToProfile) {
    const profileCompletionUrl = new URL(ROUTES.PROFILE_COMPLETION, request.url);
    profileCompletionUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(profileCompletionUrl);
  }

  // =========================================================================
  // STEP 8: Role-based access control (RBAC)
  // =========================================================================
  const allowedRoles = getProtectedRouteRoles(pathname);

  if (allowedRoles && allowedRoles.length > 0 && userRole) {
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      // Uses centralized route configuration
      const dashboardPath = getDashboardByRole(userRole);
      
      // If getDashboardByRole returns login (invalid role), redirect to login with error
      if (dashboardPath === ROUTES.LOGIN) {
        const loginUrl = new URL(ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('error', 'invalid_role');
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      const dashboardUrl = new URL(dashboardPath, request.url);
      // Preserve original path in query params for potential redirect after role fix
      dashboardUrl.searchParams.set('unauthorized', 'true');
      dashboardUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(dashboardUrl);
    }
  }
  

  // =========================================================================
  // STEP 9: Add Security Headers (CSP, HSTS, etc.)
  // =========================================================================
  
  // ✅ Dynamically build allowed hosts from environment variables
  const apiHost = normalizeOrigin(process.env.NEXT_PUBLIC_API_URL);
  const wsHost =
    normalizeOrigin(process.env.NEXT_PUBLIC_WEBSOCKET_URL) ||
    apiHost;
  const appHost = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const openViduHost =
    normalizeOrigin(process.env.NEXT_PUBLIC_OPENVIDU_SERVER_URL) ||
    normalizeOrigin(process.env.OPENVIDU_URL);
  
  // Build connect-src dynamically from environment
  const connectSources = [
    "'self'",
    ...buildConnectSrcSources(appHost || undefined),
    ...buildConnectSrcSources(apiHost || undefined),
    ...buildConnectSrcSources(wsHost || undefined),
    ...buildOpenViduConnectSrcSources(openViduHost || undefined),
    'https://*.cashfree.com',
    'https://api.cashfree.com',
    'https://sandbox.cashfree.com',
    'https://payments.cashfree.com',
    'https://payments-test.cashfree.com',
    'https://sdk.cashfree.com',
    'https://*.googleapis.com',
    'ws://localhost:*',
    'http://localhost:*',
  ].filter(Boolean).join(' ');
  
  // Strict Content Security Policy
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.facebook.com https://connect.facebook.net https://sdk.cashfree.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://lh3.googleusercontent.com https://graph.facebook.com https://platform-lookaside.fbsbx.com https://storage.googleapis.com https://ui-avatars.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src ${connectSources};
    frame-src 'self' https://accounts.google.com https://www.facebook.com https://*.cashfree.com https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com;
    media-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://*.cashfree.com https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

// ============================================================================
// PROXY CONFIGURATION
// ============================================================================

/**
 * Matcher configuration for Next.js proxy
 * Matches all routes except static files and images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

