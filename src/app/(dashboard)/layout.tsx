"use client";

/**
 * (dashboard) route group layout.
 *
 * This is the single central shell for ALL protected dashboard routes.
 * It renders the Sidebar, Header, auth guards, and role-based navigation
 * once — every page nested under (dashboard) automatically gets the full
 * shell without needing its own <DashboardLayout> wrapper.
 *
 * Public routes (login, register, landing page, etc.) are NOT inside this
 * route group and are therefore unaffected.
 *
 * Individual pages may still wrap with <DashboardLayout allowedRole={...}>
 * for per-page RBAC — the context inside DashboardLayout detects the parent
 * shell is already mounted and skips re-rendering the sidebar/header.
 */

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
