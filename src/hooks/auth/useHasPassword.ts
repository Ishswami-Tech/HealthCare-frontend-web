"use client";

import { useAuth } from "./useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";

/**
 * Whether the signed-in account has a password set: `true`, `false`, or `undefined` while it is
 * not known. Reads `hasPassword` from the profile (`GET /user/profile`) or the session user; on
 * older payloads without the flag it falls back to "signed in with a password".
 */
export function useHasPassword(): boolean | undefined {
  const { session } = useAuth();
  const { data: profile } = useUserProfile({ enabled: !!session?.user });
  const fromProfile = readFlag(profile);
  if (fromProfile !== undefined) return fromProfile;
  const fromSession = session?.user?.hasPassword;
  if (typeof fromSession === "boolean") return fromSession;
  return session?.user?.loginMethod === "password" ? true : undefined;
}

function readFlag(profile: unknown): boolean | undefined {
  if (!profile || typeof profile !== "object") return undefined;
  const record = profile as Record<string, unknown>;
  if (typeof record.hasPassword === "boolean") return record.hasPassword;
  const nested = record.data;
  if (nested && typeof nested === "object" && typeof (nested as Record<string, unknown>).hasPassword === "boolean") {
    return (nested as Record<string, unknown>).hasPassword as boolean;
  }
  return undefined;
}
