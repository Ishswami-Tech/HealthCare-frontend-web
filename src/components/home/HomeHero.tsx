"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  Award,
  Check,
  ChevronDown,
  Droplets,
  Flame,
  Flower2,
  Leaf,
  Pause,
  Play,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { HOME_LINKS } from "./home-links";
import { HOME_EASE } from "./home-motion";
import {
  HERO_BENEFIT_COUNT,
  HERO_SLIDES,
  SLIDE_DURATION_MS,
  useHeroCarousel,
  type HeroSlide,
} from "./home-hero-slides";
import { ACCENTS, CONTAINER, THERAPY_ACCENT } from "@/lib/design/tokens";

/**
 * Entrance animation driven by CSS (tw-animate-css) so hero content is visible
 * and animating straight from the server-rendered HTML, before hydration.
 * The expo ease matches every other transition on the page — Tailwind's stock
 * `ease-out` decelerates too early to read as deliberate at this scale.
 */
const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Entrance ladder. Even steps, so the column resolves top-to-bottom as one
 * movement rather than six unrelated fades. Written out because Tailwind only
 * compiles class names it can see literally.
 */
const DELAY = {
  eyebrow: "",
  headline: "delay-[90ms]",
  therapies: "delay-[180ms]",
  actions: "delay-[270ms]",
  rail: "delay-[360ms]",
  figures: "delay-[450ms]",
} as const;

type Therapy = {
  key: keyof typeof THERAPY_ACCENT;
  icon: LucideIcon;
  href: string;
  labelKey: string;
  /**
   * Written out in full rather than interpolated from the accent token —
   * Tailwind only detects class names that appear literally in the source.
   */
  hoverText: string;
};

type Figure = { icon: LucideIcon; value: string; label: string };

/**
 * The three specialisations, each with the icon and accent it already owns in
 * `THERAPY_ACCENT` and `HomeSpecializations` — so the hero speaks the same
 * colour-per-therapy language as the cards and the treatment pages.
 */
const THERAPIES: readonly Therapy[] = [
  {
    key: "agnikarma",
    icon: Flame,
    href: HOME_LINKS.agnikarma,
    labelKey: "treatments.agnikarma.name",
    hoverText: "group-hover/therapy:text-amber-700 dark:group-hover/therapy:text-amber-300",
  },
  {
    key: "viddhakarma",
    icon: Zap,
    href: HOME_LINKS.viddhaKarma,
    labelKey: "treatments.viddhakarma.name",
    hoverText: "group-hover/therapy:text-violet-700 dark:group-hover/therapy:text-violet-300",
  },
  {
    key: "panchakarma",
    icon: Droplets,
    href: HOME_LINKS.panchakarma,
    labelKey: "treatments.panchakarma.name",
    hoverText: "group-hover/therapy:text-sky-700 dark:group-hover/therapy:text-sky-300",
  },
];

