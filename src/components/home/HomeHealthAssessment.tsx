"use client";

import { useState } from "react";
import { AnimatePresence, m, type Variants } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { Eyebrow, SectionHeading } from "./SectionHeading";
import { HOME_EASE, Reveal } from "./home-motion";
import { CARD, CONTAINER, PANEL, SECTION_Y } from "./home-theme";

const SUCCESS_RATE = 94;

type Question = { id: string; title: string; question: string; options: string[] };
type Translate = (path: string) => string;

const QUESTION_OPTION_KEYS: Record<string, string[]> = {
  physical: ["headNeck", "shoulders", "back", "joints", "digestive", "noIssues"],
  energy: ["morning", "afternoon", "evening", "night", "variesDaily"],
  digestion: ["strongRegular", "variable", "weak", "irregular", "problematic"],
  mental: ["veryLow", "low", "moderate", "high", "veryHigh"],
  goals: ["painRelief", "detoxification", "weightManagement", "stressRelief", "overallWellness"],
};

function buildQuestions(t: Translate): Question[] {
  return Object.entries(QUESTION_OPTION_KEYS).map(([id, optionKeys]) => ({
    id,
    title: t(`healthAssessment.questions.${id}.title`),
    question: t(`healthAssessment.questions.${id}.question`),
    options: optionKeys.map((key) => t(`healthAssessment.questions.${id}.options.${key}`)),
  }));
}

const slideVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
    transition: { duration: 0.2, ease: HOME_EASE },
  }),
};

type OptionButtonProps = { option: string; isSelected: boolean; onSelect: () => void };

function OptionButton({ option, isSelected, onSelect }: OptionButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:text-sm",
        isSelected
          ? "border-primary bg-primary/6 text-primary shadow-[0_8px_20px_-12px_oklch(0.62_0.16_150_/_0.7)] ring-1 ring-primary/25"
          : "border-border/70 bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/4"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/35 group-hover:border-primary/50"
        )}
        aria-hidden="true"
      >
        {isSelected ? <Check className="size-3" /> : null}
      </span>
      {option}
    </button>
  );
}

type ResultField = { label: string; value: string; highlight?: boolean };

function ResultsPanel({ t }: { t: Translate }) {
  const fields: ResultField[] = [
    { label: t("healthAssessment.results.primaryDosha"), value: t("healthAssessment.results.primaryDosha"), highlight: true },
    { label: t("healthAssessment.results.currentImbalance"), value: t("healthAssessment.results.imbalance") },
    { label: t("healthAssessment.results.recommendedTreatment"), value: t("healthAssessment.results.treatment"), highlight: true },
    { label: t("healthAssessment.results.supportingTherapies"), value: t("healthAssessment.results.supportingTherapies") },
    {
      label: t("healthAssessment.results.expectedTimeline"),
      value: `${t("healthAssessment.results.timeline")} ${t("healthAssessment.results.timelineText")}`,
      highlight: true,
    },
  ];

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: HOME_EASE }}
      className="p-5 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h3 className="home-display font-heading text-xl font-semibold text-foreground sm:text-2xl">
          {t("healthAssessment.results.cardTitle")}
        </h3>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className={cn(PANEL, "p-4")}>
            <dt className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {field.label}
            </dt>
            <dd className={cn("mt-1.5 text-sm font-semibold", field.highlight ? "text-primary" : "text-foreground")}>
              {field.value}
            </dd>
          </div>
        ))}
        <div className={cn(PANEL, "p-4 sm:col-span-2")}>
          <dt className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("healthAssessment.results.successProbability")}
          </dt>
          <dd className="mt-3">
            <div className="flex items-center gap-3">
              <Progress value={SUCCESS_RATE} className="h-2 flex-1" />
              <span className="home-display font-heading text-sm font-semibold text-primary">{SUCCESS_RATE}%</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("healthAssessment.results.basedOnCases")}</p>
          </dd>
        </div>
      </dl>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <BookVideoCta size="md" label={t("healthAssessment.results.bookConsultation")} />
        <Button type="button" variant="outline" className="h-12 rounded-full px-5 font-heading">
          <Download aria-hidden="true" />
          {t("healthAssessment.results.downloadReport")}
        </Button>
      </div>
    </m.div>
  );
}

