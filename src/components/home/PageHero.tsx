import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { splitTail } from "@/components/treatments/treatment-theme";
import { cn } from "@/lib/utils";
import { CONTAINER, DISPLAY_XL } from "@/lib/design/tokens";
import { Eyebrow } from "./SectionHeading";

export interface PageHeroChip {
  icon: LucideIcon;
  label: string;
}

interface PageHeroProps {
  headingId: string;
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  /** The final word is drawn in the brand gradient. */
  title: string;
  subtitle: string;
  actions?: ReactNode;
  chips?: readonly PageHeroChip[];
  /** Right-hand column on wide screens, stacked under the copy on phones. */
  aside: ReactNode;
  /** Full-width row under the two columns, e.g. a figures board. */
  footer?: ReactNode;
}

/**
 * Opening band for the About and Contact pages. Follows the theme rather than
 * forcing a dark photograph, and animates its copy from CSS so the server HTML
 * is visible on first paint — no fade-in after hydration, so no refresh blink.
 */
export function PageHero({
  headingId,
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  actions,
  chips,
  aside,
  footer,
}: PageHeroProps) {
  const { lead, tail } = splitTail(title);

  return (
    <section
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden border-b border-border/60 bg-background"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 -top-40 size-[36rem] rounded-full bg-primary/12 blur-3xl dark:bg-primary/10" />
        <div className="absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/8" />
        <div className="home-dotgrid absolute inset-0 text-primary [mask-image:radial-gradient(ellipse_55%_60%_at_80%_28%,black,transparent)]" />
      </div>

      <div
        className={cn(
          CONTAINER,
          "grid items-center gap-x-12 gap-y-12 pt-10 sm:pt-12 lg:grid-cols-12 lg:pt-14",
          footer ? "pb-10 lg:pb-12" : "pb-12 sm:pb-14 lg:pb-16"
        )}
      >
        <div className="home-hero-copy-in flex flex-col items-start lg:col-span-7">
          <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>

          <h1 id={headingId} className={cn(DISPLAY_XL, "mt-5 max-w-3xl text-foreground")}>
            {lead}
            {tail ? (
              <>
                {" "}
                <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-300">
                  {tail}
                </span>
              </>
            ) : null}
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>

          {actions ? (
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">{actions}</div>
          ) : null}

          {chips?.length ? (
            <ul className="mt-7 flex flex-wrap gap-2">
              {chips.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[13px] font-medium text-foreground/85 backdrop-blur"
                >
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="lg:col-span-5">{aside}</div>
      </div>

      {footer ? <div className={cn(CONTAINER, "pb-12 sm:pb-14 lg:pb-16")}>{footer}</div> : null}
    </section>
  );
}
