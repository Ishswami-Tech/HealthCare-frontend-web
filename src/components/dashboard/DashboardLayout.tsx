"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/auth.types";

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
  const { session } = useAuth();
  const { user } = session || {};

  useEffect(() => {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!user?.role || !roles.includes(user.role)) {
      console.error(`Unauthorized access to ${title.toLowerCase()} dashboard`);
    }
  }, [user, title, allowedRole]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
}
