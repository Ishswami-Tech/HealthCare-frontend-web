"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, CircleAlert, Inbox, Loader2, RefreshCw, Settings } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { EmptyBlock, FilterChips, PageHero, Surface } from "@/components/tbd";
import { useNotifications } from "@/hooks/query/useNotifications";
import type { Notification } from "@/stores/notifications.store";
import { NotificationItem } from "./NotificationItem";

type Filter = "all" | "unread" | Notification["type"];

const FILTER_LABELS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "APPOINTMENT", label: "Appointments" },
  { value: "PRESCRIPTION", label: "Prescriptions" },
  { value: "REMINDER", label: "Reminders" },
  { value: "SYSTEM", label: "System" },
];

function matchesFilter(notification: Notification, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.isRead;
  return notification.type === filter;
}

/**
 * The full notifications page (the header bell shows the same list in a popover): filter, open,
 * mark one or all as read, remove. `preferencesHref` links to the screen with the delivery
 * channels and categories.
 */
export function NotificationsPage({
  eyebrow,
  preferencesHref,
}: {
  eyebrow: string;
  preferencesHref?: string;
}) {
  const { notifications, unreadCount, isPending, error, markAsRead, markAllAsRead, removeNotification, refetch } =
    useNotifications(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const visible = useMemo(
    () => notifications.filter((notification) => matchesFilter(notification, filter)),
    [notifications, filter],
  );
  const options = useMemo(
    () =>
      FILTER_LABELS.map((option) => ({
        ...option,
        count:
          option.value === "unread"
            ? unreadCount
            : option.value === "all"
              ? notifications.length
              : notifications.filter((notification) => notification.type === option.value).length,
      })),
    [notifications, unreadCount],
  );

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow={eyebrow}
        title="Notifications"
        description={
          unreadCount > 0
            ? `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`
            : "You are all caught up."
        }
        actions={
          <>
            {preferencesHref ? (
              <Button asChild size="md" variant="outline">
                <Link href={preferencesHref}>
                  <Settings aria-hidden="true" />
                  Preferences
                </Link>
              </Button>
            ) : null}
            <Button size="md" onClick={() => void handleMarkAll()} disabled={unreadCount === 0 || markingAll}>
              {markingAll ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCheck aria-hidden="true" />}
              Mark all as read
            </Button>
          </>
        }
      />

      <Surface as="section" aria-label="Notifications list">
        <FilterChips options={options} value={filter} onChange={setFilter} ariaLabel="Filter notifications" />
        {isPending && notifications.length === 0 ? (
          <div className="flex flex-col gap-2.5" aria-hidden="true">
            <span className="sr-only" role="status">
              Loading notifications…
            </span>
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-[76px] animate-pulse rounded-[14px] bg-well" />
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="Could not load notifications"
            description="Check your connection and try again."
            action={
              <Button size="md" variant="outline" onClick={() => void refetch()}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyBlock
            icon={filter === "all" ? Bell : Inbox}
            title={filter === "unread" ? "No unread notifications" : "No notifications"}
            description={
              filter === "all"
                ? "Appointment updates, prescriptions and reminders show up here."
                : "Nothing matches this filter."
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => void markAsRead(id)}
                onRemove={(id) => void removeNotification(id)}
              />
            ))}
          </div>
        )}
      </Surface>
    </DashboardPageShell>
  );
}
