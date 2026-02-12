import React, { ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  Settings2,
  Calendar,
  Users,
  FileText,
  Building2,
  Pill,
  Package,
  ArrowLeft,
  DollarSign,
  QrCode,
} from "lucide-react";
import { Role } from "@/types/auth.types";
import { ROLE_ROUTES } from "@/lib/config/routes";

export type SidebarLink = {
  label: string;
  path: string;
  icon: () => ReactNode;
};

// Helper to DRY icon rendering with consistent size
const iconWrapper = (Icon: React.ComponentType<{ className?: string }>) => {
  const Wrapped = () => <Icon className="size-6" />;
  const iconMeta = Icon as { displayName?: string; name?: string };
  Wrapped.displayName = `SidebarIconWrapper(${
    iconMeta.displayName || iconMeta.name || "Icon"
  })`;
  return Wrapped;
};

// Icon components
const DashboardIcon = iconWrapper(LayoutDashboard);
const UserIcon = iconWrapper(User);
const SettingsIcon = iconWrapper(Settings2);
const CalendarIcon = iconWrapper(Calendar);
const UsersIcon = iconWrapper(Users);
const FileTextIcon = iconWrapper(FileText);
const BuildingIcon = iconWrapper(Building2);
const PillIcon = iconWrapper(Pill);
const PackageIcon = iconWrapper(Package);
const LogOutIcon = iconWrapper(ArrowLeft);
const BillingIcon = iconWrapper(DollarSign);
const QrCheckInIcon = iconWrapper(QrCode);

// Helper function to map route label to icon
const getIconForRoute = (path: string): (() => ReactNode) => {
  if (path.includes("dashboard")) return DashboardIcon;
  if (path.includes("appointments")) return CalendarIcon;
  if (
    path.includes("patients") ||
    path.includes("users") ||
    path.includes("staff")
  )
    return UsersIcon;
  if (path.includes("profile")) return UserIcon;
  if (path.includes("settings")) return SettingsIcon;
  if (path.includes("clinics") || path.includes("locations"))
    return BuildingIcon;
  if (path.includes("prescriptions")) return PillIcon;
  if (path.includes("inventory")) return PackageIcon;
  if (path.includes("medical-records")) return FileTextIcon;
  if (path.includes("billing")) return BillingIcon;
  if (path.includes("check-in")) return QrCheckInIcon;
  if (path.includes("logout") || path === "#logout") return LogOutIcon;
  return DashboardIcon; // Default icon
};

// Role-based sidebar links
// ✅ Uses centralized routes from routes.ts - single source of truth
export const sidebarLinksByRole: Record<Role, SidebarLink[]> = {
  [Role.SUPER_ADMIN]: ROLE_ROUTES.SUPER_ADMIN.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.CLINIC_ADMIN]: ROLE_ROUTES.CLINIC_ADMIN.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.DOCTOR]: ROLE_ROUTES.DOCTOR.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.ASSISTANT_DOCTOR]: ROLE_ROUTES.ASSISTANT_DOCTOR.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.RECEPTIONIST]: ROLE_ROUTES.RECEPTIONIST.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.PATIENT]: ROLE_ROUTES.PATIENT.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
  [Role.PHARMACIST]: ROLE_ROUTES.PHARMACIST.routes.map((route) => ({
    label: route.label,
    path: route.path,
    icon: getIconForRoute(route.path),
  })),
};

/**
 * Get sidebar links for a role
 */
export function getSidebarLinksByRole(
  role: Role | string | undefined
): SidebarLink[] {
  if (!role) return [];
  return sidebarLinksByRole[role as Role] || [];
}
