"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardByRole } from "@/lib/config/routes";
import { Role } from "@/types/auth.types";
import { PageLoading } from "@/components/ui/loading";

export function AuthRedirect() {
  const { isAuthenticated, session, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated && session?.user?.role) {
      const dashboardPath = getDashboardByRole(session.user.role as Role);
      router.replace(dashboardPath);
    }
  }, [isPending, isAuthenticated, session, router]);

  // Optionally show a loader while checking/redirecting
  if (isPending || (isAuthenticated && session?.user)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 mobile-only-loader">
        <PageLoading text="Redirecting to dashboard..." />
      </div>
    );
  }

  return null;
}
