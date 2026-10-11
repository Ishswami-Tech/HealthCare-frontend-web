"use client";

import { m } from "motion/react";
import { Check, ChevronRight, Clock, Flower2, Leaf, type LucideIcon } from "lucide-react";
import { HOME_EASE, Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CONTAINER,
  DISPLAY_LG,
  DISPLAY_MD,
  HOVER_CARD_LIFT,
  HOVER_TRANSITION,
  SECTION_Y,
  SURFACE,
} from "@/lib/design/tokens";
import { splitTail, type TreatmentTheme } from "./treatment-theme";

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short chip under the title, e.g. a phase duration. */
  meta?: string;
  /** Optional bullet list, e.g. a phase's key activities. */
  points?: string[];
  pointsLabel?: string;
}

interface TreatmentProcessProps {
  theme: TreatmentTheme;
  title: string;
  subtitle: string;
  steps: ProcessStep[];
}

const EMERALD_WAVE = "oklch(0.62 0.16 150)";

/** Literal classes so Tailwind can see them. */
const GRID_COLUMNS: Record<number, string> = {
  3: "md:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-6",
};

/** Agnikarma's hand-tuned gradient stops for five steps. */
const FIVE_STEP_STOPS = [0, 22, 30, 45, 52, 65, 72, 86, 93, 100];

/** Wave through the step badges: one S-bend per hand-off, alternating up and down. */
function wavePath(count: number): string {
  const spacing = 1000 / count;
  const pull = spacing * 0.3;
  const centre = (index: number) => spacing * (index + 0.5);
  let path = `M ${centre(0)},40 C ${centre(0) + pull},0 ${centre(1) - pull},0 ${centre(1)},40`;
  for (let index = 2; index < count; index += 1) {
    path += ` S ${centre(index) - pull},${index % 2 === 0 ? 80 : 0} ${centre(index)},40`;
  }
  return path;
}

/** Colour stops: each step's own colour across its share of the line. */
function waveStops(count: number, accentWave: string): { offset: number; color: string }[] {
  const colorFor = (index: number) => (index % 2 === 0 ? EMERALD_WAVE : accentWave);

  if (count === 5) {
    return FIVE_STEP_STOPS.map((offset, stopIndex) => ({ offset, color: colorFor(Math.floor(stopIndex / 2)) }));
  }

  const share = 100 / count;
  return Array.from({ length: count }, (_, index) => [
    { offset: index === 0 ? 0 : index * share + share * 0.15, color: colorFor(index) },
    { offset: index === count - 1 ? 100 : (index + 1) * share - share * 0.15, color: colorFor(index) },
  ]).flat();
}

