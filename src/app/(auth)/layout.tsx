"use client";

/**
 * ✅ Auth Layout
 * Simple layout for authentication pages
 * Loading states are handled by Next.js loading.tsx
 */

import { StatusFooter } from "@/components/status/StatusFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-blue-500">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <h1 className="text-3xl xl:text-4xl font-bold mb-6">Welcome to HealthCare App</h1>
          <p className="text-lg xl:text-xl">
            Your comprehensive healthcare management solution. Connect with
            doctors, manage appointments, and access your medical records
            securely.
          </p>
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
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex-1 flex flex-col justify-center">{children}</div>
        <StatusFooter />
      </div>
    </div>
  );
}
