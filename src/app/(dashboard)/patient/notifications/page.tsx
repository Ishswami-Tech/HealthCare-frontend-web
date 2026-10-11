"use client";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";

export default function PatientNotifications() {
  return <NotificationsPage eyebrow="Your Notifications" preferencesHref="/patient/profile/settings" />;
}
