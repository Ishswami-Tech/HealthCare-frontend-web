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
import { useAuth } from "@/hooks/auth/useAuth";

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

/** Roles that have their own `/<role>/appointments` page (URL segment form). */
const ROLES_WITH_APPOINTMENTS = new Set([
  "patient",
  "doctor",
  "assistant-doctor",
  "receptionist",
  "clinic-admin",
  "clinic-location-head",
  "therapist",
  "counselor",
]);

/** Staff roles that have their own `/<role>/prescriptions` page (patients use Medicines). */
const ROLES_WITH_PRESCRIPTIONS = new Set(["doctor", "assistant-doctor", "pharmacist"]);

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
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  // The role as it appears in the URL: "ASSISTANT_DOCTOR" -> "assistant-doctor".
  const userRole =
    String(user?.role || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-") || "patient";

  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || typeColors.SYSTEM;

  const openNotification = async () => {
    // Mark as read if not already read
    if (!notification.isRead && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }

    // Navigate if URL is provided
    if (notification.data?.url) {
      push(notification.data.url as string);
    } else if (notification.data?.appointmentId) {
      // The role's own appointments page. Roles without one (pharmacy, lab, ...) stay where they are.
      if (ROLES_WITH_APPOINTMENTS.has(userRole)) {
        push(`/${userRole}/appointments?id=${encodeURIComponent(String(notification.data.appointmentId))}`);
      }
    } else if (notification.data?.prescriptionId) {
      const prescriptionId = encodeURIComponent(String(notification.data.prescriptionId));
      if (userRole === "patient") {
        // Patients open the prescription on their Medicines page.
        push(`/patient/health/medicines?prescriptionId=${prescriptionId}`);
      } else if (userRole === "pharmacist") {
        // The pharmacy prescriptions screen reads `prescriptionId` (it marks and opens that one).
        push(`/pharmacist/prescriptions?prescriptionId=${prescriptionId}`);
      } else if (ROLES_WITH_PRESCRIPTIONS.has(userRole)) {
        push(`/${userRole}/prescriptions?id=${prescriptionId}`);
      }
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
        "group relative flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-accent",
        !notification.isRead && "bg-accent/50 border-primary/20",
        notification.isRead && "opacity-75",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 size-10 rounded-full flex items-center justify-center border-2",
          colorClass
        )}
      >
        <Icon className="size-5" />
      </div>

      <button
        type="button"
        onClick={openNotification}
        className="flex-1 min-w-0 text-left"
      >
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
            <div className="shrink-0 size-2 rounded-full bg-primary" />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span suppressHydrationWarning>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleMarkAsRead}
            title="Mark as read"
          >
            <CheckCircle2 className="size-3" />
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
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}


