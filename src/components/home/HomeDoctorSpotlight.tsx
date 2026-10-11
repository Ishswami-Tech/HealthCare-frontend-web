"use client";

import Image from "next/image";
import { ArrowRight, Quote, Sprout } from "lucide-react";
import { splitHeroText } from "@/components/doctor-profile/doctor-profile-data";
import { DoctorCredentials, DoctorPortrait, LeafGlyph } from "@/components/doctor-profile/doctor-visuals";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { Float, Reveal } from "./home-motion";
import { HOME_LINKS } from "./home-links";
import { CONTAINER, SECTION_Y } from "./home-theme";

const HEADING_ID = "doctor-spotlight-heading";

const HERBS = { src: "/assets/doctor/ayurveda-herbs-mortar.webp", width: 416, height: 235 } as const;

function SpotlightQuote({ quote, author }: { quote: string; author: string }) {
  return (
    <figure className="relative rounded-[1.75rem] border border-primary/10 bg-primary/[0.06] p-6 sm:p-7">
      <Quote className="size-10 rotate-180 fill-current stroke-0 text-primary" aria-hidden="true" />
      <blockquote className="mt-4 text-lg font-medium leading-relaxed text-foreground sm:text-xl">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 text-[15px] font-medium text-muted-foreground">&mdash; {author}</figcaption>
    </figure>
  );
}

/**
 * Introduces Dr. Deshmukh directly under the hero. The credentials are the
 * same `drDeshmukhPage.heroText` the /drdeshmukh page renders, so the two
 * surfaces never drift apart.
 */
export default function HomeDoctorSpotlight() {
  const { t } = useTranslation();
  const doctorName = t("team.teamMembers.drDeshmukh.name");
  const { tagline, achievements } = splitHeroText(t("drDeshmukhPage.heroText"));
  const [role, ...specialities] = tagline;

  return (
    <section
      aria-labelledby={HEADING_ID}
      className={cn("home-light-band relative isolate overflow-hidden border-y border-border/60", SECTION_Y)}
    >
      {/* Soft ground wave the credentials sit on. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-primary/[0.07]"
      >
        <path d="M0 64C240 16 480 16 720 56s480 64 720 8v56H0Z" fill="currentColor" />
      </svg>

      <div className={CONTAINER}>
        <div className="grid items-center gap-x-8 gap-y-10 lg:grid-cols-12 xl:grid-cols-[minmax(0,32fr)_minmax(0,45fr)_minmax(0,23fr)]">
          <Reveal className="lg:col-span-5 lg:row-span-2 xl:col-span-1 xl:row-span-1">
            <DoctorPortrait
              alt={doctorName}
              experienceValue={t("drDeshmukhPage.spotlight.experienceValue")}
              experienceLabel={t("drDeshmukhPage.spotlight.experienceLabel")}
            />
          </Reveal>

          <Reveal delay={0.08} className="relative lg:col-span-7 xl:col-span-1">
            <Float className="absolute -top-2 right-2 hidden xl:block" distance={8} duration={7}>
              <LeafGlyph className="size-7 -rotate-12 text-primary/60" />
            </Float>

            <div className="flex flex-col items-start">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.07] px-4 py-2 text-sm font-semibold text-foreground/85">
                <Sprout className="size-4 text-primary" aria-hidden="true" />
                {t("team.teamMembers.drDeshmukh.title")}
              </span>

              <h2
                id={HEADING_ID}
                className="mt-5 font-heading text-[clamp(2.25rem,8vw,3rem)] font-bold leading-[1.2] text-balance text-foreground lg:text-[clamp(2.5rem,4.4vw,3.5rem)] xl:text-[clamp(2.5rem,3.5vw,3.75rem)]"
              >
                {doctorName}
              </h2>

              {role ? (
                <p className="mt-2 font-heading text-[clamp(1.5rem,1.15rem+1.1vw,2.125rem)] font-bold leading-snug text-primary">
                  {role}
                </p>
              ) : null}

              {specialities.length > 0 ? (
                <p className="mt-2 text-lg leading-relaxed text-muted-foreground sm:text-xl">{specialities.join(" · ")}</p>
              ) : null}

              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-foreground/75 sm:text-base">
                {t("drDeshmukhPage.spotlight.description")}
              </p>
            </div>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <BookVideoCta className="w-full sm:w-auto" />
              <HomeLinkButton
                href={HOME_LINKS.booking}
                variant="outline"
                size="lg"
                trailingIcon={ArrowRight}
                className="w-full sm:w-auto"
              >
                {t("common.learnMore")}
              </HomeLinkButton>
            </div>
          </Reveal>

          <Reveal delay={0.16} className="relative lg:col-span-7 xl:col-span-1">
            <SpotlightQuote quote={t("drDeshmukhPage.spotlight.quote")} author={doctorName} />

            <div aria-hidden="true" className="relative mt-2 hidden xl:-mr-8 xl:block">
              <Float className="absolute -left-2 top-6 z-10" distance={6} duration={6.5} delay={0.8}>
                <LeafGlyph className="size-6 rotate-45 text-primary/55" />
              </Float>
              <Image
                src={HERBS.src}
                alt=""
                width={HERBS.width}
                height={HERBS.height}
                sizes="22rem"
                className="home-feather-soft h-auto w-full"
              />
            </div>
          </Reveal>
        </div>

        {/* Hairline vine dividing the profile from the credentials. */}
        <div aria-hidden="true" className="pointer-events-none relative mt-10 h-10 lg:mt-12">
          <svg
            viewBox="0 0 1440 40"
            preserveAspectRatio="none"
            fill="none"
            className="absolute left-1/2 top-0 h-full w-screen -translate-x-1/2 text-primary/25"
          >
            <path
              d="M0 30C240 4 480 4 720 20s480 20 720-12"
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <Float className="absolute left-1/2 top-0.5" distance={5} duration={6}>
            <LeafGlyph className="size-7 -translate-x-1/2 -rotate-[20deg] text-primary/70" />
          </Float>
        </div>

        <DoctorCredentials achievements={achievements} className="mt-6" />
      </div>
    </section>
  );
}
