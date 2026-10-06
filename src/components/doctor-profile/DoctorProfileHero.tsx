"use client";

import Image from "next/image";
import { BadgeCheck, Check, Mail, Phone, Share2, Sparkles, Youtube, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton, SmartLink } from "@/components/home/HomeLinkButton";
import { Eyebrow } from "@/components/home/SectionHeading";
import { toTelHref } from "@/components/home/home-links";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTROL_LIFT, CONTROL_TRANSITION } from "@/lib/design/tokens";
import { DOCTOR, splitAchievement, splitHeroText } from "./doctor-profile-data";
import { InstagramIcon, WhatsAppIcon } from "./social-icons";

const ENTER_CLASSES = "animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-700 ease-out";
const ACHIEVEMENT_BASE_DELAY_MS = 300;
const ACHIEVEMENT_STAGGER_MS = 50;

type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  className: string;
};

interface DoctorProfileHeroProps {
  doctorName: string;
  isPageCopied: boolean;
  onSharePage: () => void;
}

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
    { label: t("drDeshmukhPage.socialLinks.email"), href: DOCTOR.socialLinks.email, icon: Mail, className: "bg-slate-800" },
    { label: t("drDeshmukhPage.socialLinks.youtube"), href: DOCTOR.socialLinks.youtube, icon: Youtube, className: "bg-red-500" },
    {
      label: t("drDeshmukhPage.socialLinks.whatsapp"),
      href: DOCTOR.socialLinks.whatsapp,
      icon: WhatsAppIcon,
      className: "bg-[#25D366]",
    },
    { label: t("drDeshmukhPage.socialLinks.phone"), href: telHref, icon: Phone, className: "bg-slate-800" },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-emerald-900/5">
      <div className="grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        {/* Small centred avatar on phones, full portrait column on desktop */}
        <div className="relative flex items-center justify-center bg-linear-to-br from-emerald-100 via-emerald-50 to-teal-100 p-4 dark:from-emerald-950/70 dark:via-emerald-950/40 dark:to-teal-950/50">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-3xl bg-emerald-200/50 animate-in fade-in zoom-in-95 fill-mode-both duration-1000 ease-out dark:bg-emerald-900/40 sm:size-36 lg:aspect-[4/5] lg:size-auto lg:w-full lg:rounded-[1.25rem]">
            <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
              <div className="absolute left-1/2 top-[40%] size-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/60 dark:border-emerald-700/40" />
              <div className="absolute left-1/2 top-[40%] size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/30 dark:bg-emerald-700/20" />
            </div>
            <Image
              src={DOCTOR.photo}
              alt={doctorName}
              fill
              priority
              sizes="(min-width: 1024px) 16rem, (min-width: 640px) 9rem, 7rem"
              className="object-cover object-top"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-5 text-center sm:p-6 lg:items-start lg:p-8 lg:text-left">
          <div className={cn(ENTER_CLASSES, "flex w-full flex-wrap items-center justify-center gap-3 lg:justify-between")}>
            {role ? <Eyebrow icon={BadgeCheck}>{role}</Eyebrow> : <span />}
            <button
              type="button"
              onClick={onSharePage}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3.5 text-sm font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                CONTROL_TRANSITION,
                CONTROL_LIFT,
                "hover:border-primary/40 hover:text-primary"
              )}
            >
              {isPageCopied ? (
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
          </div>

          <div className={cn(ENTER_CLASSES, "delay-100")}>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl lg:text-4xl lg:leading-[1.15]">
              {doctorName}
            </h1>
            {specialities.length > 0 ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {specialities.join(" · ")}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              ENTER_CLASSES,
              "flex w-full flex-col gap-2.5 delay-200 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
            )}
          >
            <div className="relative isolate">
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/40 blur-lg"
              />
              <BookVideoCta size="md" className="w-full sm:w-auto" />
            </div>
            <HomeLinkButton href={telHref} variant="outline" size="md" icon={Phone} className="w-full sm:w-auto">
              {t("common.callNow")}
            </HomeLinkButton>
          </div>

          <ul className={cn(ENTER_CLASSES, "flex flex-wrap items-center justify-center gap-2 delay-300 lg:justify-start")}>
            {socialLinks.map(({ label, href, icon: Icon, className }) => (
              <li key={label}>
                <SmartLink
                  href={href}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-white shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                    CONTROL_TRANSITION,
                    CONTROL_LIFT,
                    className
                  )}
                >
                  <Icon className="size-4.5" />
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {achievements.length > 0 ? (
        <div className="border-t border-border bg-background/70 p-4 sm:p-5 lg:px-8 lg:py-5">
          <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
            {achievements.map((item, index) => {
              const { icon, label } = splitAchievement(item);
              return (
                <li
                  key={item}
                  className={cn(
                    ENTER_CLASSES,
                    "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-[13px]"
                  )}
                  style={{ animationDelay: `${ACHIEVEMENT_BASE_DELAY_MS + index * ACHIEVEMENT_STAGGER_MS}ms` }}
                >
                  <span aria-hidden="true" className="flex items-center text-sm leading-none">
                    {icon ?? <Sparkles className="size-3.5 text-primary" />}
                  </span>
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
