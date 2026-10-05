"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/components/tbd";
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
import type {
  DietAdviceCategory,
  DietChartLanguage,
  VisitDietChart,
  VisitDietChartItem,
} from "@/types/visit-diet-chart.types";

interface DietChartPrintViewProps {
  patientId: string;
  visitId: string;
  /** CSS-variable classes from next/font (Gujarati + Devanagari) */
  fontClassName: string;
}

const PRINT_ROOT_ID = "diet-chart-print-root";

const CATEGORY_ACCENT: Record<DietAdviceCategory, string> = {
  TAKE: "border-[#059669]",
  AVOID: "border-[#e11d48]",
  OCCASIONAL: "border-[#f59e0b]",
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
 * On paper the sheet has no card look (no border, shadow, padding or fixed
 * height): the A4 page margin is the only margin.
 */
const PRINT_STYLES = `
@media print {
  @page { size: A4; margin: 14mm; }
  html, body { background: #ffffff !important; }
  body * { visibility: hidden; }
  #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible; }
  #${PRINT_ROOT_ID} { position: absolute; inset: 0 auto auto 0; width: 100%; max-width: none; min-height: 0; margin: 0; padding: 0; box-shadow: none; border: 0; border-radius: 0; background: #ffffff; color: #171717; }
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
    <section
      className={cn("print-avoid-break flex min-w-0 flex-col gap-2.5 border-t-4 pt-2.5", CATEGORY_ACCENT[category])}
    >
      <h2 className="m-0 text-base font-extrabold leading-tight">
        {title}
        {language !== "en" ? (
          <span className="ml-2 text-xs font-medium text-[#64748b]" lang="en">
            {englishTitle}
          </span>
        ) : null}
      </h2>
      {items.length === 0 ? (
        <p className="m-0 text-sm text-[#a3a3a3]">—</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {items.map((item, index) => {
            const label = dietLabel(item, language);
            const showEnglish = language !== "en" && label !== item.nameEn;
            return (
              <li key={item.id} className="flex gap-2 text-sm leading-[1.4]">
                <span className="w-[18px] shrink-0 text-[#64748b]" lang="en">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <span className="font-semibold">{label}</span>
                  {showEnglish ? (
                    <span className="ml-1 text-xs font-medium text-[#64748b]" lang="en">
                      ({item.nameEn})
                    </span>
                  ) : null}
                  {item.note ? <div className="text-xs text-[#3b4a5e]">{item.note}</div> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export interface DietChartPrintSheetProps {
  /** Where "Back to patient" goes. */
  backHref: string;
  language: DietChartLanguage;
  onLanguageChange: (language: DietChartLanguage) => void;
  onPrint: () => void;
  chart: VisitDietChart | null | undefined;
  isLoading: boolean;
  /** Message when the chart could not be loaded. */
  error?: string | null;
  clinicName: string | null;
  patientName: string;
  doctorName: string;
  opdNumber: string | null;
  /** Visit date, already formatted. */
  visitDate: string;
  /** CSS-variable classes from next/font (Gujarati + Devanagari) */
  fontClassName?: string;
}

/** The print page: a toolbar (not printed) and the A4 sheet. Everything comes in through props. */
export function DietChartPrintSheet({
  backHref,
  language,
  onLanguageChange,
  onPrint,
  chart,
  isLoading,
  error = null,
  clinicName,
  patientName,
  doctorName,
  opdNumber,
  visitDate,
  fontClassName,
}: DietChartPrintSheetProps) {
  const labels = DIET_CHART_LABELS[language];

  return (
    <div className={cn("mx-auto flex w-full max-w-[794px] flex-col gap-5", fontClassName)}>
      <style>{PRINT_STYLES}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="lg" className="px-3.5 has-[>svg]:px-3.5">
          <Link href={backHref}>
            <ChevronLeft aria-hidden="true" />
            Back to patient
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2.5">
          <span id="diet-print-language-label" className="text-xs font-bold text-ink-soft">
            Print language
          </span>
          <div
            role="radiogroup"
            aria-labelledby="diet-print-language-label"
            className="inline-flex max-w-full gap-0.5 rounded-xl border border-line bg-card p-[3px]"
          >
            {DIET_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={language === lang}
                lang={lang}
                onClick={() => onLanguageChange(lang)}
                style={{ fontFamily: SCRIPT_FONT[lang] }}
                className={cn(
                  "inline-flex min-h-[34px] items-center whitespace-nowrap rounded-[9px] px-3 text-[13px] transition-colors",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                  language === lang
                    ? "bg-primary font-bold text-primary-foreground"
                    : "font-semibold text-ink-soft hover:bg-well",
                )}
              >
                {DIET_LANGUAGE_NAMES[lang]}
              </button>
            ))}
          </div>
          <Button size="lg" className="px-3.5 has-[>svg]:px-3.5" onClick={onPrint} disabled={isLoading || !chart}>
            <Printer aria-hidden="true" />
            Print
          </Button>
        </div>
      </div>

      {error ? (
        <Note tone="rose" className="no-print">
          Could not load the diet chart: {error}
        </Note>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[420px] flex-col gap-3 rounded-md border border-[#e2e8f0] bg-white p-6 shadow-[0_12px_32px_rgba(15,27,45,0.12)] sm:px-[52px] sm:py-12">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
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
          className="flex min-h-[780px] flex-col rounded-md border border-[#e2e8f0] bg-white p-6 text-[#171717] shadow-[0_12px_32px_rgba(15,27,45,0.12)] sm:px-[52px] sm:py-12"
        >
          <header className="flex flex-col gap-3 border-b border-[#d4d4d4] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 print:flex-row print:items-start print:justify-between print:gap-5">
            <div className="flex min-w-0 flex-col gap-0.5">
              {clinicName ? (
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.8px] text-[#64748b]" lang="en">
                  {clinicName}
                </p>
              ) : null}
              <h1 className="m-0 text-[26px] font-extrabold leading-[1.2]">{labels.title}</h1>
              {language !== "en" ? (
                <p className="m-0 text-xs text-[#64748b]" lang="en">
                  Diet Chart
                </p>
              ) : null}
            </div>
            <dl className="m-0 grid shrink-0 grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-sm">
              <dt className="text-[#64748b]">{labels.opdNumber}</dt>
              <dd className="m-0 font-semibold" lang="en">
                {opdNumber ?? "—"}
              </dd>
              <dt className="text-[#64748b]">{labels.date}</dt>
              <dd className="m-0 font-semibold" lang="en">
                {visitDate || "—"}
              </dd>
            </dl>
          </header>

          <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-sm">
            <dt className="text-[#64748b]">{labels.patient}</dt>
            <dd className="m-0 font-bold" lang="en">
              {patientName}
            </dd>
            <dt className="text-[#64748b]">{labels.doctor}</dt>
            <dd className="m-0 font-semibold" lang="en">
              {doctorName}
            </dd>
          </dl>

          <div className="mt-[26px] grid gap-[26px] md:grid-cols-3 print:grid-cols-3">
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
            <section className="print-avoid-break mt-7 border-t border-[#d4d4d4] pt-3">
              <h2 className="m-0 text-sm font-extrabold">{labels.notes}</h2>
              <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-[1.6]" lang="en">
                {chart.notes}
              </p>
            </section>
          ) : null}

          <div className="flex-1" />

          <footer className="mt-10 flex items-end justify-between text-xs text-[#64748b]">
            <span lang="en">{chart?.updatedAt ? formatDateInIST(chart.updatedAt) : ""}</span>
            <span className="border-t border-[#a3a3a3] pl-[90px] pt-1.5">{labels.doctor}</span>
          </footer>
        </article>
      )}
    </div>
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
  const visit = caseSheet?.visit;

  return (
    <DietChartPrintSheet
      backHref={`/doctor/patients/${patientId}`}
      language={language}
      onLanguageChange={setLanguageOverride}
      onPrint={() => window.print()}
      chart={chart}
      isLoading={chartPending || sheetPending}
      error={chartError ? chartError.message : null}
      clinicName={clinic?.name ?? null}
      patientName={caseSheet?.patient?.name || "—"}
      doctorName={pickName(doctor) ?? pickName(user) ?? "—"}
      opdNumber={visit?.opdNumber ?? null}
      visitDate={visit?.registrationDate ? formatDateInIST(visit.registrationDate) : ""}
      fontClassName={fontClassName}
    />
  );
}
