"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getRoutesByRole } from "@/config/routes";
import { getUserProfile } from "@/lib/actions/users.server";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user profile for display
  const { data: profile } = useQueryData<UserProfile>(
    ["layout-profile"],
    async () => {
      const response = await getUserProfile();
      return response.data || response;
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Get navigation links based on user role
  const navLinks = getRoutesByRole(session?.user?.role);

  const handleLogout = async () => {
    try {
      await logout();
      // The useAuth hook will handle the redirection and state cleanup
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = `/auth/login?t=${Date.now()}`;
    }
  };

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "User";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Welcome</h2>
          <p className="text-sm text-gray-300">{displayName}</p>
          <p className="text-xs text-gray-400">{session?.user?.role}</p>
        </div>

        <nav className="space-y-2">
          {navLinks.map((link) => (
            <Button
              key={link.path}
              variant={pathname === link.path ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => router.push(link.path)}
            >
              {link.label}
            </Button>
          ))}
          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
