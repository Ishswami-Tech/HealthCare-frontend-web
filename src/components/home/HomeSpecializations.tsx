"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Droplets, Flame, Zap, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { HomeLinkButton } from "./HomeLinkButton";
import { splitTrailingWords } from "./home-format";
import { HOME_LINKS } from "./home-links";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CONTAINER, HOME_TINTS, SECTION_Y, type HomeTint } from "./home-theme";
import { HOVER_CARD_LIFT, HOVER_TRANSITION, HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";
import { SURFACE } from "@/lib/design/tokens";

type Specialization = {
  key: "panchakarma" | "agnikarma" | "viddhakarma";
  icon: LucideIcon;
  tint: HomeTint;
  href: string;
  /** Accent for the card's "Learn More" link — written out for Tailwind. */
  linkText: string;
};

const SPECIALIZATIONS: Specialization[] = [
  {
    key: "panchakarma",
    icon: Droplets,
    tint: "sky",
    href: HOME_LINKS.panchakarma,
    linkText: "text-sky-700 dark:text-sky-300",
  },
  {
    key: "agnikarma",
    icon: Flame,
    tint: "amber",
    href: HOME_LINKS.agnikarma,
    linkText: "text-amber-700 dark:text-amber-300",
  },
  {
    key: "viddhakarma",
    icon: Zap,
    tint: "violet",
    href: HOME_LINKS.viddhaKarma,
    linkText: "text-violet-700 dark:text-violet-300",
  },
];

/** Lotus mark that sits in the break of the heading's divider rule. */
function LotusMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 28"
      fill="none"
      className={cn("shrink-0", className)}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <path d="M24 25c0-7 3.2-12.4 9.6-16.2C34.6 17 31.4 22.4 24 25Z" />
      <path d="M24 25c0-7-3.2-12.4-9.6-16.2C13.4 17 16.6 22.4 24 25Z" />
      <path d="M24 25c0-8 1-13.6 0-18-1 4.4 0 10 0 18Z" />
      <path d="M24 25c0-5 5.4-8.4 13-9.4-2.6 5.6-7.2 8.8-13 9.4ZM24 25c0-5-5.4-8.4-13-9.4 2.6 5.6 7.2 8.8 13 9.4Z" />
    </svg>
  );
}

/** Botanical sprig tucked into the lower corner of a card. */
function CardSprig({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 90 110"
      fill="none"
      className={cn("pointer-events-none absolute", className)}
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M45 108V34" />
      <g fill="currentColor" fillOpacity="0.1">
        <path d="M45 80c0-14 7-23 21-27-2 17-9 26-21 27ZM45 80c0-14-7-23-21-27 2 17 9 26 21 27Z" />
        <path d="M45 52c0-12 6-19.5 17.5-23-1.5 14.5-7.5 22-17.5 23ZM45 52c0-12-6-19.5-17.5-23 1.5 14.5 7.5 22 17.5 23Z" />
      </g>
    </svg>
  );
}

/**
 * Warm showcase band for the three signature therapies. Parchment rather than
 * the page's usual card surface — it is the one warm beat between the cool
 * light sections either side of it, which is what keeps them from blurring
 * into a single stretch.
 */
