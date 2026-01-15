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
// Unused icons removed: LogOutIcon, StethoscopeIcon, ActivityIcon, VideoIcon

// Role-based sidebar links
export const sidebarLinksByRole: Record<Role, SidebarLink[]> = {
  [Role.SUPER_ADMIN]: [
    { label: "Dashboard", path: "/(dashboard)/super-admin/dashboard", icon: HomeIcon },
    { label: "Clinics", path: "/(dashboard)/super-admin/clinics", icon: BuildingIcon },
    { label: "Users", path: "/(dashboard)/super-admin/users", icon: UsersIcon },
    { label: "Settings", path: "/(dashboard)/super-admin/settings", icon: SettingsIcon },
  ],
  [Role.CLINIC_ADMIN]: [
    { label: "Dashboard", path: "/(dashboard)/clinic-admin/dashboard", icon: HomeIcon },
    { label: "Staff", path: "/(dashboard)/clinic-admin/staff", icon: UsersIcon },
    { label: "Locations", path: "/(dashboard)/clinic-admin/locations", icon: BuildingIcon },
    { label: "Schedule", path: "/(dashboard)/clinic-admin/schedule", icon: CalendarIcon },
    { label: "Settings", path: "/(dashboard)/clinic-admin/settings", icon: SettingsIcon },
  ],
  [Role.DOCTOR]: [
    { label: "Dashboard", path: "/(dashboard)/doctor/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/(shared)/appointments", icon: CalendarIcon },
    { label: "Patients", path: "/(dashboard)/doctor/patients", icon: UsersIcon },
    { label: "Profile", path: "/(dashboard)/doctor/profile", icon: UserIcon },
  ],
  [Role.RECEPTIONIST]: [
    { label: "Dashboard", path: "/(dashboard)/receptionist/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/(shared)/appointments", icon: CalendarIcon },
    { label: "Patients", path: "/(dashboard)/receptionist/patients", icon: UsersIcon },
    { label: "Profile", path: "/(dashboard)/receptionist/profile", icon: UserIcon },
  ],
  [Role.PATIENT]: [
    { label: "Dashboard", path: "/(dashboard)/patient/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/(shared)/appointments", icon: CalendarIcon },
    { label: "Medical Records", path: "/(dashboard)/patient/medical-records", icon: FileTextIcon },
    { label: "Prescriptions", path: "/(dashboard)/patient/prescriptions", icon: PillIcon },
    { label: "Profile", path: "/(dashboard)/patient/profile", icon: UserIcon },
  ],
  [Role.PHARMACIST]: [
    { label: "Dashboard", path: "/(dashboard)/pharmacist/dashboard", icon: HomeIcon },
    { label: "Prescriptions", path: "/(shared)/pharmacy", icon: PillIcon },
    { label: "Inventory", path: "/(dashboard)/pharmacist/inventory", icon: PackageIcon },
    { label: "Profile", path: "/(dashboard)/pharmacist/profile", icon: UserIcon },
  ],
};

/**
 * Get sidebar links for a role
 */
export function getSidebarLinksByRole(role: Role | string | undefined): SidebarLink[] {
  if (!role) return [];
  return sidebarLinksByRole[role as Role] || [];
}

