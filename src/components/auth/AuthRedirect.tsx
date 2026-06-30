"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";

export function AuthRedirect() {
  const { session, isAuthenticated, isPending: authPending } = useAuth();
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
    const profileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
      session?.user as Record<string, unknown> | null | undefined,
      userProfile as Record<string, unknown> | null | undefined,
    );
    const nextPath =
      String(role).toUpperCase() === "PATIENT" && profileComplete !== true
        ? ROUTES.PROFILE_COMPLETION
        : getDashboardByRole(role);

    setHasRedirected(true);
    router.replace(nextPath);
  }, [authPending, isAuthenticated, profilePending, userProfile, hasRedirected, router]);

  return null;
}