export default function HomeSpecializations() {
  const { t } = useTranslation();

  // "Our Specializations" → "Our" above, the payoff word below in italic.
  const [titleLead, titleAccent] = splitTrailingWords(t("homepage.specializations.title"), 1);

  return (
    <section className={cn(SURFACE.parchment, "relative isolate overflow-hidden", SECTION_Y)}>
      {/* Warm atmosphere: two soft pools and a gilt hairline sweeping out of
          the top corner, both well outside the text column. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 size-[32rem] rounded-full bg-[radial-gradient(circle,oklch(0.86_0.06_60/0.5),transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 size-[30rem] rounded-full bg-[radial-gradient(circle,oklch(0.88_0.04_30/0.42),transparent_70%)] blur-2xl"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 400 300"
        fill="none"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -top-10 right-0 hidden h-72 w-[28rem] text-amber-700/25 lg:block"
      >
        <path d="M400 10C300 10 250 70 268 140c14 54 90 72 132 150" stroke="currentColor" strokeWidth="1" />
        <path d="M400 46C322 50 286 96 300 150c12 46 70 66 100 120" stroke="currentColor" strokeWidth="0.75" />
      </svg>

      <div className={cn(CONTAINER, "relative")}>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
            <div className="lg:col-span-7">
              {/* Running number, rule, label — one line, editorial. */}
              <div className="flex items-center gap-4">
                <span className="font-heading text-sm font-semibold tabular-nums tracking-[0.1em] text-amber-800 dark:text-amber-400">
                  04
                </span>
                <span aria-hidden="true" className="h-px w-10 bg-amber-800/40 dark:bg-amber-400/40" />
                <span className="font-heading text-[11px] font-semibold uppercase leading-none tracking-[0.3em] text-foreground/70">
                  {t("navigation.treatments")}
                </span>
              </div>

              {/* Newsreader, already the brand's serif on the auth screens. The
                  payoff word drops to its own line in the real italic cut. */}
              <h2 className="mt-5 font-serif text-[clamp(2.4rem,1.4rem+4.2vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-foreground">
                {/* The separating space is kept, not trimmed — the accent is a
                    block so it never renders, but without it the accessible
                    name collapses to "OurSpecializations". */}
                {titleLead}
                <span className="mt-1 block font-semibold italic text-amber-800 dark:text-amber-400">
                  {titleAccent}
                </span>
              </h2>

              {/* Rule — lotus — rule */}
              <div aria-hidden="true" className="mt-7 flex max-w-md items-center gap-4">
                <span className="home-rule w-full -scale-x-100 text-amber-900" />
                <LotusMark className="h-6 w-10 text-amber-700/70 dark:text-amber-400/70" />
                <span className="home-rule w-full text-amber-900" />
              </div>
            </div>

            <div className="flex flex-col items-start gap-7 lg:col-span-5 lg:pt-2">
              <p className="max-w-md text-pretty text-[15px] leading-relaxed text-foreground/70 sm:text-base">
                {t("homepage.specializations.subtitle")}
              </p>
              <HomeLinkButton
                href={HOME_LINKS.treatments}
                size="lg"
                trailingIcon={ArrowRight}
                className="home-sheen bg-linear-to-r from-amber-800 to-orange-800 text-white shadow-[0_12px_30px_-14px_oklch(0.5_0.12_55_/_0.9)] hover:from-amber-900 hover:to-orange-900"
              >
                {t("common.learnMore")}
              </HomeLinkButton>
            </div>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-14">
          {SPECIALIZATIONS.map(({ key, icon: Icon, tint: tintKey, href, linkText }, index) => {
            const tint = HOME_TINTS[tintKey];

            return (
              <RevealItem key={key} className="h-full">
                <Link
                  href={href}
                  prefetch={false}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-6 sm:p-7",
                    HOVER_TRANSITION,
                    HOVER_CARD_LIFT,
                    "hover:shadow-[0_32px_60px_-32px_rgba(90,50,20,0.35)]",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    tint.border,
                    tint.wash,
                    tint.hover
                  )}
                >
                  {/* Soft wave across the floor of the card, in the card's own
                      accent — the shape the sprig sits on. */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 400 160"
                    fill="none"
                    preserveAspectRatio="none"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-25 group-hover:opacity-40",
                      HOVER_TRANSITION_CHILD,
                      tint.text
                    )}
                  >
                    <path d="M0 96c74-46 138 22 212-6s114-62 188-38v108H0V96Z" fill="currentColor" fillOpacity="0.28" />
                  </svg>

                  <CardSprig
                    className={cn("-bottom-2 right-3 h-28 w-24 opacity-50", tint.text)}
                  />

                  {/* Running number */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute right-5 top-3 font-serif text-[3.5rem] font-bold leading-none opacity-25 group-hover:opacity-40",
                      HOVER_TRANSITION_CHILD,
                      tint.text
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={cn(
                      "relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg",
                      HOVER_TRANSITION_CHILD,
                      "group-hover:scale-105",
                      tint.gradient,
                      tint.glow
                    )}
                  >
                    <Icon className="size-7" aria-hidden="true" />
                  </span>

                  <h3 className="relative mt-6 font-serif text-[1.65rem] font-bold leading-tight tracking-[-0.01em] text-foreground">
                    {t(`homepage.specializations.${key}.title`)}
                  </h3>
                  <p className="relative mt-2 max-w-[22rem] flex-1 text-[14.5px] leading-relaxed text-foreground/65">
                    {t(`homepage.specializations.${key}.description`)}
                  </p>

                  <span
                    className={cn(
                      "relative mt-7 inline-flex items-center gap-3 font-heading text-[13.5px] font-semibold",
                      linkText
                    )}
                  >
                    {t("common.learnMore")}
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border",
                        HOVER_TRANSITION_CHILD,
                        "group-hover:translate-x-1",
                        tint.border,
                        tint.soft
                      )}
                    >
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
