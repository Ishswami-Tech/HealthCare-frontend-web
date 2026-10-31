/**
 * Identity cookies (server-side only).
 *
 * Name and phone used to be copied into 7-day cookies (first_name, last_name,
 * user_name, verified_phone) so getServerSession could tell a patient had a
 * real name while the JWT claims were still stale after profile completion.
 * Personal data does not belong in long-lived cookies, so the only thing kept
 * now is a non-PII httpOnly flag; display names come from the JWT / profile
 * API. The legacy cookies are expired whenever identity cookies are written.
 */

/** httpOnly flag: the user has a meaningful first + last name on record. */
export const IDENTITY_COMPLETE_COOKIE = "identity_complete";

/** Old PII cookies; only ever expired now, never written. */
export const LEGACY_IDENTITY_COOKIES = [
  "first_name",
  "last_name",
  "user_name",
  "verified_phone",
] as const;

const IDENTITY_FLAG_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface CookieWriter {
  set(options: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  }): unknown;
}

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

function baseOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function expireLegacyIdentityCookies(store: CookieWriter): void {
  for (const name of LEGACY_IDENTITY_COOKIES) {
    store.set({ name, value: "", ...baseOptions(0) });
  }
}

/**
 * Records (or clears) the identity flag and removes any legacy PII cookies.
 * Pass `undefined` to leave the flag untouched (e.g. when the payload carries
 * no name fields at all).
 */
export function writeIdentityCookies(
  store: CookieWriter,
  hasMeaningfulName: boolean | undefined,
): void {
  expireLegacyIdentityCookies(store);
  if (hasMeaningfulName === true) {
    store.set({
      name: IDENTITY_COMPLETE_COOKIE,
      value: "true",
      ...baseOptions(IDENTITY_FLAG_MAX_AGE_SECONDS),
    });
  }
}

export function clearIdentityCookies(store: CookieWriter): void {
  expireLegacyIdentityCookies(store);
  store.set({ name: IDENTITY_COMPLETE_COOKIE, value: "", ...baseOptions(0) });
}

export function readIdentityComplete(store: CookieReader): boolean {
  return store.get(IDENTITY_COMPLETE_COOKIE)?.value === "true";
}
