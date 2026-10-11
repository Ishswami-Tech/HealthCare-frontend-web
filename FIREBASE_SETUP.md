# Firebase setup

This portal uses the existing `healthcare-dabe7` project and web app
`1:803018683216:web:94da712d8b145b6a3b7255` for Firebase Cloud Messaging.
The Firebase SDK is already installed. The application's existing backend owns
user authentication and healthcare data.

The downloaded web configuration is in the ignored `.env.local` file. Add the
project's **public** Web Push certificate key as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
Find it in Firebase Console → Project settings → Cloud Messaging → Web Push
certificates. Never put a private VAPID key or service account in public variables.

For deployments, copy the `NEXT_PUBLIC_FIREBASE_*` settings listed in
`.env.example` into the deployment environment **before building** Next.js.
Restart the development server after changing local environment values.

The worker loads public client configuration from `/api/firebase/config` on
startup, including when the browser restarts it while the page is closed.
Token registration uses the same worker at `/firebase-messaging-sw.js`.
No server credentials are exposed by the configuration endpoint.

To verify delivery, use HTTPS (or localhost), sign in, grant notification
permission, confirm token registration with the backend, and test foreground,
background, closed-tab, and notification-tap behavior. The backend must use
Firebase Admin credentials for `healthcare-dabe7`. Local sign-in to the Firebase
CLI does not configure those backend credentials. Use generic test messages
without patient information.

Run `npm run type-check` and `npm run lint` before release. A new build and
deployment are required to apply deployment environment changes.
