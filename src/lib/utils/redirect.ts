/**
 * ✅ Comprehensive Redirection Utility
 * Single source of truth for all redirection logic
 * Handles all scenarios from A to Z with proper role-based routing
 * 
 * This utility ensures consistent redirection behavior across:
 * - Login/Logout flows
 * - Profile completion flows
 * - Unauthorized access
 * - Session expiry
 * - Role-based access control
 * - Edge cases (unknown roles, invalid tokens, etc.)
 */

import { Role } from '@/types/auth.types';
import { getDashboardByRole, ROUTES, isAuthPath } from '@/lib/config/routes';
import { getProfileCompletionRedirectUrl } from '@/lib/config/profile';

/**
 * Redirection context - all information needed for proper redirection
 */
export interface RedirectContext {
  user?: {
    role?: Role | string;
    profileComplete?: boolean;
  } | null;
  currentPath?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  error?: string;
  isAuthenticated?: boolean;
}

/**
 * Redirection result
 */
export interface RedirectResult {
  path: string;
  reason: string;
  preserveQuery?: boolean;
}

/**
 * Get redirect path after login
 * Handles: profile completion, callback URLs, role-based dashboards
 */
export function getLoginRedirect(context: RedirectContext): RedirectResult {
  const { user, redirectUrl, callbackUrl, currentPath } = context;

  // If no user, redirect to login
  if (!user || !user.role) {
    return {
      path: ROUTES.LOGIN,
      reason: 'no_user',
    };
  }

  const userRole = user.role as Role;

  // Priority 1: Check if profile is incomplete
  if (user.profileComplete === false) {
    const profileUrl = new URL(ROUTES.PROFILE_COMPLETION, window.location.origin);
    if (currentPath && !isAuthPath(currentPath)) {
      profileUrl.searchParams.set('redirect', currentPath);
    }
    return {
      path: profileUrl.pathname + profileUrl.search,
      reason: 'profile_incomplete',
    };
  }

  // Priority 2: Use callback URL if provided and valid
  if (callbackUrl && !isAuthPath(callbackUrl)) {
    return {
      path: callbackUrl,
      reason: 'callback_url',
    };
  }

  // Priority 3: Use redirect URL from response if provided and valid
  if (redirectUrl && !isAuthPath(redirectUrl)) {
    return {
      path: redirectUrl,
      reason: 'response_redirect_url',
    };
  }

  // Priority 4: Use role-based dashboard
  const dashboardPath = getDashboardByRole(userRole);
  if (dashboardPath && dashboardPath !== ROUTES.LOGIN) {
    return {
      path: dashboardPath,
      reason: 'role_based_dashboard',
    };
  }

  // Fallback: Home page
  return {
    path: ROUTES.HOME,
    reason: 'fallback_home',
  };
}

/**
 * Get redirect path after logout
 * Always redirects to login with optional message
 */
export function getLogoutRedirect(message?: string): RedirectResult {
  const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
  if (message) {
    loginUrl.searchParams.set('message', message);
  }
  return {
    path: loginUrl.pathname + loginUrl.search,
    reason: 'logout',
  };
}

/**
 * Get redirect path for unauthorized access
 * Redirects to role-appropriate dashboard
 */
export function getUnauthorizedRedirect(context: RedirectContext): RedirectResult {
  const { user, currentPath } = context;

  // If no user, redirect to login
  if (!user || !user.role) {
    const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
    if (currentPath) {
      loginUrl.searchParams.set('callbackUrl', currentPath);
    }
    return {
      path: loginUrl.pathname + loginUrl.search,
      reason: 'unauthorized_no_user',
    };
  }

  const userRole = user.role as Role;
  const dashboardPath = getDashboardByRole(userRole);

  // If invalid role, redirect to login with error
  if (dashboardPath === ROUTES.LOGIN) {
    const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
    loginUrl.searchParams.set('error', 'invalid_role');
    return {
      path: loginUrl.pathname + loginUrl.search,
      reason: 'invalid_role',
    };
  }

  return {
    path: dashboardPath,
    reason: 'unauthorized_redirect_to_dashboard',
  };
}

