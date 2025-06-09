import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDashboardByRole, isAuthPath, getAllowedRolesForPath, AUTH_PATHS } from '@/config/routes';
import { Role } from '@/types/auth.types';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/', // Root path
  ...AUTH_PATHS, // All auth paths
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow access to public paths without authentication
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    // If user is authenticated and trying to access auth pages, redirect to their dashboard
    if (pathname !== '/' && isAuthPath(pathname)) {
      const token = request.cookies.get('access_token')?.value;
      const sessionId = request.cookies.get('session_id')?.value;
      const userRole = request.cookies.get('user_role')?.value as Role | undefined;

      if (token && sessionId && userRole) {
        return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
      }
    }
    return NextResponse.next();
  }

  // Get auth tokens from cookies
  const token = request.cookies.get('access_token')?.value;
  const sessionId = request.cookies.get('session_id')?.value;
  const userRole = request.cookies.get('user_role')?.value as Role | undefined;

  // Check if user is authenticated for protected routes
  if (!token || !sessionId || !userRole) {
    const searchParams = new URLSearchParams({
      callbackUrl: pathname,
    });
    return NextResponse.redirect(
      new URL(`/auth/login?${searchParams}`, request.url)
    );
  }

  // Check role-based access
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to user's dashboard if they don't have access
    return NextResponse.redirect(
      new URL(getDashboardByRole(userRole), request.url)
    );
  }

  // Clone the response and add session headers
  const response = NextResponse.next();
  response.headers.set('X-Session-ID', sessionId);
  response.headers.set('X-User-Role', userRole);

  return response;
}

// Configure middleware matching pattern
export const config = {
  // Match all paths except static files and api routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}; 