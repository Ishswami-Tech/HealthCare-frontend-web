"use client";

import {
  Award,
  BadgeCheck,
  Clock,
  GraduationCap,
  Heart,
  Shield,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { CountUp, Marquee, Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CARD, CONTAINER, HEADING_GAP, HOME_TINTS, SECTION_Y, type HomeTint } from "./home-theme";
import { HOVER_CARD_LIFT, HOVER_TRANSITION, HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

const TICKER_DURATION_S = 32;

type Stat = {
  icon: LucideIcon;
  value: number;
  decimals?: number;
  suffix: string;
  label: string;
  description: string;
  tint: HomeTint;
};

type Certification = { icon: LucideIcon; title: string; description: string; tint: HomeTint };
type TickerItem = { icon?: LucideIcon; label: string };

/**
 * One cell of the figure board. Cells share hairline dividers rather than
 * being individual cards, which reads as a single instrument panel.
 */
function StatCell({ stat }: { stat: Stat }) {
  const tint = HOME_TINTS[stat.tint];
  const Icon = stat.icon;

  return (
    <div className={cn("group relative flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-primary/4 sm:p-6 lg:p-7", HOVER_TRANSITION)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r group-hover:scale-x-100",
          HOVER_TRANSITION_CHILD,
          tint.gradient
        )}
      />
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl group-hover:scale-105",
          HOVER_TRANSITION_CHILD,
          tint.plate
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <p className="home-display font-heading text-[clamp(2rem,1.4rem+1.6vw,2.75rem)] font-semibold leading-none text-foreground">
        <CountUp to={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
      </p>

      <div>
        <p className="font-heading text-sm font-semibold text-foreground">{stat.label}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{stat.description}</p>
      </div>
    </div>
  );
}

function CertificationCard({ certification }: { certification: Certification }) {
  const tint = HOME_TINTS[certification.tint];
  const Icon = certification.icon;

  return (
    <div
      className={cn(
        CARD,
        "group flex h-full items-start gap-4 p-5 hover:border-primary/25 hover:shadow-[0_22px_44px_-26px_rgba(10,70,52,0.4)]",
        HOVER_CARD_LIFT
      )}
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl group-hover:scale-105", HOVER_TRANSITION_CHILD, tint.plate)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-sm font-semibold text-foreground">{certification.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{certification.description}</p>
      </div>
    </div>
  );
}

function TickerStrip({ items }: { items: TickerItem[] }) {
  return (
    <div className="home-fade-x relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/5 py-3.5">
      <Marquee duration={TICKER_DURATION_S} className="gap-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.label}
              className="inline-flex items-center gap-2.5 whitespace-nowrap px-6 text-[13px] font-medium text-foreground/80"
            >
              {Icon ? (
                <Icon className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
              )}
              {item.label}
            </span>
          );
        })}
      </Marquee>
    </div>
  );
}

export default function HomeStats() {
  const { t } = useTranslation();

  const stats: Stat[] = [
    {
      icon: Users,
      value: 5000,
      suffix: "+",
      label: t("stats.livesTransformed"),
      description: t("stats.patientsSuccessfullyTreated"),
      tint: "emerald",
    },
    {
      icon: Clock,
      value: 20,
      suffix: "+",
      label: t("stats.yearsLegacy"),
      description: t("stats.authenticAyurvedicPractice"),
      tint: "sky",
    },
    {
      icon: Star,
      value: 4.9,
      decimals: 1,
      suffix: "★",
      label: t("stats.patientRating"),
      description: t("stats.basedOnReviews"),
      tint: "amber",
    },
    {
      icon: Award,
      value: 95,
      suffix: "%",
      label: t("stats.successRate"),
      description: t("stats.chronicConditions"),
      tint: "violet",
    },
  ];

  const certifications: Certification[] = [
    {
      icon: Shield,
      title: t("stats.certifications.governmentCertified.title"),
      description: t("stats.certifications.governmentCertified.description"),
      tint: "teal",
    },
    {
      icon: Award,
      title: t("stats.certifications.iso9001.title"),
      description: t("stats.certifications.iso9001.description"),
      tint: "rose",
    },
    {
      icon: BadgeCheck,
      title: t("stats.certifications.nabhAccredited.title"),
      description: t("stats.certifications.nabhAccredited.description"),
      tint: "amber",
    },
    {
      icon: GraduationCap,
      title: t("stats.certifications.teachingHospital.title"),
      description: t("stats.certifications.teachingHospital.description"),
      tint: "sky",
    },
  ];

  const tickerItems: TickerItem[] = [
    { label: t("stats.currentlyTreating") },
    { icon: TrendingUp, label: t("stats.bookingIncrease") },
    { icon: Heart, label: t("stats.featuredChannels") },
    { icon: Users, label: t("stats.peopleViewing") },
  ];

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="01"
            eyebrow={t("stats.provenResultsExcellence")}
            icon={TrendingUp}
            title={t("stats.transformingLives")}
            description={t("stats.twoDecadesExcellence")}
          />
        </Reveal>

        {/* Figure board — one panel, hairline-divided cells. */}
        <Reveal delay={0.08} className={HEADING_GAP}>
          <div className={cn(CARD, "grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2 lg:grid-cols-4")}>
            {stats.map((stat) => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <SectionHeading
            align="left"
            index="02"
            eyebrow={t("stats.trustedCertified")}
            icon={BadgeCheck}
            title={t("stats.recognizedExcellence")}
            as="h3"
          />
        </Reveal>

        <RevealGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.map((certification) => (
            <RevealItem key={certification.title} className="h-full">
              <CertificationCard certification={certification} />
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-8">
          <TickerStrip items={tickerItems} />
        </Reveal>
      </div>
    </section>
  );
}
