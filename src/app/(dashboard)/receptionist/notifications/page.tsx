"use client";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";

/**
 * RecNotifications: the desk's alerts (arrivals, waits, payments, visit changes) on the shared
 * notifications page (`/communication/history/*`: filters, mark one or all read, remove).
 */
export default function RecNotificationsPage() {
  return <NotificationsPage eyebrow="Desk alerts" preferencesHref="/settings" />;
}
