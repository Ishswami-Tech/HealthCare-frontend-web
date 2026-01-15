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
import { getDashboardByRole } from '@/lib/config/routes';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * Protected routes and their allowed roles
 * Role-based access control (RBAC) configuration
 */
const PROTECTED_ROUTES: Record<string, Role[]> = {
  // Dashboard routes (role-specific)
  '/dashboard': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
  '/(dashboard)/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/(dashboard)/doctor/dashboard': [Role.DOCTOR],
  '/(dashboard)/patient/dashboard': [Role.PATIENT],
  '/(dashboard)/receptionist/dashboard': [Role.RECEPTIONIST],
  '/(dashboard)/pharmacist/dashboard': [Role.PHARMACIST],
  '/(dashboard)/super-admin/dashboard': [Role.SUPER_ADMIN],
  
  // Legacy dashboard routes (for backward compatibility)
  '/super-admin': [Role.SUPER_ADMIN],
  '/clinic-admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/receptionist': [Role.RECEPTIONIST],
  '/pharmacist': [Role.PHARMACIST],
  '/patient': [Role.PATIENT],
  
  // Shared routes (multiple roles)
  '/(shared)/appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
  '/(shared)/queue': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST],
  '/(shared)/ehr': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/(shared)/pharmacy': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PHARMACIST, Role.DOCTOR],
  '/(shared)/analytics': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/(shared)/billing': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  '/(shared)/video-appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.PATIENT],
  
  // Legacy dashboard routes (for backward compatibility - without route groups)
  '/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/doctor/dashboard': [Role.DOCTOR],
  '/patient/dashboard': [Role.PATIENT],
  '/receptionist/dashboard': [Role.RECEPTIONIST],
  '/pharmacist/dashboard': [Role.PHARMACIST],
  '/super-admin/dashboard': [Role.SUPER_ADMIN],
  
  // Settings (all authenticated users)
  '/settings': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
};

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  // Auth routes
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/verify',
  '/auth/callback',
  
  // Public API routes
  '/api/public',
  
  // Public content routes
  '/',
  '/treatments',
  '/about',
  '/contact',
  '/team',
  '/gallery',
  '/treatments/panchakarma',
  '/treatments/agnikarma',
  '/treatments/viddha-karma',
  
  // Public folder pattern
  '/(public)',
];

/**
 * Routes that require authentication but don't need profile completion
 */
const AUTH_ONLY_ROUTES = [
  '/profile-completion',
];

/**
 * Static file patterns to skip proxy processing
 */
const STATIC_FILE_PATTERNS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/public',
];

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
 * Check if path matches any pattern in the list
 * @param pathname - Request pathname
 * @param patterns - List of patterns to match
 * @returns boolean indicating if path matches
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => 
    pathname === pattern || 
    pathname.startsWith(pattern + '/') ||
    pathname.startsWith(pattern)
  );
}

/**
 * Check if path is a static file or API route
 * @param pathname - Request pathname
 * @returns boolean indicating if should skip proxy
 */
function shouldSkipProxy(pathname: string): boolean {
  return (
    STATIC_FILE_PATTERNS.some(pattern => pathname.startsWith(pattern)) ||
    pathname.includes('.') // Static files with extensions
  );
}

/**
 * Check if route is public
 * @param pathname - Request pathname
 * @returns boolean indicating if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    
    // Handle public folder pattern
    if (route === '/(public)') {
      return (
        pathname === '/' ||
        pathname.startsWith('/treatments') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/contact') ||
        pathname.startsWith('/team') ||
        pathname.startsWith('/gallery')
      );
    }
    
    return false;
  });
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
  // STEP 1: Skip proxy for static files and API routes
  // =========================================================================
  if (shouldSkipProxy(pathname)) {
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
    const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route => 
      pathname.startsWith(route) || pathname === route
    );
    
    if (isProtectedRoute) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return response;
  }

  // If we have access token but no role, allow the request and let the app handle it
  if (hasValidToken && !userRole) {
    return response;
  }

  // =========================================================================
  // STEP 6: Check auth-only routes (requires auth but not profile completion)
  // =========================================================================
  if (matchesPath(pathname, AUTH_ONLY_ROUTES)) {
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
    const profileCompletionUrl = new URL('/profile-completion', request.url);
    profileCompletionUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(profileCompletionUrl);
  }

  // =========================================================================
  // STEP 8: Role-based access control (RBAC)
  // =========================================================================
  const matchedRoute = Object.entries(PROTECTED_ROUTES).find(([routePath]) => 
    pathname === routePath || pathname.startsWith(routePath + '/')
  );

  if (matchedRoute && userRole) {
    const [, allowedRoles] = matchedRoute;

    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      // Uses centralized route configuration
      const dashboardPath = getDashboardByRole(userRole);
      const dashboardUrl = new URL(dashboardPath, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // =========================================================================
  // STEP 9: Allow the request
  // =========================================================================
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
