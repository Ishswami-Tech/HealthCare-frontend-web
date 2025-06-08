"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getAllowedRolesForPath, getRoutesByRole } from "@/config/routes";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Get allowed roles for the current path
  const allowedRoles = getAllowedRolesForPath(pathname);

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
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-indigo-600">
                    Healthcare App
                  </h1>
                </div>
                {/* Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.path}
                      onClick={() => router.replace(link.path)}
                      className={`${
                        pathname === link.path
                          ? "border-indigo-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Profile and Logout */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session?.user?.name || "User"}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
