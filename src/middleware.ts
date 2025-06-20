import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@/types/auth.types';

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

// Helper function to convert string role to enum
function parseRole(roleStr: string | undefined): Role | undefined {
  if (!roleStr) return undefined;
  
  // Check if the role string matches any enum value
  const validRole = Object.values(Role).includes(roleStr as Role);
  return validRole ? roleStr as Role : undefined;
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
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log('Middleware - Public route, allowing access');
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRoleStr = request.cookies.get('user_role')?.value;
  const userRole = parseRole(userRoleStr);

  console.log('Middleware - Auth check:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    userRole,
    pathname
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

  // Check role-based access for protected routes
  const matchedRoute = Object.entries(PROTECTED_ROUTES).find(([routePath]) => 
    pathname.startsWith(routePath)
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