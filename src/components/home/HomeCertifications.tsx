"use client";

import { Award, BadgeCheck, Shield, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { stripLeadingValue } from "./home-format";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import {
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  HOME_TINTS,
  SECTION_Y,
  SURFACE_RAISED,
  type HomeTint,
} from "./home-theme";
import { HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

type CertificationKey = "governmentCertified" | "iso9001" | "excellenceAward" | "safetyCertified";
type CertificationMeta = { key: CertificationKey; icon: LucideIcon; tint: HomeTint };

const CERTIFICATIONS: CertificationMeta[] = [
  { key: "governmentCertified", icon: Shield, tint: "sky" },
  { key: "iso9001", icon: Award, tint: "emerald" },
  { key: "excellenceAward", icon: BadgeCheck, tint: "amber" },
  { key: "safetyCertified", icon: ShieldCheck, tint: "violet" },
];

const TRUST_STATS = [
  { key: "treatments", value: "20,000+" },
  { key: "satisfaction", value: "95%" },
  { key: "publications", value: "50+" },
  { key: "support", value: "24/7" },
] as const;

export default function HomeCertifications() {
  const { t } = useTranslation();

  const stats = TRUST_STATS.map((stat) => ({
    ...stat,
    label: stripLeadingValue(t(`trust.certifications.stats.${stat.key}`), stat.value),
  }));

  return (
    <section className={cn(SURFACE_RAISED, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="10"
            eyebrow={t("trust.certifications.title")}
            icon={Award}
            title={t("trust.certifications.subtitle")}
            description={t("trust.certifications.description")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
          {CERTIFICATIONS.map(({ key, icon: Icon, tint: tintKey }) => {
            const tint = HOME_TINTS[tintKey];
            return (
              <RevealItem key={key} className="h-full">
                <div className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col items-center p-6 text-center")}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-linear-to-br opacity-0 blur-3xl group-hover:opacity-25",
                      HOVER_TRANSITION_CHILD,
                      tint.gradient
                    )}
                  />

                  {/* Seal: gradient plate inside a soft ring */}
                  <span className={cn("relative flex size-20 items-center justify-center rounded-full", tint.soft)}>
                    <span
                      aria-hidden="true"
                      className={cn("absolute inset-0 rounded-full border border-dashed", tint.border)}
                    />
                    <span
                      className={cn(
                        "flex size-14 items-center justify-center rounded-full bg-linear-to-br text-white group-hover:scale-105",
                        HOVER_TRANSITION_CHILD,
                        tint.gradient,
                        tint.glow
                      )}
                    >
                      <Icon className="size-7" aria-hidden="true" />
                    </span>
                  </span>

                  <h3 className="home-display relative mt-5 font-heading text-base font-semibold text-foreground">
                    {t(`stats.certifications.${key}.title`)}
                  </h3>
                  <p className="relative mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {t(`stats.certifications.${key}.description`)}
                  </p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <RevealGroup className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-border/70 bg-border/70 md:grid-cols-4">
          {stats.map((stat) => (
            <RevealItem key={stat.key}>
              <div className="bg-background px-4 py-6 text-center">
                <p className="home-display font-heading text-[clamp(1.6rem,1.2rem+1.1vw,2.25rem)] font-semibold leading-none text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{stat.label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
