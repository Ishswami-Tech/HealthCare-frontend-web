"use client";

import { useState, type ElementType, type ReactNode, type SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Instagram,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Share2,
  Video,
  X,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: ElementType<SVGProps<SVGSVGElement>>;
  accent: string;
  badge: string;
  previewKind: "video" | "app" | "map" | "order";
};

type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
};

function getServiceCardClass(index: number) {
  if (index === 0) {
    // Video appointments - highlighted orange card
    return "border-orange-300 bg-orange-100/80 hover:bg-orange-200/60 dark:border-orange-700/50 dark:bg-orange-950/25 dark:hover:bg-orange-900/40 shadow-md shadow-orange-200/40 dark:shadow-orange-500/10";
  }
  const tones = [
    // Sky blue
    "border-sky-200 bg-sky-50/70 hover:bg-sky-100/55 dark:border-sky-900/35 dark:bg-sky-950/18 dark:hover:bg-sky-950/30",
    // Amber
    "border-amber-200 bg-amber-50/70 hover:bg-amber-100/55 dark:border-amber-900/35 dark:bg-amber-950/18 dark:hover:bg-amber-950/30",
    // Green
    "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/55 dark:border-emerald-900/35 dark:bg-emerald-950/18 dark:hover:bg-emerald-950/30",
    // Violet
    "border-violet-200 bg-violet-50/70 hover:bg-violet-100/55 dark:border-violet-900/35 dark:bg-violet-950/18 dark:hover:bg-violet-950/30",
    // Rose
    "border-rose-200 bg-rose-50/70 hover:bg-rose-100/55 dark:border-rose-900/35 dark:bg-rose-950/18 dark:hover:bg-rose-950/30",
    // Teal
    "border-teal-200 bg-teal-50/70 hover:bg-teal-100/55 dark:border-teal-900/35 dark:bg-teal-950/18 dark:hover:bg-teal-950/30",
  ];

  return tones[index % tones.length];
}

function getServiceAccentClass(index: number) {
  if (index === 0) {
    // Video appointments - orange accent with glow
    return "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30";
  }
  const tones = [
    // Sky blue
    "bg-sky-400 text-slate-900",
    // Amber
    "bg-amber-400 text-slate-900",
    // Green
    "bg-emerald-400 text-white",
    // Violet
    "bg-violet-400 text-white",
    // Rose
    "bg-rose-400 text-white",
    // Teal
    "bg-teal-400 text-white",
  ];

  return tones[index % tones.length];
}

function WhatsAppIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M20.5 3.5A11 11 0 0 0 2.2 16.3L1 23l6.9-1.2A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-4.1.7.7-4-.2-.4A9 9 0 1 1 12 20.5Zm5.2-6.7c-.3-.1-1.7-.8-2-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.1-.6 0a7.5 7.5 0 0 1-2.2-1.3 8.2 8.2 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.4.2-.3a.9.9 0 0 0 .1-.5c0-.1-.6-1.4-.9-2s-.5-.5-.6-.5h-.5c-.2 0-.5.1-.8.4s-1.1 1-1.1 2.4 1.1 2.8 1.2 3c.2.2 2 3 4.8 4.1.7.3 1.2.4 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.3.2-.6.2-1.1.1-1.2s-.3-.2-.6-.3Z" />
    </svg>
  );
}

function InstagramIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17.8 6.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Z" />
    </svg>
  );
}

function FacebookIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M13.5 22v-8.2h2.8l.4-3.1h-3.2V9.5c0-.9.3-1.6 1.7-1.6h1.7V5.1c-.8-.1-1.8-.2-3-.2-3 0-5 1.8-5 5.1v2.8H6v3.1h2.9V22h4.6Z" />
    </svg>
  );
}

function LinkedInIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M6.5 8.5H3.7V21h2.8V8.5ZM5.1 2.8A1.7 1.7 0 1 0 5.1 6.2 1.7 1.7 0 0 0 5.1 2.8ZM10.2 8.5H7.5V21h2.7v-6.1c0-1.6.3-3.1 2.3-3.1s2 1.8 2 3.2V21h2.8v-6.8c0-3.3-.7-5.7-4.1-5.7-1.6 0-2.7.9-3.1 1.8h-.1V8.5Z" />
    </svg>
  );
}

function SnapchatIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M12 2.5c2.6 0 4.7 2.1 4.7 4.7v3.1c0 .8.7 1.1 1.7 1.2.6 0 1 .3 1 .8 0 .5-.4.8-1 .9-.8.2-1.3.5-1.3 1.1 0 .4.4.8 1.1 1.1.8.4 1.5.6 1.5 1.2 0 .6-.5.8-1.1.9-.8.1-1.2.4-1.2.8 0 .5.5.8 1.1 1 .7.1 1 .4 1 .8 0 .6-.7.8-1.4.9-1.5.2-3 .7-4.2 1.8-.4.3-.7.7-.9 1.1-.3.5-.8.7-1.3.7s-1-.2-1.3-.7c-.2-.4-.5-.8-.9-1.1-1.2-1.1-2.7-1.6-4.2-1.8-.7-.1-1.4-.3-1.4-.9 0-.4.3-.7 1-.8.6-.2 1.1-.5 1.1-1 0-.4-.4-.7-1.2-.8-.6-.1-1.1-.4-1.1-.9 0-.6.7-.8 1.5-1.2.7-.3 1.1-.7 1.1-1.1 0-.6-.5-.9-1.3-1.1-.6-.1-1-.4-1-.9 0-.5.4-.8 1-.8 1-.1 1.7-.4 1.7-1.2V7.2c0-2.6 2.1-4.7 4.7-4.7Z" />
    </svg>
  );
}

const doctor = {
  name: "Dr. Chandrakumar Deshmukh",
  heroText:
    "Viddhakarma and agnikarma specialist pune Gold medal Infertility- Arthritis - autism- CP रजयपल भरत सरकर परसकत , वदयरतन, सशरतरतन ,वर वदय",
  phone: "+91 9860370961",
  location: "Pune, India",
  photo: "/drdeshmukh.webp",
  socialLinks: {
    instagram: "https://instagram.com/drchandrakumardeshmukh",
    youtube: "http://www.youtube.com/@viddhakarma",
    whatsapp: "https://wa.me/919860370961",
    email: "mailto:info@viddhakarma.com",
  },
};

const services: ServiceItem[] = [
  {
    id: "video-appointments",
    title: "Book Video Consultation",
    description: "Schedule an online video consultation with Dr. Deshmukh on the web.",
    href: "/patient/appointments?openBooking=1&mode=VIDEO",
    icon: Video,
    accent: "bg-orange-500",
    badge: "Book Now",
    previewKind: "app",
  },
  {
    id: "soup",
    title: "Charabi Bhasma Soup",
    description: "Open the product page for details and ordering.",
    href: "https://www.charabibhasma.com/product-page/charabi-bhasma-soup",
    icon: Flame,
    accent: "bg-amber-500",
    badge: "Rs 2,500",
    previewKind: "order",
  },
  {
    id: "android",
    title: "Appointment - Android",
    description: "Open the Android app listing.",
    href: "https://play.google.com/store/apps/details?id=com.syntagihealthcare.chandrakumardeshmukh&pcampaignid=web_share",
    icon: CalendarDays,
    accent: "bg-orange-500",
    badge: "Book now",
    previewKind: "app",
  },
  {
    id: "apple",
    title: "Appointment - Apple",
    description: "Open the iPhone app listing.",
    href: "https://apps.apple.com/in/app/syntagi-consult-doctor-online/id1479574621",
    icon: CalendarDays,
    accent: "bg-orange-500",
    badge: "Book now",
    previewKind: "app",
  },
  {
    id: "chinchwad",
    title: "Chinchwad Clinic",
    description: "Vishal market, near manakarnika aushadhalaya, bhaji mandai, Chinchwad, Pimpri-Chinchwad.",
    href: "https://maps.app.goo.gl/vUpHxgJ46WuhxacR8",
    icon: MapPin,
    accent: "bg-sky-500",
    badge: "Open maps",
    previewKind: "map",
  },
  {
    id: "nanapeth",
    title: "Nanapeth Clinic",
    description: "102, RAMPRASAD CHAMBERS, 368/1, Jawaharlal Nehru Rd, KIRAD HOSPITAL, SHRADDHA MEDICALS, New Nana Peth, Pune.",
    href: "https://maps.app.goo.gl/h32bZgQhb8r8YewX7",
    icon: MapPin,
    accent: "bg-sky-500",
    badge: "Open maps",
    previewKind: "map",
  },
  {
    id: "youtube",
    title: "Dr Chandrakumar Deshmukh - YouTube",
    description: "Open the main YouTube channel.",
    href: "http://www.youtube.com/@viddhakarma",
    icon: Youtube,
    accent: "bg-red-500",
    badge: "Watch now",
    previewKind: "video",
  },
  {
    id: "viddhakarma",
    title: "Viddhakarma As it is",
    description: "Open the Viddhakarma playlist.",
    href: "https://youtube.com/playlist?list=PL3ZA4ZyCkM0t_96X_VPMUTw1sKF6C3vRT&si=zaWUgJEqyujuGMWd",
    icon: Youtube,
    accent: "bg-red-500",
    badge: "Watch now",
    previewKind: "video",
  },
  {
    id: "autism",
    title: "Autism concepts",
    description: "Open the Autism concepts playlist.",
    href: "https://youtube.com/playlist?list=PL3ZA4ZyCkM0tjWUVGrEYr3XJFLHU063l3&si=ghHxiTW9Bzw2WMDj",
    icon: Youtube,
    accent: "bg-red-500",
    badge: "Watch now",
    previewKind: "video",
  },
];

