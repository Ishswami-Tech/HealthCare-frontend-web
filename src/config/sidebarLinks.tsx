import React, { ReactNode } from "react";
import {
  Home, User, Settings, LogOut, Calendar, Users, Stethoscope, FileText, Building2
} from "lucide-react";
import { Role } from "@/types/auth.types";

export type SidebarLink = {
  label: string;
  path: string;
  icon: () => ReactNode;
};

// Helper to DRY icon rendering with consistent size
const iconWrapper = (Icon: React.ElementType) => () => <Icon className="size-6" />;

export const sidebarLinksByRole: Record<Role, SidebarLink[]> = {
  [Role.SUPER_ADMIN]: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: iconWrapper(Home) },
    { label: "Clinics", path: "/super-admin/clinics", icon: iconWrapper(Building2) },
    { label: "Users", path: "/super-admin/users", icon: iconWrapper(Users) },
    { label: "Reports", path: "/super-admin/reports", icon: iconWrapper(FileText) },
    { label: "Settings", path: "/super-admin/settings", icon: iconWrapper(Settings) },
    { label: "Logout", path: "#", icon: iconWrapper(LogOut) },
  ],
  [Role.CLINIC_ADMIN]: [
    { label: "Dashboard", path: "/clinic-admin/dashboard", icon: iconWrapper(Home) },
    { label: "Doctors", path: "/clinic-admin/doctors", icon: iconWrapper(Stethoscope) },
    { label: "Patients", path: "/clinic-admin/patients", icon: iconWrapper(Users) },
    { label: "Appointments", path: "/clinic-admin/appointments", icon: iconWrapper(Calendar) },
    { label: "Reports", path: "/clinic-admin/reports", icon: iconWrapper(FileText) },
    { label: "Settings", path: "/clinic-admin/settings", icon: iconWrapper(Settings) },
    { label: "Logout", path: "#", icon: iconWrapper(LogOut) },
  ],
  [Role.DOCTOR]: [
    { label: "Dashboard", path: "/doctor/dashboard", icon: iconWrapper(Home) },
    { label: "Appointments", path: "/doctor/appointments", icon: iconWrapper(Calendar) },
    { label: "Patients", path: "/doctor/patients", icon: iconWrapper(Users) },
    { label: "Profile", path: "/doctor/profile", icon: iconWrapper(User) },
    { label: "Logout", path: "#", icon: iconWrapper(LogOut) },
  ],
  [Role.RECEPTIONIST]: [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: iconWrapper(Home) },
    { label: "Appointments", path: "/receptionist/appointments", icon: iconWrapper(Calendar) },
    { label: "Patients", path: "/receptionist/patients", icon: iconWrapper(Users) },
    { label: "Logout", path: "#", icon: iconWrapper(LogOut) },
  ],
  [Role.PATIENT]: [
    { label: "Dashboard", path: "/patient/dashboard", icon: iconWrapper(Home) },
    { label: "Appointments", path: "/patient/appointments", icon: iconWrapper(Calendar) },
    { label: "Profile", path: "/patient/profile", icon: iconWrapper(User) },
    { label: "Logout", path: "#", icon: iconWrapper(LogOut) },
  ],
}; 