"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/types/auth.types";
import Link from "next/link";
import {
  Calendar,
  Users,
  FileText,
  Pill,
  BarChart3,
  ArrowLeft,
  User,
} from "lucide-react";
import { BackendStatusWidget } from "@/components/common/BackendStatusIndicator";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/(auth)/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !session?.user) {
    return null;
  }

  const userRole = session.user.role as Role;
  const userName = session.user.firstName || "User";

  // Define which tabs are visible for each role
  const getVisibleTabs = (role: Role) => {
    const allTabs = [
      {
        name: "Appointments",
        href: "/appointments",
        icon: Calendar,
        roles: [
          Role.PATIENT,
          Role.DOCTOR,
          Role.RECEPTIONIST,
          Role.CLINIC_ADMIN,
        ],
      },
      {
        name: "Queue",
        href: "/queue",
        icon: Users,
        roles: [Role.DOCTOR, Role.RECEPTIONIST, Role.CLINIC_ADMIN],
      },
      {
        name: "EHR",
        href: "/ehr",
        icon: FileText,
        roles: [Role.DOCTOR, Role.CLINIC_ADMIN],
      },
      {
        name: "Pharmacy",
        href: "/pharmacy",
        icon: Pill,
        roles: [Role.PHARMACIST, Role.DOCTOR, Role.CLINIC_ADMIN],
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.DOCTOR],
      },
    ];

    return allTabs.filter((tab) => tab.roles.includes(role));
  };

  const visibleTabs = getVisibleTabs(userRole);
  const dashboardPath = `/(dashboard)/${userRole.toLowerCase()}/dashboard`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(dashboardPath)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <BackendStatusWidget />
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{userName}</span>
              <Badge variant="secondary" className="text-xs">
                {userRole.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                typeof window !== "undefined" &&
                window.location.pathname.startsWith(`/(shared)${tab.href}`);

              return (
                <Link
                  key={tab.name}
                  href={`/(shared)${tab.href}`}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
