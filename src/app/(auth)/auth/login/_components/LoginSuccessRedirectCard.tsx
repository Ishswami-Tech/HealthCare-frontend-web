"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthSuccessPanel } from "@/components/auth/AuthFrame";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardByRole } from "@/lib/config/routes";

export function LoginSuccessRedirectCard() {
  const router = useRouter();
  const { session } = useAuth();

  const role = session?.user?.role;
  const redirectUrl = role ? getDashboardByRole(role) : "/dashboard";

  // Lock body scroll during redirect
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(redirectUrl);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [redirectUrl, router]);

  const firstName = session?.user?.firstName?.trim();

  return (
    <AuthSuccessPanel
      message={`${firstName ? `Hi ${firstName}. ` : ""}Taking you to your portal.`}
    />
  );
}
