"use client";

import { m } from "motion/react";
import { History } from "lucide-react";
import { Eyebrow, SectionIndex } from "@/components/home/SectionHeading";
import { REVEAL_ITEM_VARIANTS, Reveal, RevealGroup } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTAINER, DISPLAY_LG, SECTION_Y, SURFACE } from "@/lib/design/tokens";

const YEARS = ["2003", "2008", "2012", "2015", "2018", "2020", "2023"] as const;
const LATEST_YEAR = YEARS[YEARS.length - 1];

/** Milestones on a single rule, newest one lit. */
export function AboutTimeline() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="about-timeline-heading" className={cn(SURFACE.canvas, SECTION_Y)}>
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-14")}>
        <Reveal className="lg:col-span-4">
          <div className="flex flex-col items-start gap-4 lg:sticky lg:top-32">
            <SectionIndex value="03" />
            <Eyebrow icon={History}>
              {YEARS[0]} – {LATEST_YEAR}
            </Eyebrow>
            <h2 id="about-timeline-heading" className={cn(DISPLAY_LG, "text-foreground")}>
              {t("about.milestones.title")}
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t("about.milestones.subtitle")}</p>
          </div>
        </Reveal>

        <RevealGroup className="lg:col-span-8">
          <ol className="relative">
            {/* The rule the milestones hang from. */}
            <span
              aria-hidden="true"
              className="absolute bottom-6 left-[0.6875rem] top-6 w-px bg-linear-to-b from-primary/50 via-primary/25 to-primary/60 sm:left-[7.6875rem]"
            />

            {YEARS.map((year) => {
              const isLatest = year === LATEST_YEAR;
              return (
                <m.li
                  key={year}
                  variants={REVEAL_ITEM_VARIANTS}
                  className="relative grid grid-cols-[1.5rem_1fr] gap-x-4 py-3 sm:grid-cols-[6rem_1.5rem_1fr] sm:gap-x-4"
                >
                  <p
                    className={cn(
                      "home-display col-start-2 font-heading text-xl font-semibold tabular-nums sm:col-start-1 sm:pt-4 sm:text-right sm:text-2xl",
                      isLatest ? "text-primary" : "text-foreground/70"
                    )}
                  >
                    {year}
                  </p>

                  <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1 flex justify-center pt-1.5 sm:col-start-2 sm:row-span-1 sm:pt-5">
                    <span
                      className={cn(
                        "relative flex size-3.5 rounded-full ring-4 ring-background",
                        isLatest ? "bg-primary" : "border-2 border-primary/60 bg-background"
                      )}
                    >
                      {isLatest ? <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-50" /> : null}
                    </span>
                  </span>

                  <div
                    className={cn(
                      "col-start-2 mt-2 rounded-2xl border p-4 sm:col-start-3 sm:mt-0 sm:p-5",
                      isLatest ? "border-primary/25 bg-primary/[0.06]" : "border-border/70 bg-card"
                    )}
                  >
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {t(`about.milestones.${year}.event`)}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                      {t(`about.milestones.${year}.description`)}
                    </p>
                  </div>
                </m.li>
              );
            })}
          </ol>
        </RevealGroup>
      </div>
    </section>
  );
}
