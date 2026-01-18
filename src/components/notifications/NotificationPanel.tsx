"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  useNotificationStore,
  Notification,
} from "@/stores/notifications.store";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  Inbox,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNotifications } from "@/hooks/query/useNotifications";

interface NotificationPanelProps {
  className?: string | undefined;
}

type FilterType = "all" | "unread" | Notification["type"];

export function NotificationPanel({ className }: NotificationPanelProps) {
  const { isNotificationPanelOpen, setNotificationPanelOpen } =
    useNotificationStore();
  const {
    notifications,
    unreadCount,
    isPending: isLoading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread")
      return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "APPOINTMENT", label: "Appointments" },
    { value: "PRESCRIPTION", label: "Prescriptions" },
    { value: "REMINDER", label: "Reminders" },
    { value: "SYSTEM", label: "System" },
    { value: "MARKETING", label: "Marketing" },
  ];

  return (
    <Popover
      open={isNotificationPanelOpen}
      onOpenChange={setNotificationPanelOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="h-8 text-xs"
                >
                  {isMarkingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <CheckCheck className="h-3 w-3 mr-1" />
                  )}
                  Mark all read
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs whitespace-nowrap"
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
                <AlertCircle className="h-6 w-6 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                  Failed to load notifications
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setNotificationPanelOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
