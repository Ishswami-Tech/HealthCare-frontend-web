import React, { ReactNode } from "react";
import {
  Home,
  User,
  Settings,
  LogOut,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  Building2,
  Pill,
  Package,
  Activity,
  Video,
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
const LogOutIcon = iconWrapper(LogOut);
const CalendarIcon = iconWrapper(Calendar);
const UsersIcon = iconWrapper(Users);
const StethoscopeIcon = iconWrapper(Stethoscope);
const FileTextIcon = iconWrapper(FileText);
const BuildingIcon = iconWrapper(Building2);
const PillIcon = iconWrapper(Pill);
const PackageIcon = iconWrapper(Package);
const ActivityIcon = iconWrapper(Activity);
const VideoIcon = iconWrapper(Video);

// Role-based sidebar links
export const sidebarLinksByRole: Record<Role, SidebarLink[]> = {
  [Role.SUPER_ADMIN]: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: HomeIcon },
    { label: "Clinics", path: "/super-admin/clinics", icon: BuildingIcon },
    { label: "Users", path: "/super-admin/users", icon: UsersIcon },
    { label: "Settings", path: "/super-admin/settings", icon: SettingsIcon },
  ],
  [Role.CLINIC_ADMIN]: [
    { label: "Dashboard", path: "/clinic-admin/dashboard", icon: HomeIcon },
    { label: "Staff", path: "/clinic-admin/staff", icon: UsersIcon },
    { label: "Locations", path: "/clinic-admin/locations", icon: BuildingIcon },
    { label: "Schedule", path: "/clinic-admin/schedule", icon: CalendarIcon },
    { label: "Settings", path: "/clinic-admin/settings", icon: SettingsIcon },
  ],
  [Role.DOCTOR]: [
    { label: "Dashboard", path: "/doctor/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/doctor/appointments", icon: CalendarIcon },
    { label: "Patients", path: "/doctor/patients", icon: UsersIcon },
    { label: "Profile", path: "/doctor/profile", icon: UserIcon },
  ],
  [Role.RECEPTIONIST]: [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/receptionist/appointments", icon: CalendarIcon },
    { label: "Patients", path: "/receptionist/patients", icon: UsersIcon },
    { label: "Profile", path: "/receptionist/profile", icon: UserIcon },
  ],
  [Role.PATIENT]: [
    { label: "Dashboard", path: "/patient/dashboard", icon: HomeIcon },
    { label: "Appointments", path: "/patient/appointments", icon: CalendarIcon },
    { label: "Medical Records", path: "/patient/medical-records", icon: FileTextIcon },
    { label: "Prescriptions", path: "/patient/prescriptions", icon: PillIcon },
    { label: "Profile", path: "/patient/profile", icon: UserIcon },
  ],
  [Role.PHARMACIST]: [
    { label: "Dashboard", path: "/pharmacist/dashboard", icon: HomeIcon },
    { label: "Prescriptions", path: "/pharmacist/prescriptions", icon: FileTextIcon },
    { label: "Inventory", path: "/pharmacist/inventory", icon: PackageIcon },
    { label: "Profile", path: "/pharmacist/profile", icon: UserIcon },
  ],
};

/**
 * Get sidebar links for a role
 */
export function getSidebarLinksByRole(role: Role | string | undefined): SidebarLink[] {
  if (!role) return [];
  return sidebarLinksByRole[role as Role] || [];
}

