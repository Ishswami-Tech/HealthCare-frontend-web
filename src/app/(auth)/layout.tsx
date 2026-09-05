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
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { StatusFooter } from "@/components/status/StatusFooter";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";

import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

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
    <div className="auth-page-scroll relative h-dvh min-h-0 w-full overflow-hidden bg-[#fff9ed] transition-colors duration-300 lg:flex lg:h-screen">
      {/* Full-canvas scenery contains no person; the doctor is rendered only by AuthLeftPanel. */}
      <Image
        src="/assets/auth-login-forest-continuation-light.png"
        alt=""
        fill
        priority
        aria-hidden="true"
        className="hidden object-cover object-center lg:block"
        sizes="100vw"
      />

      {/* The mobile hero and form share one continuous forest background. */}
      <section
        aria-label="Welcome to Dr. Chandrakumar Deshmukh Clinic"
        className="relative h-[max(180px,calc(100dvh-421px))] max-h-[540px] shrink-0 lg:hidden"
        role="img"
      />

      {/* Left side - Ayurvedic Hero Panel */}
      <AuthLeftPanel />

      {/* Right side - Auth forms */}
      <div className="auth-mobile-login-form relative z-20 mt-0 flex min-h-0 flex-1 flex-col justify-start overflow-visible px-5 pt-0 sm:px-6 lg:mt-0 lg:h-screen lg:justify-center lg:px-[1.65vw] lg:py-3">
        <div className="auth-mobile-login-scale mx-auto flex min-h-0 w-full max-w-[588px] origin-top flex-col justify-center transition-transform duration-200 lg:w-[calc(100%+88px)] lg:flex-1 lg:origin-center lg:-translate-x-[7vw] [@media(max-height:900px)]:scale-[.95] [@media(max-height:800px)]:scale-[.88] [@media(max-height:720px)]:scale-[.80]">
          {children}
          <StatusFooter className="mt-3 shrink-0 justify-center py-0 lg:py-1" />
        </div>
      </div>
    </div>
  );
}
