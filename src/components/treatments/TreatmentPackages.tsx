import { CalendarCheck, type LucideIcon } from "lucide-react";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
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
  SECTION_Y,
  STATUS,
  SURFACE,
} from "@/lib/design/tokens";
import type { TreatmentTheme } from "./treatment-theme";

export interface TreatmentPackage {
  key: string;
  title: string;
  /** "6 Sessions", "Complete Program". */
  sessions: string;
  description: string;
  successRate: string;
  /** "Most Popular", "Premium". A badged package is drawn as the featured one. */
  badge?: string;
}

interface TreatmentPackagesProps {
  theme: TreatmentTheme;
  index: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  packages: TreatmentPackage[];
  successLabel: string;
  ctaLabel: string;
  ctaHref: string;
}

/** Programme cards; badged programmes carry the accent frame and a solid button. */
export function TreatmentPackages({
  theme,
  index,
  eyebrow,
  icon,
  title,
  description,
  packages,
  successLabel,
  ctaLabel,
  ctaHref,
}: TreatmentPackagesProps) {
  const accent = ACCENTS[theme.accent];

  return (
    <section className={cn(SURFACE.raised, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading align="split" index={index} eyebrow={eyebrow} icon={icon} title={title} description={description} />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-x-4 gap-y-8 pt-3 sm:grid-cols-2 lg:grid-cols-4")}>
          {packages.map((item) => {
            const isFeatured = Boolean(item.badge);
            return (
              <RevealItem key={item.key} className="h-full">
                <article
                  className={cn(
                    CARD,
                    CARD_INTERACTIVE,
                    "group flex h-full flex-col overflow-visible p-6",
                    isFeatured && cn("border-2 shadow-[0_24px_48px_-30px_rgba(10,70,52,0.45)]", accent.border, accent.wash)
                  )}
                >
                  {item.badge ? (
                    <span
                      className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r px-3 py-1 font-heading text-[11px] font-semibold text-white shadow-md",
                        accent.gradient
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}

                  <h3 className={cn(DISPLAY_MD, "text-base text-foreground sm:text-lg")}>{item.title}</h3>
                  <p className={cn("home-display mt-3 font-heading text-3xl font-semibold leading-none", accent.text)}>
                    {item.sessions}
                  </p>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">{item.description}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-[13px]">
                    <span className="text-muted-foreground">{successLabel}</span>
                    <span className={cn("home-display font-heading font-semibold tabular-nums", STATUS.success.text)}>
                      {item.successRate}
                    </span>
                  </div>

                  <HomeLinkButton
                    href={ctaHref}
                    variant={isFeatured ? "solid" : "outline"}
                    size="md"
                    icon={CalendarCheck}
                    className="mt-5 w-full"
                  >
                    {ctaLabel}
                  </HomeLinkButton>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
