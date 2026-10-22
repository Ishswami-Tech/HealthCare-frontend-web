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
  Wallet,
  Settings,
  Receipt,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Star,
  Bell,
  UserCog,
  MapPin,
  CalendarDays,
  BarChart3,
  Boxes,
  ScanLine,
  PencilLine,
  ClipboardCheck,
  PackageCheck,
  Package,
  UserRound,
  HandHeart,
  CalendarOff,
  CalendarCheck2,
  UserX,
  FlaskConical,
  MessageSquareText,
  UserPlus,
  Banknote,
  LifeBuoy,
  ListOrdered,
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
    { title: "Earnings", href: "/super-admin/earnings", icon: DollarSign, permission: Permission.MANAGE_BILLING },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "System Health", href: "/super-admin/health", icon: Activity, permission: Permission.MANAGE_SYSTEM_SETTINGS },
    { title: "Settings", href: "/super-admin/settings", icon: Settings, permission: Permission.MANAGE_SYSTEM_SETTINGS },
  ],
  CLINIC_ADMIN: [
    // Clinic admin owns billing, staff, locations, reports and inventory (design: Ca* boards).
    { title: "Dashboard", href: "/clinic-admin/dashboard", icon: LayoutDashboard },
    { title: "Billing", href: "/clinic-admin/billing", icon: Wallet, permission: Permission.MANAGE_BILLING },
    { title: "Invoices", href: "/clinic-admin/billing/invoices", icon: Receipt, permission: Permission.MANAGE_BILLING },
    { title: "Staff", href: "/clinic-admin/staff", icon: Users, permission: Permission.MANAGE_CLINIC_STAFF },
    { title: "Roles", href: "/clinic-admin/roles", icon: UserCog, permission: Permission.MANAGE_ROLE_MATRIX },
    { title: "Locations", href: "/clinic-admin/locations", icon: MapPin, permission: Permission.VIEW_CLINICS },
    { title: "Schedule", href: "/clinic-admin/schedule", icon: CalendarDays, permission: Permission.MANAGE_DOCTOR_SCHEDULE },
    { title: "Reports", href: "/clinic-admin/reports", icon: BarChart3, permission: Permission.VIEW_REPORTS },
    { title: "Inventory", href: "/clinic-admin/inventory", icon: Boxes, permission: Permission.MANAGE_INVENTORY },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Check-in log", href: "/clinic-admin/check-ins", icon: ScanLine, permission: Permission.VIEW_CHECK_IN_LOGS },
    { title: "Notifications", href: "/clinic-admin/notifications", icon: Bell, permission: Permission.VIEW_NOTIFICATIONS },
    { title: "Settings", href: "/clinic-admin/settings", icon: Settings, permission: Permission.UPDATE_CLINICS },
  ],
  DOCTOR: [
    { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    // Drafts written by the assistant doctor, waiting for approval.
    { title: "Rx drafts", href: "/doctor/drafts", icon: ClipboardCheck, permission: Permission.REVIEW_PRESCRIPTION_DRAFTS },
    { title: "Investigations", href: "/doctor/investigations", icon: FlaskConical, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Dispense", href: "/doctor/dispense", icon: PackageCheck, permission: Permission.DISPENSE_FROM_CLINIC_STOCK },
    { title: "Follow-ups", href: "/doctor/follow-up", icon: CalendarCheck2, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Missed visits", href: "/doctor/no-show", icon: UserX, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Leave", href: "/doctor/leave", icon: CalendarOff, permission: Permission.MANAGE_DOCTOR_LEAVE },
    { title: "Reviews", href: "/doctor/reviews", icon: Star },
    // No Earnings / Billing link: the doctor never sees billing amounts (clinic admin owns billing).
    { title: "Notifications", href: "/doctor/notifications", icon: Bell },
    { title: "Profile", href: "/doctor/profile", icon: UserRound },
  ],
  ASSISTANT_DOCTOR: [
    // Assistant doctor: prescription drafts for the doctor, hand-over from clinic stock (no vitals, no check-in desk).
    // No Billing / Earnings link: the assistant never sees billing amounts.
    { title: "Dashboard", href: "/assistant-doctor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/assistant-doctor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Patients", href: "/assistant-doctor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Prescribe", href: "/assistant-doctor/prescribe", icon: PencilLine, permission: Permission.DRAFT_PRESCRIPTIONS },
    { title: "Drafts", href: "/assistant-doctor/drafts", icon: ClipboardCheck, permission: Permission.DRAFT_PRESCRIPTIONS },
    { title: "Dispense", href: "/assistant-doctor/dispense", icon: PackageCheck, permission: Permission.DISPENSE_FROM_CLINIC_STOCK },
    { title: "Stock", href: "/assistant-doctor/stock", icon: Package, permission: Permission.VIEW_STOCK_READONLY },
    { title: "Notifications", href: "/assistant-doctor/notifications", icon: Bell },
    { title: "Profile", href: "/assistant-doctor/profile", icon: UserRound },
  ],
  PATIENT: [
    { title: "Home", href: "/patient/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/patient/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Health", href: "/patient/health", icon: FileText, permission: Permission.VIEW_MEDICAL_RECORDS },
    { title: "Queue status", href: "/patient/queue", icon: ListOrdered },
    { title: "Lab tests", href: "/patient/lab-booking", icon: FlaskConical },
    { title: "Family", href: "/patient/family", icon: Users },
    { title: "Payments", href: "/patient/payments", icon: Wallet, permission: Permission.VIEW_BILLING },
    { title: "Notifications", href: "/patient/notifications", icon: Bell },
    { title: "Help & chat", href: "/patient/help", icon: LifeBuoy },
  ],
  RECEPTIONIST: [
    { title: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/receptionist/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/receptionist/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Check-In", href: "/receptionist/check-in", icon: ClipboardList, permission: Permission.MANAGE_QUEUE },
    { title: "Walk-in", href: "/receptionist/walk-in", icon: UserPlus, permission: Permission.CREATE_APPOINTMENTS },
    { title: "Collect payment", href: "/receptionist/collect", icon: Banknote, permission: Permission.PROCESS_PAYMENTS },
    { title: "Billing & Collections", href: "/billing?tab=invoices", icon: Wallet, permission: Permission.MANAGE_BILLING },
    // Patients' help-chat threads (`/support/threads`).
    { title: "Messages", href: "/receptionist/messages", icon: MessageSquareText },
    { title: "Notifications", href: "/receptionist/notifications", icon: Bell },
    { title: "Profile", href: "/receptionist/profile", icon: UserRound },
  ],
  PHARMACIST: [
    { title: "Dashboard", href: "/pharmacist/dashboard", icon: LayoutDashboard },
    { title: "Prescriptions", href: "/pharmacist/prescriptions", icon: Pill, permission: Permission.MANAGE_PRESCRIPTIONS },
    { title: "Hand-over", href: "/pharmacist/handover", icon: HandHeart, permission: Permission.HANDOVER_MEDICINES },
    { title: "Dispense", href: "/pharmacist/dispense", icon: PackageCheck, permission: Permission.DISPENSE_FROM_CLINIC_STOCK },
    { title: "Inventory", href: "/pharmacy", icon: ClipboardList, permission: Permission.MANAGE_INVENTORY },
    { title: "Billing", href: "/pharmacist/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
    { title: "Notifications", href: "/pharmacist/notifications", icon: Bell },
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
    { title: "My Sessions", href: "/therapist/sessions", icon: ClipboardList, permission: Permission.VIEW_PATIENTS },
    { title: "Patients", href: "/therapist/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
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
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  COUNSELOR: [
    { title: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/counselor/appointments", icon: Calendar, permission: Permission.VIEW_APPOINTMENTS },
    { title: "Patients", href: "/counselor/patients", icon: Users, permission: Permission.VIEW_PATIENTS },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
    { title: "Billing", href: "/billing", icon: Wallet, permission: Permission.VIEW_BILLING },
  ],
  // Ayurveda / diet / IPD: only their dashboards are built. The Prakriti, Nadi, Dosha, Diagnoses,
  // Diet plans, Food catalog, Diet patients, Admissions, Beds, Wards and Discharge pages do not exist
  // yet, so they have no links (add them back with the page).
  AYURVEDIST: [
    { title: "Dashboard", href: "/ayurveda/dashboard", icon: LayoutDashboard },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
  ],
  DIETITIAN: [
    { title: "Dashboard", href: "/diet/dashboard", icon: LayoutDashboard },
  ],
  IPD_MANAGER: [
    { title: "Dashboard", href: "/ipd/dashboard", icon: LayoutDashboard },
    { title: "Queue", href: "/queue", icon: Activity, permission: Permission.VIEW_QUEUE },
  ],
};

/**
 * Routes that still exist but have no sidebar entry any more (the TestByDoctor sidebars are
 * shorter than the old ones). Builders link to them from inside the screens that replace them:
 *  - /clinic-admin/appointments, /clinic-admin/payments, /clinic-admin/earnings (CLINIC_ADMIN)
 *  - /assistant-doctor/coverage, /assistant-doctor/prescriptions (ASSISTANT_DOCTOR)
 */
export const SIDEBAR_HIDDEN_ROUTES: Record<string, string[]> = {
  CLINIC_ADMIN: ["/clinic-admin/appointments", "/clinic-admin/payments", "/clinic-admin/earnings"],
  ASSISTANT_DOCTOR: ["/assistant-doctor/coverage", "/assistant-doctor/prescriptions"],
};

export function getSidebarLinksByRole(role: string): SidebarLink[] {
  const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
  return sidebarLinksByRole[normalizedRole] || [];
}
