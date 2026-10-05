"use client";

import Image from "next/image";

import {
  BookOpen,
  Accessibility,
  Activity,
  Bone,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Clock,
  Flame,
  Flower2,
  Footprints,
  HeartPulse,
  Leaf,
  Heart,
  Microscope,
  Quote,
  Hand,
  MoveVertical,
  Shield,
  ShieldCheck,
  Spline,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { m } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { SectionHeading, SectionIndex } from "@/components/home/SectionHeading";
import {
  CountUp,
  HOME_EASE,
  HomeMotionProvider,
  Reveal,
  RevealGroup,
  RevealItem,
} from "@/components/home/home-motion";
import { HOME_LINKS } from "@/components/home/home-links";
import {
  ACCENTS,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  DISPLAY_LG,
  DISPLAY_MD,
  DISPLAY_XL,
  HEADING_GAP,
  HOVER_CARD_LIFT,
  HOVER_TRANSITION,
  HOVER_TRANSITION_CHILD,
  SECTION_Y,
  STATUS,
  SURFACE,
  THERAPY_ACCENT,
  type AccentName,
  type StatusName,
} from "@/lib/design/tokens";

/** Agnikarma owns the amber accent everywhere it appears. */
const ACCENT: AccentName = THERAPY_ACCENT.agnikarma;
const accent = ACCENTS[ACCENT];

/** The health assessment lives on the homepage, so it needs an absolute hash. */
const ASSESSMENT_HREF = "/#health-assessment";

/** Hero photograph. Replace the file to change the image; no code change needed. */
const HERO_IMAGE = "/assets/treatments/agnikarma-brow-marma.webp";

const HEADLINE_SUCCESS_RATE = 92;

/**
 * Hero entrance runs from CSS (tw-animate-css) rather than scroll reveals, so
 * the above-the-fold content is painted and animating from the server HTML
 * instead of waiting on hydration.
 */
const ENTER = "animate-in fade-in slide-in-from-bottom-5 fill-mode-both duration-700 ease-out";

type Translate = (path: string) => string;
type TranslateArray = (path: string) => string[];

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const FOUNDATION_PILLARS = [
  { key: "ancientText", icon: BookOpen, tint: "amber", image: "/assets/treatments/agnikarma-ancient-texts.webp" },
  { key: "modernValidation", icon: Microscope, tint: "emerald", image: "/assets/treatments/agnikarma-modern-validation.webp" },
  { key: "precisionTechnology", icon: Target, tint: "violet", image: "/assets/treatments/agnikarma-clinic-heat.webp" },
  { key: "zeroSideEffects", icon: Shield, tint: "teal", image: "/assets/treatments/agnikarma-zero-side-effects.webp" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName; image: string }[];

const ADVANTAGES = [
  { key: "instantResults", icon: Zap, tint: "amber" },
  { key: "precisionTargeting", icon: Target, tint: "violet" },
  { key: "zeroSideEffects", icon: Shield, tint: "emerald" },
  { key: "costEffective", icon: TrendingUp, tint: "sky" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName }[];

const CONDITION_KEYS = [
  { key: "chronicKneePain", successRate: 95 },
  { key: "sciatica", successRate: 92 },
  { key: "frozenShoulder", successRate: 88 },
  { key: "tennisElbow", successRate: 94 },
  { key: "plantarFasciitis", successRate: 90 },
  { key: "cervicalSpondylosis", successRate: 87 },
  { key: "arthritis", successRate: 89 },
] as const;

interface Condition {
  key: string;
  condition: string;
  successRate: number;
  avgSessions: string;
  recoveryTime: string;
  patientStory: string;
}

function buildConditions(t: Translate): Condition[] {
  return CONDITION_KEYS.map(({ key, successRate }) => ({
    key,
    successRate,
    condition: t(`agnikarma.conditions.${key}.condition`),
    avgSessions: t(`agnikarma.conditions.${key}.avgSessions`),
    recoveryTime: t(`agnikarma.conditions.${key}.recoveryTime`),
    patientStory: t(`agnikarma.conditions.${key}.patientStory`),
  }));
}

/**
 * Comparison rows. `tone` carries the clinical judgement, so it maps to a
 * STATUS token rather than a decorative accent.
 */
interface ComparisonRow {
  method: string;
  duration: string;
  successRate: number;
  sideEffects: string;
  cost: string;
  tone: StatusName;
  isAgnikarma?: boolean;
}

function buildComparison(t: Translate): ComparisonRow[] {
  return [
    {
      method: t("agnikarma.comparison.agnikarma"),
      duration: `3-5 ${t("agnikarma.comparison.sessions")}`,
      successRate: 92,
      sideEffects: t("agnikarma.advantages.zeroSideEffects.title"),
      cost: t("agnikarma.advantages.costEffective.title"),
      tone: "success",
      isAgnikarma: true,
    },
    {
      method: t("agnikarma.comparison.surgery"),
      duration: `6-12 ${t("agnikarma.comparison.months")}`,
      successRate: 70,
      sideEffects: t("agnikarma.comparison.highRisk"),
      cost: t("agnikarma.comparison.veryHigh"),
      tone: "danger",
    },
    {
      method: t("agnikarma.comparison.medications"),
      duration: t("agnikarma.comparison.ongoing"),
      successRate: 60,
      sideEffects: t("agnikarma.comparison.multiple"),
      cost: t("agnikarma.comparison.highOngoing"),
      tone: "danger",
    },
    {
      method: t("agnikarma.comparison.physiotherapy"),
      duration: `6-18 ${t("agnikarma.comparison.months")}`,
      successRate: 50,
      sideEffects: t("agnikarma.comparison.minimal"),
      cost: t("agnikarma.comparison.moderate"),
      tone: "warning",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero({ t }: { t: Translate }) {
  /* The title is one string; accent the final word so the treatment name reads
     as display type without hard-coding an English split. */
  const titleWords = t("agnikarma.title").trim().split(/\s+/);
  const titleTail = titleWords.length > 1 ? titleWords[titleWords.length - 1] : "";
  const titleLead = titleWords.length > 1 ? titleWords.slice(0, -1).join(" ") : titleWords.join(" ");

  const features = [
    { icon: Zap, label: t("agnikarma.advantages.instantResults.title") },
    { icon: Leaf, label: t("agnikarma.advantages.zeroSideEffects.title") },
    { icon: Target, label: t("agnikarma.advantages.precisionTargeting.title") },
    { icon: TrendingUp, label: t("agnikarma.advantages.costEffective.title") },
  ];

  const stats = [
    { icon: Users, value: "5000+", label: t("stats.livesTransformed") },
    { icon: Shield, value: `${HEADLINE_SUCCESS_RATE}%`, label: t("common.successRate") },
    { icon: Leaf, value: "100%", label: t("hero.natural") },
  ];

  const assurances = [
    { icon: Leaf, label: t("hero.natural") },
    { icon: Shield, label: t("hero.noSideEffects") },
    { icon: Sparkles, label: t("hero.provenResults") },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#1b1008]">
      {/* Photographic backdrop. The gradient underneath carries the hero on its
          own, so a slow or missing image degrades to a deliberate dark field. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-linear-to-br from-[#2a1709] via-[#1b1008] to-[#0d0804]" />
      <Image
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[82%_center] sm:object-[78%_center] lg:object-[72%_center]"
      />

      {/* Readability scrim: dark on the left where the copy sits, clear on the
          right where the photograph's subject is. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#140c06]/78 lg:hidden" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-linear-to-r from-[#140c06] via-[#140c06]/85 to-transparent lg:block" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-[#140c06] via-transparent to-[#140c06]/55" />

      <div className={cn(CONTAINER, "relative py-14 sm:py-16 lg:py-24")}>
        <div className="max-w-2xl lg:max-w-[54%]">
          <div className={ENTER}>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
              <Flame className="size-3.5" aria-hidden="true" />
              {t("agnikarma.badge")}
            </span>

            <h1 className={cn(DISPLAY_XL, "mt-6 text-white")}>
              <span className="block">{titleLead}</span>
              {titleTail ? (
                <span className="block bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {titleTail}
                </span>
              ) : null}
            </h1>

            <p className="mt-5 font-heading text-xl font-medium text-white/90 sm:text-2xl">
              {t("agnikarma.subtitle")}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
              {t("agnikarma.advantages.subtitle")}
            </p>
          </div>

          {/* Feature row */}
          <div className={cn(ENTER, "mt-9 grid grid-cols-2 gap-5 delay-200 sm:grid-cols-4 sm:gap-4")}>
            {features.map(({ icon: Icon, label }, featureIndex) => (
              <div key={label} style={{ animationDelay: `${260 + featureIndex * 70}ms` }} className={ENTER}>
                <div className="flex flex-col items-center gap-2.5 text-center sm:items-start sm:text-left">
                  <span className="flex size-11 items-center justify-center rounded-full border border-amber-400/35 bg-amber-500/10 text-amber-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-[13px] font-semibold leading-snug text-white/90">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={cn(ENTER, "mt-9 flex flex-col items-stretch gap-3 delay-[560ms] sm:flex-row sm:items-center")}>
            <BookVideoCta
              label={t("agnikarma.cta.bookSession")}
              className="w-full bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-[0_14px_34px_-12px_rgba(245,158,11,0.75)] hover:from-amber-500 hover:to-orange-600 sm:w-auto"
            />
            <HomeLinkButton
              href={ASSESSMENT_HREF}
              variant="inverseOutline"
              size="lg"
              icon={ClipboardList}
              className="w-full sm:w-auto"
            >
              {t("agnikarma.cta.freeAssessment")}
            </HomeLinkButton>
          </div>

          {/* Figure bar */}
          <div className={cn(ENTER, "mt-9 delay-[660ms]")}>
            <dl className="grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/10 sm:grid-cols-3">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3 bg-[#140c06]/70 px-4 py-3.5 backdrop-blur">
                  <Icon className="size-5 shrink-0 text-amber-300" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="sr-only">{label}</dt>
                    <dd className="home-display font-heading text-lg font-semibold leading-none text-white">{value}</dd>
                    <p className="mt-1 text-[11px] leading-tight text-white/60">{label}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Assurances sit with the copy — the photograph's half stays clear. */}
          <div className={cn(ENTER, "mt-4 flex flex-wrap gap-2 delay-[760ms]")}>
            {assurances.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-[11px] font-medium text-amber-100"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scientific foundation                                                      */
/* -------------------------------------------------------------------------- */

function ScientificFoundation({ t }: { t: Translate }) {
  /* Two-tone display title: accent the final word without hard-coding a split. */
  const words = t("agnikarma.scientificFoundation.title").trim().split(/\s+/);
  const tail = words.length > 1 ? words[words.length - 1] : "";
  const lead = words.length > 1 ? words.slice(0, -1).join(" ") : words.join(" ");

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y)}>
      <div className={CONTAINER}>
        {/* Header: title block left, lede right behind a hairline rule. */}
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <SectionIndex value="01" />
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
                <Leaf className="size-3.5" aria-hidden="true" />
                {t("agnikarma.scientificFoundation.title")}
              </span>

              <h2 className={cn(DISPLAY_LG, "mt-5 text-emerald-950 dark:text-emerald-50")}>
                {lead}
                {tail ? (
                  <>
                    {" "}
                    <span className="text-amber-600 dark:text-amber-400">{tail}</span>
                  </>
                ) : null}
              </h2>
              <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400 sm:text-xl">
                {t("agnikarma.scientificFoundation.subtitle")}
              </p>
            </div>

            <div className="flex items-start gap-5 lg:col-span-5">
              <span aria-hidden="true" className="hidden w-px self-stretch bg-amber-900/15 dark:bg-amber-100/15 lg:block" />
              <Flower2 className="mt-1 hidden size-6 shrink-0 text-amber-600 dark:text-amber-400 lg:block" aria-hidden="true" />
              <p className="text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
                {t("agnikarma.scientificFoundation.description")}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Pillar cards: tinted frame, numbered, photo-footed. */}
        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4")}>
          {FOUNDATION_PILLARS.map(({ key, icon: Icon, tint, image }, index) => {
            const tone = ACCENTS[tint];
            return (
              <RevealItem key={key} className="h-full">
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border bg-card", HOVER_TRANSITION, HOVER_CARD_LIFT, "hover:shadow-[0_28px_56px_-28px_rgba(10,70,52,0.4)]",
                    tone.border
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b opacity-30", tone.soft)}
                  />

                  {/* Only the copy is padded — the photograph bleeds to the card edge. */}
                  <div className="relative z-10 flex flex-1 flex-col p-5 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn("flex size-11 items-center justify-center rounded-xl", HOVER_TRANSITION_CHILD, "group-hover:scale-105", tone.plate)}>
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className={cn("home-display font-heading text-xl font-semibold tabular-nums opacity-50", tone.text)}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className={cn(DISPLAY_MD, "mt-4 text-base text-foreground")}>
                      {t(`agnikarma.scientificFoundation.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {t(`agnikarma.scientificFoundation.${key}.description`)}
                    </p>
                  </div>

                  {/* The photograph tucks up behind the copy and dissolves into the
                      card, so there is no hard seam between text and image. */}
                  <div className="relative -mt-16 h-56 shrink-0">
                    <Image
                      src={image}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105 [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.25)_26%,black_58%)]"
                    />
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Process                                                                    */
/* -------------------------------------------------------------------------- */

/** The five steps alternate emerald / amber, badge through to footer rule. */
const PROCESS_STEPS = [
  { icon: FileSearch, tint: "emerald" },
  { icon: Leaf, tint: "amber" },
  { icon: Flame, tint: "emerald" },
  { icon: HeartPulse, tint: "amber" },
  { icon: ShieldCheck, tint: "emerald" },
] as const satisfies readonly { icon: LucideIcon; tint: AccentName }[];

/** Hand-drawn-feeling wave that threads the five step badges together. */
function ProcessConnector() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-20 -translate-y-1/2 lg:block">
      <svg className="size-full" viewBox="0 0 1000 80" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="agnikarma-process-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.62 0.16 150)" />
            <stop offset="22%" stopColor="oklch(0.62 0.16 150)" />
            <stop offset="30%" stopColor="oklch(0.70 0.16 62)" />
            <stop offset="45%" stopColor="oklch(0.70 0.16 62)" />
            <stop offset="52%" stopColor="oklch(0.62 0.16 150)" />
            <stop offset="65%" stopColor="oklch(0.62 0.16 150)" />
            <stop offset="72%" stopColor="oklch(0.70 0.16 62)" />
            <stop offset="86%" stopColor="oklch(0.70 0.16 62)" />
            <stop offset="93%" stopColor="oklch(0.62 0.16 150)" />
            <stop offset="100%" stopColor="oklch(0.62 0.16 150)" />
          </linearGradient>
        </defs>
        <m.path
          d="M 100,40 C 160,0 240,0 300,40 S 440,80 500,40 S 640,0 700,40 S 840,80 900,40"
          stroke="url(#agnikarma-process-wave)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.6, ease: HOME_EASE }}
        />
      </svg>

      {/* Chevrons mark the hand-off between one step and the next, landing just
          behind the wave as it draws past them. */}
      {[20, 40, 60, 80].map((left, index) => (
        <m.span
          key={left}
          style={{ left: `${left}%` }}
          className="absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-[0_6px_16px_-8px_rgba(10,70,52,0.5)]"
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, ease: HOME_EASE, delay: 0.45 + index * 0.3 }}
        >
          <ChevronRight className="size-4" />
        </m.span>
      ))}
    </div>
  );
}

function Process({ t }: { t: Translate }) {
  const words = t("agnikarma.processSteps.title").trim().split(/\s+/);
  const tail = words.length > 1 ? words[words.length - 1] : "";
  const lead = words.length > 1 ? words.slice(0, -1).join(" ") : words.join(" ");

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y, "relative isolate overflow-hidden")}>
      {/* Soft botanical wash in the corners. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-20 size-80 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute -right-24 top-10 size-80 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-900/20" />
        <div className="home-dotgrid absolute inset-0 text-amber-800 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      </div>

      <div className={CONTAINER}>
        <Reveal className="flex flex-col items-center text-center">
          {/* Eyebrow flanked by rules */}
          <div className="flex w-full max-w-lg items-center gap-4">
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-emerald-700/25" />
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
              <Leaf className="size-3.5" aria-hidden="true" />
              {t("agnikarma.processSteps.title")}
            </span>
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-emerald-700/25" />
          </div>

          <h2 className={cn(DISPLAY_LG, "mt-6 text-emerald-950 dark:text-emerald-50")}>
            {lead}
            {tail ? (
              <>
                {" "}
                <span className="text-amber-600 dark:text-amber-400">{tail}</span>
              </>
            ) : null}
          </h2>
          <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400 sm:text-xl">
            {t("agnikarma.processSteps.subtitle")}
          </p>

          {/* Lotus divider */}
          <div className="mt-5 flex w-full max-w-xs items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-amber-600/35" />
            <Flower2 className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-amber-600/35" />
          </div>
        </Reveal>

        <div className="relative mt-20">
          <ProcessConnector />

          <RevealGroup stagger={0.12} className="grid grid-cols-1 gap-x-4 gap-y-16 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map(({ icon: Icon, tint }, index) => {
              const step = index + 1;
              const tone = ACCENTS[tint];
              const isEmerald = tint === "emerald";

              return (
                <RevealItem key={step} className="h-full">
                  <article
                    className={cn(
                      "group relative flex h-full flex-col items-center rounded-[1.5rem] border border-transparent px-5 pb-6 pt-12 text-center", HOVER_TRANSITION, HOVER_CARD_LIFT, "hover:shadow-[0_28px_56px_-28px_rgba(10,70,52,0.35)]",
                      isEmerald
                        ? "bg-linear-to-b from-emerald-50/80 to-transparent dark:from-emerald-950/30"
                        : "bg-linear-to-b from-amber-50/80 to-transparent dark:from-amber-950/30"
                    )}
                  >
                    {/* Numbered badge straddling the card's top edge */}
                    <m.span
                      className={cn(
                        "home-display absolute -top-7 left-1/2 flex size-14 items-center justify-center rounded-full bg-linear-to-br font-heading text-base font-semibold text-white shadow-[0_10px_24px_-10px_rgba(10,70,52,0.7)] ring-4 ring-[#faf8f2] dark:ring-[oklch(0.19_0.012_75)]",
                        isEmerald ? "from-emerald-600 to-emerald-700" : "from-amber-500 to-orange-600"
                      )}
                      initial={{ opacity: 0, scale: 0.3, x: "-50%" }}
                      whileInView={{ opacity: 1, scale: 1, x: "-50%" }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.2 + index * 0.3 }}
                    >
                      {String(step).padStart(2, "0")}
                    </m.span>

                    {/* Icon in a ringed plate */}
                    <span className={cn("relative flex size-24 items-center justify-center rounded-full", tone.soft)}>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 100 100"
                        fill="none"
                        className={cn("absolute inset-0 size-full -rotate-[55deg]", tone.text)}
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="196 93"
                          opacity="0.55"
                        />
                        <circle cx="50" cy="4" r="3.5" fill="currentColor" />
                      </svg>
                      <Icon className={cn("size-10", tone.text)} aria-hidden="true" />
                    </span>

                    <h3 className={cn(DISPLAY_MD, "mt-6 text-base text-emerald-950 dark:text-emerald-50")}>
                      {t(`agnikarma.processSteps.steps.${step}.title`)}
                    </h3>
                    <span
                      aria-hidden="true"
                      className={cn("mt-3 h-0.5 w-10 rounded-full", isEmerald ? "bg-emerald-600" : "bg-amber-600")}
                    />

                    <p className="mt-4 flex-1 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">
                      {t(`agnikarma.processSteps.steps.${step}.description`)}
                    </p>

                    <span
                      aria-hidden="true"
                      className={cn("mt-6 h-0.5 w-10 rounded-full opacity-60", isEmerald ? "bg-emerald-600" : "bg-amber-600")}
                    />
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Conditions and success rates                                               */
/* -------------------------------------------------------------------------- */

/** Splits "3-5 sessions" into its figure and its unit so each can be sized. */
function splitValueUnit(text: string): { value: string; unit: string } {
  const trimmed = text.trim();
  const gap = trimmed.indexOf(" ");
  if (gap === -1) return { value: trimmed, unit: "" };
  return { value: trimmed.slice(0, gap).replace("-", "\u2013"), unit: trimmed.slice(gap + 1) };
}

/** Each condition keeps its own glyph so the rows are scannable. */
const CONDITION_ICONS: Record<string, LucideIcon> = {
  chronicKneePain: Bone,
  sciatica: Spline,
  frozenShoulder: Accessibility,
  tennisElbow: Activity,
  plantarFasciitis: Footprints,
  cervicalSpondylosis: MoveVertical,
  arthritis: Hand,
};

function ConditionRow({ item, t }: { item: Condition; t: Translate }) {
  const Icon = CONDITION_ICONS[item.key] ?? Bone;
  const sessions = splitValueUnit(item.avgSessions);
  const recovery = splitValueUnit(item.recoveryTime);

  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-[1.25rem] border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(16,40,32,0.04)] sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        HOVER_TRANSITION,
        HOVER_CARD_LIFT,
        "hover:shadow-[0_22px_44px_-26px_rgba(10,70,52,0.35)]"
      )}
    >
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          HOVER_TRANSITION_CHILD,
          "group-hover:scale-105"
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>

      {/* Name + success meter */}
      <div className="min-w-0 flex-1">
        <h3 className={cn(DISPLAY_MD, "text-base text-foreground sm:text-lg")}>{item.condition}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("common.successRate")}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <Progress value={item.successRate} className="h-2 flex-1" />
          <span className={cn("home-display font-heading text-sm font-semibold tabular-nums", STATUS.success.text)}>
            {item.successRate}%
          </span>
        </div>
      </div>

      {/* Sessions + recovery, hairline-separated */}
      <dl className="flex shrink-0 divide-x divide-border/60 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="flex flex-1 items-center gap-2.5 pr-4 sm:pr-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{t("agnikarma.comparison.avgSessions")}</dt>
            <dd className="home-display font-heading text-base font-semibold leading-tight text-foreground">
              {sessions.value}
            </dd>
            <p className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{sessions.unit}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2.5 pl-4 sm:pl-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Clock className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{t("agnikarma.comparison.recoveryTime")}</dt>
            <dd className={cn("home-display font-heading text-base font-semibold leading-tight", accent.text)}>
              {recovery.value}
            </dd>
            <p className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{recovery.unit}</p>
          </div>
        </div>
      </dl>
    </article>
  );
}

function Conditions({
  t,
  tArray,
  conditions,
}: {
  t: Translate;
  tArray: TranslateArray;
  conditions: Condition[];
}) {
  const words = t("agnikarma.conditions.title").trim().split(/\s+/);
  const tail = words.length > 1 ? words[words.length - 1] : "";
  const lead = words.length > 1 ? words.slice(0, -1).join(" ") : words.join(" ");
  const assurancePoints = tArray("agnikarma.conditions.assurance.points");

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y, "relative isolate overflow-hidden")}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-24 -left-20 size-96 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute -right-20 top-0 size-80 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-900/15" />
      </div>

      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-12")}>
        {/* Standfirst */}
        <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            <Leaf className="size-3.5" aria-hidden="true" />
            {t("agnikarma.conditions.title")}
          </span>

          <h2 className={cn(DISPLAY_LG, "mt-5 text-emerald-950 dark:text-emerald-50")}>
            <span className="block">{lead}</span>
            {tail ? <span className="block text-amber-600 dark:text-amber-400">{tail}</span> : null}
          </h2>

          <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400">
            {t("agnikarma.conditions.subtitle")}
          </p>
          <span aria-hidden="true" className="mt-5 block h-0.5 w-14 rounded-full bg-amber-500" />
          <p className="mt-5 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
            {t("agnikarma.conditions.description")}
          </p>

          {/* Assurance panel */}
          <div className="mt-8 rounded-[1.5rem] border border-emerald-600/15 bg-emerald-50/70 p-5 dark:bg-emerald-950/30">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                <Flower2 className="size-6" aria-hidden="true" />
              </span>
              <p className={cn(DISPLAY_MD, "text-base text-emerald-950 dark:text-emerald-50")}>
                {t("agnikarma.conditions.assurance.title")}
              </p>
            </div>

            <ul className="mt-5 flex flex-col gap-3">
              {assurancePoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[13px] text-stone-700 dark:text-stone-200">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Condition rows */}
        <RevealGroup stagger={0.07} className="flex flex-col gap-3.5 lg:col-span-8">
          {conditions.map((item) => (
            <RevealItem key={item.key}>
              <ConditionRow item={item} t={t} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Patient stories                                                            */
/* -------------------------------------------------------------------------- */

function PatientStories({ t, conditions }: { t: Translate; conditions: Condition[] }) {
  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="04"
            eyebrow="Patient Success Stories"
            icon={Heart}
            title="Real Results, Real Stories"
            description="Discover how Agnikarma has transformed lives and brought relief to patients suffering from various conditions."
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3")}>
          {conditions.map((item) => (
            <RevealItem key={item.key} className="h-full">
              <figure className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col p-5 sm:p-6")}>
                <Quote className={cn("size-7 opacity-40", accent.text)} aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-foreground">
                  &ldquo;{item.patientStory}&rdquo;
                </blockquote>
                <figcaption className="mt-5 border-t border-border/70 pt-4">
                  <p className="font-heading text-[13px] font-semibold text-foreground">{item.condition}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", STATUS.success.dot)} aria-hidden="true" />
                      {item.successRate}% {t("common.success")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", STATUS.warning.dot)} aria-hidden="true" />
                      {item.avgSessions}
                    </span>
                  </div>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Advantages + comparison                                                    */
/* -------------------------------------------------------------------------- */

function Advantages({ t, comparison }: { t: Translate; comparison: ComparisonRow[] }) {
  const headers = [
    t("agnikarma.comparison.treatmentMethod"),
    t("agnikarma.comparison.duration"),
    t("common.successRate"),
    t("agnikarma.comparison.sideEffects"),
    t("agnikarma.comparison.cost"),
  ];

  return (
    <section className={cn(SURFACE.raised, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="05"
            eyebrow={t("agnikarma.advantages.title")}
            icon={Star}
            title={t("agnikarma.advantages.title")}
            description={t("agnikarma.advantages.subtitle")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
          {ADVANTAGES.map(({ key, icon: Icon, tint }) => {
            const tone = ACCENTS[tint];
            return (
              <RevealItem key={key} className="h-full">
                <div className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col p-5 sm:p-6")}>
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl", HOVER_TRANSITION_CHILD, "group-hover:scale-105",
                      tone.plate
                    )}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className={cn(DISPLAY_MD, "mt-4 text-base text-foreground sm:text-lg")}>
                    {t(`agnikarma.advantages.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {t(`agnikarma.advantages.${key}.description`)}
                  </p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Modality comparison */}
        <Reveal className="mt-10">
          <h3 className={cn(DISPLAY_LG, "text-center text-foreground")}>{t("agnikarma.comparison.title")}</h3>

          <div className={cn(CARD, "mt-7 hidden shadow-[0_24px_52px_-34px_rgba(10,70,52,0.4)] md:block")}>
            <table className="w-full text-sm">
              <thead className="bg-[oklch(0.22_0.045_163)] text-white">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={header}
                      scope="col"
                      className={cn(
                        "py-4 font-heading text-[10px] font-semibold uppercase tracking-[0.18em]",
                        index === 0 ? "px-5 pl-6 text-left" : "px-5 text-center last:pr-6"
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {comparison.map((row) => {
                  const tone = STATUS[row.tone];
                  return (
                    <tr
                      key={row.method}
                      className={cn(
                        "transition-colors duration-300",
                        row.isAgnikarma ? cn(accent.soft, "font-medium") : "hover:bg-primary/5"
                      )}
                    >
                      <th
                        scope="row"
                        className={cn(
                          "px-5 py-4 pl-6 text-left font-semibold",
                          row.isAgnikarma ? accent.text : "text-foreground"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          {row.isAgnikarma ? <Flame className="size-4" aria-hidden="true" /> : null}
                          {row.method}
                        </span>
                      </th>
                      <td className="px-5 py-4 text-center text-[13px] text-muted-foreground">{row.duration}</td>
                      <td className={cn("px-5 py-4 text-center font-heading text-[13px] font-semibold tabular-nums", tone.text)}>
                        {row.successRate}%
                      </td>
                      <td className={cn("px-5 py-4 text-center text-[13px]", tone.text)}>{row.sideEffects}</td>
                      <td className={cn("px-5 py-4 pr-6 text-center text-[13px]", tone.text)}>{row.cost}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {comparison.map((row) => {
              const tone = STATUS[row.tone];
              return (
                <div
                  key={row.method}
                  className={cn(CARD, "flex flex-col p-5", row.isAgnikarma && cn(accent.border, "ring-1", accent.soft))}
                >
                  <p
                    className={cn(
                      "inline-flex items-center gap-2 font-heading text-sm font-semibold",
                      row.isAgnikarma ? accent.text : "text-foreground"
                    )}
                  >
                    {row.isAgnikarma ? <Flame className="size-4" aria-hidden="true" /> : null}
                    {row.method}
                  </p>
                  <dl className="mt-3 flex flex-col gap-2 text-[13px]">
                    {[
                      { label: headers[1], value: row.duration },
                      { label: headers[2], value: `${row.successRate}%` },
                      { label: headers[3], value: row.sideEffects },
                      { label: headers[4], value: row.cost },
                    ].map((cell) => (
                      <div key={cell.label} className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{cell.label}</dt>
                        <dd className={cn("font-medium", tone.text)}>{cell.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Closing CTA                                                                */
/* -------------------------------------------------------------------------- */

function ClosingCta({ t }: { t: Translate }) {
  const features = [
    { icon: Zap, label: t("agnikarma.cta.features.instantRelief") },
    { icon: Shield, label: t("agnikarma.cta.features.zeroSideEffects") },
    { icon: Star, label: t("agnikarma.cta.features.successRate") },
  ];

  return (
    <section className={cn(SURFACE.ink, SECTION_Y, "home-grain")}>
      <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-55" />
      <div
        aria-hidden="true"
        className="home-dotgrid absolute inset-0 -z-10 text-white [mask-image:radial-gradient(ellipse_70%_60%_at_50%_100%,black,transparent)]"
      />

      <div className={cn(CONTAINER, "relative max-w-4xl text-center")}>
        <Reveal>
          <h2 className={cn(DISPLAY_LG, "text-white")}>{t("agnikarma.cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75 sm:text-lg">
            {t("agnikarma.cta.subtitle")}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BookVideoCta variant="inverse" label={t("agnikarma.cta.bookSession")} />
          <HomeLinkButton href={ASSESSMENT_HREF} variant="inverseOutline" size="lg" icon={ClipboardList}>
            {t("agnikarma.cta.freeAssessment")}
          </HomeLinkButton>
        </Reveal>

        <RevealGroup className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {features.map(({ icon: Icon, label }) => (
            <RevealItem key={label}>
              <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-[13px] font-medium text-white/85">
                <Icon className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                {label}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-8">
          <HomeLinkButton href={HOME_LINKS.treatments} variant="inverseOutline" size="sm">
            {t("common.learnMore")}
          </HomeLinkButton>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AgnikarmaPage() {
  const { t, tArray } = useTranslation();
  const conditions = buildConditions(t);
  const comparison = buildComparison(t);

  return (
    <PageTransition>
      <HomeMotionProvider>
        <div className="overflow-x-clip font-body">
          <Hero t={t} />
          <ScientificFoundation t={t} />
          <Process t={t} />
          <Conditions t={t} tArray={tArray} conditions={conditions} />
          <PatientStories t={t} conditions={conditions} />
          <Advantages t={t} comparison={comparison} />
          <ClosingCta t={t} />
        </div>
      </HomeMotionProvider>
    </PageTransition>
  );
}
