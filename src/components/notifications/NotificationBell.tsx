"use client";

import { NotificationPanel } from "./NotificationPanel"; 

interface NotificationBellProps {
  className?: string | undefined;
}

/**
 * Notification Bell Component
 * Shows unread count badge and opens notification panel on click
 */
export function NotificationBell({ className }: NotificationBellProps) {
  return <NotificationPanel className={className} />;
}