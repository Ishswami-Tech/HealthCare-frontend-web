/**
 * Push Notification Provider
 *
 * Manages push notification initialization and token registration
 */

"use client";

import React, { useEffect, useState } from "react";
import { useFCM } from "@/hooks/realtime/useFCM";
import { APP_CONFIG } from "@/lib/config/config";

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export function PushNotificationProvider({
  children,
}: PushNotificationProviderProps) {
  const {
    isSupported,
    permission,
    isRegistered,
    isLoading,
    requestPermission,
  } = useFCM();

  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );

        console.log("Service Worker registered:", registration);

        // Inject Firebase config into service worker
        const sendConfigToSW = () => {
          if (registration.active) {
            registration.active.postMessage({
              type: "FIREBASE_CONFIG",
              firebaseConfig: {
                apiKey: APP_CONFIG.FIREBASE.API_KEY,
                authDomain: APP_CONFIG.FIREBASE.AUTH_DOMAIN,
                projectId: APP_CONFIG.FIREBASE.PROJECT_ID,
                storageBucket: APP_CONFIG.FIREBASE.STORAGE_BUCKET,
                messagingSenderId: APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
                appId: APP_CONFIG.FIREBASE.APP_ID,
              },
            });
          } else if (registration.installing) {
            registration.installing.addEventListener("statechange", () => {
              if (registration.installing?.state === "activated") {
                registration.active?.postMessage({
                  type: "FIREBASE_CONFIG",
                  firebaseConfig: {
                    apiKey: APP_CONFIG.FIREBASE.API_KEY,
                    authDomain: APP_CONFIG.FIREBASE.AUTH_DOMAIN,
                    projectId: APP_CONFIG.FIREBASE.PROJECT_ID,
                    storageBucket: APP_CONFIG.FIREBASE.STORAGE_BUCKET,
                    messagingSenderId: APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
                    appId: APP_CONFIG.FIREBASE.APP_ID,
                  },
                });
              }
            });
          }
        };

        sendConfigToSW();

        setServiceWorkerRegistered(true);

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log(
                  "New service worker available. Please refresh the page."
                );
              }
            });
          }
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);

  // Request permission when supported and not already granted
  useEffect(() => {
    if (
      isSupported &&
      permission === "default" &&
      !isLoading &&
      serviceWorkerRegistered &&
      APP_CONFIG.FEATURES.NOTIFICATIONS
    ) {
      // Auto-request permission after a short delay
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    isSupported,
    permission,
    isLoading,
    serviceWorkerRegistered,
    requestPermission,
  ]);

  // Log registration status
  useEffect(() => {
    if (isRegistered) {
      console.log("Push notifications registered successfully");
    }
  }, [isRegistered]);

  return <>{children}</>;
}