/** Faint botanical linework in the corners of the panel. */
function HeroOrnament({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      fill="none"
      className={cn("pointer-events-none absolute size-40 text-emerald-800/[0.06]", className)}
    >
      <path
        d="M60 110C60 70 80 40 112 26 104 66 86 96 60 110ZM60 110C60 74 44 46 16 32 22 68 38 96 60 110Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M60 110V54" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Headline, tagline, lede and benefits for one slide.
 *
 * Every slide is rendered, stacked in a single grid cell, with the inactive
 * ones hidden. That makes the cell exactly as tall as the tallest slide
 * without measuring anything in JavaScript: the height is correct on the
 * server-rendered HTML, survives a font swap or a language change, and the
 * section never resizes mid-rotation (which would shove the rest of the page
 * up and down every five seconds). `items-end` on the grid puts the slack
 * above the headline rather than leaving a hole under the lede.
 *
 * Only the active slide renders an `h1`; the hidden ones are plain `div`s, so
 * the document still has exactly one top-level heading.
 */
function HeroCopy({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  const { t, tArray } = useTranslation();

  const accent = ACCENTS[slide.accent];
  const isSingleLine = slide.headlineKeys.length === 1;
  const benefits = slide.benefitsKey ? tArray(slide.benefitsKey).slice(0, HERO_BENEFIT_COUNT) : [];

  const headingClass = cn(
    "home-display font-heading font-semibold text-balance",
    // `globals.css` sets `overflow-wrap: anywhere` on every heading, which
    // lets the balancer split a single word across two lines. That applied to
    // the active `h1` but not to the hidden `div` sizers beside it, so
    // "Viddhakarma" measured one line while hidden and two while active and
    // the reserved height jumped 68px on that slide. Pinning it here keeps
    // every copy identical — and stops a therapy name breaking mid-word.
    "[overflow-wrap:break-word]",
    isSingleLine
      ? // One word at the brand slide's size wastes the reserved height; at
        // this scale it reads as a deliberate editorial title.
        cn("text-[length:var(--home-hero-display-solo)] font-bold", accent.text)
      : "text-[length:var(--home-hero-display)] text-foreground",
    // Must come AFTER the font size. `cn` runs tailwind-merge, which treats an
    // arbitrary `text-[…]` as a font-size utility and drops any earlier
    // `leading-*` with it — Tailwind's own text sizes bundle a line-height, so
    // they are listed as conflicting. Leading it instead of trailing it here
    // silently left the headline at the 1.5 body line-height, which is what
    // made the hero overrun the first screen by ~100px.
    "leading-[1.02]"
  );

  const lines = slide.headlineKeys.map((key, lineIndex) => (
    <span
      key={key}
      className={cn(
        "block",
        // Three lines at one weight and one colour read as a wall with no
        // payoff. Light → semibold → emerald, with the marker on the last.
        !isSingleLine && lineIndex === 0 && "font-light text-foreground/60",
        !isSingleLine && lineIndex === 1 && "font-semibold",
        !isSingleLine &&
          lineIndex === 2 &&
          cn("home-mark font-bold", ACCENTS.emerald.text)
      )}
    >
      {t(key)}
    </span>
  ));

  return (
    <div
      aria-hidden={isActive ? undefined : true}
      className={cn("col-start-1 row-start-1 self-end", !isActive && "invisible")}
    >
      {/*
       * Remounted on every activation (the key flips with `isActive`) so the
       * staggered `home-hero-copy-in` ladder replays for the incoming slide.
       * The wrapper must stay a plain box: the CSS targets its direct
       * children by position, and the hidden sizers never carry the class, so
       * the reserved height is untouched.
       */}
      <div key={isActive ? "on" : "off"} className={cn(isActive && "home-hero-copy-in")}>
        {isActive ? <h1 className={headingClass}>{lines}</h1> : <div className={headingClass}>{lines}</div>}

        {/* `hero.transformHealth` is a fragment on its own — the brand slide
            completes it with the script accent. The tight leading is what
            keeps the oversized script word from blowing the line box open
            when the sentence wraps on a phone. */}
        <p
          className={cn(
            "mt-[var(--hero-gap-1)] max-w-[38ch] text-pretty font-heading text-[clamp(1.1rem,0.92rem+0.6vw,1.4rem)] font-semibold leading-[1.3]",
            // Emerald under an amber or violet headline looks like two accents
            // fighting. Only the brand slide keeps it — that line is the brand.
            isSingleLine ? "text-foreground/75" : "text-emerald-900 dark:text-emerald-200"
          )}
        >
          {slide.taglineKey ? (
            t(slide.taglineKey)
          ) : (
            <>
              {t("hero.transformHealth")}{" "}
              <span className="font-script text-[1.3em] font-semibold leading-none">
                {t("hero.ancientWisdom")}
              </span>
            </>
          )}
        </p>

        <p className="mt-[var(--hero-gap-2)] max-w-[52ch] text-[14.5px] leading-[1.65] text-foreground/75 sm:text-[15px]">
          {t(slide.ledeKey)}
        </p>

        {benefits.length > 0 ? (
          <ul className="mt-[var(--hero-gap-2)] grid max-w-lg gap-[var(--hero-gap-1)]">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground/85"
              >
                <span
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                    accent.plate
                  )}
                  aria-hidden="true"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default function HomeHero() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const carousel = useHeroCarousel();
  const { index, slide, isPlaying, isStopped, goTo, toggleStopped, pauseHandlers } = carousel;

  const figures: Figure[] = [
    { icon: Users, value: "5000+", label: t("stats.livesTransformed") },
    { icon: Award, value: "20+", label: t("stats.yearsLegacy") },
    { icon: Leaf, value: "95%", label: t("stats.successRate") },
    { icon: ShieldCheck, value: "", label: t("common.governmentCertified") },
  ];

  const accent = ACCENTS[slide.accent];

  return (
    <section
      className={cn(
        "home-hero relative isolate overflow-hidden border-b border-border/60",
        // One screen, not more. `svh` rather than `vh` so a mobile browser's
        // collapsing toolbar does not leave the band taller than the visible
        // area. The floor keeps it sane on a very short window, where the
        // page is expected to scroll a little.
        "lg:flex lg:flex-col lg:justify-center lg:min-h-[calc(100svh-var(--home-header-h))]"
      )}
      {...pauseHandlers}
    >
      {/* Photograph. Full-bleed from lg; a band at the top of the section
          below that, where a 16:9 picture in a portrait slot would otherwise
          be cropped to a sliver. */}
      <div className="absolute inset-x-0 top-0 -z-20 h-[var(--home-hero-band)] lg:inset-0 lg:h-auto">
        <AnimatePresence mode="sync" initial={false}>
          <m.div
            key={slide.key}
            aria-hidden="true"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: HOME_EASE }}
          >
            {/* Ken Burns lives on this inner wrapper, not on the crossfading
                parent — Motion owns `transform` there. */}
            <div className="home-hero-drift absolute inset-0">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover [object-position:var(--hero-focal-mobile)] lg:[object-position:var(--hero-focal)]"
                style={
                  {
                    "--hero-focal": slide.focal,
                    "--hero-focal-mobile": slide.focalMobile,
                  } as CSSProperties
                }
              />
            </div>
          </m.div>
        </AnimatePresence>

        <div aria-hidden="true" className="home-hero-band-fade absolute inset-0 lg:hidden" />
      </div>

      {/* Frosted scrim, lg and up only. Below that the copy sits on plain
          canvas under the band, so there is nothing to veil. The aura is a
          slow emerald drift behind it, so the column breathes instead of
          sitting on a flat wash. */}
      <div
        aria-hidden="true"
        className="home-hero-scrim home-hero-aura absolute inset-0 -z-10 hidden lg:block"
      />

      {/* Decorative only, and the left one lands squarely behind the copy on a
          phone — so both step out below lg. */}
      <HeroOrnament className="right-[6%] top-10 hidden lg:block" />
      <HeroOrnament className="-left-8 bottom-0 hidden -scale-x-100 lg:block" />

      <div className={cn(CONTAINER, "relative")}>
        <div className="pb-9 pt-[calc(var(--home-hero-band)+1.5rem)] sm:pb-11 lg:w-[56%] lg:max-w-[44rem] lg:py-[var(--home-hero-pad-y)]">
          {/* Eyebrow */}
          <div
            className={cn(
              ENTER,
              DELAY.eyebrow,
              "inline-flex items-center gap-2 rounded-full border border-white/70 bg-card/80 py-1.5 pl-1.5 pr-4 shadow-[0_2px_12px_-6px_rgba(10,70,52,0.45)] backdrop-blur-md max-[430px]:pr-3"
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/12 ring-1 ring-inset ring-emerald-500/20">
              <Flower2 className="size-3.5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            </span>
            <span className="font-heading text-[12.5px] font-semibold leading-none text-foreground max-[430px]:text-[11.5px]">
              {t("hero.ancientWisdom")}
              {/* The clinic strapline is secondary; on a phone it wraps the
                  pill onto a second line and pushes the booking CTA under the
                  fold, so it steps out below 430px. */}
              <span className="mx-2 text-border max-[430px]:hidden" aria-hidden="true">
                |
              </span>
              <span className="font-medium text-muted-foreground max-[430px]:hidden">
                {t("navigation.clinicSubtitle")}
              </span>
            </span>
          </div>

          {/* Headline block — every slide stacked in one grid cell. */}
          <div className={cn(ENTER, DELAY.headline, "mt-[var(--hero-gap-3)] grid")}>
            {HERO_SLIDES.map((item, itemIndex) => (
              <HeroCopy key={item.key} slide={item} isActive={itemIndex === index} />
            ))}
          </div>

          {/* The three specialisations. One segmented plate rather than three
              loose icons — it reads as a control, echoes the figures plate at
              the foot of the column, and stops the row floating in the gap
              between the lede and the buttons. */}
          <ul
            className={cn(
              ENTER,
              DELAY.therapies,
              "mt-[var(--hero-gap-4)] grid max-w-md grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-2xl border border-white/70 bg-card/70 shadow-[0_10px_28px_-24px_rgba(10,70,52,0.5)] backdrop-blur sm:max-w-lg"
            )}
          >
            {THERAPIES.map(({ key, icon: Icon, href, labelKey, hoverText }) => {
              const tint = ACCENTS[THERAPY_ACCENT[key]];
              return (
                <li key={key}>
                  <Link
                    href={href}
                    prefetch={false}
                    className="group/therapy flex h-full flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-colors duration-[420ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] delay-0 hover:delay-[60ms] hover:bg-foreground/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 sm:flex-row sm:gap-2.5 sm:px-3"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-[420ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] delay-0 group-hover/therapy:delay-[60ms] group-hover/therapy:-translate-y-0.5 group-hover/therapy:scale-105",
                        tint.plate
                      )}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span
                      className={cn(
                        "font-heading text-[11.5px] font-semibold leading-tight text-foreground/85 transition-colors duration-300 sm:text-[13px]",
                        hoverText
                      )}
                    >
                      {t(labelKey)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Calls to action */}
          <div
            className={cn(
              ENTER,
              DELAY.actions,
              "mt-[var(--hero-gap-3)] flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            )}
          >
            <BookVideoCta label={t("hero.primaryCta")} className="w-full sm:w-auto" />
            <HomeLinkButton
              href={HOME_LINKS.youtube}
              variant="outline"
              size="lg"
              icon={Play}
              className="w-full bg-card/80 backdrop-blur sm:w-auto"
            >
              {t("hero.watchJourneysText")}
            </HomeLinkButton>
          </div>

          {/* Service picker — the rail the rotation runs on.
              No visible slide caption: on three of the four slides it simply
              repeated the headline a line above it, and on the brand slide the
              doctor's full name truncated to an ellipsis. Each bar still
              carries the slide name as its accessible label. */}
          <div
            className={cn(
              ENTER,
              DELAY.rail,
              "mt-[var(--hero-gap-4)] flex max-w-md items-center gap-3 sm:gap-4"
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {HERO_SLIDES.map((item, itemIndex) => {
                const isActive = itemIndex === index;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => goTo(itemIndex)}
                    aria-label={t(item.overlayTitleKey)}
                    aria-current={isActive}
                    className="group/dot relative h-5 flex-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {/* The track is inset so the button itself can keep a
                        pointer-sized hit area around a 3px rule. */}
                    <span className="absolute inset-x-0 top-1/2 block h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-foreground/15 transition-colors duration-300 group-hover/dot:bg-foreground/30">
                      {isActive ? (
                        <m.span
                          key={`${item.key}-${index}-${isPlaying}`}
                          className={cn(
                            "absolute inset-y-0 left-0 block w-full origin-left rounded-full bg-linear-to-r",
                            accent.gradient
                          )}
                          initial={{ scaleX: isPlaying ? 0 : 1 }}
                          animate={{ scaleX: 1 }}
                          transition={
                            isPlaying
                              ? { duration: SLIDE_DURATION_MS / 1000, ease: "linear" }
                              : { duration: 0.2 }
                          }
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="flex shrink-0 items-baseline gap-1 font-mono text-[11.5px] tabular-nums text-muted-foreground">
              <span className="text-[13px] font-semibold text-foreground/85">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="opacity-40">/</span>
              <span>{String(HERO_SLIDES.length).padStart(2, "0")}</span>
            </p>

            <button
              type="button"
              onClick={toggleStopped}
              aria-label={isStopped ? t("common.play") : t("common.pause")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-[color,border-color,translate,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:text-emerald-300"
            >
              {isStopped ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          </div>

          {/* Figures. One frosted plate with hairlines inside it — `divide-x`
              over a transparent background died against the photograph. */}
          <dl
            className={cn(
              ENTER,
              DELAY.figures,
              "mt-[var(--hero-gap-4)] grid max-w-2xl grid-cols-2 overflow-hidden rounded-2xl border border-white/70 bg-card/75 shadow-[0_16px_36px_-26px_rgba(10,70,52,0.5)] backdrop-blur sm:grid-cols-4"
            )}
          >
            {figures.map(({ icon: Icon, value, label }, figureIndex) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3",
                  figureIndex > 1 && "border-t border-border/60 sm:border-t-0",
                  figureIndex % 2 === 1 && "border-l border-border/60",
                  "sm:border-l sm:first:border-l-0"
                )}
              >
                <Icon
                  className="size-[18px] shrink-0 text-emerald-700 dark:text-emerald-300"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  {value ? (
                    <dd className="home-display font-heading text-[1.3rem] font-semibold leading-none text-foreground">
                      {value}
                    </dd>
                  ) : null}
                  <dt
                    className={cn(
                      "text-[10.5px] uppercase leading-tight tracking-[0.06em] text-muted-foreground",
                      value ? "mt-1" : "font-semibold text-foreground/85"
                    )}
                  >
                    {label}
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Scroll affordance for the full-height desktop hero. Sat over the
          photograph rather than centred on the viewport, where it would land
          on the figures plate — and clear of the fixed WhatsApp button in the
          opposite corner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 left-[70%] hidden -translate-x-1/2 lg:block"
      >
        <span className="home-hero-cue flex size-9 items-center justify-center rounded-full border border-white/50 bg-card/60 text-foreground/70 shadow-[0_6px_18px_-10px_rgba(10,70,52,0.5)] backdrop-blur">
          <ChevronDown className="size-4" />
        </span>
      </div>
    </section>
  );
}
