"use client";

import {
  Accessibility,
  Activity,
  Baby,
  Brain,
  ClipboardList,
  Clock,
  Crosshair,
  FileSearch,
  Flower2,
  Hand,
  HeartPulse,
  Leaf,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { HomeMotionProvider } from "@/components/home/home-motion";
import { HOME_LINKS } from "@/components/home/home-links";
import { TreatmentCards } from "@/components/treatments/TreatmentCards";
import { TreatmentConditions } from "@/components/treatments/TreatmentConditions";
import { TreatmentCta } from "@/components/treatments/TreatmentCta";
import { TreatmentHero } from "@/components/treatments/TreatmentHero";
import { TreatmentPackages } from "@/components/treatments/TreatmentPackages";
import { TreatmentPillars } from "@/components/treatments/TreatmentPillars";
import { TreatmentProcess } from "@/components/treatments/TreatmentProcess";
import { TREATMENT_THEMES, parsePercent } from "@/components/treatments/treatment-theme";
import type { AccentName } from "@/lib/design/tokens";

/** Viddhakarma owns the violet accent everywhere it appears. */
const THEME = TREATMENT_THEMES.violet;

/** The health assessment lives on the homepage, so it needs an absolute hash. */
const ASSESSMENT_HREF = "/#health-assessment";

/** Real clinic photograph; the subject sits right of centre, clear of the copy. */
const HERO_IMAGE = "/assets/treatments/viddhakarma-hero.webp";

const HEADLINE_SUCCESS_RATE = 89;
const MARMA_POINT_COUNT = 107;

/**
 * Marma Therapy is the clinic's own photograph; the other three are free
 * Unsplash photographs, credited under the cards.
 */
const TECHNIQUES = [
  { key: "marmaTherapy", icon: Target, tint: "violet", image: "/assets/treatments/viddhakarma-marma-therapy.webp" },
  { key: "pranayama", icon: Wind, tint: "sky", image: "/assets/treatments/viddhakarma-pranayama.webp" },
  { key: "meditation", icon: Brain, tint: "emerald", image: "/assets/treatments/viddhakarma-meditation.webp" },
  { key: "herbalSupport", icon: Leaf, tint: "teal", image: "/assets/treatments/viddhakarma-herbal-support.webp" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName; image: string }[];

const PHOTO_CREDIT = "Unsplash: Charanjeet Dhiman · Jared Rice · Emma-Jane Hobden";

const PROCESS_ICONS: readonly LucideIcon[] = [FileSearch, Crosshair, Zap, Activity, HeartPulse];

const CONDITIONS = [
  { key: "autism", icon: Brain },
  { key: "cerebralPalsy", icon: Accessibility },
  { key: "stroke", icon: HeartPulse },
  { key: "developmental", icon: Baby },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

/**
 * Specialised applications. The success rates are the clinic's published
 * figures from the previous page; the translations carry the copy only.
 */
const APPLICATIONS = [
  { key: "autism", icon: Brain, tint: "violet", successRate: 89 },
  { key: "cerebralPalsy", icon: Accessibility, tint: "sky", successRate: 92 },
  { key: "stroke", icon: HeartPulse, tint: "rose", successRate: 85 },
  { key: "parkinsons", icon: Hand, tint: "amber", successRate: 87 },
  { key: "stressMentalHealth", icon: Sparkles, tint: "teal", successRate: 83 },
  { key: "womensHealth", icon: Flower2, tint: "emerald", successRate: 88 },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName; successRate: number }[];

const PACKAGES = [
  { key: "essential", hasBadge: false },
  { key: "comprehensive", hasBadge: true },
  { key: "advanced", hasBadge: false },
  { key: "holistic", hasBadge: true },
] as const;

export default function ViddhaKarmaPage() {
  const { t } = useTranslation();

  /* No PageTransition wrapper: it server-renders the whole page at opacity 0
     and fades it in only after hydration, so every refresh blinked. The hero
     animates itself from CSS and the sections reveal on scroll. */
  return (
    <HomeMotionProvider>
      <div className="overflow-x-clip font-body">
        <TreatmentHero
          theme={THEME}
          appearance="auto"
          badgeIcon={Zap}
          badge={t("viddhakarma.badge")}
          title={t("viddhakarma.title")}
          subtitle={t("viddhakarma.subtitle")}
          lede={t("viddhakarma.specializedApplications.subtitle")}
          features={TECHNIQUES.map(({ key, icon }) => ({ icon, label: t(`viddhakarma.advancedTechniques.${key}.title`) }))}
          stats={[
            { icon: Users, value: "5000+", label: t("stats.livesTransformed") },
            { icon: Shield, value: `${HEADLINE_SUCCESS_RATE}%`, label: t("common.successRate") },
            { icon: Target, value: String(MARMA_POINT_COUNT), label: t("viddhakarma.marmaPoints") },
          ]}
          assurances={[
            { icon: Leaf, label: t("hero.natural") },
            { icon: Shield, label: t("hero.noSideEffects") },
            { icon: Sparkles, label: t("hero.provenResults") },
          ]}
          primaryCtaLabel={t("viddhakarma.cta.bookConsultation")}
          secondaryCta={{ icon: ClipboardList, label: t("viddhakarma.cta.freeAssessment"), href: ASSESSMENT_HREF }}
          image={{ src: HERO_IMAGE, fit: "right", positionClassName: "object-[78%_30%] sm:object-[74%_30%] lg:object-[70%_center]" }}
        />

        <TreatmentPillars
          theme={THEME}
          index="01"
          title={t("viddhakarma.advancedTechniques.title")}
          subtitle={t("viddhakarma.advancedTechniques.subtitle")}
          description={t("viddhakarma.advancedTechniques.description")}
          credit={PHOTO_CREDIT}
          pillars={TECHNIQUES.map((technique) => ({
            ...technique,
            title: t(`viddhakarma.advancedTechniques.${technique.key}.title`),
            description: t(`viddhakarma.advancedTechniques.${technique.key}.description`),
          }))}
        />

        <TreatmentProcess
          theme={THEME}
          title={t("viddhakarma.processSteps.title")}
          subtitle={t("viddhakarma.processSteps.subtitle")}
          steps={PROCESS_ICONS.map((icon, index) => ({
            icon,
            title: t(`viddhakarma.processSteps.steps.${index + 1}.title`),
            description: t(`viddhakarma.processSteps.steps.${index + 1}.description`),
          }))}
        />

        <TreatmentConditions
          theme={THEME}
          title={t("viddhakarma.conditions.title")}
          subtitle={t("viddhakarma.conditions.subtitle")}
          successLabel={t("common.successRate")}
          rows={CONDITIONS.map(({ key, icon }) => ({
            key,
            icon,
            condition: t(`viddhakarma.conditions.${key}.condition`),
            note: t(`viddhakarma.conditions.${key}.description`),
            successRate: parsePercent(t(`viddhakarma.conditions.${key}.successRate`)),
            metrics: [{ icon: Clock, label: t("common.duration"), text: t(`viddhakarma.conditions.${key}.duration`), tone: "accent" }],
          }))}
        />

        <TreatmentCards
          index="04"
          eyebrow={t("viddhakarma.specializedApplications.title")}
          icon={Target}
          title={t("viddhakarma.specializedApplications.title")}
          description={t("viddhakarma.specializedApplications.subtitle")}
          successLabel={t("viddhakarma.specializedApplications.successRate")}
          columnsClassName="lg:grid-cols-3"
          surface="canvas"
          cards={APPLICATIONS.map((application) => ({
            ...application,
            title: t(`viddhakarma.specializedApplications.${application.key}.title`),
            description: t(`viddhakarma.specializedApplications.${application.key}.description`),
          }))}
        />

        <TreatmentPackages
          theme={THEME}
          index="05"
          eyebrow={t("viddhakarma.treatmentPackages.title")}
          icon={Star}
          title={t("viddhakarma.treatmentPackages.title")}
          description={t("viddhakarma.treatmentPackages.subtitle")}
          successLabel={t("viddhakarma.treatmentPackages.successRate")}
          ctaLabel={t("viddhakarma.treatmentPackages.choosePackage")}
          ctaHref={HOME_LINKS.videoBooking}
          packages={PACKAGES.map(({ key, hasBadge }) => ({
            key,
            title: t(`viddhakarma.treatmentPackages.${key}.title`),
            sessions: t(`viddhakarma.treatmentPackages.${key}.sessions`),
            description: t(`viddhakarma.treatmentPackages.${key}.description`),
            successRate: t(`viddhakarma.treatmentPackages.${key}.successRate`),
            badge: hasBadge ? t(`viddhakarma.treatmentPackages.${key}.badge`) : undefined,
          }))}
        />

        <TreatmentCta
          title={t("viddhakarma.cta.title")}
          subtitle={t("viddhakarma.cta.subtitle")}
          primaryLabel={t("viddhakarma.cta.bookConsultation")}
          secondary={{ icon: ClipboardList, label: t("viddhakarma.cta.freeAssessment"), href: ASSESSMENT_HREF }}
          features={[
            { icon: Target, label: t("viddhakarma.cta.features.marmaPoints") },
            { icon: Shield, label: t("viddhakarma.cta.features.safeNatural") },
            { icon: Star, label: t("viddhakarma.cta.features.successRate") },
          ]}
          learnMore={{ label: t("common.learnMore"), href: HOME_LINKS.treatments }}
        />
      </div>
    </HomeMotionProvider>
  );
}
