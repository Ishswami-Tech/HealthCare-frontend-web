"use client";

import {
  Activity,
  BadgeCheck,
  BookOpen,
  Brain,
  ClipboardList,
  Clock,
  CloudFog,
  Droplet,
  Droplets,
  Flower2,
  Hand,
  Heart,
  HelpCircle,
  Layers,
  Leaf,
  Microscope,
  Salad,
  Shield,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  Users,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { HomeMotionProvider } from "@/components/home/home-motion";
import { HOME_LINKS } from "@/components/home/home-links";
import { TreatmentCards } from "@/components/treatments/TreatmentCards";
import { TreatmentConditions } from "@/components/treatments/TreatmentConditions";
import { TreatmentCta } from "@/components/treatments/TreatmentCta";
import { TreatmentFaq } from "@/components/treatments/TreatmentFaq";
import { TreatmentHero } from "@/components/treatments/TreatmentHero";
import { TreatmentPillars } from "@/components/treatments/TreatmentPillars";
import { TreatmentProcess } from "@/components/treatments/TreatmentProcess";
import { TreatmentQuotes } from "@/components/treatments/TreatmentQuotes";
import { TREATMENT_THEMES, parsePercent } from "@/components/treatments/treatment-theme";
import type { AccentName } from "@/lib/design/tokens";

/** Panchakarma owns the sky accent everywhere it appears. */
const THEME = TREATMENT_THEMES.sky;

/** The health assessment lives on the homepage, so it needs an absolute hash. */
const ASSESSMENT_HREF = "/#health-assessment";

const HEADLINE_SUCCESS_RATE = 95;
const PATIENTS_TREATED = "2000+";

/** Real treatment photograph (free Unsplash photo), mirrored so its subject sits right of the copy. */
const HERO_IMAGE = "/assets/treatments/panchakarma-shirodhara-hero.webp";

/** Free Unsplash photographs, credited under the cards. */
const PILLARS = [
  { key: "ancientScience", icon: BookOpen, tint: "amber", image: "/assets/treatments/panchakarma-ancient-science.webp" },
  { key: "fiveProcedures", icon: Layers, tint: "sky", image: "/assets/treatments/panchakarma-five-procedures.webp" },
  { key: "holisticApproach", icon: Flower2, tint: "emerald", image: "/assets/treatments/panchakarma-holistic-approach.webp" },
  { key: "modernApplication", icon: Microscope, tint: "violet", image: "/assets/treatments/panchakarma-modern-application.webp" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName; image: string }[];

const PHOTO_CREDIT = "Unsplash: Charanjeet Dhiman · Gokul Gurung";

const PHASES = [
  { key: "purvaKarma", icon: Droplet },
  { key: "pradhanaKarma", icon: Waves },
  { key: "paschatKarma", icon: Sprout },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const PROCEDURES = [
  { key: "abhyanga", icon: Hand, tint: "amber" },
  { key: "swedana", icon: CloudFog, tint: "sky" },
  { key: "vamana", icon: Waves, tint: "teal" },
  { key: "virechana", icon: Leaf, tint: "emerald" },
  { key: "basti", icon: Droplets, tint: "violet" },
  { key: "nasya", icon: Wind, tint: "rose" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName }[];

const CONDITIONS = [
  { key: "chronicDiseases", icon: Activity },
  { key: "digestiveDisorders", icon: Salad },
  { key: "skinConditions", icon: Sparkles },
  { key: "mentalHealth", icon: Brain },
  { key: "respiratoryIssues", icon: Wind },
  { key: "hormonalImbalances", icon: Flower2 },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const BENEFITS = [
  { key: "detoxification", icon: Droplets, tint: "sky" },
  { key: "rejuvenation", icon: Sparkles, tint: "amber" },
  { key: "immunity", icon: ShieldCheck, tint: "emerald" },
  { key: "mentalClarity", icon: Brain, tint: "violet" },
  { key: "longTermResults", icon: TrendingUp, tint: "teal" },
  { key: "provenEfficacy", icon: BadgeCheck, tint: "rose" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName }[];

const TESTIMONIALS = ["patient1", "patient2", "patient3"] as const;
const FAQ_KEYS = ["question1", "question2", "question3", "question4", "question5"] as const;

export default function PanchakarmaPage() {
  const { t, tArray } = useTranslation();

  /* No PageTransition wrapper: it server-renders the whole page at opacity 0
     and fades it in only after hydration, so every refresh blinked. The hero
     animates itself from CSS and the sections reveal on scroll. */
  return (
    <HomeMotionProvider>
      <div className="overflow-x-clip font-body">
        <TreatmentHero
          theme={THEME}
          appearance="auto"
          badgeIcon={Droplets}
          badge={t("panchakarma.badge")}
          title={t("panchakarma.title")}
          subtitle={t("panchakarma.subtitle")}
          lede={t("panchakarma.benefits.subtitle")}
          features={[
            { icon: Droplets, label: t("panchakarma.benefits.detoxification.title") },
            { icon: Sparkles, label: t("panchakarma.benefits.rejuvenation.title") },
            { icon: ShieldCheck, label: t("panchakarma.benefits.immunity.title") },
            { icon: Brain, label: t("panchakarma.benefits.mentalClarity.title") },
          ]}
          stats={[
            { icon: Shield, value: `${HEADLINE_SUCCESS_RATE}%`, label: t("common.successRate") },
            { icon: Users, value: PATIENTS_TREATED, label: `${t("common.patients")} ${t("common.treated")}` },
            { icon: Leaf, value: "100%", label: t("hero.natural") },
          ]}
          assurances={[
            { icon: Leaf, label: t("hero.natural") },
            { icon: Shield, label: t("hero.noSideEffects") },
            { icon: Sparkles, label: t("hero.provenResults") },
          ]}
          primaryCtaLabel={t("panchakarma.cta.bookProgram")}
          secondaryCta={{ icon: ClipboardList, label: t("panchakarma.cta.freeConsultation"), href: ASSESSMENT_HREF }}
          image={{ src: HERO_IMAGE, fit: "right", positionClassName: "object-[72%_62%] sm:object-[72%_60%] lg:object-[85%_center]" }}
        />

        <TreatmentPillars
          theme={THEME}
          index="01"
          title={t("panchakarma.whatIs.title")}
          subtitle={t("panchakarma.whatIs.completeTransformation")}
          description={`${t("panchakarma.whatIs.completeTransformationDesc")} · ${t("panchakarma.whatIs.daysProgram")}`}
          credit={PHOTO_CREDIT}
          pillars={PILLARS.map((pillar) => ({
            ...pillar,
            title: t(`panchakarma.whatIs.${pillar.key}.title`),
            description: t(`panchakarma.whatIs.${pillar.key}.description`),
          }))}
        />

        <TreatmentProcess
          theme={THEME}
          title={t("panchakarma.phases.title")}
          subtitle={t("panchakarma.phases.subtitle")}
          steps={PHASES.map(({ key, icon }) => ({
            icon,
            title: t(`panchakarma.phases.${key}.name`),
            description: t(`panchakarma.phases.${key}.subtitle`),
            meta: t(`panchakarma.phases.${key}.duration`),
            points: tArray(`panchakarma.phases.${key}.activities`),
            pointsLabel: t("panchakarma.phases.keyActivities"),
          }))}
        />

        <TreatmentCards
          index="02"
          eyebrow={t("panchakarma.processGallery.title")}
          icon={Layers}
          title={t("panchakarma.processGallery.title")}
          description={t("panchakarma.processGallery.subtitle")}
          columnsClassName="lg:grid-cols-3"
          cards={PROCEDURES.map((procedure) => ({
            ...procedure,
            title: t(`panchakarma.processGallery.${procedure.key}.title`),
            description: t(`panchakarma.processGallery.${procedure.key}.description`),
          }))}
        />

        <TreatmentConditions
          theme={THEME}
          title={t("panchakarma.conditions.title")}
          subtitle={t("panchakarma.conditions.subtitle")}
          successLabel={t("common.successRate")}
          rows={CONDITIONS.map(({ key, icon }) => ({
            key,
            icon,
            condition: t(`panchakarma.conditions.${key}.category`),
            successRate: parsePercent(t(`panchakarma.conditions.${key}.successRate`)),
            tags: tArray(`panchakarma.conditions.${key}.items`),
            metrics: [{ icon: Clock, label: t("common.duration"), text: t(`panchakarma.conditions.${key}.duration`), tone: "accent" }],
          }))}
        />

        <TreatmentQuotes
          theme={THEME}
          index="04"
          eyebrow={t("panchakarma.testimonials.title")}
          icon={Heart}
          title={t("panchakarma.testimonials.title")}
          description={t("panchakarma.testimonials.subtitle")}
          items={TESTIMONIALS.map((key) => ({
            key,
            quote: t(`panchakarma.testimonials.${key}.testimonial`),
            title: t(`panchakarma.testimonials.${key}.name`),
            subtitle: t(`panchakarma.testimonials.${key}.condition`),
          }))}
        />

        <TreatmentCards
          index="05"
          eyebrow={t("panchakarma.benefits.title")}
          icon={Star}
          title={t("panchakarma.benefits.title")}
          description={t("panchakarma.benefits.subtitle")}
          columnsClassName="lg:grid-cols-3"
          cards={BENEFITS.map((benefit) => ({
            ...benefit,
            title: t(`panchakarma.benefits.${benefit.key}.title`),
            description: t(`panchakarma.benefits.${benefit.key}.description`),
          }))}
        />

        <TreatmentFaq
          theme={THEME}
          index="06"
          eyebrow={t("panchakarma.faq.title")}
          icon={HelpCircle}
          title={t("panchakarma.faq.title")}
          description={t("panchakarma.faq.subtitle")}
          items={FAQ_KEYS.map((key) => ({
            question: t(`panchakarma.faq.${key}.question`),
            answer: t(`panchakarma.faq.${key}.answer`),
          }))}
        />

        <TreatmentCta
          title={t("panchakarma.cta.title")}
          subtitle={t("panchakarma.cta.subtitle")}
          primaryLabel={t("panchakarma.cta.bookProgram")}
          secondary={{ icon: ClipboardList, label: t("panchakarma.cta.freeConsultation"), href: ASSESSMENT_HREF }}
          features={[
            { icon: Star, label: t("panchakarma.cta.features.successRate") },
            { icon: Users, label: t("panchakarma.cta.features.patientsTreated") },
            { icon: ShieldCheck, label: t("panchakarma.cta.features.governmentCertified") },
          ]}
          learnMore={{ label: t("common.learnMore"), href: HOME_LINKS.treatments }}
        />
      </div>
    </HomeMotionProvider>
  );
}
