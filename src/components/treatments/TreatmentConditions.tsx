import { Check, Flower2, Leaf, type LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CONTAINER,
  DISPLAY_LG,
  DISPLAY_MD,
  HOVER_CARD_LIFT,
  HOVER_TRANSITION,
  HOVER_TRANSITION_CHILD,
  SECTION_Y,
  STATUS,
  SURFACE,
} from "@/lib/design/tokens";
import { splitTail, splitValueUnit, type TreatmentTheme } from "./treatment-theme";

export interface ConditionMetric {
  icon: LucideIcon;
  label: string;
  /** Free text such as "3-5 sessions"; the figure and the unit are sized separately. */
  text: string;
  /** `accent` takes the therapy colour, `primary` the brand emerald. */
  tone: "primary" | "accent";
}

export interface ConditionRowData {
  key: string;
  icon: LucideIcon;
  condition: string;
  successRate: number;
  /** One line under the name. */
  note?: string;
  /** Small chips under the meter, e.g. the conditions a category covers. */
  tags?: string[];
  metrics: ConditionMetric[];
}

interface TreatmentConditionsProps {
  theme: TreatmentTheme;
  title: string;
  subtitle: string;
  description?: string;
  assurance?: { title: string; points: string[] };
  successLabel: string;
  rows: ConditionRowData[];
}

function MetricCell({ metric, theme, position }: { metric: ConditionMetric; theme: TreatmentTheme; position: "first" | "middle" | "last" }) {
  const Icon = metric.icon;
  const { value, unit } = splitValueUnit(metric.text);
  const isAccent = metric.tone === "accent";

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2.5",
        position !== "last" && "pr-4 sm:pr-5",
        position !== "first" && "pl-4 sm:pl-5"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isAccent ? theme.metricPlate : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{metric.label}</dt>
        <dd
          className={cn(
            "home-display font-heading text-base font-semibold leading-tight",
            isAccent ? ACCENTS[theme.accent].text : "text-foreground"
          )}
        >
          {value}
        </dd>
        <p className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">{unit}</p>
      </div>
    </div>
  );
}

function ConditionRow({ item, theme, successLabel }: { item: ConditionRowData; theme: TreatmentTheme; successLabel: string }) {
  const Icon = item.icon;
  const metricPosition = (index: number) =>
    index === item.metrics.length - 1 && index > 0 ? "last" : index === 0 ? "first" : "middle";

  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-[1.25rem] border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(16,40,32,0.04)] sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        HOVER_TRANSITION,
        HOVER_CARD_LIFT,
        "hover:shadow-[0_22px_44px_-26px_rgba(10,70,52,0.35)]"
      )}
    >
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          HOVER_TRANSITION_CHILD,
          "group-hover:scale-105"
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>

      {/* Name + success meter */}
      <div className="min-w-0 flex-1">
        <h3 className={cn(DISPLAY_MD, "text-base text-foreground sm:text-lg")}>{item.condition}</h3>
        {item.note ? <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.note}</p> : null}
        <p className="mt-1 text-[11px] text-muted-foreground">{successLabel}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <Progress value={item.successRate} className="h-2 flex-1" />
          <span className={cn("home-display font-heading text-sm font-semibold tabular-nums", STATUS.success.text)}>
            {item.successRate}%
          </span>
        </div>
        {item.tags && item.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Metrics, hairline-separated */}
      <dl className="flex shrink-0 divide-x divide-border/60 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        {item.metrics.map((metric, index) => (
          <MetricCell key={metric.label} metric={metric} theme={theme} position={metricPosition(index)} />
        ))}
      </dl>
    </article>
  );
}

/** Sticky standfirst on the left, condition rows with success meters on the right. */
export function TreatmentConditions({
  theme,
  title,
  subtitle,
  description,
  assurance,
  successLabel,
  rows,
}: TreatmentConditionsProps) {
  const { lead, tail } = splitTail(title);

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y, "relative isolate overflow-hidden")}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-24 -left-20 size-96 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
        <div className={cn("absolute -right-20 top-0 size-80 rounded-full blur-3xl", theme.glowSoft)} />
      </div>

      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-12")}>
        {/* Standfirst */}
        <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            <Leaf className="size-3.5" aria-hidden="true" />
            {title}
          </span>

          <h2 className={cn(DISPLAY_LG, "mt-5 text-emerald-950 dark:text-emerald-50")}>
            <span className="block">{lead}</span>
            {tail ? <span className={cn("block", theme.tailText)}>{tail}</span> : null}
          </h2>

          <p className="mt-3 font-heading text-lg font-medium text-stone-500 dark:text-stone-400">{subtitle}</p>
          <span aria-hidden="true" className={cn("mt-5 block h-0.5 w-14 rounded-full", theme.standfirstRule)} />
          {description ? (
            <p className="mt-5 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{description}</p>
          ) : null}

          {/* Assurance panel */}
          {assurance ? (
            <div className="mt-8 rounded-[1.5rem] border border-emerald-600/15 bg-emerald-50/70 p-5 dark:bg-emerald-950/30">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                  <Flower2 className="size-6" aria-hidden="true" />
                </span>
                <p className={cn(DISPLAY_MD, "text-base text-emerald-950 dark:text-emerald-50")}>{assurance.title}</p>
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {assurance.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-[13px] text-stone-700 dark:text-stone-200">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Reveal>

        {/* Condition rows */}
        <RevealGroup stagger={0.07} className="flex flex-col gap-3.5 lg:col-span-8">
          {rows.map((item) => (
            <RevealItem key={item.key}>
              <ConditionRow item={item} theme={theme} successLabel={successLabel} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
