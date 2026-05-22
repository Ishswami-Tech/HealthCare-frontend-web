"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { resolveRedirect } from "@/lib/utils/redirect";
import { PageLoading } from "@/components/ui/loading";

export function AuthRedirect() {
  const { isAuthenticated, session, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated && session?.user) {
      const redirect = resolveRedirect({
        isAuthenticated: true,
        user: {
          role: session.user.role,
          ...(typeof session.user.profileComplete === "boolean"
            ? { profileComplete: session.user.profileComplete }
            : {}),
        },
      });
      router.replace(redirect.path);
    }
  }, [isPending, isAuthenticated, session, router]);

  // Optionally show a loader while checking/redirecting
  if (isPending || (isAuthenticated && session?.user)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 mobile-only-loader">
        <PageLoading text="Redirecting..." />
      </div>
    );
  }

  return null;
}
