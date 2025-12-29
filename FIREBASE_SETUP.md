# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the healthcare frontend application.

## Prerequisites

1. Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Web app registered in Firebase project
3. Firebase Cloud Messaging API enabled

## Environment Variables

Add the following environment variables to your `.env.local`, `.env.development`, and `.env.production` files:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

## Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on the web app (or create one if it doesn't exist)
7. Copy the configuration values

## Getting VAPID Key

1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Under "Web Push certificates", click "Generate key pair" if you don't have one
5. Copy the key pair (this is your VAPID key)

## Features Implemented

### 1. Firebase Initialization (`src/lib/firebase/firebase.ts`)
- Initializes Firebase app with configuration
- Provides functions for:
  - Requesting notification permission
  - Getting FCM token
  - Handling foreground messages
  - Checking Firebase configuration

### 2. FCM Hook (`src/hooks/useFCM.ts`)
- React hook for managing FCM tokens
- Automatically registers token with backend when available
- Handles permission requests
- Manages token registration state

### 3. Service Worker (`public/firebase-messaging-sw.js`)
- Handles background push notifications
- Shows notifications when app is in background
- Handles notification clicks
- Opens app on notification click

### 4. Push Notification Provider (`src/components/push-notifications/PushNotificationProvider.tsx`)
- Registers service worker
- Injects Firebase config into service worker
- Automatically requests notification permission
- Manages push notification lifecycle

## API Integration

The FCM token is automatically registered with the backend via:
```
POST /api/v1/communication/push/device-token
```

Request body:
```json
{
  "token": "fcm_token_here",
  "platform": "web",
  "userId": "user_id_here",
  "deviceModel": "Chrome",
  "osVersion": "Windows 10",
  "appVersion": "1.0.0"
}
```

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in a browser that supports push notifications (Chrome, Firefox, Edge)

3. Check the browser console for:
   - "Firebase initialized successfully"
   - "Service Worker registered"
   - "FCM token retrieved successfully"
   - "Device token registered successfully"

4. Test sending a push notification from the backend:
   ```bash
   curl -X POST http://localhost:8088/api/v1/communication/push \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "deviceToken": "YOUR_FCM_TOKEN",
       "title": "Test Notification",
       "body": "This is a test push notification",
       "data": {
         "type": "test",
         "id": "123"
       }
     }'
   ```

## Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Edge
- ✅ Safari (macOS 16.4+)
- ❌ Safari (iOS) - Limited support

## Troubleshooting

### Service Worker Not Registering
- Ensure the service worker file is in the `public` folder
- Check browser console for errors
- Verify HTTPS is enabled (required for service workers in production)

### FCM Token Not Retrieved
- Check that VAPID key is correctly configured
- Verify Firebase configuration is complete
- Check browser console for errors
- Ensure notification permission is granted

### Token Not Registered with Backend
- Check network tab for API call
- Verify user is authenticated
- Check backend logs for errors
- Ensure API endpoint is correct

### Notifications Not Showing
- Check notification permission status
- Verify service worker is active
- Check browser notification settings
- Test with a simple notification first

## Next Steps

1. Add notification preferences UI
2. Implement notification categories
3. Add notification history
4. Implement notification actions
5. Add notification sound customization




