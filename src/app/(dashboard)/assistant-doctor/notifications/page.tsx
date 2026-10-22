"use client";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";

// AsNotifications (B5): the shared notifications list (draft returned / approved, stock alerts arrive here).
export default function AsNotificationsPage() {
  return <NotificationsPage eyebrow="Assistant doctor" preferencesHref="/settings" />;
}
