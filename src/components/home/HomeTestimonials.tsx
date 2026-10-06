"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, type Variants } from "motion/react";
import { CheckCircle2, ChevronLeft, ChevronRight, Heart, Play, Quote, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { SectionHeading } from "./SectionHeading";
import { HOME_LINKS } from "./home-links";
import { HOME_EASE, Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CARD, CONTAINER, HEADING_GAP, HOME_TINTS, SECTION_Y, type HomeTint } from "./home-theme";
import { HOVER_TRANSITION } from "@/lib/design/tokens";

const AUTOPLAY_MS = 6000;
const STAR_KEYS = ["one", "two", "three", "four", "five"] as const;

type PatientMeta = { key: string; age: number; tint: HomeTint };

const PATIENTS: PatientMeta[] = [
  { key: "rekha", age: 45, tint: "violet" },
  { key: "suresh", age: 52, tint: "teal" },
  { key: "priya", age: 38, tint: "emerald" },
  { key: "rajesh", age: 48, tint: "amber" },
  { key: "sunita", age: 35, tint: "rose" },
];

const slideVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 44 : -44 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -44 : 44,
    transition: { duration: 0.2, ease: HOME_EASE },
  }),
};

const NAV_BUTTON =
  `flex size-11 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${HOVER_TRANSITION}`;

const META_LABEL = "font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60";

export default function HomeTestimonials() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = PATIENTS.map((patient) => ({
    ...patient,
    name: t(`testimonials.patients.${patient.key}.name`),
    location: t(`testimonials.patients.${patient.key}.location`),
    condition: t(`testimonials.patients.${patient.key}.condition`),
    treatment: t(`testimonials.patients.${patient.key}.treatment`),
    quote: t(`testimonials.patients.${patient.key}.quote`),
    result: t(`testimonials.patients.${patient.key}.result`),
  }));
  const total = testimonials.length;

  const goTo = (next: number, nextDirection: number) => {
    setDirection(nextDirection);
    setIndex(((next % total) + total) % total);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, total]);

  const current = testimonials[index] ?? testimonials[0];
  if (!current) return null;
  const tint = HOME_TINTS[current.tint];

  const quickStats = [
    { value: "4,200+", label: t("testimonials.stats.patientReviews") },
    { value: "4.9★", label: t("testimonials.stats.averageRating") },
    { value: "95%", label: t("testimonials.stats.successRate") },
    { value: "100%", label: t("testimonials.stats.verifiedStories") },
  ];

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="07"
            eyebrow={t("testimonials.title")}
            icon={Heart}
            title={t("testimonials.subtitle")}
            description={t("testimonials.description")}
          />
        </Reveal>

        <Reveal delay={0.08} className={HEADING_GAP}>
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <div className={cn(CARD, "shadow-[0_34px_70px_-40px_rgba(10,70,52,0.45)]")}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <m.article
                  key={current.key}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: HOME_EASE }}
                  className="grid lg:grid-cols-12"
                >
                  {/* Patient dossier.
                      Tinted wash rather than a full-saturation gradient with
                      white text. Each patient still owns a colour, but at the
                      weight every other card on the page uses — at full
                      strength this one panel was the loudest thing on the
                      page, and it changed hue every five seconds. The accent
                      now lives in the avatar plate and the stars, where it
                      reads as identity instead of shouting. */}
                  <div
                    className={cn(
                      "relative overflow-hidden border-b p-6 sm:p-7 lg:col-span-5 lg:border-b-0 lg:border-r",
                      tint.wash,
                      tint.border
                    )}
                  >
                    <div className="relative flex items-center gap-4">
                      <span
                        className={cn(
                          "home-display flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br font-heading text-xl font-semibold text-white shadow-lg",
                          tint.gradient,
                          tint.glow
                        )}
                      >
                        {current.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="home-display font-heading text-lg font-semibold text-foreground">
                          {current.name}
                        </h3>
                        <p className="text-[13px] text-muted-foreground">
                          {t("testimonials.age")} {current.age}, {current.location}
                        </p>
                        <div
                          className={cn("mt-1.5 flex gap-0.5", tint.text)}
                          aria-label={`${STAR_KEYS.length}/5`}
                        >
                          {STAR_KEYS.map((key) => (
                            <Star key={key} className="size-3.5 fill-current" aria-hidden="true" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <dl className="relative mt-7 flex flex-col gap-4">
                      <div>
                        <dt className={META_LABEL}>{t("testimonials.conditionTreated")}</dt>
                        <dd className="mt-1 text-sm font-medium text-foreground">{current.condition}</dd>
                      </div>
                      <div>
                        <dt className={META_LABEL}>{t("testimonials.treatmentReceived")}</dt>
                        <dd className="mt-1 text-sm font-medium text-foreground">{current.treatment}</dd>
                      </div>
                      <div className={cn("rounded-2xl border bg-card/70 p-4", tint.border)}>
                        <dt className={META_LABEL}>{t("testimonials.resultAchieved")}</dt>
                        <dd className="home-display mt-1 font-heading text-base font-semibold text-foreground">
                          {current.result}
                        </dd>
                      </div>
                    </dl>

                    <HomeLinkButton
                      href={HOME_LINKS.youtube}
                      variant="outline"
                      size="sm"
                      icon={Play}
                      className="relative mt-6 bg-card"
                    >
                      {t("testimonials.watchVideo")}
                    </HomeLinkButton>
                  </div>

                  {/* Quote */}
                  <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-7 lg:p-10">
                    <Quote className="size-9 text-primary/30" aria-hidden="true" />
                    <blockquote className="home-display mt-5 font-heading text-lg font-medium leading-[1.5] text-foreground sm:text-xl lg:text-[1.4rem]">
                      &ldquo;{current.quote}&rdquo;
                    </blockquote>
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5">
                      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                        <CheckCircle2 className="size-4.5" aria-hidden="true" />
                        {t("testimonials.verifiedPatient")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goTo(index - 1, -1)}
                          aria-label={t("testimonials.previousTestimonial")}
                          className={NAV_BUTTON}
                        >
                          <ChevronLeft className="size-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => goTo(index + 1, 1)}
                          aria-label={t("testimonials.nextTestimonial")}
                          className={NAV_BUTTON}
                        >
                          <ChevronRight className="size-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </m.article>
              </AnimatePresence>
            </div>

            {/* Initial-avatar rail doubles as the slide picker. */}
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {testimonials.map((item, itemIndex) => {
                const isActive = itemIndex === index;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={item.name}
                    aria-pressed={isActive}
                    onClick={() => goTo(itemIndex, itemIndex > index ? 1 : -1)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border font-heading text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                      HOVER_TRANSITION,
                      isActive
                        ? cn("scale-110 border-transparent bg-linear-to-br text-white", HOME_TINTS[item.tint].gradient)
                        : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    {item.name.charAt(0)}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <RevealGroup className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 md:grid-cols-4">
          {quickStats.map((stat) => (
            <RevealItem key={stat.label}>
              <div className="bg-card p-4 text-center">
                <p className="home-display font-heading text-2xl font-semibold text-primary">{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">{stat.label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-9 text-center">
          <p className="text-base text-muted-foreground sm:text-lg">{t("testimonials.cta.title")}</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BookVideoCta label={t("testimonials.cta.bookConsultation")} />
            <HomeLinkButton href={HOME_LINKS.youtube} variant="outline" size="lg" icon={Play}>
              {t("testimonials.cta.viewStories")}
            </HomeLinkButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
