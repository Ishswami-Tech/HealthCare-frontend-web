import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  DISPLAY_MD,
  HEADING_GAP,
  HOVER_TRANSITION_CHILD,
  SECTION_Y,
  STATUS,
  SURFACE,
  type AccentName,
} from "@/lib/design/tokens";

export interface FeatureCard {
  key: string;
  icon: LucideIcon;
  tint: AccentName;
  title: string;
  description: string;
  /** Adds a success meter to the foot of the card. */
  successRate?: number;
}

interface TreatmentCardsProps {
  index: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cards: FeatureCard[];
  successLabel?: string;
  /** Grid columns on large screens; four for a set of four, three for six. */
  columnsClassName?: string;
  /** `raised` for the white band, `canvas` to sit on the page colour. */
  surface?: "raised" | "canvas";
  /** Rendered under the cards, e.g. Agnikarma's comparison table. */
  children?: ReactNode;
}

/** Icon cards under a split heading — advantages, benefits, applications. */
export function TreatmentCards({
  index,
  eyebrow,
  icon,
  title,
  description,
  cards,
  successLabel,
  columnsClassName = "lg:grid-cols-4",
  surface = "raised",
  children,
}: TreatmentCardsProps) {
  return (
    <section className={cn(surface === "raised" ? SURFACE.raised : "relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading align="split" index={index} eyebrow={eyebrow} icon={icon} title={title} description={description} />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2", columnsClassName)}>
          {cards.map(({ key, icon: Icon, tint, title: cardTitle, description: cardDescription, successRate }) => {
            const tone = ACCENTS[tint];
            return (
              <RevealItem key={key} className="h-full">
                <div className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col p-5 sm:p-6")}>
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl", HOVER_TRANSITION_CHILD, "group-hover:scale-105",
                      tone.plate
                    )}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className={cn(DISPLAY_MD, "mt-4 text-base text-foreground sm:text-lg")}>{cardTitle}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{cardDescription}</p>

                  {successRate !== undefined ? (
                    <div className="mt-auto pt-5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{successLabel}</span>
                        <span className={cn("home-display font-heading text-sm font-semibold tabular-nums", STATUS.success.text)}>
                          {successRate}%
                        </span>
                      </div>
                      <Progress value={successRate} className="mt-1.5 h-2" />
                    </div>
                  ) : null}
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {children}
      </div>
    </section>
  );
}
