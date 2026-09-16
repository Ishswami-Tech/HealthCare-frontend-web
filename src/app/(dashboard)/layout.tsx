"use client";

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
  return <DashboardLayout>{children}</DashboardLayout>;
}
