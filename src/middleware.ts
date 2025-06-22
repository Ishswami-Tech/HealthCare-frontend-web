import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@/types/auth.types';
import { shouldRedirectToProfileCompletion } from '@/lib/profile';

// Define protected routes and their allowed roles
const PROTECTED_ROUTES = {
  '/dashboard': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
  '/clinic-admin/dashboard': [Role.CLINIC_ADMIN],
  '/doctor/dashboard': [Role.DOCTOR],
  '/patient/dashboard': [Role.PATIENT],
  '/receptionist/dashboard': [Role.RECEPTIONIST],
  '/super-admin/dashboard': [Role.SUPER_ADMIN],
  '/settings': [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT],
};

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/callback',  // Add callback routes for OAuth
  '/',               // Root path should be public
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware - Processing request for:', pathname);

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    console.log('Middleware - Public route, allowing access');
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
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userData = {
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        phone: payload.phone || '',
        dateOfBirth: payload.dateOfBirth || '',
        gender: payload.gender || '',
        address: payload.address || '',
      };
    } catch (error) {
      console.log('Middleware - Error parsing JWT token:', error);
    }
  }

  console.log('Middleware - Auth check:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    userRole,
    pathname,
    profileCompleteCookie: profileCompleteCookie,
    userData: userData ? Object.keys(userData) : null
  });

  // If no access token but has refresh token, let the app handle the refresh
  if (!accessToken && refreshToken) {
    console.log('Middleware - No access token but has refresh token, allowing request');
    return NextResponse.next();
  }

  // If no tokens at all, redirect to login
  if (!accessToken && !refreshToken) {
    console.log('Middleware - No auth tokens, redirecting to login');
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If we have access token but no role, allow the request and let the app handle it
  if (accessToken && !userRole) {
    console.log('Middleware - Has access token but no role, allowing request');
    return NextResponse.next();
  }

  // Check if this is an auth-only route (requires auth but not profile completion)
  if (AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    console.log('Middleware - Auth-only route, allowing access');
    return NextResponse.next();
  }

  // Check if profile is complete for authenticated users using centralized logic
  const profileCompleteFromCookie = profileCompleteCookie === 'true';
  const profileCompleteFromUserData = userData ? calculateProfileCompletionFromUserData(userData) : false;
  
  // Prioritize the cookie value since it's set after a successful profile update
  const profileComplete = profileCompleteFromCookie || profileCompleteFromUserData;
  
  const shouldRedirect = shouldRedirectToProfileCompletion(!!accessToken, profileComplete, pathname);
  console.log('Middleware - Profile completion check:', {
    isAuthenticated: !!accessToken,
    profileComplete,
    profileCompleteFromCookie,
    profileCompleteFromUserData,
    currentPath: pathname,
    shouldRedirect,
    functionResult: shouldRedirectToProfileCompletion(!!accessToken, profileComplete, pathname)
  });

  if (shouldRedirect) {
    console.log('Middleware - Profile not complete, redirecting to profile completion');
    console.log('Middleware - Profile completion details:', {
      isAuthenticated: !!accessToken,
      profileComplete,
      currentPath: pathname,
      shouldRedirect: shouldRedirectToProfileCompletion(!!accessToken, profileComplete, pathname)
    });
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
    console.log('Middleware - Checking role access:', {
      userRole,
      allowedRoles,
      hasAccess: allowedRoles.includes(userRole)
    });

    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      console.log('Middleware - Invalid role, redirecting to appropriate dashboard');
      const dashboardUrl = new URL(`/${userRole.toLowerCase()}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Allow the request
  console.log('Middleware - Access granted');
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