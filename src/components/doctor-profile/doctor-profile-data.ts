import { CalendarDays, Flame, MapPin, Phone, Video, Youtube, type LucideIcon } from "lucide-react";
import { HOME_LINKS } from "@/components/home/home-links";
import type { HomeTint } from "@/components/home/home-theme";

export type PreviewKind = "video" | "app" | "map" | "order";

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tint: HomeTint;
  badge: string;
  previewKind: PreviewKind;
  /** The primary conversion link, rendered as a large highlighted card. */
  featured?: boolean;
};

export type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
};

export const DOCTOR = {
  phone: "+91 9860370961",
  clinicPhone: "9860370961",
  location: "Pune, India",
  photo: "/drdeshmukh.webp",
  socialLinks: {
    instagram: "https://instagram.com/drchandrakumardeshmukh",
    youtube: HOME_LINKS.youtube,
    whatsapp: "https://wa.me/917972548944",
    email: "mailto:info@viddhakarma.com",
  },
} as const;

type Translate = (path: string) => string;

export function buildDoctorServices(t: Translate): ServiceItem[] {
  const doctorName = t("team.teamMembers.drDeshmukh.name");

  return [
    {
      id: "video-appointments",
      title: t("drDeshmukhPage.services.videoAppointments.title"),
      description: t("drDeshmukhPage.services.videoAppointments.description"),
      href: HOME_LINKS.videoBooking,
      icon: Video,
      tint: "emerald",
      badge: t("drDeshmukhPage.services.videoAppointments.badge"),
      previewKind: "app",
      featured: true,
    },
    {
      id: "soup",
      title: t("drDeshmukhPage.services.soup.title"),
      description: t("drDeshmukhPage.services.soup.description"),
      href: "https://www.charabibhasma.com/product-page/charabi-bhasma-soup",
      icon: Flame,
      tint: "amber",
      badge: t("drDeshmukhPage.services.soup.badge"),
      previewKind: "order",
    },
    {
      id: "android",
      title: t("drDeshmukhPage.services.android.title"),
      description: t("drDeshmukhPage.services.android.description"),
      href: "https://play.google.com/store/apps/details?id=com.syntagihealthcare.chandrakumardeshmukh&pcampaignid=web_share",
      icon: CalendarDays,
      tint: "sky",
      badge: t("drDeshmukhPage.services.android.badge"),
      previewKind: "app",
    },
    {
      id: "apple",
      title: t("drDeshmukhPage.services.apple.title"),
      description: t("drDeshmukhPage.services.apple.description"),
      href: "https://apps.apple.com/in/app/syntagi-consult-doctor-online/id1479574621",
      icon: CalendarDays,
      tint: "sky",
      badge: t("drDeshmukhPage.services.apple.badge"),
      previewKind: "app",
    },
    {
      id: "chinchwad",
      title: t("drDeshmukhPage.services.chinchwad.title"),
      description: t("drDeshmukhPage.services.chinchwad.description"),
      href: "https://maps.app.goo.gl/vUpHxgJ46WuhxacR8",
      icon: MapPin,
      tint: "teal",
      badge: t("drDeshmukhPage.services.chinchwad.badge"),
      previewKind: "map",
    },
    {
      id: "nanapeth",
      title: t("drDeshmukhPage.services.nanapeth.title"),
      description: t("drDeshmukhPage.services.nanapeth.description"),
      href: "https://maps.app.goo.gl/h32bZgQhb8r8YewX7",
      icon: MapPin,
      tint: "teal",
      badge: t("drDeshmukhPage.services.nanapeth.badge"),
      previewKind: "map",
    },
    {
      id: "youtube",
      title: `${doctorName} - YouTube`,
      description: t("drDeshmukhPage.services.youtube.description"),
      href: HOME_LINKS.youtube,
      icon: Youtube,
      tint: "rose",
      badge: t("drDeshmukhPage.services.youtube.badge"),
      previewKind: "video",
    },
    {
      id: "viddhakarma",
      title: t("drDeshmukhPage.services.viddhakarma.title"),
      description: t("drDeshmukhPage.services.viddhakarma.description"),
      href: "https://youtube.com/playlist?list=PL3ZA4ZyCkM0t_96X_VPMUTw1sKF6C3vRT&si=zaWUgJEqyujuGMWd",
      icon: Youtube,
      tint: "rose",
      badge: t("drDeshmukhPage.services.viddhakarma.badge"),
      previewKind: "video",
    },
    {
      id: "autism",
      title: t("drDeshmukhPage.services.autism.title"),
      description: t("drDeshmukhPage.services.autism.description"),
      href: "https://youtube.com/playlist?list=PL3ZA4ZyCkM0tjWUVGrEYr3XJFLHU063l3&si=ghHxiTW9Bzw2WMDj",
      icon: Youtube,
      tint: "rose",
      badge: t("drDeshmukhPage.services.autism.badge"),
      previewKind: "video",
    },
    {
      id: "call-clinic",
      title: t("drDeshmukhPage.services.callClinic.title"),
      description: t("drDeshmukhPage.services.callClinic.description"),
      href: `tel:${DOCTOR.clinicPhone}`,
      icon: Phone,
      tint: "violet",
      badge: t("drDeshmukhPage.services.callClinic.badge"),
      previewKind: "app",
    },
  ];
}

