"use client";

import { ArrowRight, Brain, Heart, Target, Zap, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { SmartLink } from "./HomeLinkButton";
import { SectionHeading } from "./SectionHeading";
import { HEALTH_ASSESSMENT_HREF, HOME_LINKS, firstPhone, toTelHref, toWhatsAppHref } from "./home-links";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import {
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  HOME_TINTS,
  SECTION_Y,
  type HomeTint,
} from "./home-theme";
import { HOVER_TRANSITION, HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

type CareAction = { label: string; subtext: string; href: string; emphasis?: boolean };
type CareLevel = {
  key: string;
  icon: LucideIcon;
  tint: HomeTint;
  title: string;
  subtitle: string;
  description: string;
  actions: CareAction[];
};

function CareActionLink({ action, tint }: { action: CareAction; tint: HomeTint }) {
  return (
    <SmartLink
      href={action.href}
      className={cn(
        "group/row flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        HOVER_TRANSITION,
        action.emphasis
          ? cn("home-sheen border-transparent bg-linear-to-r text-white", HOME_TINTS[tint].gradient, HOME_TINTS[tint].glow)
          : "border-border/70 bg-background text-foreground hover:border-primary/40 hover:bg-primary/4"
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-heading text-[13px] font-semibold">{action.label}</span>
        <span className={cn("block text-[11px]", action.emphasis ? "text-white/80" : "text-muted-foreground")}>
          {action.subtext}
        </span>
      </span>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
          HOVER_TRANSITION_CHILD,
          action.emphasis ? "bg-white/20" : "bg-primary/8 text-primary group-hover/row:bg-primary/15"
        )}
      >
        <ArrowRight
          className={cn("size-3.5 group-hover/row:translate-x-0.5", HOVER_TRANSITION_CHILD)}
          aria-hidden="true"
        />
      </span>
    </SmartLink>
  );
}

export default function HomeCarePaths() {
  const { t } = useTranslation();
  const telHref = toTelHref(firstPhone(t("clinic.phone")));
  const whatsAppHref = toWhatsAppHref(t("clinic.whatsapp"));

  const levels: CareLevel[] = [
    {
      key: "urgent",
      icon: Zap,
      tint: "rose",
      title: t("comprehensiveCTA.engagementLevels.urgent.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.urgent.subtitle"),
      description: t("comprehensiveCTA.engagementLevels.urgent.description"),
      actions: [
        {
          label: t("comprehensiveCTA.engagementLevels.urgent.features.helpline"),
          subtext: "24/7 immediate response",
          href: telHref,
          emphasis: true,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.urgent.features.consultation"),
          subtext: "Same day appointment",
          href: HOME_LINKS.booking,
          emphasis: true,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.urgent.features.video"),
          subtext: "Instant expert advice",
          href: HOME_LINKS.videoBooking,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.urgent.features.whatsapp"),
          subtext: "Quick guidance",
          href: whatsAppHref,
        },
      ],
    },
    {
      key: "moderate",
      icon: Heart,
      tint: "sky",
      title: t("comprehensiveCTA.engagementLevels.moderate.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.moderate.subtitle"),
      description: t("comprehensiveCTA.engagementLevels.moderate.description"),
      actions: [
        {
          label: t("comprehensiveCTA.engagementLevels.moderate.features.consultation"),
          subtext: "Within 48 hours",
          href: HOME_LINKS.videoBooking,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.moderate.features.assessment"),
          subtext: "Comprehensive evaluation",
          href: HEALTH_ASSESSMENT_HREF,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.moderate.features.planning"),
          subtext: "Personalized approach",
          href: HOME_LINKS.treatments,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.moderate.features.followup"),
          subtext: "Ongoing support",
          href: HOME_LINKS.contact,
        },
      ],
    },
    {
      key: "preventive",
      icon: Brain,
      tint: "emerald",
      title: t("comprehensiveCTA.engagementLevels.preventive.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.preventive.subtitle"),
      description: t("comprehensiveCTA.engagementLevels.preventive.description"),
      actions: [
        {
          label: t("comprehensiveCTA.engagementLevels.preventive.features.consultation"),
          subtext: "Preventive care",
          href: HOME_LINKS.videoBooking,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.preventive.features.guidance"),
          subtext: "Health optimization",
          href: HOME_LINKS.about,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.preventive.features.checkups"),
          subtext: "Maintenance care",
          href: HOME_LINKS.booking,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.preventive.features.resources"),
          subtext: "Health knowledge",
          href: HOME_LINKS.youtube,
        },
      ],
    },
  ];

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="11"
            eyebrow={t("comprehensiveCTA.strategy.title")}
            icon={Target}
            title={t("comprehensiveCTA.strategy.subtitle")}
            description={t("comprehensiveCTA.strategy.description")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-5 lg:grid-cols-3")}>
          {levels.map((level) => {
            const tint = HOME_TINTS[level.tint];
            const Icon = level.icon;

            return (
              <RevealItem key={level.key} className="h-full">
                <article className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col")}>
                  {/* Triage rail */}
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-x-0 top-0 h-1 bg-linear-to-r", tint.gradient)}
                  />

                  <div className={cn("p-5 pt-6 sm:p-6 sm:pt-7", tint.soft)}>
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl bg-linear-to-br text-white group-hover:scale-105",
                        HOVER_TRANSITION_CHILD,
                        tint.gradient,
                        tint.glow
                      )}
                    >
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="home-display mt-4 font-heading text-lg font-semibold text-foreground sm:text-xl">
                      {level.title}
                    </h3>
                    <p className={cn("mt-1 font-heading text-[13px] font-medium", tint.text)}>{level.subtitle}</p>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{level.description}</p>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                    {level.actions.map((action) => (
                      <CareActionLink key={action.label} action={action} tint={level.tint} />
                    ))}
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
