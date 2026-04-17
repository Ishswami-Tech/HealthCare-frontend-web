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
  Settings,
  Receipt,
  TrendingUp,
  DollarSign,
  CreditCard
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
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Video Consultation", href: "/super-admin/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "System Health", href: "/super-admin/health", icon: Activity, permission: Permission.MANAGE_SYSTEM_SETTINGS },
    { title: "Settings", href: "/super-admin/settings", icon: Settings, permission: Permission.MANAGE_SYSTEM_SETTINGS },
  ],
  CLINIC_ADMIN: [
    { title: "Dashboard", href: "/clinic-admin/dashboard", icon: LayoutDashboard },
    { title: "Staff", href: "/clinic-admin/staff", icon: Users, permission: Permission.MANAGE_CLINIC_STAFF },
    { title: "Schedule", href: "/clinic-admin/schedule", icon: Calendar, permission: Permission.MANAGE_DOCTOR_SCHEDULE },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Video Consultation", href: "/clinic-admin/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Locations", href: "/clinic-admin/locations", icon: Building2, permission: Permission.VIEW_CLINICS },
    { title: "Settings", href: "/clinic-admin/settings", icon: Settings, permission: Permission.UPDATE_CLINICS },
  ],
  DOCTOR: [
    { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
    { title: "Video Consultation", href: "/doctor/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
  ],
  ASSISTANT_DOCTOR: [
    { title: "Dashboard", href: "/assistant-doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/assistant-doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/assistant-doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Prescriptions", href: "/assistant-doctor/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
    { title: "Video Consultation", href: "/assistant-doctor/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
  ],
  PATIENT: [
    { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/patient/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Prescriptions", href: "/patient/prescriptions", icon: Pill, permission: Permission.VIEW_PHARMACY },
    { title: "Billing & Payments", href: "/patient/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
    { title: "Video Consultation", href: "/patient/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Medical Records", href: "/patient/medical-records", icon: FileText, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Self Check-In", href: "/patient/check-in", icon: QrCode, permission: Permission.CREATE_APPOINTMENTS },
  ],
  RECEPTIONIST: [
    { title: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/receptionist/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/receptionist/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Video Consultation", href: "/receptionist/video", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Collections", href: "/receptionist/collections", icon: CreditCard, permission: Permission.MANAGE_BILLING },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Check-In", href: "/receptionist/check-in", icon: ClipboardList, permission: Permission.MANAGE_QUEUE },
  ],
  PHARMACIST: [
    { title: "Dashboard", href: "/pharmacist/dashboard", icon: LayoutDashboard },
    { title: "Prescriptions", href: "/pharmacist/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    { title: "Inventory", href: "/pharmacy", icon: ClipboardList, permission: Permission.MANAGE_INVENTORY },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  CLINIC_LOCATION_HEAD: [
    { title: "Dashboard", href: "/clinic-location-head/dashboard", icon: LayoutDashboard },
    { title: "Locations", href: "/clinic-location-head/locations", icon: Building2, permission: Permission.VIEW_CLINICS },
    { title: "Appointments", href: "/clinic-location-head/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Check-In", href: "/clinic-location-head/check-in", icon: ClipboardList, permission: Permission.MANAGE_QUEUE },
  ],
  FINANCE_BILLING: [
    { title: "Dashboard", href: "/finance-billing/dashboard", icon: LayoutDashboard },
    { title: "Billing & Invoices", href: "/billing?tab=invoices", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Revenue Analytics", href: "/billing?tab=analytics", icon: TrendingUp, permission: Permission.VIEW_ANALYTICS },
    { title: "Financial Reports", href: "/billing?tab=reports", icon: DollarSign, permission: Permission.VIEW_REPORTS },
  ],
  THERAPIST: [
    { title: "Dashboard", href: "/therapist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/therapist/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/therapist/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Video Consultations", href: "/video-appointments", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  LAB_TECHNICIAN: [
    { title: "Dashboard", href: "/lab-technician/dashboard", icon: LayoutDashboard },
    { title: "Test Results", href: "/lab-technician/results", icon: FileText, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  SUPPORT_STAFF: [
    { title: "Dashboard", href: "/support-staff/dashboard", icon: LayoutDashboard },
    { title: "Help Requests", href: "/support-staff/requests", icon: ClipboardList, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  NURSE: [
    { title: "Dashboard", href: "/nurse/dashboard", icon: LayoutDashboard },
    { title: "Patient Care", href: "/nurse/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Vitals", href: "/nurse/vitals", icon: Activity, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  COUNSELOR: [
    { title: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/counselor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/counselor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Video Consultations", href: "/video-appointments", icon: Video, permission: Permission.VIEW_VIDEO_APPOINTMENTS },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
};

export function getSidebarLinksByRole(role: string): SidebarLink[] {
  const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
  return sidebarLinksByRole[normalizedRole] || [];
}
