import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { cn } from "@/lib/utils";
import { CONTAINER, DISPLAY_XL } from "@/lib/design/tokens";
import { splitTail, type IconLabel, type TreatmentTheme } from "./treatment-theme";

/**
 * Hero entrance runs from CSS (tw-animate-css) rather than scroll reveals, so
 * the above-the-fold content is painted and animating from the server HTML
 * instead of waiting on hydration.
 */
const ENTER = "animate-in fade-in slide-in-from-bottom-5 fill-mode-both duration-700 ease-out";

/**
 * `dark` is the original always-dark photographic hero. `auto` follows the
 * site theme the way the homepage hero does: a frosted veil in the page
 * colour behind the copy, one screen tall from lg, and on phones the
 * photograph as a band above the copy rather than behind it.
 */
export type TreatmentHeroAppearance = "dark" | "auto";

interface TreatmentHeroProps {
  theme: TreatmentTheme;
  appearance?: TreatmentHeroAppearance;
  badgeIcon: LucideIcon;
  badge: string;
  title: string;
  subtitle: string;
  lede: string;
  features: IconLabel[];
  stats: (IconLabel & { value: string })[];
  assurances: IconLabel[];
  primaryCtaLabel: string;
  secondaryCta: IconLabel & { href: string };
  /**
   * Photograph behind the copy. `positionClassName` keeps its subject clear of
   * the text. `fit: "right"` (auto appearance, lg and up) confines a close-up
   * to the right of the copy instead of stretching it under the whole hero,
   * where the subject would end up behind the buttons on a wide screen.
   */
  image?: { src: string; positionClassName: string; fit?: "full" | "right" };
  /** Shown in the right half on large screens when there is no photograph. */
  visual?: ReactNode;
}

/** Every class that differs between the two appearances. */
function heroLook(theme: TreatmentTheme, appearance: TreatmentHeroAppearance) {
  if (appearance === "auto") {
    return {
      section: cn(
        "home-hero relative isolate overflow-hidden border-b border-border/60 bg-background",
        // One screen, not more — the same rule as the homepage hero.
        "lg:flex lg:flex-col lg:justify-center lg:min-h-[calc(100svh-var(--home-header-h))]"
      ),
      container: cn(CONTAINER, "relative"),
      column: "pb-9 pt-[calc(var(--home-hero-band)+1.5rem)] sm:pb-11 lg:w-[58%] lg:max-w-[46rem] lg:py-[var(--home-hero-pad-y)]",
      badge: theme.autoBadge,
      /* The size follows the homepage's height-aware display scale. The leading
         must come after it: tailwind-merge drops a line-height that precedes a
         font-size, and the two lines would then sit a full line apart. */
      title: cn(DISPLAY_XL, "mt-[var(--hero-gap-3)] text-foreground text-[length:var(--home-hero-display-solo)] leading-[1.04]"),
      titleGradient: theme.autoTitleGradient,
      subtitle: "mt-[var(--hero-gap-2)] font-heading text-xl font-medium text-foreground/90 sm:text-2xl",
      lede: "mt-[var(--hero-gap-1)] max-w-xl text-[15px] leading-relaxed text-muted-foreground",
      features: "mt-[var(--hero-gap-4)]",
      featurePlate: theme.autoFeaturePlate,
      featureLabel: "text-foreground/85",
      ctas: "mt-[var(--hero-gap-4)]",
      secondaryVariant: "outline" as const,
      stats: "mt-[var(--hero-gap-4)]",
      statsBoard: "border-border/70 bg-border/60 shadow-[0_18px_40px_-28px_rgba(10,70,52,0.35)]",
      // Opaque enough on its own: a second blur over the frosted scrim and the
      // drifting photograph is re-rendered every frame.
      statCell: "bg-card/90",
      statIcon: theme.autoStatIcon,
      statValue: "text-foreground",
      statLabel: "text-muted-foreground",
      assurances: "mt-[var(--hero-gap-2)]",
      assurance: theme.autoAssurance,
    };
  }

  return {
    section: cn("relative isolate overflow-hidden", theme.heroSection),
    container: cn(CONTAINER, "relative py-14 sm:py-16 lg:py-24"),
    column: "max-w-2xl lg:max-w-[54%]",
    badge: cn("backdrop-blur", theme.heroBadge),
    title: cn(DISPLAY_XL, "mt-6 text-white"),
    titleGradient: theme.heroTitleGradient,
    subtitle: "mt-5 font-heading text-xl font-medium text-white/90 sm:text-2xl",
    lede: "mt-4 max-w-xl text-[15px] leading-relaxed text-white/65",
    features: "mt-9",
    featurePlate: theme.heroFeaturePlate,
    featureLabel: "text-white/90",
    ctas: "mt-9",
    secondaryVariant: "inverseOutline" as const,
    stats: "mt-9",
    statsBoard: "border-white/12 bg-white/10",
    statCell: cn("backdrop-blur", theme.heroStatCell),
    statIcon: theme.heroStatIcon,
    statValue: "text-white",
    statLabel: "text-white/60",
    assurances: "mt-4",
    assurance: theme.heroAssurance,
  };
}

