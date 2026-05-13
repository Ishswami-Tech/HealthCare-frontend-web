"use client";

/**
 * ✅ Auth Layout
 * Simple layout for authentication pages
 * Loading states are handled by Next.js loading.tsx
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardByRole } from "@/lib/config/routes";
import { Role } from "@/types/auth.types";
import { PageLoading } from "@/components/ui/loading";
import { StatusFooter } from "@/components/status/StatusFooter";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isPending, session, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isPending && isAuthenticated && session?.user?.role) {
      router.replace(getDashboardByRole(session.user.role as Role));
    }
  }, [isPending, isAuthenticated, router, session?.user?.role]);

  if (isPending || (isAuthenticated && session?.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageLoading text="Preparing secure session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden border-r border-border/70 bg-card/80 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(117,224,192,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.14),_transparent_32%)]" />
          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                Ish Swami Tech
              </Badge>
              <div className="max-w-xl space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
                  Secure care workflows with a calmer sign-in experience.
                </h1>
                <p className="text-base leading-7 text-muted-foreground xl:text-lg">
                  Access appointments, records, billing, and coordinated care tools through one polished, role-aware system.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Protected sessions",
                  copy: "Authentication and route access stay aligned with the app's RBAC model.",
                },
                {
                  icon: HeartPulse,
                  title: "Patient-centered operations",
                  copy: "Every role lands in a focused workspace built for healthcare tasks.",
                },
                {
                  icon: Stethoscope,
                  title: "Clinical continuity",
                  copy: "Consultations, queues, prescriptions, and billing remain connected.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm ring-1 ring-border/20">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <div className="rounded-[1.75rem] border border-border/80 bg-background/95 p-4 shadow-xl ring-1 ring-border/30 sm:p-6">
              {children}
            </div>
          </div>
          <StatusFooter />
        </section>
      </div>
    </div>
  );
}
