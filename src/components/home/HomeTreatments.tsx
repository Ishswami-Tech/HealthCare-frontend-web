"use client";

import { m } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Droplets,
  Flame,
  Leaf,
  Stethoscope,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { Eyebrow, DISPLAY_TITLE } from "./SectionHeading";
import { splitTrailingWords } from "./home-format";
import { HEALTH_ASSESSMENT_HREF, HOME_LINKS } from "./home-links";
import { REVEAL_ITEM_VARIANTS, Reveal, RevealGroup } from "./home-motion";
import { CONTAINER, HEADING_GAP, HOME_TINTS, SECTION_Y, type HomeTint } from "./home-theme";
import { HOVER_CARD_LIFT, HOVER_TRANSITION, HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

const VISIBLE_CONDITIONS = 2;

type TreatmentKey = "panchakarma" | "agnikarma" | "viddhakarma";
type TreatmentMeta = { key: TreatmentKey; icon: LucideIcon; tint: HomeTint; href: string };

/**
 * Icons and accents are the ones each therapy already owns in
 * `THERAPY_ACCENT` and in the hero — a card that recoloured itself here would
 * stop matching the chip the visitor clicked to get to it.
 */
const TREATMENTS: TreatmentMeta[] = [
  { key: "panchakarma", icon: Droplets, tint: "sky", href: HOME_LINKS.panchakarma },
  { key: "agnikarma", icon: Flame, tint: "amber", href: HOME_LINKS.agnikarma },
  { key: "viddhakarma", icon: Zap, tint: "violet", href: HOME_LINKS.viddhaKarma },
];

function formatPercent(value: string): string {
  return value.trim().endsWith("%") ? value.trim() : `${value.trim()}%`;
}

const META_LABEL = "font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

/**
 * Horizontal padding for the card's body rows. The rows are grid children of
 * the card now rather than siblings inside one padded wrapper, so each one
 * carries the gutter itself.
 */
const ROW_PAD = "px-5 sm:px-6";

/** Botanical linework for the section's margins. */
function LeafCluster({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 240"
      fill="none"
      className={cn("pointer-events-none absolute", className)}
    >
      <g stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.07">
        <path d="M100 236C100 170 128 112 192 78 176 158 146 210 100 236Z" />
        <path d="M100 236C100 174 70 118 8 86 20 164 52 212 100 236Z" />
      </g>
      <g stroke="currentColor" strokeWidth="1.2" fill="none">
        <path d="M100 236V92" />
        <path d="M100 192c14-20 34-34 34-34M100 192c-13-20-32-34-32-34" />
      </g>
    </svg>
  );
}

export default function HomeTreatments() {
  const { t, tArray } = useTranslation();

  const [titleLead, titleAccent] = splitTrailingWords(t("treatments.subtitle"), 2);

  const treatments = TREATMENTS.map((meta) => ({
    ...meta,
    title: t(`treatments.${meta.key}.title`),
    subtitle: t(`treatments.${meta.key}.subtitle`),
    description: t(`treatments.${meta.key}.description`),
    features: tArray(`treatments.${meta.key}.features`),
    conditions: tArray(`treatments.${meta.key}.conditions`),
    successRate: formatPercent(t(`treatments.${meta.key}.successRate`)),
    duration: t(`treatments.${meta.key}.duration`),
  }));

  return (
    <section className={cn("home-botanical relative isolate overflow-hidden border-y border-border/60", SECTION_Y)}>
      {/* Margin decoration — only where there is a margin to put it in. These
          sit outside the container so they bleed off the viewport edges, which
          below `md` means straight across the heading and the first card, so
          they step out there and the canvas wash carries the section alone. */}
      <LeafCluster className="-left-20 top-16 hidden size-80 -rotate-12 text-emerald-700/40 md:block dark:text-emerald-400/15" />
      <LeafCluster className="-right-24 bottom-4 hidden size-96 rotate-[18deg] text-emerald-700/35 md:block dark:text-emerald-400/15" />
      <div
        aria-hidden="true"
        className="home-dotgrid absolute right-0 top-0 hidden h-72 w-96 text-amber-600 opacity-25 [mask-image:radial-gradient(ellipse_70%_70%_at_100%_0%,black,transparent)] md:block"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 top-10 hidden size-56 rounded-full border border-amber-500/15 md:block"
      />

      <div className={cn(CONTAINER, "relative")}>
        {/* Editorial split heading: the statement on the left, the explanation
            on the right behind a hairline rule. */}
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-7">
              <Eyebrow icon={Leaf}>{t("treatments.title")}</Eyebrow>
              <h2 className={cn(DISPLAY_TITLE, "mt-5 max-w-2xl text-foreground")}>
                {titleLead}
                {/* Same rust as the specializations band — these two sections
                    share the page's one warm accent, so it has to be one
                    tone rather than two neighbouring ambers. */}
                <span className="text-amber-800 dark:text-amber-400">{titleAccent}</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-border/70 lg:pl-10">
              <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                {t("treatments.description")}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Five explicit rows — header, description, benefits, treats, footer.
            Each card spans all five as a subgrid, so the bands line up across
            the three cards no matter how the copy falls. Without it a title
            that wraps to two lines (Panchakarma, Viddhakarma) pushes that
            card's benefits, chips and figures out of step with Agnikarma's,
            and the three stop reading as a set. */}
        <RevealGroup
          className={cn(
            HEADING_GAP,
            "grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto_auto]"
          )}
        >
          {treatments.map((treatment) => {
            const tint = HOME_TINTS[treatment.tint];
            const Icon = treatment.icon;
            const hidden = treatment.conditions.slice(VISIBLE_CONDITIONS);

            return (
              <m.article
                key={treatment.key}
                variants={REVEAL_ITEM_VARIANTS}
                className={cn(
                  // The whole card carries the therapy's tint rather than just
                  // a header band, so the three read as three distinct objects
                  // from across the page.
                  "group relative flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border",
                  HOVER_TRANSITION,
                  HOVER_CARD_LIFT,
                  "hover:shadow-[0_32px_60px_-34px_rgba(10,70,52,0.45)]",
                  tint.border,
                  tint.soft,
                  tint.hover,
                  "lg:row-span-5 lg:grid lg:grid-rows-subgrid lg:gap-y-5"
                )}
              >
                {/* Header: round plate, title pair, and a trailing glyph that
                    echoes the "Learn More" link at the foot of the card. It is
                    decorative — making it a second link to the same page would
                    give screen readers a duplicate. */}
                <div className={cn(ROW_PAD, "pt-5 sm:pt-6")}>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-13",
                        HOVER_TRANSITION_CHILD,
                        "group-hover:scale-105",
                        tint.plate
                      )}
                    >
                      <Icon className="size-6 sm:size-6.5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="home-display font-heading text-[1.2rem] font-semibold leading-tight text-foreground">
                        {treatment.title}
                      </h3>
                      <p className={cn("mt-1 text-[12.5px] font-medium leading-snug", tint.text)}>
                        {treatment.subtitle}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "hidden size-9 shrink-0 items-center justify-center rounded-full sm:flex",
                        HOVER_TRANSITION_CHILD,
                        "group-hover:scale-110",
                        tint.plate
                      )}
                    >
                      <ArrowRight className={cn("size-4 group-hover:translate-x-0.5", HOVER_TRANSITION_CHILD)} />
                    </span>
                  </div>

                  <div className={cn("mt-5 h-px w-full", tint.rule)} />
                </div>

                <p className={cn(ROW_PAD, "text-[13.5px] leading-relaxed text-muted-foreground")}>
                  {treatment.description}
                </p>

                {/* Benefits in two columns — four short phrases stacked in one
                    column ran the card half a screen tall for no gain. */}
                <ul className={cn(ROW_PAD, "grid gap-x-4 gap-y-2.5 sm:grid-cols-2")}>
                  {treatment.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground">
                      {/* The tick takes the therapy's own accent. Emerald on
                          every card made the per-therapy colour decorative. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-px flex size-[17px] shrink-0 items-center justify-center rounded-full bg-linear-to-br text-white",
                          tint.gradient
                        )}
                      >
                        <Check className="size-[11px]" strokeWidth={3.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className={ROW_PAD}>
                  <h4 className={META_LABEL}>{t("treatments.labels.treats")}</h4>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {treatment.conditions.slice(0, VISIBLE_CONDITIONS).map((condition) => (
                      <span
                        key={condition}
                        className={cn(
                          tint.plate,
                          "rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-foreground"
                        )}
                      >
                        {condition}
                      </span>
                    ))}
                    {hidden.length > 0 ? (
                      // The overflow chip is not a control, so at least let it
                      // say what it is hiding instead of being a dead end.
                      <span
                        title={hidden.join(", ")}
                        className="rounded-full border border-border/70 bg-background px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground"
                      >
                        +{hidden.length} {t("treatments.labels.more")}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* The footer row is a query container, so the figures and the
                    button pair lay themselves out against the width of the
                    card they are in rather than the width of the window. Three
                    cards across a 1024px screen are ~305px wide, where the two
                    buttons side by side need 367px — as viewport breakpoints
                    that row stayed horizontal and the card, which clips, ate
                    the end of "Book Consultation". `container-type` also stops
                    this row forcing the card's column wider than its share.
                    The container has to be this row and not the card: the card
                    is an `lg:grid-rows-subgrid` item, and containment on it
                    drops the subgrid, so the five bands stop lining up across
                    the three cards. */}
                <div className={cn(ROW_PAD, "@container flex flex-col gap-4 pb-5 sm:pb-6")}>
                  {/* Figure pair on its own plate, hairline split */}
                  <div
                    className={cn(
                      "grid grid-cols-2 overflow-hidden rounded-2xl border bg-background/60",
                      tint.border
                    )}
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      {/* A star reads as a review score. This figure is an
                          outcome rate, so it gets a chart mark instead. */}
                      <BarChart3 className={cn("size-[18px] shrink-0", tint.text)} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="home-display font-heading text-[1.05rem] font-semibold leading-none text-foreground">
                          {treatment.successRate}
                        </p>
                        <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                          {t("treatments.labels.successRate")}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2.5 border-l px-3.5 py-3", tint.border)}>
                      <Clock className={cn("size-[18px] shrink-0", tint.text)} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="home-display font-heading text-[1.05rem] font-semibold leading-none text-foreground">
                          {treatment.duration}
                        </p>
                        <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                          {t("treatments.labels.duration")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Side by side only once the card itself can hold both
                      labels unbroken (`@xs` = 20rem of row, which the pair
                      needs), stacked below that. The short label sizes to its
                      own content and the long one takes the rest, which is
                      also how the two sit in the reference; where the card
                      runs the full width of the page letting the booking
                      button flex blew it out to 500px beside a 120px sibling,
                      so there both size to their content. */}
                  <div className="flex flex-col gap-2.5 @xs:flex-row">
                    <HomeLinkButton
                      href={treatment.href}
                      size="md"
                      trailingIcon={ArrowRight}
                      className={cn(
                        "home-sheen shrink-0 gap-2 bg-linear-to-r px-4 text-[13px] text-white",
                        tint.gradient
                      )}
                    >
                      {t("treatments.labels.learnMore")}
                    </HomeLinkButton>
                    <BookVideoCta
                      variant="outline"
                      size="md"
                      showArrow={false}
                      icon={CalendarDays}
                      label={t("treatments.labels.bookConsultation")}
                      className="min-w-0 gap-2 bg-background px-3 text-[13px] @xs:flex-1"
                    />
                  </div>
                </div>
              </m.article>
            );
          })}
        </RevealGroup>

        {/* Dual-path conversion band. Warm panel rather than ink — see the
            note on the matching band in `HomeWhyChooseUs`; the page spends its
            one dark surface on the final CTA. */}
        <Reveal className="mt-10">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-amber-200/80 bg-linear-to-br from-amber-50 via-card to-card px-6 py-9 shadow-[0_20px_50px_-36px_rgba(120,70,20,0.45)] sm:px-9 lg:px-12 lg:py-11 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-card dark:to-card">
            <div
              aria-hidden="true"
              className="home-dotgrid absolute inset-0 -z-10 text-amber-700 [mask-image:linear-gradient(to_right,black,transparent_60%)] dark:text-amber-400"
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <h3 className="home-display font-heading text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] font-semibold leading-[1.12] text-balance text-foreground">
                  {t("treatments.cta.title")}
                </h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {t("treatments.cta.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <HomeLinkButton href={HEALTH_ASSESSMENT_HREF} size="lg" icon={ClipboardList}>
                  {t("treatments.cta.assessmentButton")}
                </HomeLinkButton>
                <HomeLinkButton
                  href={HOME_LINKS.booking}
                  variant="outline"
                  size="lg"
                  icon={Stethoscope}
                  className="bg-card"
                >
                  {t("treatments.cta.expertButton")}
                </HomeLinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
