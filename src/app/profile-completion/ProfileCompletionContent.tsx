"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import ProfileCompletionForm from "@/components/forms/ProfileCompletionForm";
import { getProfileCompletionRedirectUrl } from "@/lib/config/profile";
import { Role } from "@/types/auth.types";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";

export default function ProfileCompletionContent() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { setOverlay } = useLoadingOverlay();

  useEffect(() => {
    setOverlay({
      show: isLoading,
      variant: "default",
      message: "Loading profile completion...",
    });

    if (!isLoading) {
      if (!session?.user) {
        setOverlay({ show: false });
        router.push("/auth/login");
        return;
      }
      if (session.user.profileComplete) {
        const userRole = session.user.role as Role;
        const dashboardPath = getProfileCompletionRedirectUrl(userRole);
        setOverlay({ show: false });
        router.push(dashboardPath);
        return;
      }
      setOverlay({ show: false });
    }
    return () => setOverlay({ show: false });
  }, [session, isLoading, router, setOverlay]);

  return <ProfileCompletionForm />;
}
