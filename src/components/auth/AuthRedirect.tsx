"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { LoadingSpinner } from "@/components/ui/loading";
import { resolveAuthoritativeProfileComplete } from "@/lib/config/profile";

export function AuthRedirect() {
  const { isAuthenticated, isPending: authPending } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Only fetch profile when authenticated - prevents blocking login page
  const { data: userProfile, isPending: profilePending } = useUserProfile({
    enabled: isAuthenticated,
  });

  useEffect(() => {
    // Only redirect when auth is settled and we have profile data
    if (authPending) return;
    if (!isAuthenticated) return;
    if (profilePending) return;
    if (!userProfile) return;
    if (hasRedirected) return;

    const role = (userProfile as { role?: string })?.role || "";
    const profileComplete = resolveAuthoritativeProfileComplete(userProfile as Record<string, unknown> | null | undefined);
    const nextPath =
      String(role).toUpperCase() === "PATIENT" && profileComplete !== true
        ? ROUTES.PROFILE_COMPLETION
        : getDashboardByRole(role);

    setHasRedirected(true);
    router.replace(nextPath);
  }, [authPending, isAuthenticated, profilePending, userProfile, hasRedirected, router]);

  // Show loader while auth AND profile are loading
  const showLoader = authPending || profilePending || (isAuthenticated && !hasRedirected);

  if (showLoader) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 mobile-only-loader">
        <LoadingSpinner size="lg" center />
      </div>
    );
  }

  return null;
}
