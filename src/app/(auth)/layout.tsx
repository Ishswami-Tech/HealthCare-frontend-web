"use client";

/**
 * ✅ Auth Layout
 * Simple layout for authentication pages
 * Loading states are handled by Next.js loading.tsx
 * Note: We only show the secure session loading when user is actually authenticated
 * and we need to redirect them away from auth pages.
 * When user comes to auth page with error params (like session_expired), we should
 * show the login form immediately without the loading state.
 */

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { StatusFooter } from "@/components/status/StatusFooter";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";

import { AuthFrame, AuthHelpPill } from "@/components/auth/AuthFrame";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const hadDarkTheme = root.classList.contains("dark");
    const hadLightTheme = root.classList.contains("light");
    const previousColorScheme = root.style.colorScheme;

    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";

    return () => {
      root.classList.remove("light", "dark");
      if (hadLightTheme) root.classList.add("light");
      if (hadDarkTheme) root.classList.add("dark");
      root.style.colorScheme = previousColorScheme;
    };
  }, []);

  // Check if user came with error params (like session_expired) - these indicate
  // intentional navigation to login, not needing session restoration
  const hasErrorParams = searchParams.get('error') !== null;
  const callbackUrl = searchParams.get('callbackUrl');

  const { session, isPending: authPending, isAuthenticated } = useAuth();

  // Only fetch profile when authenticated - prevents blocking public auth pages
  const { data: userProfile, isPending: profilePending } = useUserProfile({
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (authPending || profilePending) return;
    const role = (userProfile as { role?: string })?.role;
    if (!isAuthenticated || !role) return;

    const profileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
      session?.user as Record<string, unknown> | null | undefined,
      userProfile as Record<string, unknown> | null | undefined,
    );
    const nextPath =
      String(role).toUpperCase() === "PATIENT" && profileComplete !== true
        ? ROUTES.PROFILE_COMPLETION
        : getDashboardByRole(role);

    if (!nextPath) return;

    // Skip redirect on auth pages — each page manages its own navigation flow.
    if (pathname?.startsWith('/auth/login')) return;

    replace(nextPath);
  }, [isAuthenticated, profilePending, authPending, userProfile, replace, pathname]);

  return (
    <AuthFrame
      footer={
        <>
          <AuthHelpPill />
          <StatusFooter className="w-auto shrink-0 justify-center py-0" />
        </>
      }
    >
      {children}
    </AuthFrame>
  );
}
