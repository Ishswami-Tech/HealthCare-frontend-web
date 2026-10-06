import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "inverse";

interface EyebrowProps {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

/**
 * Small uppercase label that introduces a section. Carries a live dot when no
 * icon is supplied so the label never reads as plain text.
 */
export function Eyebrow({ children, icon: Icon, tone = "default", className }: EyebrowProps) {
  const isInverse = tone === "inverse";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase leading-none tracking-[0.2em]",
        isInverse
          ? "border-white/20 bg-white/10 text-white/90 backdrop-blur"
          : "border-primary/20 bg-primary/8 text-primary",
        className
      )}
    >
      {Icon ? (
        <Icon className="size-3.5" aria-hidden="true" />
      ) : (
        <span className="relative flex size-1.5" aria-hidden="true">
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-70",
              isInverse ? "bg-white" : "bg-primary"
            )}
          />
          <span className={cn("relative inline-flex size-1.5 rounded-full", isInverse ? "bg-white" : "bg-primary")} />
        </span>
      )}
      {children}
    </span>
  );
}

interface SectionIndexProps {
  value: string;
  tone?: Tone;
  className?: string;
}

/** Editorial running number with a dissolving hairline rule. */
export function SectionIndex({ value, tone = "default", className }: SectionIndexProps) {
  const isInverse = tone === "inverse";

  return (
    <span className={cn("flex items-center gap-4", className)} aria-hidden="true">
      <span
        className={cn(
          "font-heading text-xs font-semibold tabular-nums tracking-[0.3em]",
          isInverse ? "text-white/50" : "text-muted-foreground/70"
        )}
      >
        {value}
      </span>
      <span className={cn("home-rule w-14 shrink-0", isInverse ? "text-white" : "text-foreground")} />
    </span>
  );
}

/** Shared display type ramp. Sora needs the negative tracking to sit right. */
export const DISPLAY_TITLE =
  "home-display font-heading font-semibold text-balance text-[clamp(1.6rem,1.1rem+1.9vw,2.75rem)] leading-[1.12]";

interface SectionHeadingProps {
  eyebrow?: string;
  icon?: LucideIcon;
  index?: string;
  title: ReactNode;
  description?: string;
  /** `split` puts the title and the description in opposing columns. */
  align?: "center" | "left" | "split";
  tone?: Tone;
  as?: "h2" | "h3";
  /** Rendered under the description (split/left) or below it (center). */
  actions?: ReactNode;
  className?: string;
}

/** Consistent index + eyebrow + title + description block used by every section. */
export function SectionHeading({
  eyebrow,
  icon,
  index,
  title,
  description,
  align = "center",
  tone = "default",
  as: Heading = "h2",
  actions,
  className,
}: SectionHeadingProps) {
  const isInverse = tone === "inverse";

  const titleNode = (
    <Heading className={cn(DISPLAY_TITLE, isInverse ? "text-white" : "text-foreground")}>{title}</Heading>
  );

  const descriptionNode = description ? (
    <p
      className={cn(
        "text-pretty text-[15px] leading-relaxed sm:text-base",
        isInverse ? "text-white/75" : "text-muted-foreground"
      )}
    >
      {description}
    </p>
  ) : null;

  if (align === "split") {
    return (
      <div className={cn("grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10", className)}>
        <div className="flex flex-col items-start gap-4 lg:col-span-7">
          {index ? <SectionIndex value={index} tone={tone} /> : null}
          {eyebrow ? (
            <Eyebrow icon={icon} tone={tone}>
              {eyebrow}
            </Eyebrow>
          ) : null}
          <div className="max-w-2xl">{titleNode}</div>
        </div>
        <div className="flex flex-col items-start gap-5 lg:col-span-5">
          <div className="max-w-xl">{descriptionNode}</div>
          {actions}
        </div>
      </div>
    );
  }

  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isCenter ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {index ? <SectionIndex value={index} tone={tone} /> : null}
      {eyebrow ? (
        <Eyebrow icon={icon} tone={tone}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <div className={cn(isCenter ? "max-w-3xl" : "max-w-2xl")}>{titleNode}</div>
      {descriptionNode ? <div className={cn(isCenter ? "max-w-2xl" : "max-w-xl")}>{descriptionNode}</div> : null}
      {actions ? <div className={cn("pt-1", isCenter && "flex justify-center")}>{actions}</div> : null}
    </div>
  );
}
