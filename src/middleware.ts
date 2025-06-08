import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@/types/auth.types';
import {
  isAuthPath,
  isProtectedPath,
  getAllowedRolesForPath,
  getDashboardByRole,
} from '@/config/routes';

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

  const token = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value as Role;

  // Handle authentication paths
  if (isAuthPath(pathname)) {
    if (token && userRole) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // Handle protected paths
  if (isProtectedPath(pathname) || getAllowedRolesForPath(pathname)) {
    if (!token) {
      const response = NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
      return response;
    }

    // Check role-based access
    const allowedRoles = getAllowedRolesForPath(pathname);
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's role
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }
  }

  // Continue to the next middleware or to the page
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api (API routes)
     * 3. /static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. all root files inside public (e.g. /favicon.ico)
     */
    '/((?!_next|api|static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}; 