/**
 * Get redirect path after profile completion
 * Preserves original destination if provided
 */
export function getProfileCompletionRedirect(
  userRole: Role,
  originalPath?: string
): RedirectResult {
  const redirectPath = getProfileCompletionRedirectUrl(userRole, originalPath);
  
  return {
    path: redirectPath,
    reason: originalPath ? 'profile_complete_original_path' : 'profile_complete_dashboard',
  };
}

/**
 * Get redirect path for session expiry
 * Redirects to login with session expired message
 */
export function getSessionExpiredRedirect(currentPath?: string): RedirectResult {
  const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
  loginUrl.searchParams.set('error', 'session_expired');
  if (currentPath && !isAuthPath(currentPath)) {
    loginUrl.searchParams.set('callbackUrl', currentPath);
  }
  return {
    path: loginUrl.pathname + loginUrl.search,
    reason: 'session_expired',
  };
}

/**
 * Get redirect path for invalid token
 * Redirects to login with error
 */
export function getInvalidTokenRedirect(currentPath?: string): RedirectResult {
  const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
  loginUrl.searchParams.set('error', 'invalid_token');
  if (currentPath && !isAuthPath(currentPath)) {
    loginUrl.searchParams.set('callbackUrl', currentPath);
  }
  return {
    path: loginUrl.pathname + loginUrl.search,
    reason: 'invalid_token',
  };
}

/**
 * Get redirect path for registration
 * Redirects to login with success message
 */
export function getRegistrationRedirect(): RedirectResult {
  const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
  loginUrl.searchParams.set('registered', 'true');
  return {
    path: loginUrl.pathname + loginUrl.search,
    reason: 'registration_success',
  };
}

/**
 * Get redirect path for password reset
 * Redirects to login with success message
 */
export function getPasswordResetRedirect(): RedirectResult {
  const loginUrl = new URL(ROUTES.LOGIN, window.location.origin);
  loginUrl.searchParams.set('reset', 'true');
  return {
    path: loginUrl.pathname + loginUrl.search,
    reason: 'password_reset_success',
  };
}

/**
 * Get redirect path for OTP verification
 * Similar to login redirect
 */
export function getOTPVerificationRedirect(context: RedirectContext): RedirectResult {
  return getLoginRedirect(context);
}

/**
 * Get redirect path for social login
 * Similar to login redirect
 */
export function getSocialLoginRedirect(context: RedirectContext): RedirectResult {
  return getLoginRedirect(context);
}

/**
 * Comprehensive redirect resolver
 * Determines the correct redirect path based on context
 */
export function resolveRedirect(context: RedirectContext): RedirectResult {
  const { user, error, isAuthenticated, currentPath } = context;

  // Handle errors first
  if (error) {
    if (error === 'session_expired') {
      return getSessionExpiredRedirect(currentPath);
    }
    if (error === 'invalid_token' || error === 'invalid_role') {
      return getInvalidTokenRedirect(currentPath);
    }
  }

  // Handle authentication state
  if (!isAuthenticated || !user) {
    if (currentPath && isAuthPath(currentPath)) {
      // Already on auth page, no redirect needed
      return {
        path: currentPath,
        reason: 'already_on_auth_page',
      };
    }
    return getSessionExpiredRedirect(currentPath);
  }

  // Handle profile completion
  if (user.profileComplete === false) {
    return getProfileCompletionRedirect(user.role as Role, currentPath);
  }

  // Handle login redirect (for post-login scenarios)
  return getLoginRedirect(context);
}

/**
 * Check if a path requires authentication
 */
export function requiresAuth(path: string): boolean {
  return !isAuthPath(path) && path !== ROUTES.HOME;
}

/**
 * Check if a path requires profile completion
 */
export function requiresProfileCompletion(
  path: string,
  profileComplete: boolean
): boolean {
  if (profileComplete) return false;
  if (isAuthPath(path)) return false;
  if (path === ROUTES.PROFILE_COMPLETION) return false;
  return true;
}
