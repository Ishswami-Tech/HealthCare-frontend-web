"use client";

/**
 * (shared) route group layout.
 *
 * Shared pages (accessible across multiple roles: appointments, queue, EHR, etc.)
 * are siblings of (dashboard), so they need their own central shell.
 * DashboardLayout handles the Sidebar, Header, auth guards, and role-based
 * navigation automatically for every page in this group.
 */

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function SharedRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
