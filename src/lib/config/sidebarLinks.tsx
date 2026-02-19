import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  Building2,
  UserCog,
  ClipboardList,
  Activity,
  QrCode
} from "lucide-react";

export interface SidebarLink {
  title: string;
  href: string;
  icon: any;
  variant?: "default" | "ghost";
  submenu?: SidebarLink[];
}

export const sidebarLinksByRole: Record<string, SidebarLink[]> = {
  SUPER_ADMIN: [
    { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
    { title: "Clinics", href: "/super-admin/clinics", icon: Building2 },
    { title: "Users", href: "/super-admin/users", icon: Users },
    { title: "System Health", href: "/super-admin/health", icon: Activity },
    { title: "Settings", href: "/super-admin/settings", icon: Settings },
  ],
  CLINIC_ADMIN: [
    { title: "Dashboard", href: "/clinic-admin/dashboard", icon: LayoutDashboard },
    { title: "Staff", href: "/clinic-admin/staff", icon: Users },
    { title: "Schedule", href: "/clinic-admin/schedule", icon: Calendar },
    { title: "Locations", href: "/clinic-admin/locations", icon: Building2 },
    { title: "Settings", href: "/clinic-admin/settings", icon: Settings },
  ],
  DOCTOR: [
    { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { title: "Patients", href: "/doctor/patients", icon: Users },
    { title: "Profile", href: "/doctor/profile", icon: UserCog },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
  PATIENT: [
    { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/patient/appointments", icon: Calendar },
    { title: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
    { title: "Medical Records", href: "/patient/medical-records", icon: FileText },
    { title: "Self Check-In", href: "/patient/check-in", icon: QrCode },
    { title: "Profile", href: "/patient/profile", icon: UserCog },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
  RECEPTIONIST: [
    { title: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/receptionist/appointments", icon: Calendar },
    { title: "Patients", href: "/receptionist/patients", icon: Users },
    { title: "Check-In", href: "/receptionist/check-in", icon: ClipboardList },
    { title: "Profile", href: "/receptionist/profile", icon: UserCog },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
  PHARMACIST: [
    { title: "Dashboard", href: "/pharmacist/dashboard", icon: LayoutDashboard },
    { title: "Prescriptions", href: "/pharmacist/prescriptions", icon: Pill },
    { title: "Inventory", href: "/pharmacist/inventory", icon: ClipboardList },
    { title: "Profile", href: "/pharmacist/profile", icon: UserCog },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
};

export function getSidebarLinksByRole(role: string): SidebarLink[] {
  const normalizedRole = role.toUpperCase().replace(' ', '_');
  return sidebarLinksByRole[normalizedRole] || [];
}
