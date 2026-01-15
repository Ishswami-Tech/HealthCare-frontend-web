import React, { ReactNode } from "react";
import {
  Home,
  User,
  Settings,
  Calendar,
  Users,
  FileText,
  Building2,
  Pill,
  Package,
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
const HomeIcon = iconWrapper(Home);
const UserIcon = iconWrapper(User);
const SettingsIcon = iconWrapper(Settings);
const CalendarIcon = iconWrapper(Calendar);
const UsersIcon = iconWrapper(Users);
const FileTextIcon = iconWrapper(FileText);
const BuildingIcon = iconWrapper(Building2);
const PillIcon = iconWrapper(Pill);
const PackageIcon = iconWrapper(Package);

// Helper function to map route label to icon
const getIconForRoute = (path: string): (() => ReactNode) => {
  if (path.includes("dashboard")) return HomeIcon;
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
  return HomeIcon; // Default icon
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
