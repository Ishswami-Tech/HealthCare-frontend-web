import { APP_CONFIG } from '@/lib/config/config';

export const dynamic = 'force-dynamic';

/** Public client configuration only; never include Firebase Admin credentials. */
export function GET(): Response {
  const config = {
    apiKey: APP_CONFIG.FIREBASE.API_KEY,
    authDomain: APP_CONFIG.FIREBASE.AUTH_DOMAIN,
    projectId: APP_CONFIG.FIREBASE.PROJECT_ID,
    storageBucket: APP_CONFIG.FIREBASE.STORAGE_BUCKET,
    messagingSenderId: APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
    appId: APP_CONFIG.FIREBASE.APP_ID,
  };

  return new Response(`self.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