function resolveHref(href: string) {
  if (typeof window === "undefined") {
    return href;
  }

  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return href;
  }
}

function isWebLink(href: string) {
  return href.startsWith("http");
}

function createThumbnailDataUri(title: string, kind: ServiceItem["previewKind"]) {
  const colors = {
    video: ["#ef4444", "#be123c"],
    app: ["#f97316", "#d97706"],
    map: ["#0ea5e9", "#2563eb"],
    order: ["#f59e0b", "#ea580c"],
  }[kind];
  const shortTitle = title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors[0]}" />
          <stop offset="100%" stop-color="${colors[1]}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#g)" />
      <circle cx="84" cy="34" r="18" fill="rgba(255,255,255,0.16)" />
      <circle cx="38" cy="84" r="20" fill="rgba(255,255,255,0.12)" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="700">
        ${shortTitle || "V"}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getFallbackThumbnail(service: ServiceItem) {
  if (service.previewKind === "map") {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="240" height="180" rx="28" fill="url(#g)" />
        <circle cx="120" cy="78" r="28" fill="rgba(255,255,255,0.18)" />
        <path d="M120 53c-14 0-25 11-25 25 0 20 25 49 25 49s25-29 25-49c0-14-11-25-25-25Zm0 34a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" fill="#fff" />
        <path d="M58 138h124" stroke="rgba(255,255,255,0.7)" stroke-width="8" stroke-linecap="round" />
        <text x="50%" y="154" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="700">Maps</text>
      </svg>
    `)}`;
  }

  return createThumbnailDataUri(service.title, service.previewKind);
}

function getShareText(service: ServiceItem) {
  return [doctor.name, service.title, service.description, resolveHref(service.href)].join("\n");
}

function ServiceLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: ReactNode;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} prefetch>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={isWebLink(href) ? "_blank" : undefined}
      rel="noreferrer noopener"
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

