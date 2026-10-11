"use client";

import { BadgeCheck, ClipboardList, GraduationCap, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { SectionHeading } from "@/components/home/SectionHeading";
import { HEALTH_ASSESSMENT_SECTION_ID, HOME_LINKS } from "@/components/home/home-links";
import { Reveal } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTAINER, SECTION_Y, SURFACE } from "@/lib/design/tokens";

/** The health assessment lives on the homepage, so it needs an absolute hash. */
const ASSESSMENT_HREF = `/#${HEALTH_ASSESSMENT_SECTION_ID}`;

/** Closing invitation on the deep emerald band. */
export function AboutCta() {
  const { t } = useTranslation();

  const certifications = [
    { icon: BadgeCheck, label: t("about.hero.certifications.governmentCertified") },
    { icon: ShieldCheck, label: t("about.hero.certifications.iso9001") },
    { icon: GraduationCap, label: t("about.hero.certifications.teachingHospital") },
  ];

  return (
    <section className={cn(SURFACE.ink, SECTION_Y, "home-grain")}>
      <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-60" />
      <div
        aria-hidden="true"
        className="home-dotgrid absolute inset-0 -z-10 text-white [mask-image:radial-gradient(ellipse_70%_60%_at_50%_100%,black,transparent)]"
      />

      <div className={cn(CONTAINER, "relative max-w-4xl")}>
        <Reveal>
          <SectionHeading
            align="center"
            tone="inverse"
            eyebrow={t("navigation.clinicName")}
            icon={Sparkles}
            title={t("about.legacy.title")}
            description={t("about.legacy.description")}
          />
        </Reveal>

        <Reveal delay={0.08} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <BookVideoCta variant="inverse" className="w-full sm:w-auto" />
          <HomeLinkButton href={ASSESSMENT_HREF} variant="inverseOutline" size="lg" icon={ClipboardList} className="w-full sm:w-auto">
            {t("heroSection.freeHealthAssessment")}
          </HomeLinkButton>
          <HomeLinkButton href={HOME_LINKS.contact} variant="inverseOutline" size="lg" icon={Phone} className="w-full sm:w-auto">
            {t("navigation.contact")}
          </HomeLinkButton>
        </Reveal>

        <Reveal delay={0.14}>
          <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            {certifications.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[13px] font-medium text-white/85"
              >
                <Icon className="size-4 text-emerald-300" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
