"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getRoutesByRole } from "@/config/routes";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
