"use client";

import { useEffect } from "react";
import { useNotifications } from "@/hooks/query/useNotifications";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * Component to initialize notification sync on app start
 * Should be placed in AppProvider or root layout
 * 
 * Only syncs when user is authenticated AND has an access token
 */
export function NotificationInitializer() {
  const { session } = useAuth();
  const { sync } = useNotifications();

  useEffect(() => {
    // Only sync if user is authenticated AND has an access token
    // This prevents "No access token found" errors during login flow
    if (session?.user?.id && session?.access_token) {
      // Initial sync on mount
      sync();
    }
  }, [session?.user?.id, session?.access_token, sync]);

  return null;
}
