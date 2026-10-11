/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Reload public configuration whenever the browser restarts this worker.
// A postMessage alone is lost when the worker is stopped in the background.
importScripts("/api/firebase/config");
let firebaseConfig = self.__FIREBASE_CONFIG__;
let messaging = null;

// Listen for Firebase config from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    firebaseConfig = event.data.firebaseConfig;
    initializeFirebase();
  }
});

// Initialize Firebase
function initializeFirebase() {
  if (messaging) {
    return;
  }
  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return;
  }

  try {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Retrieve an instance of Firebase Messaging
    messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      // Firebase already displays notification payloads in the background.
      if (payload.notification) {
        return;
      }

      const notificationTitle =
        payload.data?.title || "New Notification";
      const notificationOptions = {
        body: payload.data?.body || "",
        icon: payload.notification?.icon || "/icon-192x192.png",
        badge: "/badge-72x72.png",
        image: payload.notification?.image,
        data: payload.data || {},
        tag: payload.data?.id || "notification",
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
      };

      return self.registration.showNotification(
        notificationTitle,
        notificationOptions
      );
    });

    console.log("[firebase-messaging-sw.js] Firebase initialized successfully");
  } catch (error) {
    console.error(
      "[firebase-messaging-sw.js] Error initializing Firebase:",
      error
    );
  }
}

initializeFirebase();

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  // Handle notification click action
  const data = event.notification.data || {};
  const link = data.link || data.url || "/";

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === link && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      })
  );
});












