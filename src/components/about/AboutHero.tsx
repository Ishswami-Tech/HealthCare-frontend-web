"use client";

import Image from "next/image";
import { Award, BadgeCheck, GraduationCap, HeartPulse, Phone, ShieldCheck, Sprout, Star, type LucideIcon } from "lucide-react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { PageHero } from "@/components/home/PageHero";
import { HOME_LINKS } from "@/components/home/home-links";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { ACCENTS, BOARD, ICON_PLATE, type AccentName } from "@/lib/design/tokens";

/** The approved spotlight portrait; it carries its own pale botanical backdrop. */
const PORTRAIT = { src: "/assets/doctor/deshmukh-spotlight-portrait.webp", width: 598, height: 490 } as const;

/** One of the clinic's own treatment photographs. */
const AT_WORK = { src: "/assets/treatments/viddhagnikarma-shoulder-hero.webp", width: 1600, height: 900 } as const;

interface Figure {
  key: "livesTransformed" | "yearsOfExcellence" | "successRate" | "patientRating";
  value: string;
  icon: LucideIcon;
  tint: AccentName;
}

/** The clinic's published figures; only the labels are translated. */
const FIGURES: readonly Figure[] = [
  { key: "livesTransformed", value: "5000+", icon: HeartPulse, tint: "rose" },
  { key: "yearsOfExcellence", value: "20+", icon: Award, tint: "amber" },
  { key: "successRate", value: "95%", icon: BadgeCheck, tint: "emerald" },
  { key: "patientRating", value: "4.9", icon: Star, tint: "violet" },
];

function PortraitStack({ name, title, experienceLabel }: { name: string; title: string; experienceLabel: string }) {
  return (
    <div className="relative mx-auto w-full max-w-md pb-10 lg:max-w-none">
      <div aria-hidden="true" className="absolute -inset-3 bottom-7 -z-10 -rotate-2 rounded-[2.25rem] bg-primary/8 dark:bg-primary/10" />

      <figure className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[#f4f9f6] shadow-[0_40px_80px_-44px_rgba(10,70,52,0.55)]">
        <Image
          src={PORTRAIT.src}
          alt={name}
          width={PORTRAIT.width}
          height={PORTRAIT.height}
          priority
          sizes="(min-width: 1280px) 30rem, (min-width: 1024px) 38vw, 28rem"
          className="h-auto w-full"
        />
        {/* Kept left of the treatment thumbnail that overlaps the right-hand corner. */}
        <figcaption className="absolute bottom-3 left-3 max-w-[58%] rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:max-w-[16rem]">
          <p className="font-heading text-[15px] font-semibold leading-tight text-[#0f1b2d]">{name}</p>
          <p className="mt-0.5 text-xs leading-snug text-[#0f1b2d]/65">{title}</p>
        </figcaption>
      </figure>

      {/* Experience badge on the portrait's shoulder. */}
      <div className="absolute -left-2 top-5 flex items-center gap-3 rounded-2xl bg-card p-2.5 pr-4 shadow-[0_22px_44px_-20px_rgba(10,70,52,0.4)] ring-1 ring-border/70 sm:-left-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sprout className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-lg font-bold leading-none text-foreground">20+</p>
          <p className="mt-1 max-w-[8rem] text-[11px] leading-snug text-muted-foreground">{experienceLabel}</p>
        </div>
      </div>

      {/* A treatment in progress, tucked under the portrait's corner. */}
      <div className="absolute -right-2 bottom-0 w-[38%] rotate-3 overflow-hidden rounded-2xl border-4 border-background shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] sm:-right-5">
        <Image
          src={AT_WORK.src}
          alt=""
          aria-hidden="true"
          width={AT_WORK.width}
          height={AT_WORK.height}
          sizes="14rem"
          className="aspect-[4/3] w-full object-cover object-[45%_50%]"
        />
      </div>
    </div>
  );
}

function FiguresBoard() {
  const { t } = useTranslation();

  return (
    /* Static, not scroll-revealed: it sits above the fold, so a reveal would
       leave it invisible until hydration — the refresh blink again. */
    <div className={cn(BOARD, "grid-cols-2 lg:grid-cols-4")}>
      {FIGURES.map(({ key, value, icon: Icon, tint }) => {
        const tone = ACCENTS[tint];
        return (
          <div key={key} className="group flex h-full items-center gap-4 bg-card px-5 py-5 sm:px-6 sm:py-6">
            <span className={cn(ICON_PLATE, "hidden sm:flex", tone.plate)}>
              <Icon className="size-5.5" aria-hidden="true" />
            </span>
            <div>
              <p
                className={cn(
                  "home-display flex items-center gap-1 font-heading text-[clamp(1.6rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-none tabular-nums",
                  tone.text
                )}
              >
                {value}
                {key === "patientRating" ? <Star className="size-[0.7em] fill-current" aria-hidden="true" /> : null}
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{t(`about.achievements.${key}`)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AboutHero() {
  const { t } = useTranslation();

  return (
    <PageHero
      headingId="about-hero-heading"
      eyebrow={t("about.hero.badge")}
      eyebrowIcon={Sprout}
      title={t("about.hero.title")}
      subtitle={t("about.hero.subtitle")}
      actions={
        <>
          <BookVideoCta className="w-full sm:w-auto" />
          <HomeLinkButton href={HOME_LINKS.contact} variant="outline" size="lg" icon={Phone} className="w-full sm:w-auto">
            {t("navigation.contact")}
          </HomeLinkButton>
        </>
      }
      chips={[
        { icon: BadgeCheck, label: t("about.hero.certifications.governmentCertified") },
        { icon: ShieldCheck, label: t("about.hero.certifications.iso9001") },
        { icon: GraduationCap, label: t("about.hero.certifications.teachingHospital") },
      ]}
      aside={
        <PortraitStack
          name={t("team.teamMembers.drDeshmukh.name")}
          title={t("team.teamMembers.drDeshmukh.title")}
          experienceLabel={t("about.achievements.yearsOfExcellence")}
        />
      }
      footer={<FiguresBoard />}
    />
  );
}