export default function DrDeshmukhPage() {
  const [pageCopied, setPageCopied] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const activeService = services.find((service) => service.id === activeServiceId) ?? null;

  const { data: previews = {} } = useQuery({
    queryKey: ["drdeshmukh-link-previews"],
    queryFn: async () => {
      const results = await Promise.allSettled(
        services.map(async (service) => {
          if (service.previewKind === "map") {
            return null;
          }
          const href = resolveHref(service.href);
          if (!isWebLink(href)) {
            return null;
          }

          const response = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, {
            cache: "no-store",
          });
          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as LinkPreview;
          return [service.id, data] as const;
        })
      );

      const nextPreviews: Record<string, LinkPreview> = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const [id, data] = result.value;
          nextPreviews[id] = data;
        }
      }

      return nextPreviews;
    },
  });

  const handleCopy = async (text: string, target: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 1500);
  };

  const handleShareLink = async (service: ServiceItem) => {
    const url = resolveHref(service.href);

    if (navigator.share) {
      try {
        await navigator.share({
          title: service.title,
          text: getShareText(service),
          url,
        });
        return;
      } catch {
        // fall back to clipboard
      }
    }

    await handleCopy(url, `share:${service.id}`);
  };

  const handleSharePage = async () => {
    const shareUrl = window.location.href;
    const shareText = `${doctor.name} - appointments, treatments, and verified links`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: doctor.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fall back to clipboard
      }
    }

    await handleCopy(shareUrl, "page");
    setPageCopied(true);
    window.setTimeout(() => setPageCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200">
              <Image
                src={doctor.photo}
                alt={doctor.name}
                width={36}
                height={36}
                className="size-9 object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{doctor.name}</h1>
            </div>
          </div>

          <Button
            onClick={handleSharePage}
            size="sm"
            variant="outline"
            className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {pageCopied ? (
              <>
                <Check className="size-4" />
                Copied
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                Share
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 py-4 pb-safe-or-10 sm:px-5 sm:py-5">
        <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-rose-50 via-white to-sky-50 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center md:gap-6">
            <div className="relative mx-auto mt-4 h-[150px] w-[150px] overflow-hidden rounded-full bg-slate-100 ring-4 ring-white/90 shadow-lg dark:bg-slate-800 dark:ring-slate-900 md:my-4 md:ml-4 md:mt-0 md:h-40 md:w-40 md:mr-2">
              <Image
                src={doctor.photo}
                alt={doctor.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 150px, 160px"
              />
            </div>

            <div className="gap-y-3 px-4 pb-4 pt-1 text-center md:px-6 md:py-5 md:pl-2 md:text-left">
              <div className="gap-y-1">
                <h2 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {doctor.name}
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:mx-0 sm:text-base">
                  {doctor.heroText}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                {[
                  { label: "Instagram", href: doctor.socialLinks.instagram, icon: InstagramIcon, bg: "bg-pink-500" },
                  { label: "Email", href: doctor.socialLinks.email, icon: Mail, bg: "bg-slate-700" },
                  { label: "YouTube", href: doctor.socialLinks.youtube, icon: Youtube, bg: "bg-red-500" },
                  { label: "WhatsApp", href: doctor.socialLinks.whatsapp, icon: WhatsAppIcon, bg: "bg-emerald-500" },
                  { label: "Phone", href: `tel:${doctor.phone}`, icon: Phone, bg: "bg-slate-700" },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <ServiceLink
                      key={link.label}
                      href={link.href}
                      className={`flex size-10 items-center justify-center rounded-full ${
                        link.label === "Instagram"
                          ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500"
                          : link.bg
                      } text-white shadow-sm transition-transform hover:scale-105 sm:h-11 sm:w-11`}
                      aria-label={link.label}
                    >
                      <Icon className="size-5" />
                    </ServiceLink>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 gap-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-sky-700 dark:text-sky-300 sm:text-lg">Links</h3>
            <p className="hidden rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 sm:block">
              Tap a row to open or use the three dots to share.
            </p>
          </div>

          <div className="gap-y-1.5">
            {services.map((service, serviceIndex) => {
              const thumbnail =
                service.previewKind === "map"
                  ? getFallbackThumbnail(service)
                  : previews[service.id]?.image || getFallbackThumbnail(service);
              const previewTitle =
                service.previewKind === "map" ? service.title : previews[service.id]?.title || service.title;
              const previewDescription =
                service.previewKind === "map"
                  ? service.description
                  : previews[service.id]?.description || service.description;

              return (
                <div
                  key={service.id}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 shadow-none transition-colors sm:gap-3 sm:px-3 sm:py-2.5 ${getServiceCardClass(
                    serviceIndex
                  )}`}
                >
                  <ServiceLink href={service.href} className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                    <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 sm:h-11 sm:w-11">
                      {service.previewKind === "map" || previews[service.id]?.image ? (
                        <img
                          src={thumbnail}
                          alt={previewTitle}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center ${getServiceAccentClass(serviceIndex)}`}
                          aria-hidden="true"
                        >
                          <service.icon className="size-4 sm:h-5 sm:w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
                        {previewTitle}
                      </h4>
                      {service.previewKind !== "map" && previews[service.id]?.siteName ? (
                        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                          {previews[service.id]?.siteName}
                        </p>
                      ) : null}
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:line-clamp-1 sm:text-xs">
                        {previewDescription}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {service.badge}
                      </span>
                    </div>
                  </ServiceLink>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label={`More actions for ${service.title}`}
                    onClick={() => setActiveServiceId(service.id)}
                  >
                    <MoreVertical className="size-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(activeService)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveServiceId(null);
          }
        }}
      >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-lg"
      >
        {activeService ? (
          <>
            <DialogTitle className="sr-only">Share - {activeService.title}</DialogTitle>

            <div className="relative border-b border-slate-100 bg-white px-4 py-4 pr-14 dark:border-slate-800 dark:bg-slate-950">
              <DialogClose asChild>
                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </button>
              </DialogClose>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div
                  className={`flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm sm:h-20 sm:w-20 sm:max-w-20 ${
                    activeService.previewKind === "map"
                      ? "border-2 border-sky-300 ring-2 ring-sky-200/70 dark:border-sky-500 dark:ring-sky-500/30"
                      : previews[activeService.id]?.image
                        ? "border-2 border-sky-300 ring-2 ring-sky-200/70 dark:border-sky-500 dark:ring-sky-500/30"
                        : "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  }`}
                >
                  {activeService.previewKind === "map" || previews[activeService.id]?.image ? (
                    <img
                      src={activeService.previewKind === "map" ? getFallbackThumbnail(activeService) : previews[activeService.id]?.image || getFallbackThumbnail(activeService)}
                      alt={activeService.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center ${getServiceAccentClass(services.findIndex((service) => service.id === activeService.id))}`}
                      aria-hidden="true"
                    >
                      <activeService.icon className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {activeService.previewKind === "map"
                      ? activeService.title
                      : previews[activeService.id]?.title || activeService.title}
                  </p>
                  {activeService.previewKind !== "map" && previews[activeService.id]?.siteName ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {previews[activeService.id]?.siteName}
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {activeService.previewKind === "map"
                      ? activeService.description
                      : previews[activeService.id]?.description || activeService.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100vh-13rem)] gap-y-4 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {resolveHref(activeService.href)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full text-slate-500 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    onClick={() => handleCopy(resolveHref(activeService.href), `service:${activeService.id}`)}
                    aria-label="Copy link"
                  >
                    {copiedTarget === `service:${activeService.id}` ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleShareLink(activeService)}
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 dark:bg-slate-100 dark:text-slate-900"
                  aria-label="Share link"
                  title="Share link"
                >
                  {copiedTarget === `share:${activeService.id}` ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="size-3.5" />
                  )}
                  <span className="sr-only">Share link</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(resolveHref(activeService.href), `service:${activeService.id}`)}
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-sky-500 text-white shadow-sm transition-transform hover:scale-105 dark:bg-sky-400 dark:text-slate-950"
                  aria-label="Copy link"
                  title="Copy link"
                >
                  {copiedTarget === `service:${activeService.id}` ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span className="sr-only">Copy link</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolveHref(activeService.href))}`, "_blank", "noreferrer")}
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition-transform hover:scale-105"
                  aria-label="Share on Facebook"
                  title="Share on Facebook"
                >
                  <FacebookIcon className="size-3.5" />
                  <span className="sr-only">Share on Facebook</span>
                </button>

                <ServiceLink
                  href={doctor.socialLinks.instagram}
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-sm transition-transform hover:scale-105"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <InstagramIcon className="size-3.5" />
                  <span className="sr-only">Instagram</span>
                </ServiceLink>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getShareText(activeService))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105"
                  aria-label="Share on WhatsApp"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon className="size-3.5" />
                  <span className="sr-only">Share on WhatsApp</span>
                </a>

                <ServiceLink
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resolveHref(activeService.href))}`}
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-sm transition-transform hover:scale-105"
                  aria-label="Share on LinkedIn"
                  title="Share on LinkedIn"
                >
                  <LinkedInIcon className="size-3.5" />
                  <span className="sr-only">Share on LinkedIn</span>
                </ServiceLink>
              <ServiceLink
                href={activeService.href}
                className="flex h-8 flex-none items-center justify-center gap-1 rounded-full bg-emerald-500 px-2.5 text-[10px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
                aria-label="Open here"
                title="Open here"
              >
                <ExternalLink className="size-2.5" />
                <span>Open here</span>
              </ServiceLink>
              </div>

              <div className="pb-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Share preview
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {getShareText(activeService)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
      </Dialog>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
          <p>Authentic Ayurvedic healing and patient support.</p>
          <p>{doctor.location}</p>
        </div>
      </footer>
    </div>
  );
}


