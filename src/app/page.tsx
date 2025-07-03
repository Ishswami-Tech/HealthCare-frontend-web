"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type Testimonial = {
  name: string;
  role: string;
  content: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Patient",
    content:
      "The appointment booking system is so convenient. I love being able to see all my medical records in one place.",
  },
  {
    name: "Dr. Michael Chen",
    role: "Cardiologist",
    content:
      "This platform has streamlined my practice. Patient management has never been easier.",
  },
  {
    name: "Emily Rodriguez",
    role: "Clinic Manager",
    content:
      "The administrative features are fantastic. It has greatly improved our clinic's efficiency.",
  },
];

export default function LandingPage() {
  const { session, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleDashboardNavigation = () => {
    if (!isAuthenticated) {
      toast.error("Please login to access the dashboard");
      router.push("/auth/login");
      return;
    }

    if (!session) {
      toast.error("Invalid user session");
      router.push("/auth/login");
      return;
    }

    const dashboardPath = `/${session.user.role.toLowerCase()}/dashboard`;
    router.push(dashboardPath);
  };

  // For public routes like the landing page, we don't need to show a loading state
  // Only show loading if we're authenticated and waiting for user data
  const isLoadingAuthenticatedUser = isLoading && isAuthenticated;

  if (isLoadingAuthenticatedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header/Navigation */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link
                href={
                  isAuthenticated
                    ? `/${session?.user?.role.toLowerCase()}/dashboard`
                    : "/"
                }
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ishswami
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && session?.user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {session.user.firstName || "User"}
                  </span>
                  <Button onClick={handleDashboardNavigation}>
                    View Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/auth/login")}
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => router.push("/auth/register")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:pt-40 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Your Health,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Experience healthcare like never before. Connect with top
                doctors, manage appointments, and access your medical records -
                all in one secure platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    onClick={handleDashboardNavigation}
                    className="text-lg px-8"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => router.push("/auth/register")}
                      className="text-lg px-8"
                    >
                      Get Started
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/auth/login")}
                      className="text-lg px-8"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="relative lg:h-[600px] h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-white rounded-3xl transform -rotate-3 overflow-hidden">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80')] bg-cover bg-center" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">1000+</div>
              <div className="mt-2 text-lg text-gray-600">Active Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">50k+</div>
              <div className="mt-2 text-lg text-gray-600">Happy Patients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">100+</div>
              <div className="mt-2 text-lg text-gray-600">Specialties</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">4.9</div>
              <div className="mt-2 text-lg text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need in one place
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Our platform provides a comprehensive suite of tools for both
              patients and healthcare providers.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Online Appointments",
                  description:
                    "Book and manage appointments with your healthcare providers online.",
                  icon: "🗓️",
                },
                {
                  title: "Medical Records",
                  description:
                    "Access your complete medical history and records securely.",
                  icon: "📋",
                },
                {
                  title: "Secure Messaging",
                  description:
                    "Communicate with your healthcare providers securely.",
                  icon: "💬",
                },
                {
                  title: "Prescription Management",
                  description:
                    "View and manage your prescriptions in one place.",
                  icon: "💊",
                },
                {
                  title: "Lab Results",
                  description:
                    "Get your lab results quickly and track your health metrics.",
                  icon: "🔬",
                },
                {
                  title: "Telemedicine",
                  description:
                    "Connect with doctors remotely through video consultations.",
                  icon: "🎥",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Don&apos;t just take our word for it - hear from our satisfied
              users
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm">
                <p className="text-gray-600 italic">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="mt-4">
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of patients and healthcare providers who trust our
              platform.
            </p>
            <div className="mt-8">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleDashboardNavigation}
                  className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push("/auth/register")}
                  className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Create an Account
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white">
                    Appointments
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Telemedicine
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Lab Tests
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Facebook
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    LinkedIn
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p>
              &copy; {new Date().getFullYear()} HealthCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
