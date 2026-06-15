"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { PageLoading } from "@/components/ui/loading";

export function AuthRedirect() {
  const { isAuthenticated, session, isPending } = useAuth();
  const { replace } = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated && session?.user) {
      const nextPath =
        String(session.user.role || "").toUpperCase() === "PATIENT" &&
        session.user.profileComplete === false
          ? ROUTES.PROFILE_COMPLETION
          : getDashboardByRole(session.user.role);
      replace(nextPath);
    }
  }, [isPending, isAuthenticated, replace, session]);

  // Optionally show a loader while checking/redirecting
  if (isPending || (isAuthenticated && session?.user)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 mobile-only-loader">
        <PageLoading text="Redirecting…" />
      </div>
    );
  }

  return null;
}