/** Turns relative routes into absolute URLs for sharing; passes other hrefs through. */
export function resolveHref(href: string): string {
  if (typeof window === "undefined") {
    return href;
  }

  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return href;
  }
}

export function isWebLink(href: string): boolean {
  return href.startsWith("http");
}

export function getShareText(service: ServiceItem, doctorName: string): string {
  return [doctorName, service.title, service.description, resolveHref(service.href)].join("\n");
}

const MAP_THUMBNAIL_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#0d9488" />
      </linearGradient>
    </defs>
    <rect width="240" height="180" rx="28" fill="url(#g)" />
    <circle cx="120" cy="78" r="28" fill="rgba(255,255,255,0.18)" />
    <path d="M120 53c-14 0-25 11-25 25 0 20 25 49 25 49s25-29 25-49c0-14-11-25-25-25Zm0 34a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" fill="#fff" />
    <path d="M58 138h124" stroke="rgba(255,255,255,0.7)" stroke-width="8" stroke-linecap="round" />
    <text x="50%" y="154" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="700">Maps</text>
  </svg>
`;

export const MAP_THUMBNAIL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(MAP_THUMBNAIL_SVG)}`;

export type ResolvedPreview = {
  title: string;
  description: string;
  image?: string;
  siteName?: string;
};

/** Merges fetched Open Graph data with the static service copy. Maps always use the local artwork. */
export function resolvePreview(service: ServiceItem, preview?: LinkPreview): ResolvedPreview {
  if (service.previewKind === "map") {
    return { title: service.title, description: service.description, image: MAP_THUMBNAIL };
  }

  return {
    title: preview?.title || service.title,
    description: preview?.description || service.description,
    image: preview?.image,
    siteName: preview?.siteName,
  };
}

export type HeroTextParts = { tagline: string[]; achievements: string[] };

/**
 * The hero text is authored as "<role> | <specialities>\n\n<emoji> <achievement> | ..." in
 * every language. Split it so the credentials can be shown as a badge grid.
 */
export function splitHeroText(text: string): HeroTextParts {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [firstLine = "", ...rest] = lines;

  const toParts = (value: string) =>
    value
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

  return { tagline: toParts(firstLine), achievements: toParts(rest.join(" | ")) };
}

const WORD_CHARACTER = /[A-Za-z0-9ऀ-ॿ]/;

/** Separates a leading emoji from an achievement such as "🏅 Honored by the Governor of India". */
export function splitAchievement(item: string): { icon: string | null; label: string } {
  const [first = "", ...rest] = item.split(/\s+/);
  if (rest.length === 0 || WORD_CHARACTER.test(first)) {
    return { icon: null, label: item };
  }
  return { icon: first, label: rest.join(" ") };
}
