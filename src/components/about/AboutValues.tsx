"use client";

import { Flower2, HeartHandshake, Microscope, ScrollText, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  DISPLAY_MD,
  HEADING_GAP,
  HOVER_TRANSITION_CHILD,
  ICON_PLATE_SOLID,
  SECTION_Y,
  SURFACE,
  type AccentName,
} from "@/lib/design/tokens";

const VALUES = [
  { key: "compassionateCare", icon: HeartHandshake, tint: "rose" },
  { key: "authenticAyurveda", icon: ScrollText, tint: "amber" },
  { key: "scientificApproach", icon: Microscope, tint: "sky" },
  { key: "holisticHealing", icon: Flower2, tint: "emerald" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName }[];

export function AboutValues() {
  const { t } = useTranslation();

  return (
    <section className={cn(SURFACE.raised, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="02"
            title={t("about.coreValues.title")}
            description={t("about.coreValues.subtitle")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
          {VALUES.map(({ key, icon: Icon, tint }, index) => {
            const tone = ACCENTS[tint];
            return (
              <RevealItem key={key} className="h-full">
                <article className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col bg-background p-6")}>
                  <span aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-36 [mask-image:linear-gradient(to_bottom,black,transparent)]", tone.soft)} />
                  {/* Each value's own icon, drawn large and faint in the corner. */}
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.1}
                    className={cn(
                      "pointer-events-none absolute -bottom-6 -right-6 size-36 -rotate-12 opacity-[0.07] group-hover:-rotate-6 group-hover:opacity-[0.12]",
                      HOVER_TRANSITION_CHILD,
                      tone.text
                    )}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className={cn(ICON_PLATE_SOLID, tone.gradient, tone.glow)}>
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className={cn("home-display font-heading text-lg font-semibold tabular-nums opacity-50", tone.text)}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className={cn(DISPLAY_MD, "relative mt-6 text-lg text-foreground")}>
                    {t(`about.coreValues.${key}.title`)}
                  </h3>
                  <p className="relative mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                    {t(`about.coreValues.${key}.description`)}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
