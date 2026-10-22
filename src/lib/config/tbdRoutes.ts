/**
 * Routes registered by B0 for the TestByDoctor build (pages exist as placeholders or shared
 * stand-ins until their batch replaces the page content). One row per route.
 *
 * - `screen` is the design board name (Ca* clinic admin, As* assistant, Doc*, Ph*, Rec*, Web*).
 * - `batch` is the build batch that owns the page file.
 * - Dynamic segments are written `[id]` / `[appointmentId]`; build links with `routeFor`.
 *
 * Also feeds the header title (see `titleForRegisteredPath`, used by DashboardLayout).
 */
export interface RegisteredRoute {
  batch: string;
  path: string;
  screen: string;
  title: string;
}

export const REGISTERED_ROUTES: readonly RegisteredRoute[] = [
  { batch: "B1", path: "/clinic-admin/billing", screen: "CaBilling", title: "Billing" },
  { batch: "B1", path: "/clinic-admin/billing/invoices", screen: "CaInvoices", title: "Invoices" },
  { batch: "B1", path: "/clinic-admin/billing/invoices/[id]", screen: "CaInvoiceDetail", title: "Invoice" },
  { batch: "B1", path: "/clinic-admin/billing/new", screen: "CaNewInvoice", title: "New invoice" },
  { batch: "B1", path: "/clinic-admin/billing/reminders", screen: "CaSendReminders", title: "Send reminders" },
  { batch: "B1", path: "/clinic-admin/reports", screen: "CaReports", title: "Reports" },
  { batch: "B1", path: "/clinic-admin/notifications", screen: "CaNotifications", title: "Notifications" },
  { batch: "B1", path: "/clinic-admin/print-settings", screen: "CaPrintSettings", title: "Print settings" },
  { batch: "B2", path: "/clinic-admin/roles", screen: "CaRoles", title: "Roles & permissions" },
  { batch: "B2", path: "/clinic-admin/staff/[id]", screen: "CaStaffDetail", title: "Staff member" },
  { batch: "B2", path: "/clinic-admin/staff/new", screen: "CaStaffAdd", title: "Add staff" },
  { batch: "B2", path: "/clinic-admin/schedule/holidays", screen: "CaHolidayEditor", title: "Holidays" },
  { batch: "B3", path: "/clinic-admin/check-ins", screen: "CaCheckInLog", title: "Check-in log" },
  { batch: "B3", path: "/clinic-admin/check-ins/failed", screen: "CaFailedCheckIns", title: "Failed check-ins" },
  { batch: "B3", path: "/clinic-admin/locations/[id]", screen: "CaLocationEdit", title: "Location" },
  { batch: "B3", path: "/clinic-admin/locations/[id]/qr", screen: "CaLocationQr", title: "Location QR" },
  { batch: "B3", path: "/clinic-admin/locations/[id]/qr/print", screen: "CaQrPrint", title: "Print QR poster" },
  { batch: "B3", path: "/clinic-admin/locations/[id]/qr/regenerate", screen: "CaQrRegenerate", title: "Regenerate QR" },
  { batch: "B4", path: "/assistant-doctor/prescribe", screen: "AsPrescribe", title: "Prescribe" },
  { batch: "B4", path: "/assistant-doctor/prescribe/quick", screen: "AsQuickRx", title: "Quick prescription" },
  { batch: "B4", path: "/assistant-doctor/drafts", screen: "AsDrafts", title: "Prescription drafts" },
  { batch: "B4", path: "/assistant-doctor/drafts/[id]", screen: "AsRxDraftPreview", title: "Draft prescription" },
  { batch: "B4", path: "/assistant-doctor/drafts/[id]/returned", screen: "AsDraftReturned", title: "Returned draft" },
  { batch: "B4", path: "/assistant-doctor/visit/[appointmentId]", screen: "AsVisitFlow", title: "Visit" },
  { batch: "B4", path: "/assistant-doctor/dispense", screen: "AsDispense", title: "Dispense" },
  { batch: "B4", path: "/assistant-doctor/dispense/[id]", screen: "AsDispense", title: "Dispense medicines" },
  { batch: "B4", path: "/assistant-doctor/dispense/[id]/success", screen: "AsDispenseSuccess", title: "Handed over" },
  { batch: "B4", path: "/doctor/drafts", screen: "DocDraftReview", title: "Rx drafts" },
  { batch: "B4", path: "/doctor/drafts/[id]", screen: "DocDraftReview", title: "Review draft" },
  { batch: "B5", path: "/assistant-doctor/stock", screen: "AsStockView", title: "Stock" },
  { batch: "B5", path: "/assistant-doctor/notifications", screen: "AsNotifications", title: "Notifications" },
  { batch: "B6", path: "/doctor/prescriptions/new", screen: "DocNewPrescription", title: "New prescription" },
  { batch: "B6", path: "/doctor/prescriptions/[id]/edit", screen: "DocEditPrescription", title: "Edit prescription" },
  { batch: "B6", path: "/doctor/diagnosis", screen: "DocDiagnosis", title: "Diagnosis" },
  { batch: "B6", path: "/doctor/investigations", screen: "DocInvestigations", title: "Investigations" },
  { batch: "B7", path: "/doctor/visit/[appointmentId]", screen: "DocVisitFlow", title: "Visit" },
  { batch: "B7", path: "/doctor/visit/[appointmentId]/summary", screen: "DocCaseSummary", title: "Case summary" },
  { batch: "B7", path: "/doctor/visit/[appointmentId]/complete", screen: "DocCompleteVisit", title: "Complete visit" },
  { batch: "B7", path: "/doctor/follow-up", screen: "DocFollowUp", title: "Follow-up" },
  { batch: "B7", path: "/doctor/dispense", screen: "DocDispense", title: "Dispense" },
  { batch: "B7", path: "/doctor/prescriptions/[id]", screen: "DocRxDetail", title: "Prescription" },
  { batch: "B7", path: "/doctor/prescriptions/[id]/print", screen: "DocRxPrint", title: "Print prescription" },
  { batch: "B7", path: "/doctor/prescriptions/[id]/sent", screen: "DocRxSent", title: "Prescription sent" },
  { batch: "B8", path: "/doctor/leave", screen: "DocLeave", title: "Leave & breaks" },
  { batch: "B9", path: "/clinic-admin/inventory", screen: "CaInventory", title: "Inventory" },
  { batch: "B9", path: "/clinic-admin/inventory/orders/[id]", screen: "CaPurchaseOrder", title: "Purchase order" },
  { batch: "B9", path: "/pharmacy/expiry", screen: "PhExpiry", title: "Expiring stock" },
  { batch: "B9", path: "/pharmacy/alert-settings", screen: "PhInventoryAlertSettings", title: "Stock alert settings" },
  { batch: "B9", path: "/pharmacy/settings", screen: "PhInventorySettings", title: "Inventory settings" },
  { batch: "B10", path: "/pharmacist/handover", screen: "PhHandover", title: "Hand-over" },
  { batch: "B10", path: "/pharmacist/handover/[id]", screen: "PhHandover", title: "Verify hand-over" },
  { batch: "B10", path: "/pharmacist/dispense", screen: "PhDispense", title: "Dispense" },
  { batch: "B10", path: "/pharmacist/notifications", screen: "PhNotifications", title: "Notifications" },
  { batch: "B10", path: "/pharmacist/billing", screen: "PhBilling", title: "Billing" },
  { batch: "B10", path: "/pharmacist/billing/invoices", screen: "PhBillingInvoices", title: "Pharmacy invoices" },
  { batch: "B10", path: "/pharmacist/billing/invoices/[id]", screen: "PhBillingInvoice", title: "Pharmacy invoice" },
  { batch: "B10", path: "/pharmacist/billing/payments", screen: "PhBillingPayments", title: "Pharmacy payments" },
  { batch: "B11", path: "/receptionist/notifications", screen: "RecNotifications", title: "Notifications" },
  { batch: "B11", path: "/receptionist/collect", screen: "RecBillingHandoff", title: "Collect payment" },
  { batch: "B11", path: "/receptionist/check-in/success", screen: "RecCheckInSuccess", title: "Checked in" },
  { batch: "B11", path: "/receptionist/walk-in", screen: "RecWalkIn", title: "Walk-in" },
  { batch: "B11", path: "/receptionist/messages", screen: "RecMessages", title: "Patient messages" },
  { batch: "B12", path: "/receptionist/patients/[id]", screen: "RecPatientDetail", title: "Patient" },
  { batch: "B12", path: "/receptionist/patients/new", screen: "RecRegister", title: "Register patient" },
  { batch: "B12", path: "/receptionist/appointments/[id]", screen: "RecAppointmentDetail", title: "Appointment" },
  { batch: "B12", path: "/receptionist/appointments/[id]/reschedule", screen: "RecReschedule", title: "Reschedule" },
  { batch: "B13", path: "/patient/appointments/[id]/reschedule", screen: "WebReschedule", title: "Reschedule" },
  { batch: "B13", path: "/patient/lab-booking", screen: "WebLabBooking", title: "Book a lab test" },
  { batch: "B13", path: "/patient/health/reports/upload", screen: "WebUploadReport", title: "Upload a report" },
];

/** Fills the `[param]` segments of a registered path: `routeFor("/clinic-admin/staff/[id]", { id })`. */
export function routeFor(path: string, params: Record<string, string | number> = {}): string {
  return path.replace(/\[([^\]]+)\]/g, (_match, key: string) => encodeURIComponent(String(params[key] ?? "")));
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TITLE_MATCHERS = REGISTERED_ROUTES.map((route) => ({
  title: route.title,
  pattern: new RegExp(`^${route.path.split(/\[[^\]]+\]/).map(escapeRegex).join("[^/]+")}/?$`),
}));

/** Header title of a registered route, or undefined for any other path. */
export function titleForRegisteredPath(pathname?: string | null): string | undefined {
  const path = String(pathname ?? "").split("?")[0] ?? "";
  return TITLE_MATCHERS.find((entry) => entry.pattern.test(path))?.title;
}
