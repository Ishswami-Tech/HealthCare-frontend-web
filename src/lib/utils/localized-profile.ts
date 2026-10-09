/**
 * Doctor public profile text in several languages (backend field `localizedProfile`).
 * Pure helpers: pick the text for the user's language and map it for the booking cards.
 */

export type LocalizedProfileLocale = "en" | "hi" | "mr";

export interface LocalizedProfileHighlight {
  icon?: string | undefined;
  text: string;
}

export interface LocalizedProfileEntry {
  name?: string | undefined;
  headline?: string | undefined;
  highlights?: LocalizedProfileHighlight[] | undefined;
}

export type LocalizedProfile = Partial<Record<LocalizedProfileLocale, LocalizedProfileEntry>>;

export interface LocalizedDoctorText {
  name?: string | undefined;
  headline?: string | undefined;
  highlights: LocalizedProfileHighlight[];
}

const clean = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

function normalizeEntry(raw: unknown): LocalizedProfileEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const highlights = Array.isArray(entry.highlights)
    ? entry.highlights.flatMap((item): LocalizedProfileHighlight[] => {
        if (!item || typeof item !== "object") return [];
        const text = clean((item as Record<string, unknown>).text);
        if (!text) return [];
        const icon = clean((item as Record<string, unknown>).icon);
        return [{ ...(icon ? { icon } : {}), text }];
      })
    : [];
  const name = clean(entry.name);
  const headline = clean(entry.headline);
  if (!name && !headline && highlights.length === 0) return null;
  return { name, headline, highlights };
}

/** Requested locale, then English, then the first language that has content, else null. */
export function pickLocalizedProfile(
  profile: unknown,
  locale: string | null | undefined,
): LocalizedProfileEntry | null {
  if (!profile || typeof profile !== "object") return null;
  const map = profile as Record<string, unknown>;
  const order = [locale ?? "", "en", ...Object.keys(map)];
  for (const key of order) {
    const entry = normalizeEntry(map[key]);
    if (entry) return entry;
  }
  return null;
}

/** The doctor's name, headline and highlight lines for the current language. */
export function toLocalizedDoctorText(
  profile: unknown,
  locale: string | null | undefined,
): LocalizedDoctorText | null {
  const entry = pickLocalizedProfile(profile, locale);
  if (!entry) return null;
  return { name: entry.name, headline: entry.headline, highlights: entry.highlights ?? [] };
}

/** Name for a doctor card: the localized name when there is one, else the formatted fallback. */
export function localizedDoctorName(
  profile: unknown,
  locale: string | null | undefined,
  fallback: string,
): string {
  return pickLocalizedProfile(profile, locale)?.name ?? fallback;
}

/** Subtitle for a doctor card: localized headline, else the plain specialization line. */
export function localizedDoctorSubtitle(
  profile: unknown,
  locale: string | null | undefined,
  fallback: string | undefined,
): string | undefined {
  return pickLocalizedProfile(profile, locale)?.headline ?? fallback;
}