/** The always-dark photographic backdrop with its three readability scrims. */
function DarkBackdrop({ theme, image }: { theme: TreatmentTheme; image?: TreatmentHeroProps["image"] }) {
  return (
    <>
      {/* The gradient underneath carries the hero on its own, so a slow or
          missing image degrades to a deliberate dark field. */}
      <div aria-hidden="true" className={cn("absolute inset-0 -z-20 bg-linear-to-br", theme.heroField)} />
      {image ? (
        <Image
          src={image.src}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className={cn("-z-10 object-cover", image.positionClassName)}
        />
      ) : (
        <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-40" />
      )}

      {/* Readability scrim: dark on the left where the copy sits, clear on the
          right where the photograph's subject is. */}
      <div aria-hidden="true" className={cn("absolute inset-0 -z-10 lg:hidden", theme.heroScrimMobile)} />
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 -z-10 hidden bg-linear-to-r to-transparent lg:block", theme.heroScrimSide)}
      />
      <div aria-hidden="true" className={cn("absolute inset-0 -z-10 bg-linear-to-t", theme.heroScrimBottom)} />
    </>
  );
}

/** The homepage treatment: full-bleed from lg, a fading band above the copy below it. */
function AutoBackdrop({ image }: { image?: TreatmentHeroProps["image"] }) {
  return (
    <>
      {image ? (
        /* Clipped: the drift scales the photograph past the band, and the
           overflow would show as a hairline under the fade on phones. */
        <div
          className={cn(
            "absolute inset-x-0 top-0 -z-20 h-[var(--home-hero-band)] overflow-hidden lg:inset-0 lg:h-auto",
            // The photograph starts beside the copy column.
            image.fit === "right" && "lg:left-[44%]"
          )}
        >
          {/* Slow Ken Burns drift, stilled under reduced motion in home.css. */}
          <div aria-hidden="true" className="home-hero-drift absolute inset-0">
            <Image src={image.src} alt="" fill priority sizes="100vw" className={cn("object-cover", image.positionClassName)} />
          </div>
          <div aria-hidden="true" className="home-hero-band-fade absolute inset-0 lg:hidden" />
          {/* Its left edge dissolves into the page colour. An overlay, not a CSS
              mask: a mask around the drifting layer re-composites every frame
              under the frosted scrim, and the hero visibly blinks. */}
          {image.fit === "right" ? (
            <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[36%] bg-linear-to-r from-background via-background/60 to-transparent lg:block" />
          ) : null}
        </div>
      ) : null}

      {/* Frosted scrim in the page colour, lg and up; light in light mode, dark in dark. */}
      <div aria-hidden="true" className="home-hero-scrim home-hero-aura absolute inset-0 -z-10 hidden lg:block" />
    </>
  );
}

