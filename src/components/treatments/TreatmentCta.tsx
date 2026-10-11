import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import { CONTAINER, DISPLAY_LG, SECTION_Y, SURFACE } from "@/lib/design/tokens";
import type { IconLabel } from "./treatment-theme";

interface TreatmentCtaProps {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondary: IconLabel & { href: string };
  features: IconLabel[];
  learnMore: { label: string; href: string };
}

/** Closing conversion band on deep emerald. */
export function TreatmentCta({ title, subtitle, primaryLabel, secondary, features, learnMore }: TreatmentCtaProps) {
  const SecondaryIcon = secondary.icon;

  return (
    <section className={cn(SURFACE.ink, SECTION_Y, "home-grain")}>
      <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-55" />
      <div
        aria-hidden="true"
        className="home-dotgrid absolute inset-0 -z-10 text-white [mask-image:radial-gradient(ellipse_70%_60%_at_50%_100%,black,transparent)]"
      />

      <div className={cn(CONTAINER, "relative max-w-4xl text-center")}>
        <Reveal>
          <h2 className={cn(DISPLAY_LG, "text-white")}>{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75 sm:text-lg">{subtitle}</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BookVideoCta variant="inverse" label={primaryLabel} />
          <HomeLinkButton href={secondary.href} variant="inverseOutline" size="lg" icon={SecondaryIcon}>
            {secondary.label}
          </HomeLinkButton>
        </Reveal>

        <RevealGroup className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {features.map(({ icon: Icon, label }) => (
            <RevealItem key={label}>
              <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-[13px] font-medium text-white/85">
                <Icon className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                {label}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-8">
          <HomeLinkButton href={learnMore.href} variant="inverseOutline" size="sm">
            {learnMore.label}
          </HomeLinkButton>
        </Reveal>
      </div>
    </section>
  );
}
