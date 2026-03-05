import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  Building2,
  ClipboardList,
  Activity,
  QrCode,
  Video,
  Wallet,
  Settings
} from "lucide-react";

import { Permission } from "@/types/rbac.types";

export interface SidebarLink {
  title: string;
  href: string;
  icon: any;
  variant?: "default" | "ghost";
  submenu?: SidebarLink[];
  permission?: Permission;
}

export const sidebarLinksByRole: Record<string, SidebarLink[]> = {
  SUPER_ADMIN: [
    { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
    { title: "Clinics", href: "/super-admin/clinics", icon: Building2, permission: Permission.VIEW_CLINICS },
    { title: "Users", href: "/super-admin/users", icon: Users, permission: Permission.VIEW_USERS },
    { title: "System Health", href: "/super-admin/health", icon: Activity, permission: Permission.MANAGE_SYSTEM_SETTINGS },
  ],
  CLINIC_ADMIN: [
    { title: "Dashboard", href: "/clinic-admin/dashboard", icon: LayoutDashboard },
    { title: "Staff", href: "/clinic-admin/staff", icon: Users, permission: Permission.MANAGE_CLINIC_STAFF },
    { title: "Schedule", href: "/clinic-admin/schedule", icon: Calendar, permission: Permission.MANAGE_DOCTOR_SCHEDULE },
    { title: "Video Consultation", href: "/clinic-admin/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Locations", href: "/clinic-admin/locations", icon: Building2, permission: Permission.VIEW_CLINICS },
    { title: "Settings", href: "/clinic-admin/settings", icon: Settings, permission: Permission.UPDATE_CLINICS },
  ],
  DOCTOR: [
    { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Video Consultation", href: "/doctor/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Patients", href: "/doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
  ],
  ASSISTANT_DOCTOR: [
    { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Video Consultation", href: "/doctor/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Patients", href: "/doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
  ],
  PATIENT: [
    { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/patient/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Live Queue", href: "/patient/queue", icon: Activity, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Prescriptions", href: "/patient/prescriptions", icon: Pill, permission: Permission.VIEW_PHARMACY },
    { title: "Video Consultation", href: "/patient/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Medical Records", href: "/patient/medical-records", icon: FileText, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Self Check-In", href: "/patient/check-in", icon: QrCode, permission: Permission.CREATE_APPOINTMENTS },
  ],

  RECEPTIONIST: [
    { title: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/receptionist/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/receptionist/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Check-In", href: "/receptionist/check-in", icon: ClipboardList, permission: Permission.MANAGE_QUEUE },
  ],
  PHARMACIST: [
    { title: "Dashboard", href: "/pharmacist/dashboard", icon: LayoutDashboard },
    { title: "Prescriptions", href: "/pharmacist/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    { title: "Inventory", href: "/pharmacist/inventory", icon: ClipboardList, permission: Permission.MANAGE_INVENTORY },
  ],
  FINANCE_BILLING: [
    { title: "Dashboard", href: "/finance-billing/dashboard", icon: LayoutDashboard },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  CLINIC_LOCATION_HEAD: [
    { title: "Dashboard", href: "/clinic-location-head/dashboard", icon: LayoutDashboard },
    { title: "Locations", href: "/clinic-location-head/locations", icon: Building2, permission: Permission.VIEW_CLINICS },
    { title: "Appointments", href: "/clinic-location-head/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Check-In", href: "/clinic-location-head/check-in", icon: ClipboardList, permission: Permission.MANAGE_QUEUE },
  ],
};

export function getSidebarLinksByRole(role: string): SidebarLink[] {
  const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
  return sidebarLinksByRole[normalizedRole] || [];
}
