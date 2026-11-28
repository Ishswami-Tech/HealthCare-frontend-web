"use client";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { ClinicAdminDecisions } from "@/components/notifications/clinic-admin/ClinicAdminDecisions";

// CaNotifications (B1): the shared notifications list plus the clinic admin's decisions
// (leave approval, failed check-ins, low stock, unpaid invoices).
export default function CaNotificationsPage() {
  return (
    <NotificationsPage eyebrow="Notification centre" preferencesHref="/clinic-admin/settings">
      <ClinicAdminDecisions />
    </NotificationsPage>
  );
}
