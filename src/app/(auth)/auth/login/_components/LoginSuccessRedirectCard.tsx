"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSuccessPanel } from "@/components/auth/AuthFrame";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardByRole, ROUTES } from "@/lib/config/routes";
import { getLoginRedirect } from "@/lib/utils/redirect";

export function LoginSuccessRedirectCard() {
  const searchParams = useSearchParams();
  const { session, isPending } = useAuth();

  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const role = session?.user?.role;
  const redirectResult = getLoginRedirect({
    user: session?.user ?? null,
    callbackUrl,
  });
  // Prefer role dashboard when callback is missing/invalid; never bounce back to login.
  const redirectUrl =
    redirectResult.path && redirectResult.path !== ROUTES.LOGIN
      ? redirectResult.path
      : role
        ? getDashboardByRole(String(role))
        : null;

  // Lock body scroll during redirect
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    // Wait until session/role is available so we don't replace() back onto /auth/login.
    if (isPending || !redirectUrl) return;
    // Hard navigation after auth avoids soft-nav stalls on cold portal routes.
    window.location.replace(redirectUrl);
  }, [isPending, redirectUrl]);

  const firstName = session?.user?.firstName?.trim();

  return (
    <AuthSuccessPanel
      message={`${firstName ? `Hi ${firstName}. ` : ""}Taking you to your portal.`}
    />
  );
}