export function TreatmentHero({
  theme,
  appearance = "dark",
  badgeIcon: BadgeIcon,
  badge,
  title,
  subtitle,
  lede,
  features,
  stats,
  assurances,
  primaryCtaLabel,
  secondaryCta,
  image,
  visual,
}: TreatmentHeroProps) {
  /* The title is one string; accent the final word so the treatment name reads
     as display type without hard-coding an English split. */
  const { lead: titleLead, tail: titleTail } = splitTail(title);
  const SecondaryIcon = secondaryCta.icon;
  const look = heroLook(theme, appearance);

  return (
    <section className={look.section}>
      {appearance === "auto" ? <AutoBackdrop image={image} /> : <DarkBackdrop theme={theme} image={image} />}

      <div className={look.container}>
        {visual ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 hidden w-[42%] items-center justify-center lg:flex">
            {visual}
          </div>
        ) : null}

        <div className={look.column}>
          <div className={ENTER}>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em]",
                look.badge
              )}
            >
              <BadgeIcon className="size-3.5" aria-hidden="true" />
              {badge}
            </span>

            <h1 className={look.title}>
              <span className="block">{titleLead}</span>
              {titleTail ? (
                <span className={cn("block bg-linear-to-r bg-clip-text text-transparent", look.titleGradient)}>{titleTail}</span>
              ) : null}
            </h1>

            <p className={look.subtitle}>{subtitle}</p>
            <p className={look.lede}>{lede}</p>
          </div>

          {/* Feature row */}
          <div className={cn(ENTER, look.features, "grid grid-cols-2 gap-5 delay-200 sm:grid-cols-4 sm:gap-4")}>
            {features.map(({ icon: Icon, label }, featureIndex) => (
              <div key={label} style={{ animationDelay: `${260 + featureIndex * 70}ms` }} className={ENTER}>
                <div className="flex flex-col items-center gap-2.5 text-center sm:items-start sm:text-left">
                  <span className={cn("flex size-11 items-center justify-center rounded-full border", look.featurePlate)}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className={cn("font-heading text-[13px] font-semibold leading-snug", look.featureLabel)}>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons wrap rather than shrink: a long label ("Book Viddhakarma
              Consultation") would otherwise be cut to an ellipsis. */}
          <div className={cn(ENTER, look.ctas, "flex flex-col items-stretch gap-3 delay-[560ms] sm:flex-row sm:flex-wrap sm:items-center")}>
            <BookVideoCta label={primaryCtaLabel} className={cn("w-full sm:w-auto sm:shrink-0", theme.heroCta)} />
            <HomeLinkButton
              href={secondaryCta.href}
              variant={look.secondaryVariant}
              size="lg"
              icon={SecondaryIcon}
              className="w-full sm:w-auto sm:shrink-0"
            >
              {secondaryCta.label}
            </HomeLinkButton>
          </div>

          {/* Figure bar */}
          <div className={cn(ENTER, look.stats, "delay-[660ms]")}>
            <dl className={cn("grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-3", look.statsBoard)}>
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className={cn("flex items-center gap-3 px-4 py-3.5", look.statCell)}>
                  <Icon className={cn("size-5 shrink-0", look.statIcon)} aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="sr-only">{label}</dt>
                    <dd className={cn("home-display font-heading text-lg font-semibold leading-none", look.statValue)}>{value}</dd>
                    <p className={cn("mt-1 text-[11px] leading-tight", look.statLabel)}>{label}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Assurances sit with the copy — the photograph's half stays clear. */}
          <div className={cn(ENTER, look.assurances, "flex flex-wrap gap-2 delay-[760ms]")}>
            {assurances.map(({ icon: Icon, label }) => (
              <span key={label} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium", look.assurance)}>
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
