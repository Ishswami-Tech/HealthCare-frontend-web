"use client";

/**
 * Profile Completion Content
 * Renders the form until the authoritative profile query confirms completion.
 */

import { useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileCompletionForm from "@/components/forms/ProfileCompletionForm";
import { getProfileCompletionRedirectUrl } from "@/lib/config/profile";
import { Role } from "@/types/auth.types";
import { LoadingSpinner } from "@/components/ui/loading";
import { ROUTES } from "@/lib/config/routes";
import { useUserProfile } from "@/hooks/query/useUsers";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";
import { useHydrated } from "@/hooks/utils/useHydrated";

export default function ProfileCompletionContent() {
  // The server never has the session (or the browser clock the form's date limits use), so the
  // first client render must match the server's spinner; the real screen renders after hydration.
  const hydrated = useHydrated();
  const { session, isPending } = useAuth();
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || undefined;
  const { data: currentUserProfile, isPending: isProfilePending } = useUserProfile({
    enabled: !!session?.user,
  });

  const authoritativeProfileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
    session?.user as Record<string, unknown> | null | undefined,
    currentUserProfile as Record<string, unknown> | null | undefined,
  );

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      push(ROUTES.LOGIN);
      return;
    }

    // Fail-closed: only redirect when AUTHORITATIVE profile confirms completion.
    // Ignore session.user.profileComplete (may be stale from initial hydration).
    // This prevents the dashboard/profile-completion bounce when session state is partial.
    if (authoritativeProfileComplete === true) {
      const userRole = session.user.role as Role;
      const safeRedirectUrl =
        redirectUrl &&
        redirectUrl !== "/" &&
        !redirectUrl.startsWith("/auth/")
          ? redirectUrl
          : undefined;
      const dashboardPath = getProfileCompletionRedirectUrl(userRole, safeRedirectUrl);
      window.location.replace(dashboardPath);
    }
  }, [authoritativeProfileComplete, isPending, push, redirectUrl, session]);

  if (!hydrated || isPending || (session?.user && isProfilePending && authoritativeProfileComplete === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading profile..." center />
      </div>
    );
  }

  if (session?.user && authoritativeProfileComplete === true) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Redirecting…" center />
      </div>
    );
  }

  return <ProfileCompletionForm />;
}
