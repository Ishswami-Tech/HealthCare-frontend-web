import { Plus, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import { ACCENTS, CARD, CONTAINER, HEADING_GAP, HOVER_TRANSITION, SECTION_Y } from "@/lib/design/tokens";
import type { TreatmentTheme } from "./treatment-theme";

interface TreatmentFaqProps {
  theme: TreatmentTheme;
  index: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
}

/**
 * Questions as native disclosure widgets: keyboard and screen-reader support
 * come from the browser, and the answers are in the server HTML for search.
 */
export function TreatmentFaq({ theme, index, eyebrow, icon, title, description, items }: TreatmentFaqProps) {
  const accent = ACCENTS[theme.accent];

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading align="split" index={index} eyebrow={eyebrow} icon={icon} title={title} description={description} />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "mx-auto flex max-w-4xl flex-col gap-3")}>
          {items.map(({ question, answer }, itemIndex) => (
            <RevealItem key={question}>
              <details className={cn(CARD, "group open:shadow-[0_22px_44px_-30px_rgba(10,70,52,0.4)]")} open={itemIndex === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                  <span className={cn("home-display font-heading text-sm font-semibold tabular-nums opacity-60", accent.text)}>
                    {String(itemIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-heading text-[15px] font-semibold text-foreground sm:text-base">{question}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full group-open:rotate-45",
                      HOVER_TRANSITION,
                      accent.plate
                    )}
                  >
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="px-5 pb-5 pl-[3.25rem] text-[14px] leading-relaxed text-muted-foreground sm:px-6 sm:pb-6 sm:pl-[3.75rem]">
                  {answer}
                </p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
