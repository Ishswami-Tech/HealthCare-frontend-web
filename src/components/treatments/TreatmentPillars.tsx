import Image from "next/image";
import { Flower2, Leaf, type LucideIcon } from "lucide-react";
import { SectionIndex } from "@/components/home/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CONTAINER,
  DISPLAY_LG,
  DISPLAY_MD,
  HEADING_GAP,
  HOVER_CARD_LIFT,
  HOVER_TRANSITION,
  HOVER_TRANSITION_CHILD,
  SECTION_Y,
  SURFACE,
  type AccentName,
} from "@/lib/design/tokens";
import { splitTail, type TreatmentTheme } from "./treatment-theme";

export interface Pillar {
  key: string;
  icon: LucideIcon;
  tint: AccentName;
  title: string;
  description: string;
  /** Photograph that dissolves into the foot of the card. Without one the card gets a drawn footer. */
  image?: string;
}

interface TreatmentPillarsProps {
  theme: TreatmentTheme;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  pillars: Pillar[];
  /** Grid columns on large screens; four for a set of four, three for six. */
  columnsClassName?: string;
  /** Photo credit line under the cards, for third-party photographs. */
  credit?: string;
}

/** Footer for a card without a photograph: its own icon, drawn large and faint over a dot field. */
function DrawnFooter({ icon: Icon, tint }: { icon: LucideIcon; tint: AccentName }) {
  const tone = ACCENTS[tint];

  return (
    <div aria-hidden="true" className="relative -mt-10 h-40 shrink-0 overflow-hidden">
      <div className={cn("absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_70%)]", tone.soft)} />
      <div className={cn("home-dotgrid absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black)]", tone.text)} />
      <Icon
        strokeWidth={1.1}
        className={cn(
          "absolute -bottom-8 -right-6 size-44 -rotate-12 opacity-[0.16] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105",
          tone.text
        )}
      />
    </div>
  );
}

/** Numbered pillar cards under an editorial split header — "Scientific Foundation" on Agnikarma. */
export function TreatmentPillars({
  theme,
  index,
  title,
  subtitle,
  description,
  pillars,
  columnsClassName = "lg:grid-cols-4",
  credit,
}: TreatmentPillarsProps) {
  /* Two-tone display title: accent the final word without hard-coding a split. */
  const { lead, tail } = splitTail(title);

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y)}>
      <div className={CONTAINER}>
        {/* Header: title block left, lede right behind a hairline rule. */}
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <SectionIndex value={index} />
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
                <Leaf className="size-3.5" aria-hidden="true" />
                {title}
              </span>

              <h2 className={cn(DISPLAY_LG, "mt-5 text-emerald-950 dark:text-emerald-50")}>
                {lead}
                {tail ? (
                  <>
                    {" "}
                    <span className={theme.tailText}>{tail}</span>
                  </>
                ) : null}
              </h2>
              <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400 sm:text-xl">{subtitle}</p>
            </div>

            <div className="flex items-start gap-5 lg:col-span-5">
              <span aria-hidden="true" className={cn("hidden w-px self-stretch lg:block", theme.ledeRule)} />
              <Flower2 className={cn("mt-1 hidden size-6 shrink-0 lg:block", theme.tailText)} aria-hidden="true" />
              <p className="text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{description}</p>
            </div>
          </div>
        </Reveal>

        {/* Pillar cards: tinted frame, numbered, photo-footed. */}
        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-5 sm:grid-cols-2", columnsClassName)}>
          {pillars.map(({ key, icon: Icon, tint, title: pillarTitle, description: pillarDescription, image }, pillarIndex) => {
            const tone = ACCENTS[tint];
            return (
              <RevealItem key={key} className="h-full">
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border bg-card", HOVER_TRANSITION, HOVER_CARD_LIFT, "hover:shadow-[0_28px_56px_-28px_rgba(10,70,52,0.4)]",
                    tone.border
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b opacity-30", tone.soft)}
                  />

                  {/* Only the copy is padded — the photograph bleeds to the card edge. */}
                  <div className="relative z-10 flex flex-1 flex-col p-5 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn("flex size-11 items-center justify-center rounded-xl", HOVER_TRANSITION_CHILD, "group-hover:scale-105", tone.plate)}>
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className={cn("home-display font-heading text-xl font-semibold tabular-nums opacity-50", tone.text)}>
                        {String(pillarIndex + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className={cn(DISPLAY_MD, "mt-4 text-base text-foreground")}>{pillarTitle}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{pillarDescription}</p>
                  </div>

                  {image ? (
                    /* The photograph tucks up behind the copy and dissolves into the
                       card, so there is no hard seam between text and image. */
                    <div className="relative -mt-16 h-56 shrink-0">
                      <Image
                        src={image}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.25)_26%,black_58%)]"
                      />
                    </div>
                  ) : (
                    <DrawnFooter icon={Icon} tint={tint} />
                  )}
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {credit ? <p className="mt-4 text-right text-[11px] text-muted-foreground/80">{credit}</p> : null}
      </div>
    </section>
  );
}
