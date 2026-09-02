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

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { StatusFooter } from "@/components/status/StatusFooter";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";

import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { CompactThemeSwitcher } from "@/components/theme/compact-theme-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <div className="relative flex h-screen min-h-0 overflow-hidden bg-[#fbfaf5] dark:bg-[#0c1310] transition-colors duration-300">
      {/* Theme switcher toggle */}
      <div className="absolute right-4 top-4 z-50">
        <CompactThemeSwitcher className="border border-slate-200/80 bg-white/80 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80" />
      </div>

      {/* Left side - Ayurvedic Hero Panel with Dark Mode */}
      <AuthLeftPanel />

      {/* Right side - Auth forms */}
      <div className="flex h-screen min-h-0 flex-1 flex-col justify-center overflow-hidden bg-[#fbfaf5] dark:bg-[#0c1310] px-4 py-3 sm:px-6 lg:px-[2vw] transition-colors duration-300">
        <div className="mx-auto flex min-h-0 w-full max-w-[480px] flex-1 flex-col justify-center lg:-translate-x-[8px] [@media(max-height:900px)]:scale-[.95] [@media(max-height:800px)]:scale-[.88] [@media(max-height:720px)]:scale-[.80] origin-center transition-transform duration-200">{children}</div>
        <StatusFooter className="justify-center py-1.5 shrink-0" />
      </div>
    </div>
  );
}
