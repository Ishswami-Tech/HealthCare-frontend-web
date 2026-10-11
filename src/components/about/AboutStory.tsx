"use client";

import Image from "next/image";
import { Quote, Target } from "lucide-react";
import { SectionIndex } from "@/components/home/SectionHeading";
import { Reveal } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTAINER, DISPLAY_LG, SECTION_Y, SURFACE } from "@/lib/design/tokens";

/** A treatment in the clinic's own treatment room — its own photograph, shown wide so the room reads. */
const CLINIC_PHOTO = { src: "/assets/treatments/viddhakarma-hero.webp", width: 1672, height: 941 } as const;

const PARAGRAPHS = ["p1", "p2", "p3", "p4"] as const;

/** Editorial founding story: heading and photograph on the left, the account on the right. */
export function AboutStory() {
  const { t, language } = useTranslation();
  const [lead, ...rest] = PARAGRAPHS;

  return (
    <section aria-labelledby="about-story-heading" className={cn(SURFACE.canvas, SECTION_Y)}>
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-14")}>
        <Reveal className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionIndex value="01" />
            <h2 id="about-story-heading" className={cn(DISPLAY_LG, "mt-4 text-foreground")}>
              {t("about.story.title")}
            </h2>

            <div className="mt-7 overflow-hidden rounded-[1.75rem] border border-border/70 shadow-[0_32px_64px_-40px_rgba(10,70,52,0.5)]">
              <Image
                src={CLINIC_PHOTO.src}
                alt=""
                aria-hidden="true"
                width={CLINIC_PHOTO.width}
                height={CLINIC_PHOTO.height}
                sizes="(min-width: 1024px) 34vw, 92vw"
                className="aspect-[16/10] w-full object-cover object-[50%_40%]"
              />
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <p
              className={cn(
                "text-pretty text-lg font-medium leading-relaxed text-foreground sm:text-xl",
                /* ::first-letter would split a Devanagari cluster, so only Latin text gets the drop cap. */
                language === "en" &&
                  "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-heading first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-primary"
              )}
            >
              {t(`about.story.paragraphs.${lead}`)}
            </p>
          </Reveal>

          <div className="mt-6 space-y-5 border-l border-primary/20 pl-5 sm:pl-6">
            {rest.map((key, index) => (
              <Reveal key={key} delay={index * 0.05}>
                <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {t(`about.story.paragraphs.${key}`)}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-9">
            <figure className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-primary/[0.06] p-6 sm:p-8">
              <Quote aria-hidden="true" className="absolute -right-3 -top-3 size-28 rotate-180 fill-current stroke-0 text-primary/[0.08]" />
              <figcaption className="flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                <Target className="size-4" aria-hidden="true" />
                {t("about.mission.title")}
              </figcaption>
              <blockquote className="home-display relative mt-4 text-balance font-heading text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-semibold leading-snug text-foreground">
                {t("about.mission.description")}
              </blockquote>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
