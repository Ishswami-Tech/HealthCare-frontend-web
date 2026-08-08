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
    <div className="min-h-screen flex">
{/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        {/* Decorative orbs */}
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 size-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute right-16 top-1/4 size-24 rounded-full bg-emerald-300/20 blur-2xl animate-pulse-soft" />
        <div className="absolute inset-0 bg-gray-950 opacity-0" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            Authentic Ayurvedic Healing
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight mb-6">Welcome to Dr Chandrakumar Deshmukh</h1>
          <p className="text-lg xl:text-xl leading-relaxed">
            Your comprehensive healthcare management solution. Connect with doctors, manage appointments, and access your medical records securely.
          </p>
          <div className="mt-12 flex flex-col gap-y-8">
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Secure & Private</h3>
                <p className="text-blue-100">
                  Your health data is protected with enterprise-grade security
                </p>
              </div>
            </div>
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">24/7 Access</h3>
                <p className="text-blue-100">
                  Access your health information anytime, anywhere
                </p>
              </div>
            </div>
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Expert Care</h3>
                <p className="text-blue-100">
                  Connect with qualified healthcare professionals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex-1 flex flex-col justify-center">{children}</div>
        <StatusFooter />
      </div>
    </div>
  );
}