/** Hand-drawn-feeling wave that threads the step badges together. */
function ProcessConnector({ theme, count }: { theme: TreatmentTheme; count: number }) {
  const gradientId = `${theme.id}-process-wave`;
  const handOffs = Array.from({ length: count - 1 }, (_, index) => ((index + 1) / count) * 100);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-20 -translate-y-1/2 lg:block">
      <svg className="size-full" viewBox="0 0 1000 80" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {waveStops(count, theme.wave).map(({ offset, color }) => (
              <stop key={offset} offset={`${offset}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <m.path
          d={wavePath(count)}
          stroke={`url(#${gradientId})`}
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
      {handOffs.map((left, index) => (
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

/** Numbered steps on a drawn wave; the steps alternate emerald and the therapy accent. */
export function TreatmentProcess({ theme, title, subtitle, steps }: TreatmentProcessProps) {
  const { lead, tail } = splitTail(title);

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y, "relative isolate overflow-hidden")}>
      {/* Soft botanical wash in the corners. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-20 size-80 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
        <div className={cn("absolute -right-24 top-10 size-80 rounded-full blur-3xl", theme.glow)} />
        <div className={cn("home-dotgrid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]", theme.dotgrid)} />
      </div>

      <div className={CONTAINER}>
        <Reveal className="flex flex-col items-center text-center">
          {/* Eyebrow flanked by rules */}
          <div className="flex w-full max-w-lg items-center gap-4">
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-emerald-700/25" />
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
              <Leaf className="size-3.5" aria-hidden="true" />
              {title}
            </span>
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-emerald-700/25" />
          </div>

          <h2 className={cn(DISPLAY_LG, "mt-6 text-emerald-950 dark:text-emerald-50")}>
            {lead}
            {tail ? (
              <>
                {" "}
                <span className={theme.tailText}>{tail}</span>
              </>
            ) : null}
          </h2>
          <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400 sm:text-xl">{subtitle}</p>

          {/* Lotus divider */}
          <div className="mt-5 flex w-full max-w-xs items-center gap-3" aria-hidden="true">
            <span className={cn("h-px flex-1 bg-linear-to-r from-transparent", theme.divider)} />
            <Flower2 className={cn("size-5 shrink-0", theme.tailText)} />
            <span className={cn("h-px flex-1 bg-linear-to-l from-transparent", theme.divider)} />
          </div>
        </Reveal>

        <div className="relative mt-20">
          <ProcessConnector theme={theme} count={steps.length} />

          <RevealGroup stagger={0.12} className={cn("grid grid-cols-1 gap-x-4 gap-y-16", GRID_COLUMNS[steps.length])}>
            {steps.map(({ icon: Icon, title: stepTitle, description, meta, points, pointsLabel }, index) => {
              const step = index + 1;
              const isEmerald = index % 2 === 0;
              const tone = ACCENTS[isEmerald ? "emerald" : theme.accent];

              return (
                <RevealItem key={step} className="h-full">
                  <article
                    className={cn(
                      "group relative flex h-full flex-col items-center rounded-[1.5rem] border border-transparent px-5 pb-6 pt-12 text-center", HOVER_TRANSITION, HOVER_CARD_LIFT, "hover:shadow-[0_28px_56px_-28px_rgba(10,70,52,0.35)]",
                      isEmerald ? "bg-linear-to-b from-emerald-50/80 to-transparent dark:from-emerald-950/30" : theme.stepCard
                    )}
                  >
                    {/* Numbered badge straddling the card's top edge */}
                    <m.span
                      className={cn(
                        "home-display absolute -top-7 left-1/2 flex size-14 items-center justify-center rounded-full bg-linear-to-br font-heading text-base font-semibold text-white shadow-[0_10px_24px_-10px_rgba(10,70,52,0.7)] ring-4 ring-[#faf8f2] dark:ring-[oklch(0.19_0.012_75)]",
                        isEmerald ? "from-emerald-600 to-emerald-700" : theme.stepBadge
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

                    <h3 className={cn(DISPLAY_MD, "mt-6 text-base text-emerald-950 dark:text-emerald-50")}>{stepTitle}</h3>
                    {meta ? (
                      <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", tone.plate)}>
                        <Clock className="size-3" aria-hidden="true" />
                        {meta}
                      </span>
                    ) : null}
                    <span aria-hidden="true" className={cn("mt-3 h-0.5 w-10 rounded-full", isEmerald ? "bg-emerald-600" : theme.stepRule)} />

                    <p className="mt-4 flex-1 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">{description}</p>

                    {points && points.length > 0 ? (
                      <div className="mt-5 w-full text-left">
                        {pointsLabel ? (
                          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {pointsLabel}
                          </p>
                        ) : null}
                        <ul className="mt-2.5 flex flex-col gap-2">
                          {points.map((point) => (
                            <li key={point} className="flex items-start gap-2.5 text-[13px] text-stone-700 dark:text-stone-200">
                              <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", tone.plate)}>
                                <Check className="size-2.5" aria-hidden="true" />
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <span aria-hidden="true" className={cn("mt-6 h-0.5 w-10 rounded-full opacity-60", isEmerald ? "bg-emerald-600" : theme.stepRule)} />
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
