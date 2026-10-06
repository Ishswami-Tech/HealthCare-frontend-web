"use client";

import {
  ArrowUpRight,
  Award,
  Clock,
  Heart,
  Leaf,
  Shield,
  Sprout,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { DISPLAY_TITLE } from "./SectionHeading";
import { splitTrailingWords } from "./home-format";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CONTAINER, HEADING_GAP, HOME_TINTS, SECTION_Y, type HomeTint } from "./home-theme";
import { HOVER_CARD_LIFT, HOVER_TRANSITION, HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

type MiniStat = { icon: LucideIcon; value: string; label: string; tint: HomeTint };

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  tint: HomeTint;
  /**
   * Explicit bento placement. Written out in full because Tailwind only
   * compiles class names that appear literally in the source, and kept on the
   * data rather than derived from the index so the arrangement is readable in
   * one place: two wide cells across the top, then a tall cell either side of
   * a stacked pair.
   */
  cell: string;
  /** Wide cells lay the icon beside the copy instead of above it. */
  wide?: boolean;
};

function FeatureCard({ feature, ordinal }: { feature: Feature; ordinal: number }) {
  const tint = HOME_TINTS[feature.tint];
  const Icon = feature.icon;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-5 sm:p-6",
        HOVER_TRANSITION,
        HOVER_CARD_LIFT,
        "hover:shadow-[0_28px_56px_-30px_rgba(10,70,52,0.4)]",
        tint.border,
        tint.wash,
        tint.hover,
        feature.wide && "lg:flex-row lg:items-start lg:gap-5"
      )}
    >
      {/* Running number, set large and faint in the card's own accent. */}
      <span
        aria-hidden="true"
        className={cn(
          "home-display pointer-events-none absolute right-4 top-2 font-heading text-[2.75rem] font-bold leading-none opacity-20 group-hover:opacity-35",
          HOVER_TRANSITION_CHILD,
          tint.text
        )}
      >
        {String(ordinal).padStart(2, "0")}
      </span>

      <span
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center rounded-2xl",
          HOVER_TRANSITION_CHILD,
          "group-hover:scale-105",
          tint.plate
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>

      {/* `mt-auto` is what gives the two tall cells the reference's silhouette
          — plate at the top of the cell, copy sitting on the floor of it. In a
          short cell there is no slack to absorb, so it changes nothing. */}
      <div
        className={cn(
          "relative mt-auto flex min-w-0 flex-1 flex-col pt-6",
          feature.wide && "lg:mt-0 lg:pt-0"
        )}
      >
        <h3 className="home-display font-heading text-[1.05rem] font-semibold text-foreground sm:text-lg">
          {feature.title}
        </h3>
        {/* The glyph is pinned to the bottom-right corner, so the last line of
            copy has to stop short of it or it runs underneath. */}
        <p className="mt-2 pr-9 text-[13px] leading-relaxed text-muted-foreground">{feature.description}</p>
      </div>

      {/* Graphic flourish, not a control — these cells have no destination of
          their own, so it is hidden from assistive tech and never focusable. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-5 right-5 flex size-7 items-center justify-center rounded-full border bg-card/70",
          HOVER_TRANSITION_CHILD,
          "group-hover:scale-110",
          tint.border,
          tint.text
        )}
      >
        <ArrowUpRight className="size-3.5" />
      </span>
    </article>
  );
}

export default function HomeWhyChooseUs() {
  const { t } = useTranslation();

  const [titleLead, titleAccent] = splitTrailingWords(t("whyChooseUs.title"), 3);

  const stats: MiniStat[] = [
    { icon: Users, value: "5000+", label: t("whyChooseUs.stats.livesTransformed"), tint: "emerald" },
    { icon: Clock, value: "20+", label: t("whyChooseUs.stats.yearsLegacy"), tint: "sky" },
    { icon: Star, value: "95%", label: t("whyChooseUs.stats.successRate"), tint: "amber" },
    { icon: Award, value: "4.9/5", label: t("whyChooseUs.stats.patientRating"), tint: "violet" },
  ];

  /* Bento rhythm: two wide cells, then a tall cell flanking a stacked pair. */
  const features: Feature[] = [
    {
      icon: Shield,
      title: t("whyChooseUs.features.governmentCertified.title"),
      description: t("whyChooseUs.features.governmentCertified.description"),
      tint: "emerald",
      cell: "lg:col-start-1 lg:col-span-2 lg:row-start-1",
      wide: true,
    },
    {
      icon: Heart,
      title: t("whyChooseUs.features.authenticAyurveda.title"),
      description: t("whyChooseUs.features.authenticAyurveda.description"),
      tint: "rose",
      cell: "lg:col-start-3 lg:col-span-2 lg:row-start-1",
      wide: true,
    },
    {
      icon: UserRound,
      title: t("whyChooseUs.features.personalizedCare.title"),
      description: t("whyChooseUs.features.personalizedCare.description"),
      tint: "violet",
      cell: "lg:col-start-1 lg:row-start-2 lg:row-span-2",
    },
    {
      icon: Leaf,
      title: t("whyChooseUs.features.naturalTreatment.title"),
      description: t("whyChooseUs.features.naturalTreatment.description"),
      tint: "amber",
      cell: "lg:col-start-2 lg:col-span-2 lg:row-start-2",
      wide: true,
    },
    {
      icon: Award,
      title: t("whyChooseUs.features.provenResults.title"),
      description: t("whyChooseUs.features.provenResults.description"),
      tint: "sky",
      cell: "lg:col-start-2 lg:col-span-2 lg:row-start-3",
      wide: true,
    },
    {
      icon: Users,
      title: t("whyChooseUs.features.expertTeam.title"),
      description: t("whyChooseUs.features.expertTeam.description"),
      tint: "teal",
      cell: "lg:col-start-4 lg:row-start-2 lg:row-span-2",
    },
  ];

  return (
    <section className={cn("home-mesh relative isolate overflow-hidden border-y border-border/60", SECTION_Y)}>
      <div className={cn(CONTAINER, "relative")}>
        {/* Centred header: rules either side of the label, a sprout glyph, then
            the statement. The treatments band runs a split heading, so the two
            light sections do not open the same way twice. */}
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <div className="flex w-full max-w-md items-center justify-center gap-4">
              <span aria-hidden="true" className="home-rule w-10 shrink-0 -scale-x-100 text-foreground sm:w-16" />
              <span className="font-heading text-[11px] font-semibold uppercase leading-none tracking-[0.26em] text-muted-foreground">
                {t("whyChooseUs.verifiedExcellence")}
              </span>
              <span aria-hidden="true" className="home-rule w-10 shrink-0 text-foreground sm:w-16" />
            </div>

            <Sprout className="mt-4 size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />

            <h2 className={cn(DISPLAY_TITLE, "mt-3 max-w-3xl text-foreground")}>
              {titleLead}
              <span className="text-emerald-700 dark:text-emerald-300">{titleAccent}</span>
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {t("whyChooseUs.subtitle")}
            </p>
          </div>
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4")}>
          {features.map((feature, index) => (
            <RevealItem key={feature.title} className={cn("h-full", feature.cell)}>
              <FeatureCard feature={feature} ordinal={index + 1} />
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Hairline figure strip — four numbers, one panel. Sits under the
            bento rather than over it so the header leads straight into the
            cards, the way the rest of the page introduces a grid. */}
        <RevealGroup className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, tint }) => (
            <RevealItem key={label} className="h-full">
              <div className="flex h-full items-center gap-3 bg-card px-4 py-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    HOME_TINTS[tint].plate
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="home-display font-heading text-xl font-semibold leading-none text-foreground">
                    {value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium leading-tight text-muted-foreground">{label}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Conversion band.
            Light, not ink. The page used to drop to near-black here, again
            under the treatments grid, and a third time at the foot — three
            slabs of the same green, the middle one sitting directly above the
            warm parchment band. The dark surface is now spent once, on the
            final CTA, so it still lands as an arrival; these mid-page bands
            instead take a tinted panel belonging to the section around them.
            The button stays solid primary, so the call is no quieter. */}
        <Reveal className="mt-10">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-primary/20 bg-linear-to-br from-emerald-50 via-card to-card px-6 py-9 shadow-[0_20px_50px_-36px_rgba(10,70,52,0.55)] sm:px-9 lg:px-12 lg:py-11 dark:from-emerald-950/40 dark:via-card dark:to-card">
            <div
              aria-hidden="true"
              className="home-dotgrid absolute inset-0 -z-10 text-emerald-800 [mask-image:linear-gradient(to_right,black,transparent_60%)] dark:text-emerald-300"
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <h3 className="home-display font-heading text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] font-semibold leading-[1.12] text-balance text-foreground">
                  {t("whyChooseUs.cta.title")}
                </h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {t("whyChooseUs.cta.description")}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2.5 lg:items-end">
                <BookVideoCta />
                <p className="text-center text-[11px] text-muted-foreground lg:text-right">
                  {t("whyChooseUs.cta.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
