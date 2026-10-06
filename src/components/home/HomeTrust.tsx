"use client";

import { CheckCircle2, ShieldCheck, Target, TrendingUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { parsePercent } from "./home-format";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CARD, CONTAINER, HEADING_GAP, SECTION_Y, SURFACE_RAISED } from "./home-theme";
import { INK_BG } from "@/lib/design/tokens";

const FAQ_KEYS = ["different", "results", "safe", "guarantees", "certifications"] as const;
const GUARANTEE_KEYS = [
  "chronicPain",
  "neurological",
  "stress",
  "digestive",
  "sleep",
  "energy",
  "immunity",
  "wellness",
] as const;

type Guarantee = {
  key: string;
  condition: string;
  guarantee: string;
  timeframe: string;
  measurement: string;
  successRate: string;
  successValue: number;
};

function TimeframeBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-heading text-[11px] font-semibold text-primary">
      {children}
    </span>
  );
}

function SuccessMeter({ guarantee }: { guarantee: Guarantee }) {
  return (
    <div className="flex items-center gap-3">
      <Progress value={guarantee.successValue} className="h-1.5 w-16 flex-1" />
      <span className="home-display font-heading text-[13px] font-semibold tabular-nums text-primary">
        {guarantee.successRate}
      </span>
    </div>
  );
}

export default function HomeTrust() {
  const { t, tArray } = useTranslation();

  const faqs = FAQ_KEYS.map((key) => ({
    key,
    question: t(`trust.faq.questions.${key}`),
    answer: t(`trust.faq.answers.${key}`),
  }));

  const guarantees: Guarantee[] = GUARANTEE_KEYS.map((key) => {
    const base = `trust.guarantees.conditions.${key}`;
    const successRate = t(`${base}.successRate`);
    return {
      key,
      condition: t(`${base}.condition`),
      guarantee: t(`${base}.guarantee`),
      timeframe: t(`${base}.timeframe`),
      measurement: t(`${base}.measurement`),
      successRate,
      successValue: parsePercent(successRate),
    };
  });

  const tableHeaders = [
    t("trust.guarantees.table.condition"),
    t("trust.guarantees.table.guarantee"),
    t("trust.guarantees.table.timeframe"),
    t("trust.guarantees.table.measurement"),
    t("trust.guarantees.table.successRate"),
  ];

  const challengeFeatures = tArray("trust.instantResults.features");

  return (
    <>
      {/* FAQ */}
      <section className={cn(SURFACE_RAISED, SECTION_Y)}>
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                align="left"
                index="08"
                eyebrow={t("trust.title")}
                icon={ShieldCheck}
                title={t("trust.faq.title")}
                description={t("trust.faq.subtitle")}
              />
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-8">
              {/* One panel, hairline-divided rows — reads as a document, not cards. */}
              <Accordion
                type="single"
                collapsible
                defaultValue="faq-different"
                className={cn(CARD, "divide-y divide-border/70")}
              >
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.key}
                    value={`faq-${faq.key}`}
                    className="border-b-0 px-5 transition-colors duration-300 data-[state=open]:bg-primary/4 sm:px-6"
                  >
                    <AccordionTrigger className="items-center gap-4 py-5 text-left font-heading text-[15px] font-semibold text-foreground hover:no-underline [&>svg]:size-5 [&>svg]:translate-y-0">
                      <span className="flex items-center gap-4">
                        <span className="home-display flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-[11px] font-semibold tabular-nums text-primary ring-1 ring-inset ring-primary/15">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{faq.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground sm:pl-12">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Outcome guarantees */}
      <section className={cn("relative", SECTION_Y)}>
        <div className={CONTAINER}>
          <Reveal>
            <SectionHeading
              align="split"
              index="09"
              eyebrow={t("trust.guarantees.title")}
              icon={Target}
              title={t("trust.guarantees.subtitle")}
              description={t("trust.guarantees.description")}
            />
          </Reveal>

          <Reveal delay={0.08} className={cn(HEADING_GAP, "hidden md:block")}>
            <div className={cn(CARD, "shadow-[0_24px_52px_-34px_rgba(10,70,52,0.4)]")}>
              <table className="w-full text-sm">
                <thead className={cn(INK_BG, "text-white")}>
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-5 py-4 text-left font-heading text-[10px] font-semibold uppercase tracking-[0.18em] first:pl-6 last:pr-6"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {guarantees.map((guarantee) => (
                    <tr key={guarantee.key} className="transition-colors duration-300 hover:bg-primary/5">
                      <th scope="row" className="px-5 py-4 text-left font-semibold text-foreground first:pl-6">
                        {guarantee.condition}
                      </th>
                      <td className="px-5 py-4 text-[13px] font-medium text-primary">{guarantee.guarantee}</td>
                      <td className="px-5 py-4">
                        <TimeframeBadge>{guarantee.timeframe}</TimeframeBadge>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-muted-foreground">{guarantee.measurement}</td>
                      <td className="px-5 py-4 last:pr-6">
                        <SuccessMeter guarantee={guarantee} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden")}>
            {guarantees.map((guarantee) => (
              <RevealItem key={guarantee.key} className="h-full">
                <div className={cn(CARD, "flex h-full flex-col p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="home-display font-heading text-sm font-semibold text-foreground">
                      {guarantee.condition}
                    </h4>
                    <TimeframeBadge>{guarantee.timeframe}</TimeframeBadge>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-primary">{guarantee.guarantee}</p>
                  <p className="mt-1 flex-1 text-[13px] text-muted-foreground">{guarantee.measurement}</p>
                  <div className="mt-4">
                    <SuccessMeter guarantee={guarantee} />
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Instant-results challenge */}
          <Reveal className="mt-8">
            <div className={cn(CARD, "home-topline p-6 sm:p-8")}>
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-9">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
                  <TrendingUp className="size-7" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="home-display font-heading text-xl font-semibold text-foreground sm:text-2xl">
                    {t("trust.instantResults.title")}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                    {t("trust.instantResults.description")}
                  </p>
                  <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {challengeFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/70 px-3.5 py-2.5 text-[13px] text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
