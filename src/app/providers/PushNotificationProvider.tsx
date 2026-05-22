/**
 * Push Notification Provider
 *
 * Manages push notification initialization and token registration
 */

"use client";

import React, { useEffect, useRef } from "react";
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
    isLoading,
    requestPermission,
  } = useFCM();

  const serviceWorkerRegisteredRef = useRef(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const hasFirebaseConfig =
      APP_CONFIG.FIREBASE.API_KEY &&
      APP_CONFIG.FIREBASE.PROJECT_ID &&
      APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID &&
      APP_CONFIG.FIREBASE.APP_ID;

    if (!hasFirebaseConfig) {
      return;
    }

    let isActive = true;
    let registrationRef: ServiceWorkerRegistration | null = null;
    let installingWorkerRef: ServiceWorker | null = null;
    let installingStateHandler: (() => void) | null = null;
    let updateFoundHandler: (() => void) | null = null;

    const registerServiceWorker = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );

        if (!isActive) {
          return;
        }

        registrationRef = registration;

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
            installingWorkerRef = registration.installing;
            installingStateHandler = () => {
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
            };
            installingWorkerRef.addEventListener("statechange", installingStateHandler);
          }
        };

        sendConfigToSW();

        serviceWorkerRegisteredRef.current = true;

        // Listen for service worker updates
        updateFoundHandler = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
              }
            });
          }
        };
        registration.addEventListener("updatefound", updateFoundHandler);
      } catch {
        // Service Worker registration failed silently — push notifications unavailable
      }
    };

    registerServiceWorker();

    return () => {
      isActive = false;
      if (registrationRef && updateFoundHandler) {
        registrationRef.removeEventListener("updatefound", updateFoundHandler);
      }
      if (installingWorkerRef && installingStateHandler) {
        installingWorkerRef.removeEventListener("statechange", installingStateHandler);
      }
    };
  }, []);

  // Request permission when supported and not already granted
  useEffect(() => {
    if (
      isSupported &&
      permission === "default" &&
      !isLoading &&
      serviceWorkerRegisteredRef.current &&
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
    requestPermission,
  ]);


  return <>{children}</>;
}
