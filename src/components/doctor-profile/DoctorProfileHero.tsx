"use client";

import { Check, Mail, Phone, Share2, Sprout, Youtube, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton, SmartLink } from "@/components/home/HomeLinkButton";
import { Float, Reveal } from "@/components/home/home-motion";
import { toTelHref } from "@/components/home/home-links";
import { CONTAINER } from "@/components/home/home-theme";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTROL_LIFT, CONTROL_TRANSITION } from "@/lib/design/tokens";
import { DOCTOR, splitHeroText } from "./doctor-profile-data";
import { DoctorCredentials, DoctorPortrait, LeafGlyph } from "./doctor-visuals";
import { InstagramIcon, WhatsAppIcon } from "./social-icons";

type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  /** Each network keeps its own brand colour. */
  className: string;
};

interface DoctorProfileHeroProps {
  doctorName: string;
  isPageCopied: boolean;
  onSharePage: () => void;
}

function ShareButton({ isCopied, onClick }: { isCopied: boolean; onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        CONTROL_TRANSITION,
        CONTROL_LIFT,
        "hover:border-primary/40 hover:text-primary"
      )}
    >
      {isCopied ? (
        <>
          <Check className="size-4 text-primary" aria-hidden="true" />
          {t("drDeshmukhPage.copiedLabel")}
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden="true" />
          {t("drDeshmukhPage.shareButtonLabel")}
        </>
      )}
    </button>
  );
}

/**
 * Profile header for the /drdeshmukh link page. Same visual language as the
 * homepage spotlight; the band stays light because the portrait does.
 */
export function DoctorProfileHero({ doctorName, isPageCopied, onSharePage }: DoctorProfileHeroProps) {
  const { t } = useTranslation();
  const { tagline, achievements } = splitHeroText(t("drDeshmukhPage.heroText"));
  const [role, ...specialities] = tagline;
  const telHref = toTelHref(DOCTOR.phone);

  const socialLinks: SocialLink[] = [
    {
      label: t("drDeshmukhPage.socialLinks.instagram"),
      href: DOCTOR.socialLinks.instagram,
      icon: InstagramIcon,
      className: "bg-linear-to-br from-fuchsia-500 via-pink-500 to-rose-500",
    },
    { label: t("drDeshmukhPage.socialLinks.youtube"), href: DOCTOR.socialLinks.youtube, icon: Youtube, className: "bg-[#FF0000]" },
    { label: t("drDeshmukhPage.socialLinks.whatsapp"), href: DOCTOR.socialLinks.whatsapp, icon: WhatsAppIcon, className: "bg-[#25D366]" },
    { label: t("drDeshmukhPage.socialLinks.email"), href: DOCTOR.socialLinks.email, icon: Mail, className: "bg-slate-700" },
    { label: t("drDeshmukhPage.socialLinks.phone"), href: telHref, icon: Phone, className: "bg-primary" },
  ];

  return (
    <section
      aria-labelledby="doctor-profile-name"
      className="home-light-band relative isolate overflow-hidden border-b border-border/60 pb-12 pt-6 sm:pt-8 lg:pb-16 lg:pt-12"
    >
      {/* Soft ground wave the credentials sit on. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-primary/[0.07]"
      >
        <path d="M0 64C240 16 480 16 720 56s480 64 720 8v56H0Z" fill="currentColor" />
      </svg>

      <div className={CONTAINER}>
        <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <DoctorPortrait
              alt={doctorName}
              priority
              experienceValue={t("drDeshmukhPage.spotlight.experienceValue")}
              experienceLabel={t("drDeshmukhPage.spotlight.experienceLabel")}
            />
          </Reveal>

          <Reveal delay={0.08} className="relative lg:col-span-7">
            <Float className="absolute -top-4 right-24 hidden lg:block" distance={8} duration={7}>
              <LeafGlyph className="size-7 -rotate-12 text-primary/50" />
            </Float>

            <div className="flex items-center justify-between gap-3">
              {role ? (
                <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.07] px-4 py-2 text-sm font-semibold text-foreground/85">
                  <Sprout className="size-4 text-primary" aria-hidden="true" />
                  {role}
                </span>
              ) : (
                <span />
              )}
              <ShareButton isCopied={isPageCopied} onClick={onSharePage} />
            </div>

            <h1
              id="doctor-profile-name"
              className="mt-5 font-heading text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-bold leading-[1.12] text-balance text-foreground"
            >
              {doctorName}
            </h1>

            {specialities.length > 0 ? (
              <p className="mt-3 font-heading text-lg font-semibold leading-snug text-primary sm:text-xl">
                {specialities.join(" · ")}
              </p>
            ) : null}

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {t("drDeshmukhPage.spotlight.description")}
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <BookVideoCta className="w-full sm:w-auto" />
              <HomeLinkButton href={telHref} variant="outline" size="lg" icon={Phone} className="w-full sm:w-auto">
                {t("common.callNow")}
              </HomeLinkButton>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-2.5">
              {socialLinks.map(({ label, href, icon: Icon, className }) => (
                <li key={label}>
                  <SmartLink
                    href={href}
                    aria-label={label}
                    title={label}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-white shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                      CONTROL_TRANSITION,
                      CONTROL_LIFT,
                      className
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </SmartLink>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <DoctorCredentials achievements={achievements} className="mt-12 lg:mt-14" />
      </div>
    </section>
  );
}
