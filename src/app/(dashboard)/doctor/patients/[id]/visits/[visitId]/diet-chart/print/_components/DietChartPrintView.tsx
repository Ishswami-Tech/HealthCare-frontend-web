"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinic, useClinicContext } from "@/hooks/query/useClinics";
import { useDoctor } from "@/hooks/query/useDoctors";
import { useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import { useVisitDietChart } from "@/hooks/query/useVisitDietChart";
import {
  DIET_CATEGORIES,
  DIET_CATEGORY_LABEL_KEY,
  DIET_CHART_LABELS,
  DIET_LANGUAGES,
  DIET_LANGUAGE_NAMES,
  dietLabel,
} from "@/lib/constants/diet-chart-labels";
import type { DietAdviceCategory, DietChartLanguage, VisitDietChartItem } from "@/types/visit-diet-chart.types";

interface DietChartPrintViewProps {
  patientId: string;
  visitId: string;
  /** CSS-variable classes from next/font (Gujarati + Devanagari) */
  fontClassName: string;
}

const PRINT_ROOT_ID = "diet-chart-print-root";

const CATEGORY_ACCENT: Record<DietAdviceCategory, string> = {
  TAKE: "border-emerald-600",
  AVOID: "border-rose-600",
  OCCASIONAL: "border-amber-500",
};

const SCRIPT_FONT: Record<DietChartLanguage, string | undefined> = {
  en: undefined,
  gu: "var(--font-diet-gujarati), sans-serif",
  hi: "var(--font-diet-devanagari), sans-serif",
  mr: "var(--font-diet-devanagari), sans-serif",
};

/**
 * Only the sheet is printed: the dashboard shell around this route stays on
 * screen but is hidden on paper. Scoped here so globals.css is untouched.
 */
const PRINT_STYLES = `
@media print {
  @page { size: A4; margin: 14mm; }
  body * { visibility: hidden; }
  #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible; }
  #${PRINT_ROOT_ID} { position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: 0; }
}
`;

function pickName(source: unknown): string | null {
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  const nested = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : record;
  const user = nested.user && typeof nested.user === "object" ? (nested.user as Record<string, unknown>) : null;
  const candidates = [
    user?.name,
    [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    nested.name,
    [nested.firstName, nested.lastName].filter(Boolean).join(" "),
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof found === "string" ? found.trim() : null;
}

function CategoryList({
  category,
  items,
  language,
}: {
  category: DietAdviceCategory;
  items: VisitDietChartItem[];
  language: DietChartLanguage;
}) {
  const labels = DIET_CHART_LABELS[language];
  const title = labels[DIET_CATEGORY_LABEL_KEY[category]];
  const englishTitle = DIET_CHART_LABELS.en[DIET_CATEGORY_LABEL_KEY[category]];

  return (
    <section className={cn("print-avoid-break border-t-4 pt-2", CATEGORY_ACCENT[category])}>
      <h2 className="text-base font-bold leading-tight">
        {title}
        {language !== "en" ? <span className="ml-2 text-xs font-normal text-neutral-500" lang="en">{englishTitle}</span> : null}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">—</p>
      ) : (
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm">
          {items.map((item) => {
            const label = dietLabel(item, language);
            const showEnglish = language !== "en" && label !== item.nameEn;
            return (
              <li key={item.id} className="leading-snug">
                <span className="font-medium">{label}</span>
                {showEnglish ? <span className="ml-1 text-xs text-neutral-500" lang="en">({item.nameEn})</span> : null}
                {item.note ? <div className="text-xs text-neutral-600">{item.note}</div> : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function DietChartPrintView({ patientId, visitId, fontClassName }: DietChartPrintViewProps) {
  const { clinicId } = useClinicContext();
  const { user } = useAuth();
  const { data: chart, isPending: chartPending, error: chartError } = useVisitDietChart(clinicId || "", visitId);
  const { data: caseSheet, isPending: sheetPending } = useVisitCaseSheet(clinicId || "", visitId);
  const { data: clinic } = useClinic(clinicId || "");
  const doctorId = caseSheet?.visit.doctorId ?? "";
  const { data: doctor } = useDoctor(doctorId);
  const [languageOverride, setLanguageOverride] = useState<DietChartLanguage | null>(null);

  const language: DietChartLanguage = languageOverride ?? chart?.printLanguage ?? "en";
  const labels = DIET_CHART_LABELS[language];
  const visit = caseSheet?.visit;
  const patientName = caseSheet?.patient?.name || "—";
  const doctorName = pickName(doctor) ?? pickName(user) ?? "—";
  const clinicName = clinic?.name ?? null;
  const visitDate = visit?.registrationDate ? formatDateInIST(visit.registrationDate) : "";
  const backHref = `/doctor/patients/${patientId}`;
  const isLoading = chartPending || sheetPending;

  return (
    <div className={cn("mx-auto flex w-full max-w-[210mm] flex-col gap-4", fontClassName)}>
      <style>{PRINT_STYLES}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="mr-1 size-4" />
            Back to patient
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Print language" className="inline-flex rounded-md border border-border/70 bg-background p-0.5">
            {DIET_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={language === lang}
                lang={lang}
                onClick={() => setLanguageOverride(lang)}
                style={{ fontFamily: SCRIPT_FONT[lang] }}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  language === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {DIET_LANGUAGE_NAMES[lang]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => window.print()} disabled={isLoading || !chart}>
            <Printer className="mr-1 size-4" />
            Print
          </Button>
        </div>
      </div>

      {chartError ? (
        <p className="no-print rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Could not load the diet chart: {chartError.message}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-8">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      ) : (
        <article
          id={PRINT_ROOT_ID}
          lang={language}
          style={{ fontFamily: SCRIPT_FONT[language] }}
          className="rounded-lg border border-neutral-200 bg-white p-8 text-neutral-900 shadow-sm print:rounded-none"
        >
          <header className="flex items-start justify-between gap-4 border-b border-neutral-300 pb-4">
            <div>
              {clinicName ? <p className="text-xs uppercase tracking-wide text-neutral-500">{clinicName}</p> : null}
              <h1 className="text-2xl font-bold leading-tight">{labels.title}</h1>
              {language !== "en" ? <p className="text-xs text-neutral-500" lang="en">Diet Chart</p> : null}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              <dt className="text-neutral-500">{labels.opdNumber}</dt>
              <dd className="font-medium" lang="en">{visit?.opdNumber ?? "—"}</dd>
              <dt className="text-neutral-500">{labels.date}</dt>
              <dd className="font-medium" lang="en">{visitDate || "—"}</dd>
            </dl>
          </header>

          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-neutral-500">{labels.patient}</dt>
            <dd className="font-semibold" lang="en">{patientName}</dd>
            <dt className="text-neutral-500">{labels.doctor}</dt>
            <dd className="font-medium" lang="en">{doctorName}</dd>
          </dl>

          <div className="mt-6 grid gap-6 md:grid-cols-3 print:grid-cols-3">
            {DIET_CATEGORIES.map((category) => (
              <CategoryList
                key={category}
                category={category}
                language={language}
                items={(chart?.items ?? []).filter((item) => item.category === category)}
              />
            ))}
          </div>

          {chart?.notes ? (
            <section className="print-avoid-break mt-6 border-t border-neutral-300 pt-3">
              <h2 className="text-sm font-bold">{labels.notes}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" lang="en">{chart.notes}</p>
            </section>
          ) : null}

          <footer className="mt-10 flex items-end justify-between text-xs text-neutral-500">
            <span lang="en">{chart?.updatedAt ? formatDateInIST(chart.updatedAt) : ""}</span>
            <span className="border-t border-neutral-400 pt-1 pl-16">{labels.doctor}</span>
          </footer>
        </article>
      )}
    </div>
  );
}
