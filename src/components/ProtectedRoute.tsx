"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Role, Session } from "@/types/auth.types";
import { getDashboardByRole } from "@/config/routes";
import { useQueryData } from "@/hooks/useQueryData";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();

  const { data: session, isPending } = useQueryData<Session | null>(
    ["auth-session"],
    async () => {
      const response = await fetch("/api/auth/session");
      if (!response.ok) return null;
      return response.json();
    }
  );

  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (!isPending) {
      if (!isAuthenticated) {
        router.replace("/auth/login");
      } else if (
        allowedRoles &&
        session?.user?.role &&
        !allowedRoles.includes(session.user.role)
      ) {
        router.replace(getDashboardByRole(session.user.role));
      }
    }
  }, [isPending, isAuthenticated, router, allowedRoles, session]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (
    allowedRoles &&
    session?.user?.role &&
    !allowedRoles.includes(session.user.role)
  ) {
    return null;
  }

  return <>{children}</>;
}
