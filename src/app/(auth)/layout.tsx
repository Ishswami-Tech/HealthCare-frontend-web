"use client";

/**
 * ✅ Auth Layout
 * Simple layout for authentication pages
 * Loading states are handled by Next.js loading.tsx
 * Note: We only show the secure session loading when user is actually authenticated
 * and we need to redirect them away from auth pages.
 * When user comes to auth page with error params (like session_expired), we should
 * show the login form immediately without the loading state.
 */

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { resolveRedirect } from "@/lib/utils/redirect";
import { PageLoading } from "@/components/ui/loading";
import { StatusFooter } from "@/components/status/StatusFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { replace } = useRouter();
  const searchParams = useSearchParams();

  // Check if user came with error params (like session_expired) - these indicate
  // intentional navigation to login, not needing session restoration
  const hasErrorParams = searchParams.get('error') !== null;
  const callbackUrl = searchParams.get('callbackUrl');

  const { isPending, session, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isPending && isAuthenticated && session?.user) {
      const redirect = resolveRedirect({
        isAuthenticated: true,
        user: {
          role: session.user.role,
          ...(typeof session.user.profileComplete === "boolean"
            ? { profileComplete: session.user.profileComplete }
            : {}),
        },
      });
      replace(redirect.path);
    }
  }, [isPending, isAuthenticated, replace, session?.user]);

  // Only show loading when we have a real authenticated session to redirect away from auth pages.
  // Unauthenticated users should see the login form immediately.
  if (isAuthenticated && session?.user && !hasErrorParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageLoading text="Preparing secure session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-blue-500">
        <div className="absolute inset-0 bg-gray-950 opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <h1 className="text-3xl xl:text-4xl font-semibold mb-6">Welcome to Dr Chandrakumar Deshmukh</h1>
          <p className="text-lg xl:text-xl">
            Your comprehensive healthcare management solution. Connect withdoctors, manage appointments, and access your medical recordssecurely.
          </p>
          <div className="mt-12 gap-y-8">
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
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
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
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
            <div className="flex items-start gap-x-4">
              <div className="flex-shrink-0">
                <div className="size-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
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
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex-1 flex flex-col justify-center">{children}</div>
        <StatusFooter />
      </div>
    </div>
  );
}


