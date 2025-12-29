/**
 * Firebase Initialization
 * 
 * Initializes Firebase app and messaging for push notifications
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';
import { APP_CONFIG } from '@/lib/config/config';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase App
 */
export function initializeFirebase(): FirebaseApp | null {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase config is available
  const firebaseConfig = {
    apiKey: APP_CONFIG.FIREBASE.API_KEY,
    authDomain: APP_CONFIG.FIREBASE.AUTH_DOMAIN,
    projectId: APP_CONFIG.FIREBASE.PROJECT_ID,
    storageBucket: APP_CONFIG.FIREBASE.STORAGE_BUCKET,
    messagingSenderId: APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
    appId: APP_CONFIG.FIREBASE.APP_ID,
  };

  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is incomplete. Push notifications will be disabled.');
    return null;
  }

  try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      return firebaseApp;
    }

    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 * Must be called in browser context only
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (messaging) {
    return messaging;
  }

  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      return null;
    }
  }

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error('Failed to get Firebase Messaging:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  const vapidKey = APP_CONFIG.FIREBASE.VAPID_KEY;
  if (!vapidKey) {
    console.warn('Firebase VAPID key is not configured');
    return null;
  }

  try {
    const token = await getToken(messagingInstance, {
      vapidKey,
    });

    if (token) {
      console.log('FCM token retrieved successfully');
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Set up foreground message handler
 */
export function onForegroundMessage(
  callback: (payload: any) => void
): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  try {
    return onMessage(messagingInstance, callback);
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return null;
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    APP_CONFIG.FIREBASE.API_KEY &&
    APP_CONFIG.FIREBASE.PROJECT_ID &&
    APP_CONFIG.FIREBASE.VAPID_KEY
  );
}






