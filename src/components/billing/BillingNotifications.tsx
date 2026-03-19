"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellRing, X, CheckCircle, AlertCircle, Info, Receipt, DollarSign, TrendingUp } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/hooks/utils/use-toast";

interface BillingNotification {
  id: string;
  type: "payment_received" | "invoice_created" | "subscription_renewed" | "payment_failed" | "invoice_overdue" | "subscription_cancelled";
  title: string;
  message: string;
  amount?: number;
  date: Date;
  read: boolean;
  actionUrl?: string;
}

interface BillingNotificationsProps {
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
}

export function BillingNotifications({ onMarkAsRead, onClearAll }: BillingNotificationsProps) {
  const { session } = useAuth();
  const user = session?.user;
  const rbac = useRBAC();
  const userRole = (user?.role as any) || "";

  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Simulated notifications - in real app, these would come from API/WebSocket
  useEffect(() => {
    // Demo notifications based on role
    const demoNotifications: BillingNotification[] = [
      {
        id: "1",
        type: "payment_received",
        title: "Payment Received",
        message: "Payment of ₹2,500 received for INV-001",
        amount: 2500,
        date: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
      },
      {
        id: "2",
        type: "invoice_created",
        title: "New Invoice Created",
        message: "Invoice INV-002 has been created for patient John Doe",
        amount: 1500,
        date: new Date(Date.now() - 7200000), // 2 hours ago
        read: false,
      },
      {
        id: "3",
        type: "subscription_renewed",
        title: "Subscription Renewed",
        message: "Your Basic Plan subscription has been renewed successfully",
        date: new Date(Date.now() - 86400000), // 1 day ago
        read: true,
      },
      {
        id: "4",
        type: "payment_failed",
        title: "Payment Failed",
        message: "Payment for INV-003 failed. Please retry.",
        amount: 3000,
        date: new Date(Date.now() - 172800000), // 2 days ago
        read: true,
      },
      {
        id: "5",
        type: "invoice_overdue",
        title: "Invoice Overdue",
        message: "Invoice INV-004 is now overdue. Please ensure payment is made.",
        amount: 1800,
        date: new Date(Date.now() - 259200000), // 3 days ago
        read: true,
      },
    ];

    setNotifications(demoNotifications);
    setUnreadCount(demoNotifications.filter(n => !n.read).length);
  }, [user]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }

    showSuccessToast("Notification marked as read", {
      id: `notification-${notificationId}`,
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);

    if (onClearAll) {
      onClearAll();
    }

    showSuccessToast("All notifications marked as read", {
      id: "all-notifications-read",
    });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const notif = notifications.find(n => n.id === notificationId);
      return notif && !notif.read ? prev - 1 : prev;
    });

    showSuccessToast("Notification deleted", {
      id: `notification-deleted-${notificationId}`,
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);

    if (onClearAll) {
      onClearAll();
    }

    showSuccessToast("All notifications cleared", {
      id: "all-notifications-cleared",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_received":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case "invoice_created":
        return <Receipt className="w-5 h-5 text-blue-600" />;
      case "subscription_renewed":
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case "payment_failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "invoice_overdue":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "subscription_cancelled":
        return <X className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment_received":
        return "bg-green-50 border-green-200";
      case "invoice_created":
        return "bg-blue-50 border-blue-200";
      case "subscription_renewed":
        return "bg-purple-50 border-purple-200";
      case "payment_failed":
        return "bg-red-50 border-red-200";
      case "invoice_overdue":
        return "bg-orange-50 border-orange-200";
      case "subscription_cancelled":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Button - Would be placed in header */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-50"
            aria-label="Close billing notifications"
            onClick={() => setShowNotifications(false)}
          />

          {/* Notifications Card */}
          <Card className="fixed right-4 top-16 w-96 max-h-[600px] z-50 shadow-2xl">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Billing Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[450px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${
                          notification.read ? "opacity-60" : "font-medium"
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && !notification.read) {
                            event.preventDefault();
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 shrink-0 rounded-full p-2 ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                {notification.amount && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="font-semibold">₹{notification.amount.toLocaleString()}</span>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.date)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification.id);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark All Read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllNotifications}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
