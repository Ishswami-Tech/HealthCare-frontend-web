"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/auth.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardByRole } from "@/config/routes";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  allowedRole: Role | Role[];
}

export function DashboardLayout({
  children,
  title,
  allowedRole,
}: DashboardLayoutProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { user } = session || {};

  useEffect(() => {
    if (!isLoading && user) {
      const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
      if (!roles.includes(user.role)) {
        console.error(
          `Unauthorized access to ${title.toLowerCase()} dashboard`
        );
        // Redirect to appropriate dashboard based on user's role
        const redirectPath = getDashboardByRole(user.role);
        router.replace(redirectPath);
      }
    } else if (!isLoading && !user) {
      // If not loading and no user, redirect to login
      router.replace("/auth/login");
    }
  }, [user, title, allowedRole, router, isLoading]);

  // Show loading state while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Verify role before rendering content
  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!roles.includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
