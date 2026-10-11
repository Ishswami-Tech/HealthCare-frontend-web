"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

/**
 * Shared authenticated shell for all role dashboards and cross-role pages
 * (queue, billing, etc.). Keeping one client layout means soft navigations
 * only swap `{children}` and leave the sidebar mounted.
 */
export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Moved down from the app-wide AppProvider boundary, which also blanked the
     public site on refresh. The dashboard shell reads search params in places,
     so it keeps the same null boundary it always had. */
  return (
    <Suspense fallback={null}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
