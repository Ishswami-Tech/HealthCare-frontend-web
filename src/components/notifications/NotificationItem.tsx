"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Notification } from "@/stores/notifications.store";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Pill,
  Bell,
  AlertCircle,
  Megaphone,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

const typeIcons = {
  APPOINTMENT: Calendar,
  PRESCRIPTION: Pill,
  REMINDER: Bell,
  SYSTEM: AlertCircle,
  MARKETING: Megaphone,
};

const typeColors = {
  APPOINTMENT: "bg-blue-100 text-blue-700 border-blue-200",
  PRESCRIPTION: "bg-green-100 text-green-700 border-green-200",
  REMINDER: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SYSTEM: "bg-red-100 text-red-700 border-red-200",
  MARKETING: "bg-purple-100 text-purple-700 border-purple-200",
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  className,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || typeColors.SYSTEM;

  const handleClick = async () => {
    // Mark as read if not already read
    if (!notification.isRead && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }

    // Navigate if URL is provided
    if (notification.data?.url) {
      router.push(notification.data.url as string);
    } else if (notification.data?.appointmentId) {
      router.push(`/appointments/${notification.data.appointmentId}`);
    } else if (notification.data?.prescriptionId) {
      router.push(`/prescriptions/${notification.data.prescriptionId}`);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent",
        !notification.isRead && "bg-accent/50 border-primary/20",
        notification.isRead && "opacity-75",
        className
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
          colorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                !notification.isRead && "font-semibold"
              )}
            >
              {notification.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleMarkAsRead}
                title="Mark as read"
              >
                <CheckCircle2 className="h-3 w-3" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:text-destructive"
                onClick={handleRemove}
                title="Remove"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
