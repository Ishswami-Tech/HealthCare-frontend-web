import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@/types/auth.types';
import { shouldRedirectToProfileCompletion } from '@/lib/profile';
import { defaultLocale } from '@/i18n/config';
// import createIntlMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale } from '@/i18n/config';

// Define protected routes and their allowed roles
const PROTECTED_ROUTES = {
  '/dashboard': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
  '/(dashboard)/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/(dashboard)/doctor/dashboard': [Role.DOCTOR],
  '/(dashboard)/patient/dashboard': [Role.PATIENT],
  '/(dashboard)/receptionist/dashboard': [Role.RECEPTIONIST],
  '/(dashboard)/pharmacist/dashboard': [Role.PHARMACIST],
  '/(dashboard)/super-admin/dashboard': [Role.SUPER_ADMIN],
  '/(shared)/appointments': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
  '/(shared)/queue': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST],
  '/(shared)/ehr': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  '/(shared)/pharmacy': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PHARMACIST, Role.DOCTOR],
  '/(shared)/analytics': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
  // Legacy routes for backward compatibility
  '/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/doctor/dashboard': [Role.DOCTOR],
  '/patient/dashboard': [Role.PATIENT],
  '/receptionist/dashboard': [Role.RECEPTIONIST],
  '/pharmacist/dashboard': [Role.PHARMACIST],
  '/super-admin/dashboard': [Role.SUPER_ADMIN],
  '/settings': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST, Role.PATIENT],
};

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  // Auth routes (using clean /auth/ paths)
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/callback',
  // Public content
  '/(public)',
  '/',               // Root path should be public
  // Ayurveda website (public pages)
  '/ayurveda',
];

// Define routes that require authentication but don't need profile completion
const AUTH_ONLY_ROUTES = [
  '/profile-completion', // Allow access to profile completion for authenticated users
];

// Helper function to convert string role to enum
function parseRole(roleStr: string | undefined): Role | undefined {
  if (!roleStr) return undefined;
  
  // Check if the role string matches any enum value
  const validRole = Object.values(Role).includes(roleStr as Role);
  return validRole ? roleStr as Role : undefined;
}

// Helper function to calculate profile completion from user data
function calculateProfileCompletionFromUserData(userData: Record<string, unknown>): boolean {
  if (!userData) return false;

  // Essential required fields for all users
  const requiredFields = [
    'firstName',
    'lastName', 
    'phone',
    'dateOfBirth',
    'gender',
    'address'
  ];

  // Check if all required fields are present and not empty
  const missingFields = requiredFields.filter(field => {
    const value = userData[field];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  // Profile is complete if no required fields are missing
  return missingFields.length === 0;
}

// Create the intl middleware
// Internationalization middleware configuration
// const intlMiddleware = createIntlMiddleware({
//   locales,
//   defaultLocale,
//   localeDetection: false, // We'll handle locale detection manually via cookies
// });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Handle i18n for non-auth routes
  // Skip i18n middleware for auth routes to avoid conflicts
  if (!pathname.startsWith('/(auth)') && !pathname.startsWith('/auth')) {
    // Get locale from cookie
    const locale = request.cookies.get('locale')?.value || defaultLocale;

    // Set locale in request headers for next-intl
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);

    // Create new request with locale header
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Ensure locale cookie is set
    if (!request.cookies.get('locale')?.value) {
      response.cookies.set('locale', defaultLocale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
      });
    }
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRoleStr = request.cookies.get('user_role')?.value;
  const userRole = parseRole(userRoleStr);
  const profileCompleteCookie = request.cookies.get('profile_complete')?.value;

  // Try to extract user data from JWT token to calculate profile completion
  let userData: Record<string, unknown> | null = null;

  if (accessToken) {
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length >= 2 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1]));
        userData = {
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          phone: payload.phone || '',
          dateOfBirth: payload.dateOfBirth || '',
          gender: payload.gender || '',
          address: payload.address || '',
        };
      }
    } catch {
      // Error parsing JWT token - continue without user data
    }
  }



  // If no access token but has refresh token, let the app handle the refresh
  if (!accessToken && refreshToken) {
    return NextResponse.next();
  }

  // If no tokens at all, redirect to login
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If we have access token but no role, allow the request and let the app handle it
  if (accessToken && !userRole) {
    return NextResponse.next();
  }

  // Check if this is an auth-only route (requires auth but not profile completion)
  if (AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if profile is complete for authenticated users using centralized logic
  const profileCompleteFromCookie = profileCompleteCookie === 'true';
  const profileCompleteFromUserData = userData ? calculateProfileCompletionFromUserData(userData) : false;
  
  // Prioritize the cookie value since it's set after a successful profile update
  const profileComplete = profileCompleteFromCookie || profileCompleteFromUserData;
  
  const shouldRedirect = shouldRedirectToProfileCompletion(!!accessToken, profileComplete, pathname);

  if (shouldRedirect) {
    const profileCompletionUrl = new URL('/profile-completion', request.url);
    profileCompletionUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(profileCompletionUrl);
  }

  // Check role-based access for protected routes
  const matchedRoute = Object.entries(PROTECTED_ROUTES).find(([routePath]) => 
    pathname === routePath || pathname.startsWith(routePath + '/')
  );

  if (matchedRoute && userRole) {
    const [, allowedRoles] = matchedRoute;

    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      const dashboardUrl = new URL(`/${userRole.toLowerCase()}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Allow the request
  return NextResponse.next();
}

// Configure matcher for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};