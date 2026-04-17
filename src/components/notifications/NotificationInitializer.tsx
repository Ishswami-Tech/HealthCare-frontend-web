"use client";

import { useEffect } from "react";
import { useNotifications } from "@/hooks/query/useNotifications";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * Component to initialize notification sync on app start
 * Should be placed in AppProvider or root layout
 * 
 * Only syncs when user is authenticated
 */
export function NotificationInitializer() {
  const { session } = useAuth();
  const { sync } = useNotifications();

  useEffect(() => {
    if (session?.user?.id && session?.isAuthenticated) {
      // Initial sync on mount
      sync();
    }
  }, [session?.user?.id, session?.isAuthenticated, sync]);

  return null;
}
