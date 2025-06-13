import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { getDashboardByRole } from '@/config/routes';
import { Role } from '@/types/auth.types';

// Define protected and public routes
const protectedRoutes = [
  '/super-admin',
  '/admin',
  '/doctor',
  '/patient',
  '/receptionist',
  '/settings',
  '/profile',
];

const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-otp',
  '/auth/request-otp',
  '/auth/magic-link',
  '/auth/social',
];

// Map routes to required roles
const routeRoleMap: Record<string, Role[]> = {
  '/super-admin': [Role.SUPER_ADMIN],
  '/admin': [Role.CLINIC_ADMIN],
  '/doctor': [Role.DOCTOR],
  '/patient': [Role.PATIENT],
  '/receptionist': [Role.RECEPTIONIST],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session from cookies
  const session = await getSession();

  // If no session, redirect to login
  if (!session) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check role-based access
  const userRole = session.user.role;
  const dashboardPath = getDashboardByRole(userRole);

  // Find the matching route and its required roles
  const matchingRoute = Object.keys(routeRoleMap).find(route => pathname.startsWith(route));
  if (matchingRoute) {
    const allowedRoles = routeRoleMap[matchingRoute];
    if (!allowedRoles.includes(userRole)) {
      // If user doesn't have the required role, redirect to their dashboard
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // If user is on a protected route but not their dashboard, redirect to their dashboard
  if (pathname !== dashboardPath && pathname.startsWith('/' + userRole.toLowerCase())) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 