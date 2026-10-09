import { pickLocalizedProfile, type LocalizedProfile } from "@/lib/utils/localized-profile";

export const PROFILE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
] as const;

export type ProfileLanguageCode = (typeof PROFILE_LANGUAGES)[number]["code"];

export interface LocalizedHighlightDraft {
  icon: string;
  text: string;
}

export interface LocalizedLanguageDraft {
  name: string;
  headline: string;
  highlights: LocalizedHighlightDraft[];
}

export type LocalizedProfileDraft = Record<ProfileLanguageCode, LocalizedLanguageDraft>;

const emptyLanguage = (): LocalizedLanguageDraft => ({ name: "", headline: "", highlights: [] });

export function emptyLocalizedProfileDraft(): LocalizedProfileDraft {
  return { en: emptyLanguage(), hi: emptyLanguage(), mr: emptyLanguage() };
}

/** Form state from the doctor record's `localizedProfile` (anything else gives empty groups). */
export function toLocalizedProfileDraft(raw: unknown): LocalizedProfileDraft {
  const draft = emptyLocalizedProfileDraft();
  if (!raw || typeof raw !== "object") return draft;
  for (const { code } of PROFILE_LANGUAGES) {
    const entry = pickLocalizedProfile({ [code]: (raw as Record<string, unknown>)[code] }, code);
    if (!entry) continue;
    draft[code] = {
      name: entry.name ?? "",
      headline: entry.headline ?? "",
      highlights: (entry.highlights ?? []).map((item) => ({ icon: item.icon ?? "", text: item.text })),
    };
  }
  return draft;
}

/** Request body value: only languages with content; null when everything is empty. */
export function toLocalizedProfilePayload(draft: LocalizedProfileDraft): LocalizedProfile | null {
  const payload: LocalizedProfile = {};
  for (const { code } of PROFILE_LANGUAGES) {
    const { name, headline, highlights } = draft[code];
    const cleanHighlights = highlights
      .map((item) => ({ icon: item.icon.trim(), text: item.text.trim() }))
      .filter((item) => item.text)
      .map((item) => (item.icon ? item : { text: item.text }));
    const cleanName = name.trim();
    const cleanHeadline = headline.trim();
    if (!cleanName && !cleanHeadline && cleanHighlights.length === 0) continue;
    payload[code] = {
      ...(cleanName ? { name: cleanName } : {}),
      ...(cleanHeadline ? { headline: cleanHeadline } : {}),
      ...(cleanHighlights.length > 0 ? { highlights: cleanHighlights } : {}),
    };
  }
  return Object.keys(payload).length > 0 ? payload : null;
}
