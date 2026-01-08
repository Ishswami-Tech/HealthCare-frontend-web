"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardByRole } from "@/lib/config/config";
import { Role } from "@/types/auth.types";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, isLoading: loading, isAuthenticated } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && session?.user && !isRedirecting) {
      setIsRedirecting(true);
      // Redirect based on user role using centralized routes
      router.replace(getDashboardByRole(session.user.role as Role));
    }
  }, [isAuthenticated, session, router, loading, isRedirecting]);

  // Show loading state while checking authentication
  if (loading || (isAuthenticated && !isRedirecting)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render auth forms if user is authenticated and we're redirecting
  if (isAuthenticated && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-blue-500">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome to HealthCare App</h1>
          <p className="text-xl">
            Your comprehensive healthcare management solution. Connect with
            doctors, manage appointments, and access your medical records
            securely.
          </p>
          {/* Add decorative elements or testimonials here */}
          <div className="mt-12 space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Secure & Private</h3>
                <p className="text-blue-100">
                  Your health data is protected with enterprise-grade security
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">24/7 Access</h3>
                <p className="text-blue-100">
                  Access your health information anytime, anywhere
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Expert Care</h3>
                <p className="text-blue-100">
                  Connect with qualified healthcare professionals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">{children}</div>
      </div>
    </div>
  );
}
