import { Quote, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  SECTION_Y,
  STATUS,
  type StatusName,
} from "@/lib/design/tokens";
import type { TreatmentTheme } from "./treatment-theme";

export interface QuoteItem {
  key: string;
  quote: string;
  /** Who or what the quote is about: the patient's name, or the condition. */
  title: string;
  /** Second line under the title, e.g. the patient's condition. */
  subtitle?: string;
  meta?: { tone: StatusName; label: string }[];
}

interface TreatmentQuotesProps {
  theme: TreatmentTheme;
  index: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  items: QuoteItem[];
}

/** Quote cards under a split heading — patient stories and testimonials. */
export function TreatmentQuotes({ theme, index, eyebrow, icon, title, description, items }: TreatmentQuotesProps) {
  const accentText = ACCENTS[theme.accent].text;

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading align="split" index={index} eyebrow={eyebrow} icon={icon} title={title} description={description} />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3")}>
          {items.map((item) => (
            <RevealItem key={item.key} className="h-full">
              <figure className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col p-5 sm:p-6")}>
                <Quote className={cn("size-7 opacity-40", accentText)} aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-border/70 pt-4">
                  <p className="font-heading text-[13px] font-semibold text-foreground">{item.title}</p>
                  {item.subtitle ? <p className="mt-0.5 text-[12px] text-muted-foreground">{item.subtitle}</p> : null}
                  {item.meta && item.meta.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      {item.meta.map(({ tone, label }) => (
                        <span key={label} className="inline-flex items-center gap-1.5">
                          <span className={cn("size-1.5 rounded-full", STATUS[tone].dot)} aria-hidden="true" />
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
