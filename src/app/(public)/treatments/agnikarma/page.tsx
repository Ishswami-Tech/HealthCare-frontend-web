"use client";

import {
  BookOpen,
  Accessibility,
  Activity,
  Bone,
  CalendarDays,
  ClipboardList,
  Clock,
  FileSearch,
  Flame,
  Footprints,
  Hand,
  Heart,
  HeartPulse,
  Leaf,
  Microscope,
  MoveVertical,
  Shield,
  ShieldCheck,
  Sparkles,
  Spline,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { HomeMotionProvider, Reveal } from "@/components/home/home-motion";
import { HOME_LINKS } from "@/components/home/home-links";
import { TreatmentCards } from "@/components/treatments/TreatmentCards";
import { TreatmentConditions, type ConditionRowData } from "@/components/treatments/TreatmentConditions";
import { TreatmentCta } from "@/components/treatments/TreatmentCta";
import { TreatmentHero } from "@/components/treatments/TreatmentHero";
import { TreatmentPillars } from "@/components/treatments/TreatmentPillars";
import { TreatmentProcess } from "@/components/treatments/TreatmentProcess";
import { TreatmentQuotes } from "@/components/treatments/TreatmentQuotes";
import { TREATMENT_THEMES } from "@/components/treatments/treatment-theme";
import {
  ACCENTS,
  CARD,
  DISPLAY_LG,
  STATUS,
  type AccentName,
  type StatusName,
} from "@/lib/design/tokens";

/** Agnikarma owns the amber accent everywhere it appears. */
const THEME = TREATMENT_THEMES.amber;
const accent = ACCENTS[THEME.accent];

/** The health assessment lives on the homepage, so it needs an absolute hash. */
const ASSESSMENT_HREF = "/#health-assessment";

/** Hero photograph. Replace the file to change the image; no code change needed. */
const HERO_IMAGE = "/assets/treatments/agnikarma-brow-marma.webp";

const HEADLINE_SUCCESS_RATE = 92;

type Translate = (path: string) => string;

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const FOUNDATION_PILLARS = [
  { key: "ancientText", icon: BookOpen, tint: "amber", image: "/assets/treatments/agnikarma-ancient-texts.webp" },
  { key: "modernValidation", icon: Microscope, tint: "emerald", image: "/assets/treatments/agnikarma-modern-validation.webp" },
  { key: "precisionTechnology", icon: Target, tint: "violet", image: "/assets/treatments/agnikarma-clinic-heat.webp" },
  { key: "zeroSideEffects", icon: Shield, tint: "teal", image: "/assets/treatments/agnikarma-zero-side-effects.webp" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName; image: string }[];

const ADVANTAGES = [
  { key: "instantResults", icon: Zap, tint: "amber" },
  { key: "precisionTargeting", icon: Target, tint: "violet" },
  { key: "zeroSideEffects", icon: Shield, tint: "emerald" },
  { key: "costEffective", icon: TrendingUp, tint: "sky" },
] as const satisfies readonly { key: string; icon: LucideIcon; tint: AccentName }[];

const CONDITION_KEYS = [
  { key: "chronicKneePain", successRate: 95 },
  { key: "sciatica", successRate: 92 },
  { key: "frozenShoulder", successRate: 88 },
  { key: "tennisElbow", successRate: 94 },
  { key: "plantarFasciitis", successRate: 90 },
  { key: "cervicalSpondylosis", successRate: 87 },
  { key: "arthritis", successRate: 89 },
] as const;

interface Condition {
  key: string;
  condition: string;
  successRate: number;
  avgSessions: string;
  recoveryTime: string;
  patientStory: string;
}

function buildConditions(t: Translate): Condition[] {
  return CONDITION_KEYS.map(({ key, successRate }) => ({
    key,
    successRate,
    condition: t(`agnikarma.conditions.${key}.condition`),
    avgSessions: t(`agnikarma.conditions.${key}.avgSessions`),
    recoveryTime: t(`agnikarma.conditions.${key}.recoveryTime`),
    patientStory: t(`agnikarma.conditions.${key}.patientStory`),
  }));
}

/**
 * Comparison rows. `tone` carries the clinical judgement, so it maps to a
 * STATUS token rather than a decorative accent.
 */
interface ComparisonRow {
  method: string;
  duration: string;
  successRate: number;
  sideEffects: string;
  cost: string;
  tone: StatusName;
  isAgnikarma?: boolean;
}

function buildComparison(t: Translate): ComparisonRow[] {
  return [
    {
      method: t("agnikarma.comparison.agnikarma"),
      duration: `3-5 ${t("agnikarma.comparison.sessions")}`,
      successRate: 92,
      sideEffects: t("agnikarma.advantages.zeroSideEffects.title"),
      cost: t("agnikarma.advantages.costEffective.title"),
      tone: "success",
      isAgnikarma: true,
    },
    {
      method: t("agnikarma.comparison.surgery"),
      duration: `6-12 ${t("agnikarma.comparison.months")}`,
      successRate: 70,
      sideEffects: t("agnikarma.comparison.highRisk"),
      cost: t("agnikarma.comparison.veryHigh"),
      tone: "danger",
    },
    {
      method: t("agnikarma.comparison.medications"),
      duration: t("agnikarma.comparison.ongoing"),
      successRate: 60,
      sideEffects: t("agnikarma.comparison.multiple"),
      cost: t("agnikarma.comparison.highOngoing"),
      tone: "danger",
    },
    {
      method: t("agnikarma.comparison.physiotherapy"),
      duration: `6-18 ${t("agnikarma.comparison.months")}`,
      successRate: 50,
      sideEffects: t("agnikarma.comparison.minimal"),
      cost: t("agnikarma.comparison.moderate"),
      tone: "warning",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Section data                                                               */
/* -------------------------------------------------------------------------- */

/** The five steps alternate emerald / amber, badge through to footer rule. */
const PROCESS_ICONS: readonly LucideIcon[] = [FileSearch, Leaf, Flame, HeartPulse, ShieldCheck];

/** Each condition keeps its own glyph so the rows are scannable. */
const CONDITION_ICONS: Record<string, LucideIcon> = {
  chronicKneePain: Bone,
  sciatica: Spline,
  frozenShoulder: Accessibility,
  tennisElbow: Activity,
  plantarFasciitis: Footprints,
  cervicalSpondylosis: MoveVertical,
  arthritis: Hand,
};

function toConditionRows(t: Translate, conditions: Condition[]): ConditionRowData[] {
  return conditions.map((item) => ({
    key: item.key,
    icon: CONDITION_ICONS[item.key] ?? Bone,
    condition: item.condition,
    successRate: item.successRate,
    metrics: [
      { icon: CalendarDays, label: t("agnikarma.comparison.avgSessions"), text: item.avgSessions, tone: "primary" },
      { icon: Clock, label: t("agnikarma.comparison.recoveryTime"), text: item.recoveryTime, tone: "accent" },
    ],
  }));
}

/* -------------------------------------------------------------------------- */
/*  Comparison                                                                 */
/* -------------------------------------------------------------------------- */

/** Agnikarma against the other modalities; desktop table, stacked cards on phones. */
function ComparisonTable({ t, comparison }: { t: Translate; comparison: ComparisonRow[] }) {
  const headers = [
    t("agnikarma.comparison.treatmentMethod"),
    t("agnikarma.comparison.duration"),
    t("common.successRate"),
    t("agnikarma.comparison.sideEffects"),
    t("agnikarma.comparison.cost"),
  ];

  return (
    <Reveal className="mt-10">
      <h3 className={cn(DISPLAY_LG, "text-center text-foreground")}>{t("agnikarma.comparison.title")}</h3>

      <div className={cn(CARD, "mt-7 hidden shadow-[0_24px_52px_-34px_rgba(10,70,52,0.4)] md:block")}>
        <table className="w-full text-sm">
          <thead className="bg-[oklch(0.22_0.045_163)] text-white">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={cn(
                    "py-4 font-heading text-[10px] font-semibold uppercase tracking-[0.18em]",
                    index === 0 ? "px-5 pl-6 text-left" : "px-5 text-center last:pr-6"
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {comparison.map((row) => {
              const tone = STATUS[row.tone];
              return (
                <tr
                  key={row.method}
                  className={cn(
                    "transition-colors duration-300",
                    row.isAgnikarma ? cn(accent.soft, "font-medium") : "hover:bg-primary/5"
                  )}
                >
                  <th
                    scope="row"
                    className={cn(
                      "px-5 py-4 pl-6 text-left font-semibold",
                      row.isAgnikarma ? accent.text : "text-foreground"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {row.isAgnikarma ? <Flame className="size-4" aria-hidden="true" /> : null}
                      {row.method}
                    </span>
                  </th>
                  <td className="px-5 py-4 text-center text-[13px] text-muted-foreground">{row.duration}</td>
                  <td className={cn("px-5 py-4 text-center font-heading text-[13px] font-semibold tabular-nums", tone.text)}>
                    {row.successRate}%
                  </td>
                  <td className={cn("px-5 py-4 text-center text-[13px]", tone.text)}>{row.sideEffects}</td>
                  <td className={cn("px-5 py-4 pr-6 text-center text-[13px]", tone.text)}>{row.cost}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
        {comparison.map((row) => {
          const tone = STATUS[row.tone];
          return (
            <div
              key={row.method}
              className={cn(CARD, "flex flex-col p-5", row.isAgnikarma && cn(accent.border, "ring-1", accent.soft))}
            >
              <p
                className={cn(
                  "inline-flex items-center gap-2 font-heading text-sm font-semibold",
                  row.isAgnikarma ? accent.text : "text-foreground"
                )}
              >
                {row.isAgnikarma ? <Flame className="size-4" aria-hidden="true" /> : null}
                {row.method}
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[13px]">
                {[
                  { label: headers[1], value: row.duration },
                  { label: headers[2], value: `${row.successRate}%` },
                  { label: headers[3], value: row.sideEffects },
                  { label: headers[4], value: row.cost },
                ].map((cell) => (
                  <div key={cell.label} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{cell.label}</dt>
                    <dd className={cn("font-medium", tone.text)}>{cell.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AgnikarmaPage() {
  const { t, tArray } = useTranslation();
  const conditions = buildConditions(t);
  const comparison = buildComparison(t);

  /* No PageTransition wrapper: it server-renders the whole page at opacity 0
     and fades it in only after hydration, so every refresh blinked. The hero
     animates itself from CSS and the sections reveal on scroll. */
  return (
    <HomeMotionProvider>
      <div className="overflow-x-clip font-body">
        <TreatmentHero
          theme={THEME}
          appearance="auto"
          badgeIcon={Flame}
          badge={t("agnikarma.badge")}
          title={t("agnikarma.title")}
          subtitle={t("agnikarma.subtitle")}
          lede={t("agnikarma.advantages.subtitle")}
          features={[
            { icon: Zap, label: t("agnikarma.advantages.instantResults.title") },
            { icon: Leaf, label: t("agnikarma.advantages.zeroSideEffects.title") },
            { icon: Target, label: t("agnikarma.advantages.precisionTargeting.title") },
            { icon: TrendingUp, label: t("agnikarma.advantages.costEffective.title") },
          ]}
          stats={[
            { icon: Users, value: "5000+", label: t("stats.livesTransformed") },
            { icon: Shield, value: `${HEADLINE_SUCCESS_RATE}%`, label: t("common.successRate") },
            { icon: Leaf, value: "100%", label: t("hero.natural") },
          ]}
          assurances={[
            { icon: Leaf, label: t("hero.natural") },
            { icon: Shield, label: t("hero.noSideEffects") },
            { icon: Sparkles, label: t("hero.provenResults") },
          ]}
          primaryCtaLabel={t("agnikarma.cta.bookSession")}
          secondaryCta={{ icon: ClipboardList, label: t("agnikarma.cta.freeAssessment"), href: ASSESSMENT_HREF }}
          image={{ src: HERO_IMAGE, fit: "right", positionClassName: "object-[66%_30%] sm:object-[66%_32%] lg:object-[72%_center]" }}
        />

        <TreatmentPillars
          theme={THEME}
          index="01"
          title={t("agnikarma.scientificFoundation.title")}
          subtitle={t("agnikarma.scientificFoundation.subtitle")}
          description={t("agnikarma.scientificFoundation.description")}
          pillars={FOUNDATION_PILLARS.map((pillar) => ({
            ...pillar,
            title: t(`agnikarma.scientificFoundation.${pillar.key}.title`),
            description: t(`agnikarma.scientificFoundation.${pillar.key}.description`),
          }))}
        />

        <TreatmentProcess
          theme={THEME}
          title={t("agnikarma.processSteps.title")}
          subtitle={t("agnikarma.processSteps.subtitle")}
          steps={PROCESS_ICONS.map((icon, index) => ({
            icon,
            title: t(`agnikarma.processSteps.steps.${index + 1}.title`),
            description: t(`agnikarma.processSteps.steps.${index + 1}.description`),
          }))}
        />

        <TreatmentConditions
          theme={THEME}
          title={t("agnikarma.conditions.title")}
          subtitle={t("agnikarma.conditions.subtitle")}
          description={t("agnikarma.conditions.description")}
          assurance={{
            title: t("agnikarma.conditions.assurance.title"),
            points: tArray("agnikarma.conditions.assurance.points"),
          }}
          successLabel={t("common.successRate")}
          rows={toConditionRows(t, conditions)}
        />

        <TreatmentQuotes
          theme={THEME}
          index="04"
          eyebrow="Patient Success Stories"
          icon={Heart}
          title="Real Results, Real Stories"
          description="Discover how Agnikarma has transformed lives and brought relief to patients suffering from various conditions."
          items={conditions.map((item) => ({
            key: item.key,
            quote: item.patientStory,
            title: item.condition,
            meta: [
              { tone: "success", label: `${item.successRate}% ${t("common.success")}` },
              { tone: "warning", label: item.avgSessions },
            ],
          }))}
        />

        <TreatmentCards
          index="05"
          eyebrow={t("agnikarma.advantages.title")}
          icon={Star}
          title={t("agnikarma.advantages.title")}
          description={t("agnikarma.advantages.subtitle")}
          cards={ADVANTAGES.map((advantage) => ({
            ...advantage,
            title: t(`agnikarma.advantages.${advantage.key}.title`),
            description: t(`agnikarma.advantages.${advantage.key}.description`),
          }))}
        >
          <ComparisonTable t={t} comparison={comparison} />
        </TreatmentCards>

        <TreatmentCta
          title={t("agnikarma.cta.title")}
          subtitle={t("agnikarma.cta.subtitle")}
          primaryLabel={t("agnikarma.cta.bookSession")}
          secondary={{ icon: ClipboardList, label: t("agnikarma.cta.freeAssessment"), href: ASSESSMENT_HREF }}
          features={[
            { icon: Zap, label: t("agnikarma.cta.features.instantRelief") },
            { icon: Shield, label: t("agnikarma.cta.features.zeroSideEffects") },
            { icon: Star, label: t("agnikarma.cta.features.successRate") },
          ]}
          learnMore={{ label: t("common.learnMore"), href: HOME_LINKS.treatments }}
        />
      </div>
    </HomeMotionProvider>
  );
}