export default function HomeHealthAssessment() {
  const { t } = useTranslation();
  const questions = buildQuestions(t);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [direction, setDirection] = useState(1);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
  };

  const goNext = () => {
    if (isLastStep) {
      setShowResults(true);
      return;
    }
    setDirection(1);
    setCurrentStep((step) => step + 1);
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep((step) => step - 1);
  };

  const trustIndicators: { icon: LucideIcon; label: string }[] = [
    { icon: Star, label: t("healthAssessment.trustIndicators.usedByPatients") },
    { icon: CheckCircle2, label: t("healthAssessment.trustIndicators.scientificallyValidated") },
    { icon: Target, label: t("healthAssessment.trustIndicators.accuracyRate") },
  ];

  return (
    <section className={cn("relative", SECTION_Y)}>
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              align="left"
              index="05"
              eyebrow={
                showResults
                  ? t("healthAssessment.results.assessmentComplete")
                  : t("healthAssessment.main.interactiveAssessment")
              }
              icon={showResults ? CheckCircle2 : Brain}
              title={showResults ? t("healthAssessment.results.title") : t("healthAssessment.main.title")}
              description={
                showResults ? t("healthAssessment.results.subtitle") : t("healthAssessment.main.subtitle")
              }
            />

            <ul className="mt-8 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
              {trustIndicators.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-foreground">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className={cn(CARD, "home-topline shadow-[0_30px_60px_-32px_rgba(10,70,52,0.4)]")}>
              {showResults || !currentQuestion ? (
                <ResultsPanel t={t} />
              ) : (
                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span>
                      {t("healthAssessment.main.step")} {currentStep + 1} {t("healthAssessment.main.of")}{" "}
                      {questions.length}
                    </span>
                    <span className="text-primary">
                      {Math.round(progress)}% {t("healthAssessment.main.complete")}
                    </span>
                  </div>

                  {/* Segmented progress — clearer than a single bar for 5 steps. */}
                  <div className="mt-3 flex gap-1.5" aria-hidden="true">
                    {questions.map((question, index) => (
                      <span
                        key={question.id}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors duration-500",
                          index < currentStep
                            ? "bg-primary"
                            : index === currentStep
                              ? "bg-primary/60"
                              : "bg-muted"
                        )}
                      />
                    ))}
                  </div>

                  <div className="relative mt-8 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                      <m.div
                        key={currentQuestion.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: HOME_EASE }}
                      >
                        <div className="flex items-start gap-4">
                          <span className="home-display flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_oklch(0.62_0.16_150_/_0.8)]">
                            {currentStep + 1}
                          </span>
                          <div className="min-w-0">
                            <Eyebrow>{currentQuestion.title}</Eyebrow>
                            <h3 className="home-display mt-2.5 font-heading text-xl font-semibold text-foreground sm:text-2xl">
                              {currentQuestion.question}
                            </h3>
                          </div>
                        </div>

                        <div
                          role="radiogroup"
                          aria-label={currentQuestion.question}
                          className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
                        >
                          {currentQuestion.options.map((option) => (
                            <OptionButton
                              key={option}
                              option={option}
                              isSelected={selectedAnswer === option}
                              onSelect={() => handleAnswer(currentQuestion.id, option)}
                            />
                          ))}
                        </div>
                      </m.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Clock className="size-4" aria-hidden="true" />~{questions.length - currentStep}{" "}
                      {t("healthAssessment.main.minutesRemaining")}
                    </span>
                    <div className="flex gap-2">
                      {currentStep > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBack}
                          className="h-12 rounded-full px-4 font-heading"
                        >
                          <ArrowLeft aria-hidden="true" />
                          {t("common.back")}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!selectedAnswer}
                        className="h-12 flex-1 rounded-full px-5 font-heading shadow-[0_10px_28px_-10px_oklch(0.62_0.16_150_/_0.7)] sm:flex-none"
                      >
                        {isLastStep ? t("healthAssessment.main.getResults") : t("healthAssessment.main.nextQuestion")}
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
