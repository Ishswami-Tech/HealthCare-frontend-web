"use client";

/**
 *… Profile Completion Content
 * Uses LoadingSpinner for loading states (no blocking overlay)
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import ProfileCompletionForm from "@/components/forms/ProfileCompletionForm";
import { getProfileCompletionRedirectUrl } from "@/lib/config/profile";
import { Role } from "@/types/auth.types";
import { LoadingSpinner } from "@/components/ui/loading";
import { ROUTES } from "@/lib/config/routes";

export default function ProfileCompletionContent() {
  const { session, isPending, refreshSession } = useAuth();
  const { push } = useRouter();
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        push(ROUTES.LOGIN);
        return;
      }
      if (session.user.profileComplete === false && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        void refreshSession(true);
        return;
      }
      if (session.user.profileComplete === true) {
        const userRole = session.user.role as Role;
        const dashboardPath = getProfileCompletionRedirectUrl(userRole);
        window.location.replace(dashboardPath);
      }
    }
  }, [session, isPending, push, refreshSession]);

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading profile..." center />
      </div>
    );
  }

  if (session?.user && session.user.profileComplete === true) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Redirecting…" center />
      </div>
    );
  }

  return <ProfileCompletionForm />;
}


