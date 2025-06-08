"use client";

import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/auth.types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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

    switch (session.role) {
      case Role.PATIENT:
        router.push("/patient/dashboard");
        break;
      case Role.DOCTOR:
        router.push("/doctor/dashboard");
        break;
      case Role.CLINIC_ADMIN:
        router.push("/clinic-admin/dashboard");
        break;
      case Role.SUPER_ADMIN:
        router.push("/super-admin/dashboard");
        break;
      case Role.RECEPTIONIST:
        router.push("/receptionist/dashboard");
        break;
      default:
        toast.error("Invalid user role");
        router.push("/auth/login");
    }
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
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">Healthcare App</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-muted-foreground hover:text-foreground"
              >
                Contact
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={handleDashboardNavigation}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                >
                  Login
                </Button>
                <Button onClick={() => router.push("/auth/register")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Your Health, Our Priority
                </h1>
                <p className="text-muted-foreground text-lg">
                  Experience seamless healthcare management with our
                  comprehensive platform. Connect with doctors, manage
                  appointments, and take control of your health journey.
                </p>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push("/auth/register")}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/auth/login")}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef"
                  alt="Healthcare"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature cards */}
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">
                  Easy Appointments
                </h3>
                <p className="text-muted-foreground">
                  Book and manage your appointments with ease. Get instant
                  confirmations and reminders.
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">
                  Secure Communication
                </h3>
                <p className="text-muted-foreground">
                  Chat securely with your healthcare providers. Share documents
                  and get quick responses.
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Health Records</h3>
                <p className="text-muted-foreground">
                  Access your medical history, prescriptions, and test results
                  in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118"
                  alt="About Us"
                  className="object-cover"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">About Us</h2>
                <p className="text-muted-foreground text-lg">
                  We are committed to revolutionizing healthcare management
                  through technology. Our platform connects patients, doctors,
                  and healthcare facilities seamlessly.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>24/7 Access to Healthcare Services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Secure and Private Platform</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Comprehensive Health Management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-muted/50">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Have questions? We&apos;re here to help. Contact us for any
                inquiries about our services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push("/auth/register")}>
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/contact")}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Healthcare App. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
