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
  shouldSkipProxy as shouldSkipProxyRoute,
  getProtectedRouteRoles,
  isProtectedRoute,
  getAllowedRolesForPath,
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

/**
 * Calculate profile completion from user data
 * @param userData - User data from JWT payload
 * @returns boolean indicating if profile is complete
 */
function calculateProfileCompletionFromUserData(userData: Record<string, unknown>): boolean {
  if (!userData) return false;

  const requiredFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address'];
  
  const missingFields = requiredFields.filter(field => {
    const value = userData[field];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  return missingFields.length === 0;
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
  // STEP 0: Rate Limiting for Auth Routes
  // =========================================================================
  // Note: Rate limiting is handled client-side in security.ts
  // Server-side rate limiting would require external state (Redis, etc.)
  // This is a placeholder for future implementation
  if (pathname.startsWith('/auth/')) {
    // Rate limiting can be implemented with Redis or other shared state
    // For now, basic protection is handled by security.ts on the client
  }

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
  if (isPublicRoute(pathname)) {
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
  const userRoleStr = request.cookies.get('user_role')?.value;
  const userRole = parseRole(userRoleStr);
  const profileCompleteCookie = request.cookies.get('profile_complete')?.value;

  // Extract user data from JWT token
  const userData = accessToken ? extractUserDataFromToken(accessToken) : null;

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
    return response;
  }

  // =========================================================================
  // STEP 6: Check auth-only routes (requires auth but not profile completion)
  // =========================================================================
  if (isAuthOnlyRoute(pathname)) {
    return response;
  }

  // =========================================================================
  // STEP 7: Check profile completion for authenticated users
  // =========================================================================
  const profileCompleteFromCookie = profileCompleteCookie === 'true';
  const profileCompleteFromUserData = userData ? calculateProfileCompletionFromUserData(userData) : false;
  const profileComplete = profileCompleteFromCookie || profileCompleteFromUserData;
  
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

  if (allowedRoles && userRole) {
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
  
  // Additional check: If user has role but trying to access route not in their role's allowed paths
  // This catches edge cases where route might not be in PROTECTED_ROUTES but should be role-restricted
  // Check role-specific paths (route groups don't appear in URLs, so check actual URL paths)
  if (userRole && (pathname.startsWith('/super-admin') || pathname.startsWith('/clinic-admin') || 
      pathname.startsWith('/doctor') || pathname.startsWith('/receptionist') || 
      pathname.startsWith('/pharmacist') || pathname.startsWith('/patient'))) {
    const rolePathMap = getAllowedRolesForPath(pathname);
    if (rolePathMap && !rolePathMap.includes(userRole)) {
      const dashboardPath = getDashboardByRole(userRole);
      if (dashboardPath !== ROUTES.LOGIN) {
        const dashboardUrl = new URL(dashboardPath, request.url);
        dashboardUrl.searchParams.set('unauthorized', 'true');
        dashboardUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }
  
  // Additional check: Shared routes access control
  // Ensure users can only access shared routes they have permission for
  if (userRole && (
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/queue') ||
    pathname.startsWith('/ehr') ||
    pathname.startsWith('/pharmacy') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/video-appointments')
  )) {
    const sharedRouteRoles = getProtectedRouteRoles(pathname);
    if (sharedRouteRoles && !sharedRouteRoles.includes(userRole)) {
      const dashboardPath = getDashboardByRole(userRole);
      if (dashboardPath !== ROUTES.LOGIN) {
        const dashboardUrl = new URL(dashboardPath, request.url);
        dashboardUrl.searchParams.set('unauthorized', 'true');
        dashboardUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // =========================================================================
  // STEP 9: Allow the request
  // =========================================================================
  // =========================================================================
  // STEP 9: Add Security Headers (CSP, HSTS, etc.)
  // =========================================================================
  
  // ✅ Dynamically build allowed hosts from environment variables
  const apiHost = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '') || '';
  const wsHost = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.replace(/^https?:\/\//, '') || apiHost;
  const appHost = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || '';
  
  // Build connect-src dynamically from environment
  const connectSources = [
    "'self'",
    appHost ? `https://${appHost}` : '',
    appHost ? `wss://${appHost}` : '',
    apiHost ? `https://${apiHost}` : '',
    wsHost ? `wss://${wsHost}` : '',
    'https://*.googleapis.com',
    'ws://localhost:*',
    'http://localhost:*',
  ].filter(Boolean).join(' ');
  
  // Strict Content Security Policy
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.facebook.com https://connect.facebook.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://lh3.googleusercontent.com https://graph.facebook.com https://platform-lookaside.fbsbx.com https://storage.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src ${connectSources};
    frame-src 'self' https://accounts.google.com https://www.facebook.com;
    media-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
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
