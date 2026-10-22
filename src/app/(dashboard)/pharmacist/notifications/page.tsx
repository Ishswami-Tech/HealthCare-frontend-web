"use client";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { PharmacistNeedsYouPanel } from "./_components/PharmacistNeedsYouPanel";

// PhNotifications (B10): the shared notifications list with the counter's "needs you now" panel.
export default function PhNotificationsPage() {
  return (
    <NotificationsPage eyebrow="Pharmacy Notifications" preferencesHref="/settings">
      <PharmacistNeedsYouPanel />
    </NotificationsPage>
  );
}
